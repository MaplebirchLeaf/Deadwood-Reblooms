// ./src/script/Transformation/horse.ts

import { options } from '../../module/constants';

function hairLikeFilter(colour: string) {
  const record = setup.colours.hair_map[colour];
  if (!record) return Renderer.emptyLayerFilter();
  const filter = clone(record.canvasfilter);
  Renderer.mergeLayerData(filter, setup.colours.sprite_prefilters.hair, true);
  return filter;
}

(function (maplebirch) {
  'use strict';

  maplebirch.char.transformation.add('horse', 'physical', {
    parts: [
      { name: 'ears', tfRequired: 4 },
      { name: 'tail', tfRequired: 6 }
    ],

    traits: [
      { name: 'hooves', tfRequired: 2 },
      { name: 'sweatblood', tfRequired: 3 }
    ],

    build: 100,
    level: 6,
    update: [5, 10, 15, 20, 25, 30],

    icon: 'horse.png',

    message: {
      EN: {
        up: [
          'You feel an urge to run.',
          'Your legs feel stronger.',
          'Your blood runs hot. Your ears begin to tingle.',
          'Horse ears have grown from your head.',
          'Your lower back begins to tingle.',
          'A horse tail has grown. You feel built to run.'
        ],
        down: [
          'The urge to run fades.',
          'Your legs feel normal again.',
          'Your blood cools. Your ears no longer tingle.',
          'Your horse ears have disappeared.',
          'Your lower back has stopped tingling.',
          'Your horse tail has disappeared. You no longer feel built to run.'
        ]
      },
      CN: {
        up: ['你产生了奔跑的冲动。', '你的双腿变得更有力。', '你的血液变得温热。你的耳朵开始发痒。', '马耳从你的头上长了出来。', '你的后腰开始发痒。', '一条马尾长了出来。你觉得自己天生适合奔跑。'],
        down: ['奔跑的冲动逐渐消退。', '你的双腿恢复了正常。', '你的血液逐渐冷却。你的耳朵不再发痒。', '你的马耳消失了。', '你的后腰不再发痒。', '你的马尾消失了。你不再觉得自己天生适合奔跑。']
      }
    },

    decay: true,

    decayConditions: [
      () => V.maplebirch.transformation.horse.build >= 1,
      () => V.worn.head.name !== 'mane_ribbon',
      () => V.worn.neck.name !== 'golden_carrot_pendant',
      () => playerNormalPregnancyType() !== 'horse'
    ],

    suppress: true,

    suppressConditions: [sourceName => sourceName !== 'horse', () => V.worn.head.name !== 'mane_ribbon', () => V.worn.neck.name !== 'golden_carrot_pendant'],

    pre: options => {
      options.horse_ears_type = V.transformationParts?.horse?.ears;
      options.horse_tail_type = V.transformationParts?.horse?.tail;
    },

    layers: {
      horse_ears: {
        src: 'img/transformations/horse/ears/default.png',
        showfn: options => options.show_tf && isPartEnabled(options['horse_ears_type']) && !options.hide_all,
        filters: ['hair'],
        masksrcfn: options => {
          if (!V.transformationParts?.horse?.ears) return options.headMask;
        },
        zfn: () => {
          if (V.transformationParts?.horse?.ears) return maplebirch.char.ZIndices.over_head;
          return maplebirch.char.ZIndices.basehead;
        }
      },
      horse_tail: {
        srcfn: options => {
          const demon = isChimeraEnabled('demonhorse', 'tail');
          const tail = demon ? `tail-${options.demon_tail_state}` : 'tail-idle';
          return `img/transformations/horse/${tail}/${options['horse_tail_type']}.png`;
        },
        showfn: options => options.show_tf && isPartEnabled(options['horse_tail_type']) && !options.hide_all,
        zfn: options => {
          const cover = ['cover', 'flaunt'].includes(options.demon_tail_state) && isChimeraEnabled('demonhorse', 'tail');
          if (cover) return maplebirch.char.ZIndices.tailPenisCover;
          if (options['horse_tail_layer'] === 'back') return maplebirch.char.ZIndices.tail;
          return maplebirch.char.ZIndices.back_lower;
        }
      }
    },

    translations: {
      horse: { EN: 'Horse', CN: '马' }
    }
  });

  function pre(options: any) {
    options.filters.horseHair = hairLikeFilter(V.haircolour);
    maplebirch.log('test', 'WARN', options);
  }

  const layers = {
    horseEarsFront: {
      srcfn: (options: any) => `${options.src}body/transformations/horse/ears/front-default.png`,
      showfn: () => {
        const ears = V.transformationParts?.horse?.ears;
        return !(ears === 'disabled' || ears === 'hidden');
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
      showfn: () => {
        const ears = V.transformationParts?.horse?.ears;
        return !(ears === 'disabled' || ears === 'hidden');
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

  maplebirch.char.use('pre', pre, 'combatMainPc');
  maplebirch.char.use(layers, 'combatMainPc');
})(maplebirch);
