// ./src/module/MoreTransformations/Whale.ts

import message from '@/assets/transformations/whale.yaml';
import Transformation, { TransformationOption } from './Transformation';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

type SkillValue = (skill: string, disableModifiers?: number) => number;

const whaleFinsLayer: CanvasLayerMap[string] = {
  showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.whale?.fins) && !options.hide_all && options.maplebirchTransformation,
  masksrcfn: options => {
    if (options.worn.over_upper.setup.name === 'kaiju costume') return 'img/clothes/over-upper/kaiju/mask.png';
    if (!options.hideHeadAcc) return options.headMask;
  }
};

class Whale extends Transformation {
  constructor() {
    super(
      'whale',
      'physical',
      {
        parts: [
          { name: 'fins', tfRequired: 4, label: () => lanSwitch('Fins', '鲸鳍') },
          { name: 'tail', tfRequired: 6, label: () => lanSwitch('Tail', '尾巴') }
        ],

        traits: [
          { name: 'deep_diver', tfRequired: 2 },
          { name: 'finned_limbs', tfRequired: 3 }
        ],

        message: maplebirch.yaml.load(message) as TransformationOption['message'],

        decayConditions: [() => V.maplebirch.transformation.whale.build >= 1, () => V.worn.head.name !== 'pearl shell hair clip'],

        suppressConditions: [sourceName => sourceName !== 'whale', () => V.worn.head.name !== 'pearl shell hair clip'],

        pre: options => {
          options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
        },

        layers: {
          whale_fins: {
            ...whaleFinsLayer,
            src: 'img/transformations/whale/fins/default.png',
            zfn: options => {
              if (options.hideHeadAcc) return maplebirch.char.ZIndices.over_head;
              return maplebirch.char.ZIndices.front_hair + 1;
            }
          },
          whale_fins_portrait: {
            ...whaleFinsLayer,
            src: 'img/transformations/whale/fins/default-portrait.png',
            zfn: options => {
              if (options.hideHeadAcc) return maplebirch.char.ZIndices.over_head;
              return maplebirch.char.ZIndices.ears + 0.1;
            }
          },
          whale_tail: {
            src: 'img/transformations/whale/tail-idle/default.png',
            showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.whale?.tail) && !options.hide_all && options.maplebirchTransformation,
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return 'img/clothes/over-upper/kaiju/mask.png';
            },
            zfn: () => maplebirch.char.ZIndices.back_lower
          }
        },

        translations: {
          whale: { EN: 'Whale', CN: '鲸' }
        }
      },
      {
        pre: Whale.pre,
        layers: Whale.layers
      }
    );
  }

  private static pre(options: any): void {
    options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
  }

  private static readonly layers: CanvasLayerMap = {
    whaleFinsFront: {
      srcfn: (options: any) => `${options.src}body/transformations/whale/fins/front-default.png`,
      showfn: (options: any) => {
        const fins = V.transformationParts?.whale?.fins;
        return !(fins === 'disabled' || fins === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 82
    },
    whaleFinsBack: {
      srcfn: (options: any) => `${options.src}body/transformations/whale/fins/back-default.png`,
      showfn: (options: any) => {
        const fins = V.transformationParts?.whale?.fins;
        return !(fins === 'disabled' || fins === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 40
    },
    whaleTailFront: {
      srcfn: (options: any) => `${options.src}body/transformations/whale/tail/front-default-default.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.whale?.tail;
        return !(tail === 'disabled' || tail === 'hidden') && options.maplebirchTransformation;
      },
      animationfn: (options: any) => options.animKey,
      z: 40
    },
    whaleTailBack: {
      srcfn: (options: any) => `${options.src}body/transformations/whale/tail/back-default-default.png`,
      showfn: (options: any) => {
        const tail = V.transformationParts?.whale?.tail;
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
        name: () => maplebirch.t('deadwood-reblooms:Traits:deep_diver:name'),
        colour: 'lblue',
        has: () => !!V.transformationParts?.traits?.deep_diver && isPartEnabled(V.transformationParts.traits.deep_diver),
        text: () => maplebirch.t('deadwood-reblooms:Traits:deep_diver:text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:finned_limbs:name'),
        colour: 'lblue',
        has: () => !!V.transformationParts?.traits?.finned_limbs && isPartEnabled(V.transformationParts.traits.finned_limbs),
        text: () => maplebirch.t('deadwood-reblooms:Traits:finned_limbs:text')
      },
      {
        title: 'General Traits',
        name: () => {
          const name = maplebirch.t('deadwood-reblooms:Traits:whale:gender');
          return name + (V.player.sex === 'h' ? lanSwitch(' (⚥)', '(⚥)') : '');
        },
        colour: 'lblue',
        has: () => (V.maplebirch?.transformation?.whale?.level ?? 0) >= 6,
        text: () => maplebirch.t('deadwood-reblooms:Traits:whale:text')
      }
    );

    // 鳍肢特质
    maplebirch.tool.onInit(() => {
      const original = window.currentSkillValue as SkillValue;

      window.currentSkillValue = (skill, disableModifiers = 0) => {
        const value = original(skill, disableModifiers);
        const trait = V.transformationParts?.traits?.finned_limbs;
        const enabled = trait != null && !['disabled', 'hidden'].includes(trait);
        if (skill !== 'swimmingskill' || disableModifiers >= 2 || !enabled) return value;
        return Math.floor(value * 1.1);
      };
    });

    maplebirch.tool.addTo(
      'SkillsBonusDisplay',
      `<<if $transformationParts.traits.finned_limbs and isPartEnabled($transformationParts.traits.finned_limbs)>>
        <<set _swimmingConfig.modifier to Math.floor(_swimmingConfig.modifier * 1.1)>>
        <<run _swimmingConfig.modTypes.good.pushUnique(maplebirch.t("deadwood-reblooms:Traits:finned_limbs:name"))>>
      <</if>>`
    );

    // 把鲸转化效果接入原版游泳、潜水和烹饪流程。
    maplebirch.tool.inject({
      locationPassage: {
        'Rocks Pool': [
          // 在原版潜水链接前加入休憩选项，不匹配英汉链接文本。
          {
            src: '<<swimicon "dive">>',
            applybefore: '<<deadwood-whale-rest>>\n',
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
          // 在原版游泳动作耗时计算后应用高等级鲸化减时，保留原本由游泳技能决定的基础耗时。
          {
            src: '<<set _waterActionTime to [18, 15, 12, 10, 8, 8, 7, 7, 6, 6, 5, 4][$_swimLevel] || 3>>',
            applyafter: '<<if $maplebirch.transformation.whale.level >= 6>><<set _waterActionTime to Math.max(1, Math.ceil(_waterActionTime / 2))>><</if>>',
            expected: 1
          },
          // 将原版水下耗氧公式替换为屏息减耗版本，没有有效特质时乘数仍为 1。
          {
            src: '<<set $oxygen -= _waterActionTime * 10>>',
            to: '<<set $oxygen -= _waterActionTime * 10 * ($transformationParts.traits.deep_diver && isPartEnabled($transformationParts.traits.deep_diver) ? 0.25 : 1)>>',
            expected: 1
          },
          // 在游泳技能结算完成后追加概率鲸化成长，不改变原版技能上限与增长流程。
          {
            srcmatch: /<<set \$swimmingskill to Math\.clamp\(\$swimmingskill, 0, 1000(?: \* \$AMCTraits\.swimming)?\)>>/,
            applyafter: '<<if $rng <= 30>><<transform "whale" 1>><</if>>',
            expected: 1
          },
          // 在水下动作实际推进时间后追加概率鲸化成长，确保只有完成动作才触发。
          {
            src: '<<pass _waterActionTime sec>>',
            applyafter: '<<if $rng <= 20>><<transform "whale" 1>><</if>>',
            expected: 1
          }
        ]
      }
    });
  }
}

export default Whale;
