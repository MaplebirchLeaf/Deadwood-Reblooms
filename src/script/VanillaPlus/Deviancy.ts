// ./src/script/VanillaPlus/Deviancy.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Nature'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.deviancy.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.deviancy.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'deviancy-unlock', {
    output: 'deadwood-reblooms-deviancy-unlock',
    cond: () => maplebirch.VP.deviancy.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'deviancy-max', {
    output: 'earnFeat "Beyond Nature"',
    cond: () => maplebirch.VP.deviancy.max && !V.feats.currentSave['Beyond Nature']
  });

  const discover = (mirror: 'home' | 'farm' | 'tower') => `<<run maplebirch.VP.deviancy.discover('${mirror}')>>`;

  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-deviancy-mirror-exits', passage: 'Tentacle Plains' },
    { widget: 'deadwood-reblooms-deviancy-conduct-link', passage: 'Gwylan Ritual Select' }
  );

  // 记录镜面探索与仪式结算，并扩展异种癖上限。
  maplebirch.tool.zone.inject({
    locationPassage: {
      Mirror: [{ src: '<<effects>>', applyafter: discover('home') }],
      'Farm Mirror': [
        { src: '<<effects>>', applyafter: discover('farm') },
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "farm">>\n' }
      ],
      'Bird Tower Mirror': [
        { src: '<<effects>>', applyafter: discover('tower') },
        { src: '<<mirror>>', applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "tower">>\n' }
      ],
      'Eerie Mirror': [
        { src: '<<effects>>', applyafter: discover('home') },
        {
          src: '<<crimeicon "mark">>',
          applybefore: '<<deadwood-reblooms-deviancy-mirror-enter-link "home">>\n'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        {
          src: '$deviancy "deviancy" {reverse: true}',
          to: '$deviancy "deviancy" {max: $VanillaPlus.lock.deviancy ? 150 : 100, reverse: true}'
        }
      ],
      'Gwylan Ritual Sex Widgets': [
        {
          src: '<<earnFeat "Wildsong">>',
          applyafter: '<<set $VanillaPlus.deviancy.wildsong to true>>'
        },
        {
          src: '<<unset $sexRitual>>',
          applybefore: '<<run maplebirch.VP.deviancy.finish($sexRitual)>>'
        }
      ],
      'Widgets Deviancy': [
        {
          src: '<<set $_scaledDeviancyMax to 20 * $_n>>',
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? 150 : 20 * $_n>>'
        },
        {
          src: '<<set $_scaledDeviancyMax to 20 * $_n>>',
          to: '<<set $_scaledDeviancyMax to $_n is 6 and $VanillaPlus.lock.deviancy ? 150 : 20 * $_n>>'
        },
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>"
        },
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>"
        }
      ],
      'Widgets Clamp': [
        {
          src: '<<set $deviancy to Math.clamp($deviancy, 0, 100)>>',
          to: "<<set $deviancy to Math.clamp($deviancy, maplebirch.VP.minimum('deviancy'), $VanillaPlus.lock.deviancy ? 150 : 100)>>"
        }
      ]
    }
  });
}
