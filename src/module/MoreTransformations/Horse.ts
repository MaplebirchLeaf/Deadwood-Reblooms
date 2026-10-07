// ./src/module/MoreTransformations/Horse.ts

import message from '@/assets/transformations/horse.yaml';
import Transformation, { TransformationOption } from './Transformation';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

class Horse extends Transformation {
  // demonhorse 混合尾只在当前绘制帧合成，玩家实际选择的恶魔尾状态仍由原版存档维护。
  private static get demonTailEnabled(): boolean {
    const parts = V.transformationParts;
    return [parts?.horse?.tail, parts?.demon?.tail].every(part => typeof part === 'string' && isPartEnabled(part)) && isChimeraEnabled('demonhorse', 'tail');
  }

  private static hairLikeFilter(colour: string) {
    const record = setup.colours.hair_map[colour];
    if (!record) return Renderer.emptyLayerFilter();
    const filter = clone(record.canvasfilter);
    Renderer.mergeLayerData(filter, setup.colours.sprite_prefilters.hair, true);
    return filter;
  }

  constructor() {
    super(
      'horse',
      'physical',
      {
        // 胡萝卜位于图标右下方，覆盖原色，毛发沿用原版红底发色滤镜。
        icon: `<span style="display:inline-grid" @class="'hair-'+$haircolour"><span style="grid-area:1/1" class="colour-hair"><<iconUi 'horse.png'>></span><span style="grid-area:1/1;clip-path:polygon(31.25% 46.875%,100% 46.875%,100% 100%,25% 100%,25% 84.375%,31.25% 78.125%)"><<iconUi 'horse.png'>></span></span>`,
        parts: [
          { name: 'ears', tfRequired: 4, label: () => lanSwitch('Ears', '耳朵') },
          { name: 'tail', tfRequired: 6, label: () => lanSwitch('Tail', '尾巴') }
        ],

        traits: [
          { name: 'hooves', tfRequired: 2 },
          { name: 'sweatblood', tfRequired: 3 }
        ],

        message: maplebirch.yaml.load(message) as TransformationOption['message'],

        decayConditions: [
          () => V.maplebirch.transformation.horse.build >= 1,
          () => V.worn.head.name !== 'mane ribbon',
          () => V.worn.neck.name !== 'golden carrot pendant',
          () => playerNormalPregnancyType() !== 'horse'
        ],

        suppressConditions: [sourceName => sourceName !== 'horse', () => V.worn.head.name !== 'mane ribbon', () => V.worn.neck.name !== 'golden carrot pendant'],

        chimeras: [{ name: 'demonhorse', part: 'tail', sources: ['horse', 'demon'], label: () => lanSwitch('Demon horse tail:', '恶魔马尾：') }],

        pre: options => {
          options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
          options.horse_ears_layer = V.tfearslayer ?? 'back';
          options.horse_tail_layer = V.taillayer ?? 'front';
          // 只合并当前可见且未被原版其他混合形态接管的恶魔尾，不改动存档里的部件选择。
          options.horse_demon_tail = !!options.maplebirchTransformation && Horse.demonTailEnabled && options.demon_tail_type === V.transformationParts.demon.tail;
          if (options.horse_demon_tail) options.demon_tail_type = 'hidden';
          if (options.worn.head.setup.name === 'sage witch hat' && isPartEnabled(V.transformationParts?.horse?.ears)) options.hideHeadAcc = true;
        },

        layers: {
          horse_ears: {
            src: 'img/transformations/horse/ears/default.png',
            showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.horse?.ears) && !options.hide_all && options.maplebirchTransformation,
            filters: ['hair'],
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return `img/clothes/over-upper/kaiju/mask.png`;
              if (!options.hideHeadAcc) return options.headMask;
            },
            zfn: options => {
              if (options.hideHeadAcc) return maplebirch.char.ZIndices.over_head;
              return options.horse_ears_layer === 'front' ? maplebirch.char.ZIndices.front_hair + 1 : maplebirch.char.ZIndices.basehead;
            }
          },

          horse_tail: {
            animation: 'idle',
            srcfn: options => {
              const state = options.horse_demon_tail && ['cover', 'flaunt'].includes(options.demon_tail_state) ? options.demon_tail_state : 'idle';
              const style = options.horse_demon_tail ? 'default-demon' : V.transformationParts?.horse?.tail;
              return `img/transformations/horse/tail-${state}/${style}.png`;
            },
            filters: ['hair'],
            showfn: options => {
              const tail = V.transformationParts?.horse?.tail;
              return options.show_tf && typeof tail === 'string' && isPartEnabled(tail) && !options.hide_all && options.maplebirchTransformation;
            },
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return `img/clothes/over-upper/kaiju/mask.png`;
            },
            zfn: options => {
              const cover = ['cover', 'flaunt'].includes(options.demon_tail_state) && options.horse_demon_tail;
              if (cover) return maplebirch.char.ZIndices.tailPenisCover;
              if (options.horse_tail_layer === 'back') return maplebirch.char.ZIndices.tail;
              return maplebirch.char.ZIndices.back_lower;
            }
          }
        },

        translations: {
          horse: { EN: 'Horse', CN: '马' }
        }
      },
      {
        pre: Horse.pre,
        layers: Horse.layers
      }
    );
  }

  private static pre(options: any): void {
    // BeautySelector 的贴图管线与原版角色渲染是两套层表，二者需分别隐藏被合成的恶魔尾。
    options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
    options.filters.horseHair = Horse.hairLikeFilter(V.haircolour);
    const demonTail = options.transformations?.demon?.tail;
    options.horse_demon_tail = !!options.maplebirchTransformation && Horse.demonTailEnabled && demonTail?.show === true && !['cat', 'cow'].includes(demonTail.style);
    if (options.horse_demon_tail) options.transformations.demon.tail.show = false;
  }

  private static readonly layers: CanvasLayerMap = {
    horseEarsFront: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/ears/front-default.png`,
      showfn: (options: any) => {
        const ears = V.transformationParts?.horse?.ears;
        return !(ears === 'disabled' || ears === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      zfn: (options: any) => {
        const ears = V.transformationParts?.horse?.ears;
        if (!(ears === 'disabled' || ears === 'hidden') && options.clothes.head?.name === 'witchsage') return 84;
        return 82;
      }
    },
    horseEarsBack: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/ears/back-default.png`,
      showfn: (options: any) => {
        const ears = V.transformationParts?.horse?.ears;
        return !(ears === 'disabled' || ears === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      zfn: (options: any) => {
        const ears = V.transformationParts?.horse?.ears;
        if (!(ears === 'disabled' || ears === 'hidden') && options.clothes.head?.name === 'witchsage') return 84;
        return 40;
      }
    },
    horseTailFront: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/tail/front-${options.horse_demon_tail ? 'default-demon' : 'default'}.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.horse?.tail;
        return typeof tail === 'string' && isPartEnabled(tail) && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      z: 40
    },
    horseTailBack: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/tail/back-${options.horse_demon_tail ? 'default-demon' : 'default'}.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.horse?.tail;
        return typeof tail === 'string' && isPartEnabled(tail) && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      z: 40
    }
  };

  protected override extend(maplebirch: MaplebirchCore): void {
    const descriptions = () => {
      for (const [slot, variable] of [
        ['head', 'mane_ribbon'],
        ['neck', 'golden_carrot_pendant']
      ] as const) {
        const item = setup.clothes[slot].find((item: Record<string, string>) => item.variable === variable);
        if (item) item.description = maplebirch.t(`deadwood-reblooms:clothes:${variable}:description`);
      }
    };
    maplebirch.tool.onInit(descriptions);
    maplebirch.on(':language', descriptions);

    maplebirch.tool.patch.traits.add(
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:hooves:name'),
        colour: 'def',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.hooves),
        text: () => maplebirch.t('deadwood-reblooms:Traits:hooves:text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:sweatblood:name'),
        colour: 'tealhair',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.sweatblood),
        text: () => maplebirch.t('deadwood-reblooms:Traits:sweatblood:text')
      },
      {
        title: 'General Traits',
        name: () => {
          const name = maplebirch.t('deadwood-reblooms:Traits:horse:gender');
          return name + (V.player.sex === 'h' ? lanSwitch(' (⚥)', '(⚥)') : '');
        },
        colour: 'softbrown',
        has: () => V.maplebirch.transformation.horse.level >= 6,
        text: () => maplebirch.t('deadwood-reblooms:Traits:horse:text')
      }
    );

    // 汗血特质
    maplebirch.tool.onInit(() => {
      const body = Weather.BodyTemperature;
      const originalSet = body.set.bind(body);
      body.set = (value: number) => {
        const current = body.get();
        const base = Weather.tempSettings.baseBodyTemperature;
        const trait = V.transformationParts?.traits?.sweatblood;
        const enabled = trait != null && !['disabled', 'hidden'].includes(trait);
        const movingAway = Math.abs(value - base) > Math.abs(current - base);
        if (enabled && movingAway) value = current + (value - current) * 0.5;
        originalSet(value);
      };
    });

    // 把马转化成长接入原版骑术、刷马和战斗动作。
    maplebirch.tool.inject({
      locationPassage: {
        'Riding School Lesson Grab': [
          // 在骑术课吃草链接完整结束后显示马化提示，不插入链接内部以免改变原版点击结算顺序。
          {
            src: '<<stress -6>><</link>>',
            applyafter: '<<transform-hint "horse" "softbrown">>',
            expected: 1
          }
        ],
        'Farm Horses Brush': [
          // 在农场刷马后续链接结束处追加马化提示，仅对已经开始马化的玩家显示。
          {
            src: '<<tiredness 2>><</link>>',
            applyafter: '<<if $maplebirch.transformation.horse.level > 0>><<transform-hint "horse" "softbrown">><</if>>',
            expected: 1
          }
        ],
        'Riding School Lesson Eat': [
          // 在吃草场景清空画布模型后增加马化进度，使剧情行为与转化成长直接对应。
          {
            src: '<<canvas-model-override "clear">>',
            applyafter: '<<transform "horse" 5>>',
            expected: 1
          }
        ],
        'Moor Horse Riding': [
          // 在荒原骑马离开链接结束后显示马化提示，保留原版事件跳过和时间推进逻辑。
          {
            src: '<<set $moormove to "horse">><</link>>',
            applyafter: '<<if $maplebirch.transformation.horse.level > 0>><<transform-hint "horse" "softbrown">><</if>>',
            expected: 1
          },
          // 在骑马经过五分钟之前按概率增加马化进度，只对已有马化状态的玩家生效。
          {
            src: '<<bird_pass 5>>',
            applybefore: '<<if $maplebirch.transformation.horse.level > 0 and $rng <= 30>><<transform "horse" 1>><</if>>',
            expected: 1
          }
        ]
      },
      widgetPassage: {
        'Farm Widgets': [
          // 追上马并完成刷毛时结算一次成长，直接挂在唯一的刷毛组件入口。
          {
            src: '<<widget "farm_brush">>',
            applyafter: '<<if $passage is "Farm Horses Chase" and $maplebirch.transformation.horse.level > 0>><<transform "horse" 1>><</if>>',
            expected: 1
          }
        ],
        'Widgets BeastEjaculation': [
          // 在原版狐狸转化判定后追加马类 NPC 的转化判定，使马、马男和马女共享马化增长。
          {
            srcmatchgroup: /<<if _npcisFoxType>><<transform fox 1>><<\/if>>/g,
            applyafter: '<<if ["horse", "horseboy", "horsegirl"].includes($NPCList[_jj].type)>><<transform "horse" 1>><</if>>',
            expected: 14
          }
        ],
        'Widgets Effects Man': [
          // 只替换动作描写，保留 DoLP 的闪避、反击与成功后的数值结算。
          {
            srcmatchgroup: /<<actionskick \$feettarget>>/g,
            to: '<<deadwood-reblooms-action-kick $feettarget>>',
            expected: 2
          },
          // 两版成功踢击的基础伤害不同，蹄足倍率沿用各自原值。DoLP 分支数不固定。
          {
            srcmatchgroup: /<<defiance (5|10) \$feettarget>>/g,
            to: '<<defiance `$1 * (typeof $transformationParts?.traits?.hooves is "string" and isPartEnabled($transformationParts.traits.hooves) ? 3 : 1)` $feettarget>>'
          }
        ]
      }
    });
  }
}

export default Horse;
