// ./src/script/VanillaPlus.ts

import Beauty from './VanillaPlus/Beauty';
import Deviancy from './VanillaPlus/Deviancy';
import DivineTransformations from './VanillaPlus/DivineTransformations';
import Exhibitionism from './VanillaPlus/Exhibitionism';
import HandGrip from './VanillaPlus/HandGrip';
import HermEjaculation from './VanillaPlus/HermEjaculation';
import NPCDoublePenetration from './VanillaPlus/NPCDoublePenetration';
import OrphanEvents from './VanillaPlus/OrphanEvents';
import PenisSize from './VanillaPlus/PenisSize';
import Physique from './VanillaPlus/Physique';
import Promiscuity from './VanillaPlus/Promiscuity';
import Trinity from './VanillaPlus/Trinity';
import VirginityRestoration from './VanillaPlus/VirginityRestoration';
import Willpower from './VanillaPlus/Willpower';

export default function (maplebirch: typeof window.maplebirch) {
  'use strict';

  const { macro } = maplebirch.tool;
  macro.create('lwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -1, 'lblue'));
  macro.create('llwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -2, 'lblue'));
  macro.create('lllwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -3, 'lblue'));

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Attitudes': [{ src: '<<if $attitudesControl.unlockHypnosis>>', applybefore: '<<deadwood-reblooms-trait-attitudes>>', expected: 1 }]
    }
  });

  maplebirch.tool.addTo('DegreesBonusDisplay', 'deadwood-reblooms-characteristics-degrees-display');
  Beauty(maplebirch);
  Deviancy(maplebirch);
  DivineTransformations(maplebirch);
  Trinity(maplebirch);
  Exhibitionism(maplebirch);
  HandGrip(maplebirch);
  HermEjaculation(maplebirch);
  NPCDoublePenetration(maplebirch);
  OrphanEvents(maplebirch);
  PenisSize(maplebirch);
  Physique(maplebirch);
  Promiscuity(maplebirch);
  Willpower(maplebirch);
  VirginityRestoration(maplebirch);

  maplebirch.tool.patch.traits.add(
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:sadomasochist:name'),
      colour: 'def',
      has: () => maplebirch.get('VanillaPlus')!.sadomasochist,
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:sadomasochist:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:willpower:name'),
      colour: 'gold',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('willpower'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:willpower:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:physique:name'),
      colour: 'gold',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('physique'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:physique:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:beauty:name'),
      colour: 'gold',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('beauty'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:beauty:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:exhibitionism:name'),
      colour: 'lustful',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('exhibitionism'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:exhibitionism:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:deviancy:name'),
      colour: 'lustful',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('deviancy'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:deviancy:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:promiscuity:name'),
      colour: 'lustful',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('promiscuity'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:promiscuity:text')
    },
    {
      title: 'Special Traits',
      name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:incorrigible:name'),
      colour: 'silver',
      has: () => maplebirch.get('VanillaPlus')!.unlocked('incorrigible'),
      text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:traits:incorrigible:text')
    }
  );
}
