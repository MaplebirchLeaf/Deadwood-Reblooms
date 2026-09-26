import { SCHOOL_CAMPUS_LOCATIONS, type SchoolDressPolicy, type SchoolStudent } from '../../module/LifeSimulation/School';
import type { WardrobeItem } from '../../module/NPCSidebarPortrait';

export default function SchoolNPCs(maplebirch: typeof window.maplebirch): void {
  if (!maplebirch.get('NPCSidebarPortrait')) return;

  maplebirch.tool.onInit(() => {
    const wardrobe = maplebirch.npc.Clothes.wardrobe;

    const applyFreeDress = (student: SchoolStudent, clothes: WardrobeItem): void => {
      if (student === 'Sydney') return;
      wardrobe.strip(clothes, ['upper', 'lower']);
      if (student === 'Robin') wardrobe.put(clothes, C.npc.Robin.pronoun === 'm' ? 'tshirt_shorts' : 'summer_sundress');
      if (student === 'Kylar') wardrobe.put(clothes, 'hoodie_legwarmers');
      if (student === 'Whitney') wardrobe.put(clothes, Time.season === 'winter' ? 'hoodie_legwarmers' : 'tshirt_shorts');
    };

    const applyRevealingDress = (student: SchoolStudent, clothes: WardrobeItem): void => {
      applyFreeDress(student, clothes);
      if (!maplebirch.LS.school.prefersRevealingOutfit(student)) return;
      if (student === 'Robin' || student === 'Whitney') wardrobe.strip(clothes, 'upper');
      if (student === 'Sydney' || student === 'Kylar') wardrobe.strip(clothes, 'lower');
    };

    for (const student of maplebirch.LS.school.studentRoster) {
      wardrobe.modify(student, (clothes, context) => {
        if (!SCHOOL_CAMPUS_LOCATIONS[student].includes(context.location)) return;
        const policy = V.LifeSimulation?.school?.dress?.active as SchoolDressPolicy | undefined;
        if (!policy || policy === 'uniform') return;

        if (maplebirch.LS.school.requiresNudity) {
          wardrobe.put(clothes, 'naked');
          return;
        }

        if (policy === 'free') applyFreeDress(student, clothes);
        else applyRevealingDress(student, clothes);
      });
    }
  });
}
