import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function adaptTrinity(maplebirch: MaplebirchCore): void {
  if (!maplebirch.get('VanillaPlus')) return;
  const mirror = maplebirch.tool.zone.widgetPassage['Widgets Mirror'];
  // DoLX 没有原版的神圣形态卡，改用下方原生部件控件，不重复套用原版卡片补丁。
  if (mirror) maplebirch.tool.zone.widgetPassage['Widgets Mirror'] = mirror.filter(rule => !rule.applybefore?.includes('_trinityDivine') && !rule.applyafter?.includes('_divine is '));
  const active = '($settings.transformDivineEnabled and maplebirch.get("VanillaPlus")?.divineTransformations.trinity)';
  const independent = (forms: string[]) => `<<for _deadwoodDivineForm range (${active} ? ${JSON.stringify(forms)} : [false])>>`;
  const options = (part: string) =>
    '<<if _deadwoodDivineForm>><<set _options to Object.fromEntries(Object.entries(_options).filter(([, value]) => value === 0 || value[0] === _deadwoodDivineForm).map(([label, value]) => [label, value === 0 ? "disabled" : value[1]]))>>' +
    `<<set _deadwoodDivineValue to $transformationParts[_deadwoodDivineForm].${part}>>` +
    // 自动选择也会写回字段，保留隐藏或其它模组已有款式，打开菜单不应改变外观。
    '<<if Object.keys(_options).length gt 1 and !Object.values(_options).includes(_deadwoodDivineValue)>><<set _options[lanSwitch(_deadwoodDivineValue === "hidden" ? "Hidden" : "Current", _deadwoodDivineValue === "hidden" ? "隐藏" : "当前")] to _deadwoodDivineValue>><</if>><</if>>';

  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Mirror': [
        // 复用 DoLX 原有解锁门槛与款式，只将共用选择框按已取得的形态分开。
        { src: '/* Halo */', applybefore: independent(['angel', 'fallenAngel']), expected: 1 },
        { src: '/* Divine Horns */', applybefore: '<</for>>', expected: 1 },
        { src: '<<if !_haloChoice>>', applybefore: options('halo'), expected: 1 },
        {
          src: '<<listbox "_haloChoice" autoselect>>',
          to: '<<listbox `_deadwoodDivineForm ? "$transformationParts." + _deadwoodDivineForm + ".halo" : "_haloChoice"` autoselect>>',
          expected: 1
        },
        { src: '/* Divine Wings */', applybefore: independent(['angel', 'fallenAngel', 'demon', 'okami', 'seraphim']), expected: 1 },
        { src: '/* Wings */', applybefore: '<</for>>', expected: 1 },
        { src: '<<if !_divineWingsChoice>>', applybefore: options('wings'), expected: 1 },
        {
          src: '<<listbox "_divineWingsChoice" autoselect>>',
          to: '<<listbox `_deadwoodDivineForm ? "$transformationParts." + _deadwoodDivineForm + ".wings" : "_divineWingsChoice"` autoselect>>',
          expected: 1
        },
        {
          srcmatch: /<<if _demonFullCheck>>(?=\s*<span class="small-description">Demon colour:)/,
          to: '<<if _demonFullCheck and (!_deadwoodDivineForm or _deadwoodDivineForm is "demon")>>',
          expected: 1
        },
        ...['tf-halo', 'tf-divine-wings'].map(part => ({
          // 独立控件直接写入原有部件字段，跳过会清空其它形态的原生回调。统一重绘仍照常执行。
          src: `jQuery('.passage').on('change', 'div.${part} select.macro-listbox', function (e) {`,
          applyafter: '\n            if (V.settings.transformDivineEnabled && maplebirch.get("VanillaPlus")?.divineTransformations.trinity) return;',
          expected: 1
        }))
      ]
    }
  });

  maplebirch.once(':addon:beforePatch', () => {
    const manager = maplebirch.services.addonPlugin;
    const previous = manager.SC2DataManager.getSC2DataInfoAfterPatch();
    const data = previous.cloneSC2DataInfo();
    const file = data.scriptFileItems.getByNameWithOrWithoutPath('transformations-state.js');
    if (!file) return;
    const enabled = '(V.settings.transformDivineEnabled && maplebirch.get("VanillaPlus")?.divineTransformations.trinity)';
    // 三位一体只解除神圣形态的优先排除，各形态等级、部件、能力次数与副作用仍由 DoLX 原流程判定。
    file.content = manager.replace(
      file.content,
      [
        [/if \(!\["demon", "fallen", "angel"\]\.includes\(name\)\)/, `if (${enabled} || !["demon", "fallen", "angel"].includes(name))`],
        [
          /if \(name === "angel" && \(this\.effectiveLevel\("demon"\) >= 1 \|\| this\.effectiveLevel\("fallen"\) >= 2\)\)/,
          `if (!${enabled} && name === "angel" && (this.effectiveLevel("demon") >= 1 || this.effectiveLevel("fallen") >= 2))`
        ]
      ],
      'Deadwood DoLX: Trinity'
    );
    manager.modUtils.replaceFollowSC2DataInfo(data, previous);
  });
}
