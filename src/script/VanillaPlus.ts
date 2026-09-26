// ./src/script/VanillaPlus.ts

import Beauty from './VanillaPlus/Beauty';
import Deviancy from './VanillaPlus/Deviancy';
import DivineTransformations from './VanillaPlus/DivineTransformations';
import Exhibitionism from './VanillaPlus/Exhibitionism';
import Finance from './VanillaPlus/Finance';
import HandGrip from './VanillaPlus/HandGrip';
import NPCDoublePenetration from './VanillaPlus/NPCDoublePenetration';
import Physique from './VanillaPlus/Physique';
import Promiscuity from './VanillaPlus/Promiscuity';
import SydneyChastity from './VanillaPlus/SydneyChastity';
import SydneyConfession from './VanillaPlus/SydneyConfession';
import SydneyScience from './VanillaPlus/SydneyScience';
import VirginityRestoration from './VanillaPlus/VirginityRestoration';
import Willpower from './VanillaPlus/Willpower';

export default function (maplebirch: typeof window.maplebirch) {
  'use strict';

  maplebirch.once(':sugarcube', () => {
    const { macro } = maplebirch.tool;
    macro.create('lwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -1, 'lblue'));
    macro.create('llwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -2, 'lblue'));
    macro.create('lllwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -3, 'lblue'));
  });

  maplebirch.tool.addTo('DegreesBonusDisplay', 'deadwood-reblooms-characteristics-degrees-display');
  maplebirch.tool.onInit(() => {
    setup.feats['Every Limit Broken'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:incorrigible:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:VanillaPlus:incorrigible:feat:description');
      },
      difficulty: 5,
      series: '',
      filter: ['All', 'Stats']
    };
  });
  Beauty(maplebirch);
  Deviancy(maplebirch);
  DivineTransformations(maplebirch);
  Exhibitionism(maplebirch);
  HandGrip(maplebirch);
  NPCDoublePenetration(maplebirch);
  Finance(maplebirch);
  Physique(maplebirch);
  Promiscuity(maplebirch);
  Willpower(maplebirch);
  SydneyChastity(maplebirch);
  SydneyConfession(maplebirch);
  SydneyScience(maplebirch);
  VirginityRestoration(maplebirch);

  maplebirch.tool.patch.traits.add(
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:willpower:name'),
      colour: 'gold',
      has: () => maplebirch.VP.hasTrait('willpower'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:willpower:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:physique:name'),
      colour: 'gold',
      has: () => maplebirch.VP.hasTrait('physique'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:physique:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:beauty:name'),
      colour: 'gold',
      has: () => maplebirch.VP.hasTrait('beauty'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:beauty:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:exhibitionism:name'),
      colour: 'lustful',
      has: () => maplebirch.VP.hasTrait('exhibitionism'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:exhibitionism:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:deviancy:name'),
      colour: 'lustful',
      has: () => maplebirch.VP.hasTrait('deviancy'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:deviancy:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:promiscuity:name'),
      colour: 'lustful',
      has: () => maplebirch.VP.hasTrait('promiscuity'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:promiscuity:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:incorrigible:name'),
      colour: 'silver',
      has: () => maplebirch.VP.hasTrait('incorrigible'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:incorrigible:text')
    }
  );

  maplebirch.dynamic.regStateEvent('gate', 'vanilla-plus-traits', {
    output: 'deadwood-reblooms-trait-unlocks',
    cond: () => V.VanillaPlus != null && maplebirch.VP.traitsPending
  });
  maplebirch.dynamic.regStateEvent('gate', 'vanilla-plus-preserve', {
    output: 'run maplebirch.VP.preserve()',
    cond: () => V.VanillaPlus != null && maplebirch.VP.belowMinimum
  });
  maplebirch.dynamic.regStateEvent('gate', 'vanilla-plus-all-max-feat', {
    output: 'earnFeat "Every Limit Broken"',
    cond: () => V.VanillaPlus != null && V.VanillaPlus.traits.incorrigible && !V.feats.currentSave['Every Limit Broken']
  });
}
