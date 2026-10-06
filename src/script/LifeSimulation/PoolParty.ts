// ./src/script/LifeSimulation/PoolParty.ts

import { POOL_PARTY_COMPANIONS } from '../../module/constants';

const INVITE_PASSAGES = ['Orphanage', 'Bedroom', 'Hallways', 'Canteen', 'School Library', 'School Front Courtyard', 'School Rear Courtyard', 'Temple', 'Docks', 'Flats'] as const;

const PARTY_PASSAGES = ['School Pool', 'School Night Pool Party Around', 'School Night Pool Party Socialise'] as const;

export default function PoolParty(maplebirch: typeof window.maplebirch): void {
  const party = () => maplebirch.get('LifeSimulation')!.pool_party;
  const feat = 'Pool Party Plus Ones';

  maplebirch.tool.addTo(
    'BeforeLinkZone',
    ...INVITE_PASSAGES.map(passage => ({ widget: 'deadwood-reblooms-pool-party-invite', passage })),
    ...PARTY_PASSAGES.flatMap(passage => [
      { widget: 'deadwood-reblooms-pool-party-company', passage },
      { widget: 'deadwood-reblooms-pool-party-together', passage }
    ])
  );

  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-pool-party-journal');

  // 只在已邀约的派对结束后清场；历史同行记录不受影响。
  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-pool-party-settle', {
    cond: () => {
      if (!V.LifeSimulation?.pool_party?.companions?.length) return false;
      const state = party();
      return !state.known && !state.tonight;
    },
    action: () => party().settle()
  });

  maplebirch.dynamic.regStateEvent('append', 'life-simulation-pool-party-feat', {
    output: `earnFeat "${feat}"`,
    cond: () => {
      if (V.feats?.currentSave[feat] !== undefined) return false;
      const met = V.LifeSimulation?.pool_party?.met;
      return POOL_PARTY_COMPANIONS.every(name => met?.includes(name));
    }
  });

  maplebirch.tool.onInit(() => {
    setup.feats[feat] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:pool_party:feat:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:pool_party:feat:description');
      },
      difficulty: 2,
      series: '',
      filter: ['All', 'General']
    };
  });
}
