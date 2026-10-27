import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

type ScriptRule = { fileName: string; from: string; to: string };
type PassageRule = { passage: string; replace?: string };

export default function adaptBoot(maplebirch: MaplebirchCore): void {
  const plugins = maplebirch.services.addonPlugin.info.get('deadwood-reblooms')?.mod.bootJson.addonPlugin;
  if (!plugins) return;
  const patcher = plugins.find(plugin => plugin.modName === 'ReplacePatcher' && plugin.addonName === 'ReplacePatcherAddon');
  const params = patcher?.params as { js?: ScriptRule[] } | undefined;
  if (params?.js) {
    const replaced = new Set([
      'function passRentTick() {',
      'V.willpower = Math.clamp(V.willpower + amount * 2, 0, V.willpowermax',
      'V.beautymax;',
      'V[type] = Math.clamp(V[type] + amount, 0, maxValue);',
      'V.beauty -= overflow * 0.2;',
      'if (V.farm_stage >= 6) V.physique = V.physique - V.physique / 3000;',
      'else V.physique = V.physique - V.physique / 2500;',
      'V.temple_garden >= 1) V.temple_garden',
      'else if (V.sydney_templeWork === "quarters") {\n\t\t\t\t\tif ('
    ]);
    params.js = params.js.filter(rule => !replaced.has(rule.from));
  }
  // DoLX 抗焦虑片复用原版服药效果数组，不改写创伤或过量结算。
  if (maplebirch.get('Psyche')) {
    maplebirch.once(':storyready', () => {
      const pill = setup.pills.find((item: { type: string }) => item.type === 'calmoryl');
      if (!pill) return;
      pill.effects.push('<<psyche-rest 0 150>>');
    });
  }
  const replacer = plugins.find(plugin => plugin.modName === 'TweeReplacer' && plugin.addonName === 'TweeReplacerAddon');
  if (Array.isArray(replacer?.params)) {
    // DoLX 的块函数称号已统一处理，避免之后再次追加生理标记。
    replacer.params = (replacer.params as PassageRule[]).filter(rule => rule.passage !== 'Traits' || !rule.replace?.includes('<<deadwood-trait-sex>>'));
  }
}
