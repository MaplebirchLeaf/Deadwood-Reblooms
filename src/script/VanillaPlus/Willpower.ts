// ./src/script/VanillaPlus/Willpower.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Sovereign Will'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.willpower.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.willpower.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'willpower-max', {
    output: 'earnFeat "Sovereign Will"',
    cond: () => maplebirch.VP.willpower.max && !V.feats.currentSave['Sovereign Will']
  });

  const slimeDefyPassages = [
    'Asylum Mundane Slime Defy',
    'Asylum Patient Slime Defy',
    'Farm Slime Strip Defy',
    'Forest Pitcher Slime Defy',
    'Forest Slime Pair Defy',
    'Forest Slime Wolf Defy',
    'Hallways Slime Breasts Defy',
    'Hallways Slime Strip Defy',
    'Lake Stroll Slime Defy',
    'Livestock Slime Field Grass Defy',
    'Livestock Slime Field Grass Extreme Defy',
    'Meadow Relax Slime Defy',
    'Ocean Breeze Slime Defy',
    'Pound Food Event Slime Defy',
    'School Lesson Slime',
    'School Lesson 2 Slime',
    'Sea Slime Dolphins Defy',
    'SleepSlimeEventDefy',
    'Street Bind Slime Defy',
    'Street Car Slime Defy',
    'Street Exhibitionism Fame Flaunt Slime Defy',
    'Street Slime Defy',
    'Street Slime Extreme Defy',
    'Tentacle Plains Ear Slime Defy',
    'Trash Slime Defy'
  ];
  const slimeDefy = Object.fromEntries(
    slimeDefyPassages.map(passage => [
      passage,
      [
        {
          src: "currentSkillValue('willpower')",
          to: "maplebirch.VP.willpower.earSlimeResistance(currentSkillValue('willpower'))"
        }
      ]
    ])
  );

  maplebirch.tool.zone.inject({
    locationPassage: {
      ...slimeDefy,
      'Kylar Abduction Hypnosis Resist': [
        {
          srcmatch: /<<if [^>]*\$willpowerSuccess[^>]*>>/,
          applyafter: '<<set $VanillaPlus.willpower.kylar to true>>'
        }
      ],
      'Lake Ruin Prison Possession Resist': [
        {
          srcmatch: /<<if [^>]*\$willpowerSuccess[^>]*>>/,
          applyafter: '<<set $VanillaPlus.willpower.wraith to true>>'
        }
      ],
      'Schism End': [
        {
          src: '<<schismEnd>>',
          applyafter: '<<set $VanillaPlus.willpower.schism to true>>'
        }
      ],
      'Temple Vigil 14': [
        {
          src: '<<pass 60>>',
          applyafter: '<<set $VanillaPlus.willpower.vigil to true>>'
        }
      ],
      'Lake Ruin Prison': [
        {
          src: '<<if $wraithPrison.search gte 2>>',
          applybefore: '<<deadwood-reblooms-willpower-unlock>>'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        {
          src: '$willpower "willpower" {max: 1000}',
          to: '$willpower "willpower" {max: $VanillaPlus.lock.willpower ? Math.floor($willpowermax * 1.25) : $willpowermax}'
        }
      ],
      'Widgets Clamp': [
        {
          src: 'Math.clamp($willpower, 0, $willpowermax)',
          to: "Math.clamp($willpower, maplebirch.VP.minimum('willpower'), $VanillaPlus.lock.willpower ? Math.floor($willpowermax * 1.25) : $willpowermax)"
        }
      ]
    }
  });
}
