// ./src/script/LifeSimulation/Eden.ts

export default function Eden(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-eden-range-link', passage: ['Eden Shoot', 'Eden Shoot First Focus', 'Eden Shoot Focus'] },
    { widget: 'deadwood-eden-hunt-return', passage: 'Eden Hunt 3' }
  );
}
