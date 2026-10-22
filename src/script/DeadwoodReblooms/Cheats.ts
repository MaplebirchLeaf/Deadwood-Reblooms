// ./src/script/DeadwoodReblooms/Cheats.ts

export default function Cheats(core: typeof maplebirch): void {
  core.tool.addTo('Cheats', 'deadwood-reblooms-cheats');
  // 关闭原版增强后，旧存档仍可能保留尺寸 7。控件必须能显示现有值。
  core.tool.inject({
    widgetPassage: {
      Cheats: [
        {
          src: '"$player.penissize" $player.penissize 0 6 1',
          to: '"$player.penissize" $player.penissize 0 `maplebirch.get("VanillaPlus") ? 7 : Math.max(6, $player.penissize)` 1',
          expected: 1
        },
        { srcmatch: /<<set _penisText to \[[^\]\n]+\]>>/, applyafter: '<<run _penisText.push(lanSwitch("Gargantuan", "骇人"))>>', expected: 1 }
      ],
      'Widgets Settings': [
        {
          src: '"$penissizemin" "$penissizemax" $penissizemin $penissizemax 0 6 1',
          to: '"$penissizemin" "$penissizemax" $penissizemin $penissizemax 0 `maplebirch.get("VanillaPlus") ? 7 : Math.max(6, $penissizemin, $penissizemax)` 1',
          expected: 1
        },
        {
          srcmatch: /<<rangeslider "\$penissizemin" "\$penissizemax"[\s\S]*?var name = \[[^\]\n]+\];/,
          applyafter: 'name.push(lanSwitch("Gargantuan", "骇人"));',
          expected: 1
        }
      ]
    }
  });
  core.once(':storyready', () => {
    const original = window.settingValueNameFromValue;
    if (typeof original === 'function') {
      window.settingValueNameFromValue = (name, value) => (value === 7 && ['penissizemin', 'penissizemax'].includes(name) ? lanSwitch('Gargantuan', '骇人') : original(name, value));
    }
  });
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
