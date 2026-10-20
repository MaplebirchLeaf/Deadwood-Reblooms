// ./src/script/NamedNPCSidebarPortrait/Common/Scenes.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

const casual: Record<string, string> = { Robin: 'orphanage', Kylar: 'park', Whitney: 'home', Sydney: 'temple', Avery: 'business', Harper: 'doctor' };
const school: Record<string, string> = { Robin: 'school', Kylar: 'school', Whitney: 'school', Sydney: 'library' };
const sleep: Record<string, string> = { Robin: 'sleep', Kylar: 'manor_bedroom', Whitney: 'topless', Sydney: 'sleep' };

export function poolNudity(core: MaplebirchCore): boolean {
  if (V.location !== 'pool') return false;
  return (
    (V.swimall === 1 && Time.schoolDay && V.schoolstate === 'fifth' && V.poolroomstate === 'own') ||
    (V.weekly?.schoolNightPoolParty === 'party' && Time.dayState === 'night') ||
    core.get('LifeSimulation')?.school.requiresNudity === true
  );
}

/** 只解释模组明确出场的场景，复用各角色已有的服装规则。 */
export default function scene(core: MaplebirchCore, name: string): string | undefined {
  if (V.replayScene || C.npc[name]?.init !== 1 || !['active', 'rescued'].includes(C.npc[name].state)) return;
  if (name === 'Robin' && (V.robinmissing || V.robin.timer.hurt > 0)) return;
  if (name === 'Sydney' && V.daily.sydney.punish === 1) return;
  if (V.npc?.includes(name) && Object.hasOwn(school, name) && poolNudity(core)) return 'naked';
  const title = core.passage.title;
  const estate = core.get('Finance')?.realEstate;
  const transport = core.get('Transport');
  const outside = name === 'Robin' && Time.season === 'winter' ? 'park' : casual[name];

  if (name === 'Robin') {
    const privateScene = title.startsWith('Deadwood Robin Private ');
    if (title === 'Deadwood Robin Swim Date' || (privateScene && V.RobinExpansion?.intimacy_site === 'swim')) return 'school_swim';
    if (title === 'Deadwood Robin Meteor Date' || (privateScene && V.RobinExpansion?.intimacy_site === 'meteor')) return outside;
    if (title === 'Deadwood Robin Fishing Date' || (privateScene && V.RobinExpansion?.intimacy_site === 'fishing')) return 'beach';
  }

  if (title.startsWith('Deadwood Transport ')) {
    const ride = transport?.state.commute;
    if (ride?.npc === name && school[name]) return name === 'Sydney' && ride.kind !== 'school' ? 'temple' : school[name];
    if (estate?.outings.travelling && estate.outings.plan?.name === name) return outside;
    if ((transport?.state.trip?.passengers ?? transport?.state.passengers)?.includes(name)) return Time.schoolDay && Time.hour >= 7 && Time.hour < 17 ? school[name] : outside;
    if (title === 'Deadwood Transport Avery' && name === 'Avery') return 'business';
    return;
  }

  if (!title.startsWith('Deadwood Reblooms Property ')) return;
  if (title.startsWith('Deadwood Reblooms Property Banquet ')) {
    const banquet = estate?.banquet;
    if (!banquet?.active || !banquet.state.arrived.some(guest => guest === name)) return;
    return banquet.state.formal && ['Robin', 'Whitney', 'Kylar', 'Avery', 'Harper'].includes(name) ? 'formal' : casual[name];
  }
  if ((title === 'Deadwood Reblooms Property Outing' || title.startsWith('Deadwood Reblooms Property Outing Closeness')) && estate?.outings.plan?.name === name) return outside;
  if (title === 'Deadwood Reblooms Property Outing Weather' && estate?.outings.plan?.name === name) return casual[name];
  if (title === 'Deadwood Reblooms Property Outing Invitation' && estate?.outings.offer?.name === name) return Time.hour < (name === 'Sydney' ? 6 : 7) ? sleep[name] : casual[name];
  if (title === 'Deadwood Reblooms Property Outing Recall' && estate?.outings.memory?.name === name) return Time.hour < (name === 'Sydney' ? 6 : 7) ? sleep[name] : casual[name];
  if (title === 'Deadwood Reblooms Property Return') {
    const note = estate?.outings.state.note;
    if (note?.name === name && !note.done && note.kind === 'temple') return 'temple';
    if (note?.name === name && !note.done) return note.kind === 'ride' && name !== 'Sydney' ? school[name] : outside;
  }

  const property = estate?.current;
  if (!estate || !property || !estate.residentsAt(property.id).some(resident => resident.id === name)) return;
  if (title.startsWith('Deadwood Reblooms Property Resident Bath')) {
    const bath = estate.life.bath;
    if (bath?.partner !== name || bath.hidden) return;
    return bath.action === 'join' ? 'naked' : 'property_bath_towel';
  }
  if (title.includes(' Intimacy') || title.includes(' Outing') || title.endsWith(' Return')) return;
  if (title === 'Deadwood Reblooms Property Swim' && V.Finance.real_estate.room_companion === name) return name === 'Sydney' || name === 'Kylar' ? 'swim' : 'school_swim';
  if (title === 'Deadwood Reblooms Property Bed' || Time.hour < (name === 'Sydney' ? 6 : 7)) return sleep[name];
  return casual[name];
}
