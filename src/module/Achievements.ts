import definitions from '../assets/achievements.json';

type AchievementModule = 'Finance' | 'BirdTower' | 'LifeSimulation' | 'MoreTransformations' | 'Orchard' | 'Robin' | 'StreetLife' | 'Sydney' | 'VanillaPlus' | 'Whitney';

class Achievements {
  /** 各模块注册成就定义，标题与说明随当前语言切换。 */
  public static add(maplebirch: typeof window.maplebirch, module: AchievementModule): void {
    maplebirch.tool.onInit(() => {
      for (const entry of definitions) {
        if (entry.module !== module) continue;
        setup.feats[entry.id] ??= {
          get title() {
            return lanSwitch(entry.title[0], entry.title[1]);
          },
          get desc() {
            return lanSwitch(entry.description[0], entry.description[1]);
          },
          difficulty: entry.difficulty,
          series: '',
          filter: entry.filter,
          ...('softLockable' in entry && entry.softLockable ? { softLockable: true } : {})
        };
      }
    });

    switch (module) {
      case 'LifeSimulation': {
        maplebirch.dynamic.regStateEvent('append', 'life-simulation-history-feat', {
          output: 'earnFeat "Local History Exhibition"',
          cond: () => V.feats?.currentSave['Local History Exhibition'] === undefined && V.LifeSimulation?.historyProject?.status === 'won'
        });

        maplebirch.dynamic.regStateEvent('append', 'life-simulation-president-feat', {
          output: 'earnFeat "Student Council President"',
          cond: () => V.feats?.currentSave['Student Council President'] === undefined && V.LifeSimulation?.school?.role === 'president'
        });

        maplebirch.dynamic.regStateEvent('append', 'life-simulation-naked-school-feat', {
          output: 'earnFeat "Naked School"',
          cond: () => V.feats?.currentSave['Naked School'] === undefined && V.LifeSimulation?.school?.dress?.highest === 'mandatoryNudity'
        });

        maplebirch.dynamic.regStateEvent('append', 'life-simulation-casino-streak-feat', {
          output: 'earnFeat "Deadwood Winning Streak"',
          cond: () => V.feats?.currentSave['Deadwood Winning Streak'] === undefined && (V.LifeSimulation?.casino?.statistics.best_streak ?? 0) >= 5
        });

        maplebirch.dynamic.regStateEvent('append', 'life-simulation-casino-profit-feat', {
          output: 'earnFeat "Deadwood Big Night"',
          cond: () => V.feats?.currentSave['Deadwood Big Night'] === undefined && (V.LifeSimulation?.casino?.statistics.best_night_profit ?? 0) >= 1000000
        });

        maplebirch.dynamic.regStateEvent('append', 'life-simulation-casino-dealer-feat', {
          output: 'earnFeat "Deadwood Steady Dealer"',
          cond: () => V.feats?.currentSave['Deadwood Steady Dealer'] === undefined && (V.LifeSimulation?.casino?.good_shifts ?? 0) >= 10
        });
        break;
      }
      case 'MoreTransformations': {
        maplebirch.dynamic.regStateEvent('append', 'horse-transformation-feat', {
          output: 'earnFeat "Horse Transformation"',
          cond: () => V.feats?.currentSave['Horse Transformation'] === undefined && (V.maplebirch?.transformation?.horse?.level ?? 0) >= 6
        });

        maplebirch.dynamic.regStateEvent('append', 'whale-transformation-feat', {
          output: 'earnFeat "Whale"',
          cond: () => V.feats?.currentSave['Whale'] === undefined && (V.maplebirch?.transformation?.whale?.level ?? 0) >= 6
        });

        maplebirch.dynamic.regStateEvent('append', 'raven-transformation-feat', {
          output: 'earnFeat "Raven Transformation"',
          cond: () => V.feats?.currentSave['Raven Transformation'] === undefined && (V.maplebirch?.transformation?.raven?.level ?? 0) >= 6
        });

        maplebirch.dynamic.regStateEvent('append', 'undead-transformation-feat', {
          output: 'earnFeat "Deadwood Cursed Flesh"',
          cond: () =>
            V.feats?.currentSave['Deadwood Cursed Flesh'] === undefined &&
            !V.statFreeze &&
            !V.replayScene &&
            !V.frozenValues &&
            ((V.MoreTransformations?.treasure?.bound && maplebirch.get('MoreTransformations')?.Undead.active) || (V.MoreTransformations?.treasure?.returns ?? 0) > 0)
        });

        maplebirch.dynamic.regStateEvent('append', 'undead-cure-feat', {
          output: 'earnFeat "Deadwood Back Among the Living"',
          cond: () => V.feats?.currentSave['Deadwood Back Among the Living'] === undefined && !V.statFreeze && !V.replayScene && !V.frozenValues && (V.MoreTransformations?.treasure?.returns ?? 0) > 0
        });
        break;
      }
      case 'VanillaPlus': {
        maplebirch.dynamic.regStateEvent('append', 'beauty-max', {
          output: 'earnFeat "Unadorned"',
          cond: () => V.feats?.currentSave['Unadorned'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.beauty.max
        });

        maplebirch.dynamic.regStateEvent('append', 'deviancy-max', {
          output: 'earnFeat "Beyond Nature"',
          cond: () => V.feats?.currentSave['Beyond Nature'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.deviancy.max
        });

        maplebirch.dynamic.regStateEvent('append', 'exhibitionism-max', {
          output: 'earnFeat "Beyond Shame"',
          cond: () => V.feats?.currentSave['Beyond Shame'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.exhibitionism.max
        });

        maplebirch.dynamic.regStateEvent('append', 'physique-max', {
          output: 'earnFeat "Unbreakable"',
          cond: () => V.feats?.currentSave['Unbreakable'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.physique.max
        });

        maplebirch.dynamic.regStateEvent('append', 'promiscuity-max', {
          output: 'earnFeat "Every Inch"',
          cond: () => V.feats?.currentSave['Every Inch'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.promiscuity.max
        });

        maplebirch.dynamic.regStateEvent('append', 'willpower-max', {
          output: 'earnFeat "Sovereign Will"',
          cond: () => V.feats?.currentSave['Sovereign Will'] === undefined && V.VanillaPlus != null && maplebirch.get('VanillaPlus')!.willpower.max
        });

        maplebirch.dynamic.regStateEvent('append', 'vanilla-plus-all-max-feat', {
          output: 'earnFeat "Every Limit Broken"',
          cond: () => V.feats?.currentSave['Every Limit Broken'] === undefined && V.VanillaPlus != null && V.VanillaPlus.traits.incorrigible
        });

        break;
      }
      case 'Finance': {
        // 董事记录正式任命，控股读取当前已交割股份，未交割股份不算。
        maplebirch.dynamic.regStateEvent('append', 'finance-board-seat-feat', {
          output: 'earnFeat "Deadwood Board Seat"',
          cond: () => V.feats?.currentSave['Deadwood Board Seat'] === undefined && V.Finance?.company?.shareholders?.board === true
        });

        maplebirch.dynamic.regStateEvent('append', 'finance-controlling-stake-feat', {
          output: 'earnFeat "Deadwood Controlling Stake"',
          cond: () => V.feats?.currentSave['Deadwood Controlling Stake'] === undefined && V.Finance?.company?.shareholders != null && maplebirch.get('Finance')!.company.shareholders.controller
        });

        maplebirch.dynamic.regStateEvent('append', 'finance-black-raven-feat', {
          output: 'earnFeat "Deadwood Black Raven"',
          cond: () => V.feats?.currentSave['Deadwood Black Raven'] === undefined && V.Finance?.company?.ascension?.recognized === true
        });

        maplebirch.dynamic.regStateEvent('append', 'finance-comeback-feat', {
          output: 'earnFeat "Deadwood Comeback"',
          cond: () => V.feats?.currentSave['Deadwood Comeback'] === undefined && V.Finance?.brokerage?.margin != null && maplebirch.get('Finance')!.margin.recovered
        });

        maplebirch.dynamic.regStateEvent('append', 'property-keys-feat', {
          output: 'earnFeat "Own Keys"',
          extra: { passage: ['Deadwood Reblooms Property Office', 'Deadwood Reblooms Property Home'] },
          cond: () =>
            V.feats?.currentSave['Own Keys'] === undefined &&
            V.Finance?.real_estate != null &&
            maplebirch.get('Finance')!.realEstate.properties.some(property => maplebirch.get('Finance')!.realEstate.owns(property.id))
        });

        maplebirch.dynamic.regStateEvent('append', 'property-furniture-feat', {
          output: 'earnFeat "Feels Like Home"',
          extra: { passage: ['Deadwood Reblooms Property Furniture Catalogue', 'Deadwood Reblooms Property Home'] },
          cond: () =>
            V.feats?.currentSave['Feels Like Home'] === undefined &&
            V.Finance?.real_estate != null &&
            maplebirch.get('Finance')!.realEstate.properties.some(property => maplebirch.get('Finance')!.realEstate.furnished(property.id))
        });
        break;
      }
      case 'StreetLife': {
        // 安静进入银行还不算完成，须成功分账结案且从未报警或被认出。
        maplebirch.dynamic.regStateEvent('append', 'street-life-quiet-heist-feat', {
          output: 'earnFeat "Deadwood Quiet Heist"',
          cond: () => {
            const heist = V.StreetLife?.heist;
            return (
              V.feats?.currentSave['Deadwood Quiet Heist'] === undefined &&
              heist?.stage === 'closed' &&
              heist.settled &&
              heist.outcome === 'success' &&
              heist.entered &&
              heist.approach === 'quiet' &&
              !heist.raisedAlarm &&
              !heist.identified
            );
          }
        });

        maplebirch.dynamic.regStateEvent('append', 'street-life-first-bounty-feat', {
          output: 'earnFeat "Deadwood First Bounty"',
          cond: () => V.feats?.currentSave['Deadwood First Bounty'] === undefined && (V.StreetLife?.bounties?.completed ?? 0) >= 1
        });
        break;
      }
    }
  }
}

export default Achievements;
