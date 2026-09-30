// ./src/script/NamedNPCSidebarPortrait/NPCOutfitSets/Inject.ts

// :npcInject 在原版复制衣物后触发，同步本次生成对象，后续剧情暴露仍由原版处理。
export default function inject(npcName: string, npcno: number, clothes: Record<string, any>, exposure?: { chest: unknown }): void {
  const npc = V.NPCList?.[npcno];
  if (npc?.fullDescription !== npcName) return;
  npc.clothes = clone(clothes);
  if (!exposure) return;
  npc.chest = exposure.chest;
  for (const part of ['penis', 'vagina']) if (npc[part] !== 'none') npc[part] = clothes.lower.name === 'naked' ? 0 : 'clothed';
}
