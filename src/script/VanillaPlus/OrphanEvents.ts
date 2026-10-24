// ./src/script/VanillaPlus/OrphanEvents.ts

export default function OrphanEvents(maplebirch: typeof window.maplebirch): void {
  // 读入旧存档时只移除已废弃的镜中印记，保留其它纹身。
  maplebirch.on(':variable', () => {
    if (V.skin?.pubic?.key === 'deadwood_mirror_mark') V.skin.pubic = {};
    delete V.markAcquired;
  });

  maplebirch.dynamic.regStateEvent('gate', 'deadwood-ominous-mirror', {
    extra: { passage: ['Mirror'] },
    output: 'deadwood-ominous-mirror-entry',
    cond: () =>
      V.VanillaPlus != null &&
      !V.replayScene &&
      !V.statFreeze &&
      !V.VanillaPlus.orphanEvents.mirrorDone &&
      V.VanillaPlus.orphanEvents.mirrorDay !== Math.floor(Time.days) &&
      V.settings.tentaclesEnabled &&
      V.daily.mirrorTentacles !== 1 &&
      V.nextPassageCheck !== 'Mirror' &&
      maplebirch.SugarCube.State.peek(1)?.title === 'Bedroom',
    action: () => {
      V.VanillaPlus.orphanEvents.mirrorDay = Math.floor(Time.days);
    }
  });

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Home Events': [
        {
          src: '\t<<switch random(1, 14)>>',
          to: '\t<<switch random(1, 18)>>',
          expected: 1
        },
        {
          src: '\t\t<<case 14>>',
          applybefore:
            '\t\t<<case 15>>\n' +
            '\t\t\t<<if $fame.sex lte 50 or $fame.rape lte 50 or $fame.bestiality lte 50>>\n' +
            '\t\t\t\t<<deadwood-orphan-event "doctor">>\n' +
            '\t\t\t<<else>>\n' +
            '\t\t\t\t<<deadwood-orphan-skip>>\n' +
            '\t\t\t<</if>>\n' +
            '\t\t<<case 16>>\n' +
            '\t\t\t<<deadwood-orphan-event "judge">>\n' +
            '\t\t<<case 17>>\n' +
            '\t\t\t<<deadwood-orphan-event "masturbation">>\n' +
            '\t\t<<case 18>>\n' +
            '\t\t\t<<deadwood-orphan-event "erection">>\n',
          expected: 1
        }
      ]
    }
  });
}
