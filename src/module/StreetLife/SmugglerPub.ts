import type StreetLife from '../StreetLife';
import SmugglerCards, { pubCardPassages } from './SmugglerCards';

interface PubState {
  workDay: number;
  listenDay: number;
  restAt: number;
  teaDay: number;
  teaCount: number;
  last: { action: 'tea' | 'rest' | 'board' | 'listen' | 'work'; at: number; outcome: 'done' | 'interrupted' } | null;
  cards: typeof SmugglerCards.defaults;
}

/** 酒馆小事只在点击时推进；日限额随存档保存，正文和侧栏读取不结算。 */
export default class SmugglerPub {
  public static readonly defaults: PubState = { workDay: -1, listenDay: -1, restAt: -3600, teaDay: -1, teaCount: 0, last: null, cards: SmugglerCards.defaults };
  public readonly cards: SmugglerCards;

  public constructor(private readonly street: StreetLife) {
    this.cards = new SmugglerCards(this);
  }

  public get core(): typeof maplebirch {
    return this.street.core;
  }

  public get state(): PubState {
    return V.StreetLife.smuggler_pub;
  }

  public get picture(): boolean {
    const passage = this.street.core.passage.title;
    return (
      /^Smuggler Pub(?: |$)/.test(passage) ||
      [
        'Deadwood Smuggler Pub',
        ...Object.values(pubCardPassages),
        'Deadwood Street Weapon Shop',
        'Deadwood Street Heist Plan',
        'Deadwood Street Heist Preparation',
        'Deadwood Street Heist Candidate',
        'Deadwood Street Heist Debrief',
        'Deadwood Street Heist Contacts',
        'Deadwood Street Mickey'
      ].includes(passage) ||
      (passage === 'Deadwood Street Cargo' && V.StreetLife.jobs.site === 'smuggler')
    );
  }

  public get available(): boolean {
    return this.present && ['Smuggler Pub', 'Deadwood Smuggler Pub'].includes(this.street.core.passage.title);
  }

  public get gamblingAvailable(): boolean {
    return this.present && ['Deadwood Smuggler Pub', ...Object.values(pubCardPassages)].includes(this.core.passage.title) && V.stress < V.stressmax && !window.pcAreArmsBound('any');
  }

  private get present(): boolean {
    return (
      V.location === 'underground' &&
      V.smuggler_pub_known === 1 &&
      this.street.available &&
      !this.street.heist.inAction &&
      !this.street.bounties.busy &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      !(V.temple_spear_mission >= 1 && !V.smuggler_pub_zephyr) &&
      !(C.npc.Wren.love >= 40 && !V.smuggler_pub_wren)
    );
  }
}
