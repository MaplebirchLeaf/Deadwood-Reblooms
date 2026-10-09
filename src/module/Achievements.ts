// ./src/module/Achievements.ts

type AchievementModule = 'Finance' | 'BirdTower' | 'LifeSimulation' | 'MoreTransformations' | 'Orchard' | 'Robin' | 'Sydney' | 'VanillaPlus' | 'Whitney';

interface AchievementDefinition {
  module: AchievementModule;
  id: string;
  title: string;
  description: string;
  difficulty: number;
  filter: string[];
  softLockable?: boolean;
}

class Achievements {
  private static readonly definitions: readonly AchievementDefinition[] = [
    {
      module: 'BirdTower',
      id: 'Our First Flight',
      title: 'deadwood-reblooms:birdtower:feat:firstFlight:name',
      description: 'deadwood-reblooms:birdtower:feat:firstFlight:text',
      difficulty: 2,
      filter: ['All', 'Social']
    },
    {
      module: 'BirdTower',
      id: 'Wild Animals',
      title: 'deadwood-reblooms:birdtower:feat:wildAnimals:name',
      description: 'deadwood-reblooms:birdtower:feat:wildAnimals:text',
      difficulty: 2,
      filter: ['All', 'Social']
    },
    {
      module: 'BirdTower',
      id: 'Dances with Fox',
      title: 'deadwood-reblooms:birdtower:feat:dancesWithFox:name',
      description: 'deadwood-reblooms:birdtower:feat:dancesWithFox:text',
      difficulty: 3,
      filter: ['All', 'Social']
    },
    {
      module: 'MoreTransformations',
      id: 'Horse Transformation',
      title: 'deadwood-reblooms:transformations:horse:feat:title',
      description: 'deadwood-reblooms:transformations:horse:feat:description',
      difficulty: 1,
      filter: ['All', 'Transformation']
    },
    {
      module: 'MoreTransformations',
      id: 'Whale',
      title: 'deadwood-reblooms:transformations:whale:feat:title',
      description: 'deadwood-reblooms:transformations:whale:feat:description',
      difficulty: 1,
      filter: ['All', 'Transformation']
    },
    {
      module: 'MoreTransformations',
      id: 'Raven Transformation',
      title: 'deadwood-reblooms:transformations:raven:feat:title',
      description: 'deadwood-reblooms:transformations:raven:feat:description',
      difficulty: 1,
      filter: ['All', 'Transformation']
    },
    {
      module: 'Robin',
      id: 'Deadwood Robin Independent',
      title: 'deadwood-reblooms:robin:feat:Deadwood Robin Independent:name',
      description: 'deadwood-reblooms:robin:feat:Deadwood Robin Independent:text',
      difficulty: 2,
      filter: ['All', 'Social']
    },
    {
      module: 'Robin',
      id: 'Deadwood Robin Together',
      title: 'deadwood-reblooms:robin:feat:Deadwood Robin Together:name',
      description: 'deadwood-reblooms:robin:feat:Deadwood Robin Together:text',
      difficulty: 3,
      filter: ['All', 'Social']
    },
    {
      module: 'Robin',
      id: 'Deadwood Robin Free',
      title: 'deadwood-reblooms:robin:feat:Deadwood Robin Free:name',
      description: 'deadwood-reblooms:robin:feat:Deadwood Robin Free:text',
      difficulty: 3,
      filter: ['All', 'Social']
    },
    {
      module: 'Robin',
      id: 'Deadwood Robin Shop Open',
      title: 'deadwood-reblooms:robin:feat:Deadwood Robin Shop Open:name',
      description: 'deadwood-reblooms:robin:feat:Deadwood Robin Shop Open:text',
      difficulty: 3,
      filter: ['All', 'Social']
    },
    {
      module: 'VanillaPlus',
      id: 'Unbreakable',
      title: 'deadwood-reblooms:VanillaPlus:physique:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:physique:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    },
    {
      module: 'VanillaPlus',
      id: 'Every Limit Broken',
      title: 'deadwood-reblooms:VanillaPlus:incorrigible:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:incorrigible:feat:description',
      difficulty: 4,
      filter: ['All', 'Stats']
    },
    {
      module: 'Whitney',
      id: 'Deadwood Whitney Rescued',
      title: 'deadwood-reblooms:whitney:feat:rescued:name',
      description: 'deadwood-reblooms:whitney:feat:rescued:text',
      difficulty: 3,
      filter: ['All', 'Social']
    },
    {
      module: 'LifeSimulation',
      id: 'Evidence Matters',
      title: 'deadwood-reblooms:feats:Evidence Matters:name',
      description: 'deadwood-reblooms:feats:Evidence Matters:text',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Local History Exhibition',
      title: 'deadwood-reblooms:LifeSimulation:history:feat:title',
      description: 'deadwood-reblooms:LifeSimulation:history:feat:description',
      difficulty: 2,
      filter: ['All', 'General'],
      softLockable: true
    },
    {
      module: 'LifeSimulation',
      id: 'Pool Party Plus Ones',
      title: 'deadwood-reblooms:LifeSimulation:pool_party:feat:title',
      description: 'deadwood-reblooms:LifeSimulation:pool_party:feat:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Student Council President',
      title: 'deadwood-reblooms:LifeSimulation:school:trait:president:name',
      description: 'deadwood-reblooms:LifeSimulation:school:feat:president:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Naked School',
      title: 'deadwood-reblooms:LifeSimulation:school:feat:naked:title',
      description: 'deadwood-reblooms:LifeSimulation:school:feat:naked:description',
      difficulty: 3,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Deadwood Winning Streak',
      title: 'deadwood-reblooms:LifeSimulation:casino:feat:streak:title',
      description: 'deadwood-reblooms:LifeSimulation:casino:feat:streak:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Deadwood Big Night',
      title: 'deadwood-reblooms:LifeSimulation:casino:feat:profit:title',
      description: 'deadwood-reblooms:LifeSimulation:casino:feat:profit:description',
      difficulty: 3,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Deadwood Steady Dealer',
      title: 'deadwood-reblooms:LifeSimulation:casino:feat:dealer:title',
      description: 'deadwood-reblooms:LifeSimulation:casino:feat:dealer:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'LifeSimulation',
      id: 'Deadwood Giant Killer',
      title: 'deadwood-reblooms:LifeSimulation:casino:feat:giant_killer:title',
      description: 'deadwood-reblooms:LifeSimulation:casino:feat:giant_killer:description',
      difficulty: 3,
      filter: ['All', 'General']
    },
    {
      module: 'Sydney',
      id: 'Four Halloween Visits',
      title: 'deadwood-reblooms:sydney:halloween:feat:title',
      description: 'deadwood-reblooms:sydney:halloween:feat:description',
      difficulty: 3,
      filter: ['All', 'General']
    },
    {
      module: 'VanillaPlus',
      id: 'Unadorned',
      title: 'deadwood-reblooms:VanillaPlus:beauty:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:beauty:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    },
    {
      module: 'VanillaPlus',
      id: 'Beyond the Mirror',
      title: 'deadwood-reblooms:feats:Beyond the Mirror:name',
      description: 'deadwood-reblooms:feats:Beyond the Mirror:text',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'VanillaPlus',
      id: 'Beyond Nature',
      title: 'deadwood-reblooms:VanillaPlus:deviancy:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:deviancy:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    },
    {
      module: 'VanillaPlus',
      id: 'Beyond Shame',
      title: 'deadwood-reblooms:VanillaPlus:exhibitionism:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:exhibitionism:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    },
    {
      module: 'VanillaPlus',
      id: 'Every Inch',
      title: 'deadwood-reblooms:VanillaPlus:promiscuity:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:promiscuity:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    },
    {
      module: 'Orchard',
      id: 'Deadwood Orchard Supply',
      title: 'deadwood-reblooms:orchard:feat:supply:title',
      description: 'deadwood-reblooms:orchard:feat:supply:description',
      difficulty: 1,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Deadwood First Factory Payment',
      title: 'deadwood-reblooms:finance:feat:factory_payment:title',
      description: 'deadwood-reblooms:finance:feat:factory_payment:description',
      difficulty: 1,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Deadwood Margin Call',
      title: 'deadwood-reblooms:finance:feat:margin_call:title',
      description: 'deadwood-reblooms:finance:feat:margin_call:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Deadwood Comeback',
      title: 'deadwood-reblooms:finance:feat:comeback:title',
      description: 'deadwood-reblooms:finance:feat:comeback:description',
      difficulty: 3,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Deadwood Unpaid Invoice',
      title: 'deadwood-reblooms:finance:feat:unpaid_invoice:title',
      description: 'deadwood-reblooms:finance:feat:unpaid_invoice:description',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Own Keys',
      title: 'deadwood-reblooms:feats:Own Keys:name',
      description: 'deadwood-reblooms:feats:Own Keys:text',
      difficulty: 1,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Feels Like Home',
      title: 'deadwood-reblooms:feats:Feels Like Home:name',
      description: 'deadwood-reblooms:feats:Feels Like Home:text',
      difficulty: 2,
      filter: ['All', 'General']
    },
    {
      module: 'Finance',
      id: 'Leave a Light On',
      title: 'deadwood-reblooms:feats:Leave a Light On:name',
      description: 'deadwood-reblooms:feats:Leave a Light On:text',
      difficulty: 2,
      filter: ['All', 'Social']
    },
    {
      module: 'Finance',
      id: 'Ride the Wind',
      title: 'deadwood-reblooms:feats:Ride the Wind:name',
      description: 'deadwood-reblooms:feats:Ride the Wind:text',
      difficulty: 1,
      filter: ['All', 'General']
    },
    {
      module: 'VanillaPlus',
      id: 'Sovereign Will',
      title: 'deadwood-reblooms:VanillaPlus:willpower:feat:title',
      description: 'deadwood-reblooms:VanillaPlus:willpower:feat:description',
      difficulty: 3,
      filter: ['All', 'Stats']
    }
  ];

  /** 各模块注册成就定义，标题与说明随当前语言切换。 */
  public static add(maplebirch: typeof window.maplebirch, module: AchievementModule): void {
    maplebirch.tool.onInit(() => {
      for (const entry of Achievements.definitions) {
        if (entry.module !== module) continue;
        setup.feats[entry.id] ??= {
          get title() {
            return maplebirch.t(entry.title);
          },
          get desc() {
            return maplebirch.t(entry.description);
          },
          difficulty: entry.difficulty,
          series: '',
          filter: entry.filter,
          ...(entry.softLockable ? { softLockable: true } : {})
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
    }
  }
}

export default Achievements;
