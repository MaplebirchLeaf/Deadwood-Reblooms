// ./src/script/traits.ts

(function (maplebirch) {
  'use strict';

  maplebirch.tool.patch.addTraits(
    {
      title: 'General Traits',
      name: () => maplebirch.t('deadwoodReblooms.Traits.hooves.name'),
      colour: 'def',
      has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.hooves),
      text: () => maplebirch.t('deadwoodReblooms.Traits.hooves.text')
    },
    {
      title: 'General Traits',
      name: () => maplebirch.t('deadwoodReblooms.Traits.sweatblood.name'),
      colour: 'tealhair',
      has: () => !['disabled', 'hidden'].includes(V.transformationParts.traits.sweatblood),
      text: () => maplebirch.t('deadwoodReblooms.Traits.sweatblood.text')
    },
    {
      title: 'General Traits',
      name: () => (V.player?.gender === 'n' ? '<<lanSwitch "Horse " "马">>' : '<<lanSwitch "Horse " "马">><<pcGender>>'),
      colour: 'softbrown',
      has: () => V.maplebirch.transformation.horse.level >= 6,
      text: () => maplebirch.t('deadwoodReblooms.Traits.horse.text')
    }
  );
})(maplebirch);
