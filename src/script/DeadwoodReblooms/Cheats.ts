// ./src/script/DeadwoodReblooms/Cheats.ts

import FinanceCheats from './Finance';

export default function Cheats(core: typeof maplebirch): void {
  FinanceCheats(core);
  core.tool.addTo('Cheats', () =>
    core.get('VanillaPlus')
      ? `<div class="settingsGrid"><div class="settingsHeader options">${lanSwitch('Deadwood Reblooms', '枯木逢春')}</div><div class="settingsToggleItemWide"><<deadwood-finance-cheats>></div></div>`
      : ''
  );
  if (!core.get('VanillaPlus')) return;
  // 调整原版作弊控件的属性上限，新增模组作弊统一通过 Cheats 区域接入。
  core.tool.inject({
    widgetPassage: {
      Cheats: [
        // 将作弊面板的美貌滑条上限改为动态上限，未锁定突破时仍使用原版 $beautymax。
        {
          srcmatch: /\$beauty "beauty" \{max: (10000)( \* \$AMCTraits\.beauty)?(, percentage: false)?\}/,
          to: '$beauty "beauty" {max: maplebirch.get("VanillaPlus").divineTransformations.beautyCeiling($VanillaPlus.lock.beauty ? maplebirch.get("VanillaPlus").ceiling("beauty") : $1$2)$3}',
          expected: 1
        },
        // 将作弊面板的异种癖滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$deviancy "deviancy" {reverse: true}',
          to: '$deviancy "deviancy" {max: $VanillaPlus.lock.deviancy ? maplebirch.get("VanillaPlus").ceiling("deviancy") : maplebirch.get("VanillaPlus").normalCeiling("deviancy"), reverse: true}',
          expected: 1
        },
        // 将作弊面板暴露癖滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$exhibitionism "exhibitionism" {reverse: true}',
          to: '$exhibitionism "exhibitionism" {max: $VanillaPlus.lock.exhibitionism ? maplebirch.get("VanillaPlus").ceiling("exhibitionism") : maplebirch.get("VanillaPlus").normalCeiling("exhibitionism"), reverse: true}',
          expected: 1
        },
        // 将作弊面板体格滑条上限改为动态 125%，未突破时继续使用原版 $physiquesize。
        {
          srcmatch: /\$physique "physique" \{max: (\$physiquesize)( \* \$AMCTraits\.physique)?(, percentage: false)?\}/,
          to: '$physique "physique" {max: $VanillaPlus.lock.physique ? maplebirch.get("VanillaPlus").ceiling("physique") : $1$2$3}',
          expected: 1
        },
        // 将作弊面板淫乱滑条上限按突破倍率计算，保留原版反向显示。
        {
          src: '$promiscuity "promiscuity" {reverse: true}',
          to: '$promiscuity "promiscuity" {max: $VanillaPlus.lock.promiscuity ? maplebirch.get("VanillaPlus").ceiling("promiscuity") : maplebirch.get("VanillaPlus").normalCeiling("promiscuity"), reverse: true}',
          expected: 1
        },
        // 将作弊面板意志滑条上限改为动态 125%，未突破时继续使用原版 $willpowermax。
        {
          srcmatch: /\$willpower "willpower" \{max: (1000)( \* \$AMCTraits\.willpower)?(, percentage: false)?\}/,
          to: '$willpower "willpower" {max: $VanillaPlus.lock.willpower ? maplebirch.get("VanillaPlus").ceiling("willpower") : $1$2$3}',
          expected: 1
        }
      ]
    }
  });
}
