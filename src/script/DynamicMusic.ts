export default function DynamicMusic(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-DynamicMusic-Options');

  const selector = '.deadwood-dynamic-music-enabled input[type="checkbox"]';
  $(document)
    .off('change.deadwoodDynamicMusic', selector)
    .on('change.deadwoodDynamicMusic', selector, () => maplebirch.DM.refresh());
}
