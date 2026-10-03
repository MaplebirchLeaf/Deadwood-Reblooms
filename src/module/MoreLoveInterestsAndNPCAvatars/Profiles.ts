// ./src/module/MoreLoveInterestsAndNPCAvatars/Profiles.ts

import config from './Profiles.json';
import type { AvatarLayers, AvatarProfile, NPCData } from './Avatars';

const avatarBasePath = 'img/misc/icon/social';

function sydneyState(npc: NPCData): string {
  const { templeClothes } = config.Sydney;
  const mass = templeClothes.upper.includes(npc.clothes?.upper?.name ?? '') && templeClothes.lower.includes(npc.clothes?.lower?.name ?? '');
  const romance = window.isPossibleLoveInterest('Sydney');
  let state = 'default';

  if (mass) state = 'mass';
  else if (romance && (npc.purity ?? 0) > 80) {
    if ((npc.lust ?? 0) >= 60) {
      state = 'anything';
    } else state = 'beyondp';
  } else if (romance && (npc.purity ?? 0) >= 40) state = 'beyondp';
  else if (romance && (npc.corruption ?? 0) >= 40) state = (npc.lust ?? 0) >= 20 ? 'deflowered' : 'beyondc';
  else if (romance && (npc.corruption ?? 0) >= 10) state = 'influenced';
  else if (romance) state = 'beyondp';
  else if ((npc.love ?? 0) >= 30 && (npc.purity ?? 0) >= 50)
    state = V.purity <= 500 || V.demon >= 6 ? 'misguided' : ['monk', 'priest', 'initiate'].includes(V.temple_rank) || V.angel >= 6 ? 'equal' : 'fond';
  else if ((npc.love ?? 0) >= 60 && (npc.corruption ?? 0) >= 10) state = 'influenced';
  else if ((npc.love ?? 0) >= 30 && (npc.corruption ?? 0) >= 10) state = 'know';
  else if ((npc.love ?? 0) >= 30) state = 'conflicted';
  else if ((V.sydneySeen ?? []).includes('initiate')) state = V.purity <= 500 || V.demon >= 6 ? 'heretical' : (npc.love ?? 0) >= 10 ? 'intrigued' : 'initiate';
  else if ((npc.love ?? 0) >= 10) state = 'intrigued';

  return state;
}

// 底图查表情表，前景逐条匹配外观条件，图片名称直接写在 JSON 中。
function sydneyLayers(npc: NPCData, expression = sydneyState(npc)): AvatarLayers {
  const hairColour = npc.hairColour === 'strawberryblond' ? 'strawberryblond' : 'blond';
  const appearance: Record<string, string> = {
    hairColour,
    hair: V.sydney?.hair === 'ponytail' ? 'ponytail' : 'long',
    glasses: ['contacts', 'broken', 'playerbroken'].includes(V.sydney?.glasses) ? V.sydney.glasses : 'glasses',
    gender: npc.pronoun === 'm' ? 'male' : 'female',
    expression
  };
  const faces = config.Sydney.faces[hairColour] as Record<string, string>;
  const hair = config.Sydney.hair.find(row => Object.entries(row.when).every(([key, value]) => (Array.isArray(value) ? value.includes(appearance[key]) : value === appearance[key])));
  const folder = `${avatarBasePath}/sydney/`;
  return {
    base: folder + (faces[expression] ?? faces.default),
    fallback: folder + faces.default,
    infront: hair?.image ? folder + hair.image : undefined,
    infrontFallback: hair?.fallback ? folder + hair.fallback : undefined
  };
}

// 仅保留需要读取剧情状态的专属判断，图片配置在 JSON 中。
const rules: Record<string, Pick<AvatarProfile, 'stateResolver' | 'layers' | 'mimic'>> = {
  Avery: {
    stateResolver: npc => {
      if (npc.state === 'dismissed') return V.avery_fate === 'fallen' || V.avery_fate === 'kicked' ? 'fallen' : 'dismissed';
      if ((npc.rage ?? 0) >= 96) return 'given';
      if ((npc.love ?? 0) >= 60) {
        const rage = npc.rage ?? 0;
        if (rage >= 60) return 'infuriated';
        if (rage >= 20) return 'tighter';
        return 'prize';
      }
      if ((npc.love ?? 0) >= 20) {
        const rage = npc.rage ?? 0;
        if (rage >= 20) return 'possession';
        return 'cute';
      }
      const rage = npc.rage ?? 0;
      if (rage >= 60) return 'insolent';
      if (rage >= 20) return 'brat';
      return 'default';
    }
  },
  'Great Hawk': {
    stateResolver: npc => {
      if (V.syndromebird !== 1) return 'stay';
      const love = npc.love ?? 0;
      const dom = npc.dom ?? 0;
      if (love >= 60) return dom >= 50 ? 'domhigh' : dom >= 20 ? 'mate' : 'domlow';
      if (love >= 20) return dom >= 50 ? 'return' : dom >= 20 ? 'distraught' : 'desperate';
      return dom >= 50 ? 'mate' : dom >= 20 ? 'default' : 'smitten';
    }
  },
  Kylar: {
    stateResolver: npc => {
      if (npc.state === 'prison') return 'prison';
      const love = npc.love ?? 0;
      const rage = npc.rage ?? 0;
      const group = love >= 90 ? 'obsessed' : love >= 60 ? 'enamoured' : love >= 30 ? 'infatuated' : 'fixated';
      const level = group === 'obsessed' || group === 'enamoured' ? (rage >= 90 ? 4 : rage >= 60 ? 3 : rage >= 30 ? 2 : 1) : rage >= 90 ? 2 : 1;
      return `${group}${level}`;
    }
  },
  Mason: {
    stateResolver: npc => {
      const love = npc.love ?? 0;
      const lust = npc.lust ?? 0;
      if (love >= 35) return lust >= 40 ? 'lust3' : 'best';
      if (love >= 15) return lust >= 30 ? 'lust2' : 'delightful';
      if (love <= Number(V.npclovelow ?? 0)) return 'terrible';
      return lust >= 20 ? 'lust1' : 'default';
    }
  },
  Robin: {
    stateResolver: npc => {
      const hurt = Number(V.robin?.timer?.hurt ?? 0);
      if (hurt >= 2) return 'betrayed';
      if (hurt >= 1) return 'conflicted';
      if (window.isPossibleLoveInterest('Robin')) {
        const trauma = npc.trauma ?? 0;
        if (trauma >= 80) return (npc.lust ?? 0) >= 50 ? 'lost' : 'nothing';
        return (npc.dom ?? 0) >= 40 ? 'cherishes' : 'love';
      }
      const trauma = npc.trauma ?? 0;
      if (trauma >= 80) return 'traumatised';
      if (trauma >= 40) return 'pain';
      if (trauma >= 10) return 'troubled';
      const dom = npc.dom ?? 0;
      if (dom >= 80) return 'protective';
      if (dom >= 20) return 'friend';
      return 'default';
    }
  },
  Sydney: {
    layers: sydneyLayers,
    mimic: (npc, state) => sydneyLayers(npc, state)
  },
  Whitney: {
    stateResolver: npc => {
      if (npc.state === 'dungeon') return 'dismissed';
      const love = npc.love ?? 0;
      const lust = npc.lust ?? 0;
      const dom = npc.dom ?? 0;
      if (love >= 20) {
        if (lust >= 60) return 'lust';
        if (dom <= 8) return 'girlfriend';
        return 'own';
      }
      if (love <= 5) {
        if (lust >= 60) return 'beg';
        if (dom >= 20) return 'pathetic';
        if (dom <= 2 && love <= 2) return 'vendetta';
        if (dom <= 7) return 'threat';
        return 'freak';
      }
      return dom <= 8 ? 'threat' : 'fun';
    }
  },
  Gwylan: {
    stateResolver: npc => {
      const seen = V.gwylanSeen ?? [];
      const dom = npc.dom ?? 0;
      const status = T.npc === npc.nam ? (T.gwylanStatus ?? []) : [];
      const known = T.npc === npc.nam && T.gwylanTF?.known;
      if (npc.state === 'scorned') return V.yearningLetter === 2 ? 'yearning' : seen.includes('yearning_pub') ? 'sulking' : 'scorned';
      if (seen.includes('ritual_sex') && V.gwylan?.timer?.ritual && Time.date.dayDifference(new DateTime(V.gwylan.timer.ritual)) <= 0) {
        if (V.gwylan.hunting >= 2) return 'found';
        if (status.includes('heat') && known) return npc.pronoun === 'm' ? 'rut' : 'heat';
        return status.includes('aroused') || status.includes('lust') ? 'ready' : 'ritual';
      }
      if (seen.includes('romance') && V.gwylan?.timer?.nobody >= Time.date.timeStamp) return 'home';
      if (seen.includes('romance') && V.gwylan?.taken) return V.gwylan.taken === 'scarred' ? 'taken' : 'home';
      const close = seen.includes('romance') || seen.includes('partners') || (seen.includes('yearning') && dom >= 25);
      if (close && V.gwylan?.wary >= 2 && (V.brownFoxRevealed || seen.includes('auriga_scar'))) return V.avery_fate === 'ascended' && V.auriga_scar >= 1 ? 'ascended' : 'disappointed';
      if (seen.includes('romance')) return dom >= 140 ? 'think5' : dom >= 110 ? 'think4' : dom >= 80 ? 'think3' : dom >= 50 ? 'think2' : 'think1';
      if (seen.includes('partners')) {
        if (status.includes('wantsPregnancy')) return known ? (npc.pronoun === 'm' ? 'rut' : 'heat') : 'conflicted';
        if (dom >= 140) return 'conflicted';
        if (status.includes('heat')) return known ? (npc.pronoun === 'm' ? 'rut' : 'heat') : 'conflicted';
        return dom >= 110 ? 'think4' : dom >= 80 ? 'think3' : dom >= 50 ? 'think2' : 'think1';
      }
      if (seen.includes('yearning') && dom >= 25) {
        if (dom >= 75 && V.dateCount?.GwylanSex >= 5) return 'advance';
        if (status.includes('lust')) return 'conflicted';
        return dom >= 50 ? 'companionship' : 'back';
      }
      if (V.gwylan?.wary > 1 && (V.brownFoxRevealed || seen.includes('auriga_scar'))) return 'disappointed';
      if (status.includes('aroused')) return 'nervous';
      if (T.npc === npc.nam && T.gwylanLovePercent >= 60) return 'special';
      return '';
    }
  },
  'Ivory Wraith': { stateResolver: () => (['active', 'despair', 'haunt'].includes(V.wraith?.state) ? V.wraith.state : 'life') },
  'Night Monster': {
    layers: npc => ({
      base: `${avatarBasePath}/night-monster/${V.daily?.nmMonsterRoll ? (npc.pronoun === 'm' ? 'human-m' : 'human-f') : 'beast'}.png`
    })
  }
};

const avatarProfiles: Record<string, AvatarProfile> = Object.fromEntries(
  Object.entries(config).map(([name, entry]) => {
    const { mimic, ...profile } = entry as Omit<AvatarProfile, 'mimic'> & { mimic?: boolean };
    return [name, { ...profile, ...(mimic ? { mimicFolder: name.toLowerCase().replaceAll(' ', '-') } : {}), ...rules[name] }];
  })
);

export default avatarProfiles;
