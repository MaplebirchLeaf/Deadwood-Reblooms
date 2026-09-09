// ./src/module/MoreTransformations/Horse.ts

import message from '@/assets/transformations/horse.yaml';
import Transformation, { TransformationOption } from './Transformation';
import { MaplebirchCore } from '@scml-maplebirch/types';

class Horse extends Transformation {
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
        parts: [
          { name: 'ears', tfRequired: 4 },
          { name: 'tail', tfRequired: 6 }
        ],

        traits: [
          { name: 'hooves', tfRequired: 2 },
          { name: 'sweatblood', tfRequired: 3 }
        ],

        message: maplebirch.yaml.load(message) as TransformationOption['message'],

        decayConditions: [
          () => V.maplebirch.transformation.horse.build >= 1,
          () => V.worn.head.name !== 'mane_ribbon',
          () => V.worn.neck.name !== 'golden_carrot_pendant',
          () => playerNormalPregnancyType() !== 'horse'
        ],

        suppressConditions: [sourceName => sourceName !== 'horse', () => V.worn.head.name !== 'mane_ribbon', () => V.worn.neck.name !== 'golden_carrot_pendant'],

        pre: options => {
          options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
          options.horse_ears_layer = V.tfearslayer ?? 'back';
          options.horse_tail_layer = V.taillayer ?? 'front';
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
            srcfn: options => {
              const demon = isChimeraEnabled('demonhorse', 'tail');
              const tail = demon ? `tail-${options.demon_tail_state}` : 'tail-idle';
              return `img/transformations/horse/${tail}/${V.transformationParts?.horse?.tail}.png`;
            },
            filters: ['hair'],
            showfn: options => options.show_tf && isPartEnabled(V.transformationParts?.horse?.tail) && !options.hide_all && options.maplebirchTransformation,
            masksrcfn: options => {
              if (options.worn.over_upper.setup.name === 'kaiju costume') return `img/clothes/over-upper/kaiju/mask.png`;
            },
            zfn: options => {
              const cover = ['cover', 'flaunt'].includes(options.demon_tail_state) && isChimeraEnabled('demonhorse', 'tail');
              if (cover) return maplebirch.char.ZIndices.tailPenisCover;
              if (options.horse_tail_layer === 'back') return maplebirch.char.ZIndices.tail;
              return maplebirch.char.ZIndices.back_lower;
            }
          }
        },

        translations: {
          horse: { EN: 'Horse', CN: '马' },
          ears: { EN: 'ears', CN: '耳朵' },
          tail: { EN: 'tail', CN: '尾巴' }
        }
      },
      {
        pre: Horse.pre,
        layers: Horse.layers
      }
    );
  }

  private static pre(options: any): void {
    options.maplebirchTransformation = V.maplebirch?.transformation ?? false;
    options.filters.horseHair = Horse.hairLikeFilter(V.haircolour);
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
      srcfn: (options: any) => `${options.src}body/transformations/horse/tail/front-default.png`,
      showfn: () => {
        const tail = V.transformationParts?.horse?.tail;
        return !(tail === 'disabled' || tail === 'hidden');
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      z: 40
    },
    horseTailBack: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/tail/back-default.png`,
      showfn: () => {
        const tail = V.transformationParts?.horse?.tail;
        return !(tail === 'disabled' || tail === 'hidden');
      },
      animationfn: (options: any) => options.animKey,
      filters: ['horseHair'],
      z: 40
    }
  };

  protected override extend(maplebirch: MaplebirchCore): void {
    maplebirch.tool.patch.addTraits(
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms.Traits.hooves.name'),
        colour: 'def',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.hooves),
        text: () => maplebirch.t('deadwood-reblooms.Traits.hooves.text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms.Traits.sweatblood.name'),
        colour: 'tealhair',
        has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.sweatblood),
        text: () => maplebirch.t('deadwood-reblooms.Traits.sweatblood.text')
      },
      {
        title: 'General Traits',
        name: () => (V.player?.gender === 'n' ? '<<lanSwitch "Horse " "马">>' : '<<lanSwitch "Horse " "马">><<pcGender>>'),
        colour: 'softbrown',
        has: () => V.maplebirch.transformation.horse.level >= 6,
        text: () => maplebirch.t('deadwood-reblooms.Traits.horse.text')
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

    // 五倍踢击
    maplebirch.tool.zone.inject({
      widgetPassage: {
        'Widgets Effects Man': [
          {
            srcmatchgroup: /<<actionskick \$feettarget>><<defiance 5 \$feettarget>>/g,
            to: '<<deadwood-reblooms-action-kick $feettarget>>'
          }
        ]
      }
    });
  }
}

export default Horse;
