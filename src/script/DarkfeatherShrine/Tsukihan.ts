// ./src/script/DarkfeatherShrine/Tsukihan.ts

import TsukihanPortrait from '../NamedNPCSidebarPortrait/Tsukihan';

export default function Tsukihan(maplebirch: typeof window.maplebirch): void {
  maplebirch.npc.add(
    {
      nam: 'Tsukihan',
      fullDescription: 'Tsukihan',
      adult: 0,
      teen: 1,
      age: 19,
      title: 'shrine attendant',
      description: 'shrine attendant',
      hairColour: 'black',
      eyeColour: 'red',
      hair_side_type: 'neat',
      hair_fringe_type: 'middlepart',
      hair_sides_length: 600,
      hair_fringe_length: 200
    },
    {
      love: { maxValue: 100 },
      dom: { name: 'Wilfulness', maxValue: 100, activeIcon: 'img/ui/sym-wilfulness.png', inactiveIcon: 'img/ui/sym-wilfulness-empty.png', color: 'purple' },
      lust: { maxValue: 100 },
      important: true,
      loveInterest: true,
      romance: [() => C.npc.Tsukihan?.init === 1 && C.npc.Tsukihan.state === 'active']
    },
    {
      Tsukihan: { EN: 'Tsukihan', CN: '月羽' },
      Wilfulness: { EN: 'Wilfulness', CN: '任性' },
      'shrine attendant': { EN: 'shrine attendant', CN: '神社侍者' },
      'shrine maiden': { EN: 'shrine maiden', CN: '神社巫女' },
      'shrine priest': { EN: 'shrine priest', CN: '神社神官' }
    }
  );

  maplebirch.on(':npcInit', (name: string) => {
    if (name === 'Tsukihan') {
      C.npc.Tsukihan.dom = 10;
      C.npc.Tsukihan.lust = 0;
    }
  });

  maplebirch.on(':npcInject', (name: string) => {
    if (name !== 'Tsukihan') return;
    const npc = C.npc.Tsukihan;
    npc.title = npc.pronoun === 'm' ? 'shrine priest' : npc.pronoun === 'f' ? 'shrine maiden' : 'shrine attendant';
  });

  maplebirch.npc.addSchedule('Tsukihan', schedule => {
    schedule.at(0, 'raven_shrine_house');
    schedule.when(date => {
      const shrine = V.MoreTransformations?.shrine;
      if (!shrine || date.minute >= 30) return false;
      if (date.hour === 18) return shrine.rain_at > shrine.bathed_at;
      return date.hour === 20 && shrine.bathed_at < Math.floor(date.timeStamp / 86400) * 86400;
    }, 'raven_shrine_bath');
    schedule.when(
      date => date.hour >= 9 && date.hour < 18,
      date => {
        if (date.weekDay === 3 && date.hour >= 10 && date.hour < 12) return 'shopping_centre';
        if (date.hour === 12) return 'raven_shrine_house';
        if (date.hour === 16) return 'raven_shrine_garden';
        return 'forest_raven_shrine';
      }
    );
  });

  // 只记下实际观察到的雨中劳动。日常沐浴完成后，湿衣状态随之结束。
  const bathing = () => {
    const shrine = V.MoreTransformations?.shrine;
    if (!shrine || C.npc.Tsukihan?.init !== 1 || C.npc.Tsukihan.state !== 'active' || V.replayScene || V.statFreeze) return;
    const now = Time.date.timeStamp;
    const midnight = Math.floor(now / 86400) * 86400;
    const eveningBath = 20 * 3600 + 30 * 60;
    const regularBath = midnight + eveningBath - (now - midnight < eveningBath ? 86400 : 0);
    shrine.bathed_at = Math.max(shrine.bathed_at, regularBath);
    const rainBath = midnight + 18 * 3600 + 30 * 60;
    if (now >= rainBath && shrine.rain_at < rainBath && shrine.rain_at > shrine.bathed_at) shrine.bathed_at = rainBath;
    if (Weather.precipitation === 'rain' && ['forest_raven_shrine', 'raven_shrine_garden'].includes(maplebirch.npc.Schedule.location.Tsukihan)) shrine.rain_at = now;
  };
  for (const phase of ['onBefore', 'onAfter'] as const) maplebirch.dynamic.regTimeEvent(phase, 'deadwood-tsukihan-bathing', { action: bathing });
  maplebirch.dynamic.regStateEvent('gate', 'deadwood-tsukihan-bathing', { action: bathing });

  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-tsukihan-town-link', passage: ['Shopping Centre'] });

  TsukihanPortrait(maplebirch);
}
