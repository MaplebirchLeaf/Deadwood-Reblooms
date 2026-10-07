// ./src/script/LifeSimulation/PoolParty.ts

const INVITE_PASSAGES = ["Robin's Room Entrance", 'History Classroom', 'Canteen', 'School Library', 'School Front Courtyard', 'School Rear Courtyard', 'Temple'] as const;

const PARTY_PASSAGES = ['School Pool', 'School Night Pool Party Around', 'School Night Pool Party Socialise'] as const;

export default function PoolParty(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    ...INVITE_PASSAGES.map(passage => ({ widget: 'deadwood-reblooms-pool-party-invite', passage })),
    ...PARTY_PASSAGES.flatMap(passage => [
      { widget: 'deadwood-reblooms-pool-party-company', passage },
      { widget: 'deadwood-reblooms-pool-party-together', passage }
    ])
  );

  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-pool-party-journal');
}
