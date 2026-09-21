// ./src/script/VanillaPlus/Exhibitionism.ts

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.onInit(() => {
    setup.feats['Beyond Shame'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.exhibitionism.feat.title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms.VanillaPlus.exhibitionism.feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-unlock', {
    output: 'deadwood-reblooms-exhibitionism-unlock',
    cond: () => maplebirch.VP.exhibitionism.unlock
  });
  maplebirch.dynamic.regStateEvent('gate', 'exhibitionism-max', {
    output: 'earnFeat "Beyond Shame"',
    cond: () => maplebirch.VP.exhibitionism.max && !V.feats.currentSave['Beyond Shame']
  });

  // 记录原版裸露挑战结果，并扩展暴露癖上限。
  maplebirch.tool.zone.inject({
    locationPassage: {
      'Photo High Start': [
        {
          src: '<<photo_init>>',
          applyafter: '<<set $VanillaPlus.exhibitionism.highStreetRun to false>>'
        }
      ],
      'Swimming Lesson Naked Backstroke': [
        {
          src: '<<if $phase is 1>>',
          applyafter: '<<if $swimnudecounter gte 5>><<set $VanillaPlus.exhibitionism.swimming to true>><</if>>'
        }
      ],
      'Avery Party Dance Naked': [
        {
          src: '<<earnFeat "Ballroom Show-off">>',
          applyafter: '<<set $VanillaPlus.exhibitionism.ballroom to true>>'
        }
      ],
      'Photo High Exhibitionism Run Face': [
        {
          src: '<<effects>>',
          applyafter: '<<if $phase is 2 and $photo_flyers gte 250>><<set $VanillaPlus.exhibitionism.highStreetRun to true>><</if>>'
        }
      ],
      'Photo High End Street': [
        {
          src: '<<photo_unset>>',
          applybefore: '<<if $VanillaPlus.exhibitionism.highStreetRun>><<set $VanillaPlus.exhibitionism.highStreet to true>><</if>>'
        }
      ]
    },
    widgetPassage: {
      Cheats: [
        {
          src: '$exhibitionism "exhibitionism" {reverse: true}',
          to: '$exhibitionism "exhibitionism" {max: $VanillaPlus.lock.exhibitionism ? 150 : 100, reverse: true}'
        }
      ],
      'Widgets Exhibitionism': [
        {
          src: '<<unset $desperateaction>>',
          applybefore: '<<deadwood-reblooms-exhibitionism-trait-effects $_n>>'
        },
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: "<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum('exhibitionism'), $VanillaPlus.lock.exhibitionism ? 150 : 100)>>"
        }
      ],
      'Widgets Clamp': [
        {
          src: '<<set $exhibitionism to Math.clamp($exhibitionism, 0, 100)>>',
          to: "<<set $exhibitionism to Math.clamp($exhibitionism, maplebirch.VP.minimum('exhibitionism'), $VanillaPlus.lock.exhibitionism ? 150 : 100)>>"
        }
      ]
    }
  });
}
