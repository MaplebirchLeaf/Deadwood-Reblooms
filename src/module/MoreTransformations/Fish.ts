// ./src/module/MoreTransformations/Fish.ts

import message from '@/assets/transformations/fish.yaml';
import Transformation, { TransformationOption } from './Transformation';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

type SkillValue = (skill: string, disableModifiers?: number) => number;

class Fish extends Transformation {
  constructor() {
    super(
      'fish',
      'physical',
      {
        parts: [
          { name: 'fins', tfRequired: 4 },
          { name: 'tail', tfRequired: 6 }
        ],

        traits: [
          { name: 'gills', tfRequired: 2 },
          { name: 'finnedLimbs', tfRequired: 3 }
        ],

        message: maplebirch.yaml.load(message) as TransformationOption['message'],

        decayConditions: [() => V.maplebirch.transformation.fish.build >= 1, () => V.worn.head.name !== 'pearl shell hair clip'],

        suppressConditions: [sourceName => sourceName !== 'fish', () => V.worn.head.name !== 'pearl shell hair clip'],

        pre: options => {
          options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
        },

        layers: {
          fish_fins: {
            src: 'img/transformations/fish/fins/default.png',
            showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.fish?.fins) && !options.hide_all && options.maplebirchTransformation,
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return 'img/clothes/over-upper/kaiju/mask.png';
              if (!options.hideHeadAcc) return options.headMask;
            },
            zfn: options => {
              if (options.hideHeadAcc) return maplebirch.char.ZIndices.over_head;
              return maplebirch.char.ZIndices.front_hair + 1;
            }
          },
          fish_tail: {
            src: 'img/transformations/fish/tail-idle/default.png',
            showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.fish?.tail) && !options.hide_all && options.maplebirchTransformation,
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return 'img/clothes/over-upper/kaiju/mask.png';
            },
            zfn: () => maplebirch.char.ZIndices.back_lower
          }
        },

        translations: {
          fish: { EN: 'Fish', CN: '鱼' },
          fins: { EN: 'fins', CN: '耳鳍' },
          tail: { EN: 'tail', CN: '尾巴' }
        }
      },
      {
        pre: Fish.pre,
        layers: Fish.layers
      }
    );
  }

  private static pre(options: any): void {
    options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
  }

  private static readonly layers: CanvasLayerMap = {
    fishFinsFront: {
      srcfn: (options: any) => `${options.src}body/transformations/fish/fins/front-default.png`,
      showfn: (options: any) => {
        const fins = V.transformationParts?.fish?.fins;
        return !(fins === 'disabled' || fins === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 82
    },
    fishFinsBack: {
      srcfn: (options: any) => `${options.src}body/transformations/fish/fins/back-default.png`,
      showfn: (options: any) => {
        const fins = V.transformationParts?.fish?.fins;
        return !(fins === 'disabled' || fins === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 40
    },
    fishTailFront: {
      srcfn: (options: any) => `${options.src}body/transformations/fish/tail/front-default-default.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.fish?.tail;
        return !(tail === 'disabled' || tail === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 40
    },
    fishTailBack: {
      srcfn: (options: any) => `${options.src}body/transformations/fish/tail/back-default-default.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.fish?.tail;
        return !(tail === 'disabled' || tail === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 40
    }
  };

  protected override extend(maplebirch: MaplebirchCore): void {
    const descriptions = () => {
      const item = setup.clothes.head.find((item: Record<string, string>) => item.variable === 'pearl_shell_hair_clip');
      if (item) item.description = maplebirch.t('deadwood-reblooms:clothes:pearl_shell_hair_clip:description');
    };
    maplebirch.tool.onInit(descriptions);
    maplebirch.on(':language', descriptions);
    maplebirch.dynamic.regTimeEvent('onDay', 'deadwood-reblooms-loft-rice', {
      exact: true,
      cond: () => V.loft_river === 1,
      action: () => {
        V.loftIngredients.rice = Math.max(V.loftIngredients.rice ?? 0, 3);
      }
    });

    maplebirch.tool.patch.traits.add(
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:gills:name'),
        colour: 'lblue',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.gills),
        text: () => maplebirch.t('deadwood-reblooms:Traits:gills:text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:finnedLimbs:name'),
        colour: 'lblue',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.finnedLimbs),
        text: () => maplebirch.t('deadwood-reblooms:Traits:finnedLimbs:text')
      },
      {
        title: 'General Traits',
        name: () => {
          const name = V.player.gender === 'n' ? '<<lanSwitch "Fish" "鱼">>' : '<<lanSwitch "Fish " "鱼">><<pcGender>>';
          return name + (V.player.sex === 'h' ? "<<lanSwitch ' (⚥)' '(⚥)'>>" : '');
        },
        colour: 'lblue',
        has: () => V.maplebirch.transformation.fish.level >= 6,
        text: () => maplebirch.t('deadwood-reblooms:Traits:fish:text')
      }
    );

    // 鳍肢特质
    maplebirch.tool.onInit(() => {
      const original = window.currentSkillValue as SkillValue;

      window.currentSkillValue = (skill, disableModifiers = 0) => {
        const value = original(skill, disableModifiers);
        const trait = V.transformationParts?.traits?.finnedLimbs;
        const enabled = trait != null && !['disabled', 'hidden'].includes(trait);
        if (skill !== 'swimmingskill' || disableModifiers >= 2 || !enabled) return value;
        return Math.floor(value * 1.1);
      };
    });

    maplebirch.tool.addTo(
      'SkillsBonusDisplay',
      `<<if $transformationParts.traits.finnedLimbs and isPartEnabled($transformationParts.traits.finnedLimbs)>>
        <<set _swimmingConfig.modifier to Math.floor(_swimmingConfig.modifier * 1.1)>>
        <<run _swimmingConfig.modTypes.good.pushUnique(maplebirch.t("deadwood-reblooms:Traits:finnedLimbs:name"))>>
      <</if>>`
    );

    // 把鱼转化效果接入原版游泳、潜水和烹饪流程。
    maplebirch.tool.inject({
      locationPassage: {
        'Rocks Pool': [
          // 在礁石泳池的原版潜水链接前加入鱼化休憩选项；正则只依赖目标 Passage，不匹配英汉链接文本。
          {
            src: '<<swimicon "dive">>',
            applybefore:
              '<<icon "fish.png">><<link `lanSwitch(\'Lounge in the water like a fish (0:10)\', \'像鱼一样泡着 (0:10)\')` $passage>><<pass 10>><<stress -3>><<transform "fish" 1>><</link>><<lstress>><<transform-hint "fish" "lblue">><br>',
            expected: 1
          }
        ],
        'Orphanage Loft Kitchen': [
          // 在原版食材库存与烹饪界面之间放专属动作，不改动其他厨房的食谱。
          {
            src: '<<kitchenDisplay>>',
            applybefore: '<<deadwood-reblooms-loft-rice>>\n',
            expected: 1
          }
        ]
      },
      widgetPassage: {
        Widgets: [
          // 在原版游泳动作耗时计算后应用高等级鱼化减时，保留原本由游泳技能决定的基础耗时。
          {
            src: '<<set _waterActionTime to [18, 15, 12, 10, 8, 8, 7, 7, 6, 6, 5, 4][$_swimLevel] || 3>>',
            applyafter: '<<if $maplebirch.transformation.fish.level >= 6>><<set _waterActionTime to Math.max(1, Math.ceil(_waterActionTime / 2))>><</if>>',
            expected: 1
          },
          // 将原版水下耗氧公式替换为屏息减耗版本；没有有效特质时乘数仍为 1。
          {
            src: '<<set $oxygen -= _waterActionTime * 10>>',
            to: '<<set $oxygen -= _waterActionTime * 10 * ($transformationParts.traits.gills && isPartEnabled($transformationParts.traits.gills) ? 0.25 : 1)>>',
            expected: 1
          },
          // 在游泳技能结算完成后追加概率鱼化成长，不改变原版技能上限与增长流程。
          {
            src: '<<set $swimmingskill to Math.clamp($swimmingskill, 0, 1000)>>',
            applyafter: '<<if $rng <= 30>><<transform "fish" 1>><</if>>',
            expected: 1
          },
          // 在水下动作实际推进时间后追加概率鱼化成长，确保只有完成动作才触发。
          {
            src: '<<pass _waterActionTime sec>>',
            applyafter: '<<if $rng <= 20>><<transform "fish" 1>><</if>>',
            expected: 1
          }
        ]
      }
    });
  }
}

export default Fish;
