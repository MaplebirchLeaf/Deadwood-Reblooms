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
          fins: { EN: 'fins', CN: '鱼鳍' },
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
      if (item) item.description = maplebirch.t('deadwood-reblooms.clothes.pearl_shell_hair_clip.description');
    };
    maplebirch.tool.onInit(descriptions);
    maplebirch.on(':language', descriptions);

    maplebirch.tool.patch.addTraits(
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms.Traits.gills.name'),
        colour: 'lblue',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.gills),
        text: () => maplebirch.t('deadwood-reblooms.Traits.gills.text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms.Traits.finnedLimbs.name'),
        colour: 'lblue',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.finnedLimbs),
        text: () => maplebirch.t('deadwood-reblooms.Traits.finnedLimbs.text')
      },
      {
        title: 'General Traits',
        name: () => (V.player?.gender === 'n' ? '<<lanSwitch "Fish " "鱼">>' : '<<lanSwitch "Fish " "鱼">><<pcGender>>'),
        colour: 'lblue',
        has: () => V.maplebirch.transformation.fish.level >= 6,
        text: () => maplebirch.t('deadwood-reblooms.Traits.fish.text')
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
        <<run _swimmingConfig.modTypes.good.pushUnique(maplebirch.t("deadwood-reblooms.Traits.finnedLimbs.name"))>>
      <</if>>`
    );

    // 鱼鳃与完整鱼转化特质
    maplebirch.tool.zone.inject({
      locationPassage: {
        'Rocks Pool': [
          {
            srcmatch: /<<swimicon "dive">><<link \[\[[^\n]*?\|Rocks Dive\]\]>>/,
            applybefore:
              '<<icon "fish.png">><<link `maplebirch.t("deadwood-reblooms.fish.rockPool")` $passage>><<pass 10>><<stress -3>><<transform "fish" 1>><</link>><<lstress>><<transform-hint "fish" "lblue">><br>'
          }
        ]
      },
      widgetPassage: {
        'Widgets Kitchen': [
          {
            src: '<<set $_group to _recipeKeys.find((obj) => obj.key is $lastRecipeViewed).group>>',
            applyafter: '<<deadwood-reblooms-eat-rice>>'
          }
        ],
        Widgets: [
          {
            src: '<<set _waterActionTime to [18, 15, 12, 10, 8, 8, 7, 7, 6, 6, 5, 4][$_swimLevel] || 3>>',
            applyafter: '<<if $maplebirch.transformation.fish.level >= 6>><<set _waterActionTime to Math.max(1, Math.ceil(_waterActionTime / 2))>><</if>>'
          },
          {
            src: '<<set $oxygen -= _waterActionTime * 10>>',
            to: '<<set $oxygen -= _waterActionTime * 10 * ($transformationParts.traits.gills && isPartEnabled($transformationParts.traits.gills) ? 0.25 : 1)>>'
          },
          {
            src: '<<set $swimmingskill to Math.clamp($swimmingskill, 0, 1000)>>',
            applyafter: '<<if $rng <= 30>><<transform "fish" 1>><</if>>'
          },
          {
            src: '<<pass _waterActionTime sec>>',
            applyafter: '<<if $rng <= 20>><<transform "fish" 1>><</if>>'
          }
        ]
      }
    });
  }
}

export default Fish;
