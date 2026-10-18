import terms from '../../assets/street/stories.json';
import type StreetLife from '../StreetLife';

export type StreetStory = 'landry' | 'wren' | 'mickey';

interface StoryState {
  stage: number;
  choice: string;
  outcome: string;
  crew: string[];
  roll: number;
  result: string;
  quality: number;
  source: string;
  paid: number;
  spent: number;
  paused: boolean;
}

const story = (): StoryState => ({ stage: 0, choice: '', outcome: '', crew: [], roll: 0, result: '', quality: 0, source: '', paid: 0, spent: 0, paused: false });

/** 三段街头经历只保存实际选择；剧情与结算写在自有 Twee，普通菜单仅接入短入口。 */
export default class Stories {
  public static readonly defaults: Record<StreetStory, StoryState> = { landry: story(), wren: story(), mickey: story() };
  public readonly terms = terms;

  public constructor(private readonly street: StreetLife) {}

  public get state(): Record<StreetStory, StoryState> {
    return V.StreetLife.stories;
  }

  public get current(): StreetStory | null {
    return (Object.keys(this.state) as StreetStory[]).find(id => this.state[id].stage > 0 && this.state[id].stage < 4) ?? null;
  }

  public get busy(): boolean {
    const current = this.current;
    return current !== null && !this.state[current].paused;
  }

  public get available(): boolean {
    return (
      this.street.available &&
      ['idle', 'prep'].includes(this.street.heist.state.stage) &&
      !V.nextPassage &&
      !V.nextPassageCheck &&
      !this.street.jobs.state.active &&
      !this.street.bounties.state.active &&
      !this.street.bounties.busy &&
      !V.gag &&
      !V.worn.face.type.includes('gag') &&
      !window.pcAreArmsBound('both')
    );
  }

  public get unlocked(): Record<StreetStory, boolean> {
    return {
      landry:
        V.smuggler_pub_known === 1 &&
        C.npc.Landry?.init === 1 &&
        this.street.heist.contacts.landryTier >= 1 &&
        this.street.reputation >= terms.requiredReputation &&
        (this.street.jobs.state.completed >= 2 || V.pub_task_stat >= 3 || (V.moneyStats?.pubStolenGoods?.earned ?? 0) >= 100000),
      wren: this.state.landry.stage === 4 && C.npc.Wren?.init === 1 && C.npc.Wren.love >= 20,
      mickey: this.state.wren.stage === 4
    };
  }

  public get ready(): boolean {
    return Object.values(this.state).every(record => record.stage === 4);
  }

  public get policeAvailable(): boolean {
    return C.npc.Grant?.init === 1 && C.npc.Grant.state === 'active' && this.street.heist.grantAvailable && this.street.core.npc.Schedule.get('Grant').location === 'police_station';
  }

  public get entries() {
    if (!this.available) return [];
    const current = this.current;
    return (Object.keys(terms.chains) as StreetStory[]).flatMap(id => {
      const record = this.state[id];
      if (record.paused || record.stage >= 4 || (current !== null && current !== id) || (record.stage === 0 && !this.unlocked[id])) return [];
      const chain = terms.chains[id];
      return chain.stages[record.stage].flatMap(target => {
        const site = terms.sites[target.site as keyof typeof terms.sites];
        const atSite = this.street.core.passage.title === site.passage || (target.site === 'smuggler' && this.street.core.passage.title === 'Deadwood Street Work');
        return atSite && V.location === site.location && Time.hour >= site.open && Time.hour < site.close && (target.site !== 'police' || this.policeAvailable)
          ? [{ id, name: chain.name, icon: chain.icon, ...target }]
          : [];
      });
    });
  }

  /** 情报与取舍只影响对应环节，不能抵掉 PC 的技能、伤势或犯罪记录。 */
  public get modifiers() {
    return {
      entry: this.state.mickey.stage === 4 && this.state.mickey.outcome === 'verified' ? terms.finale.verifiedEntry : 0,
      talk: this.state.mickey.stage === 4 && this.state.mickey.outcome === 'cautious' ? terms.finale.cautiousTalk : 0,
      vault:
        (this.state.landry.stage === 4 && this.state.landry.outcome === 'settled' ? terms.finale.settledVault : 0) +
        (this.state.wren.stage === 4 && this.state.wren.outcome === 'cargo' ? terms.finale.cargoVault : 0),
      escape:
        (this.state.wren.stage === 4 ? (this.state.wren.outcome === 'people' ? terms.finale.peopleEscape : this.state.wren.outcome === 'lost' ? terms.finale.lostEscape : 0) : 0) +
        (this.state.mickey.stage === 4 && this.state.mickey.outcome === 'police' ? terms.finale.policeEscape : 0)
    };
  }
}
