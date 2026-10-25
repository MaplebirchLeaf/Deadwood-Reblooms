// ./src/script/MoreTransformations.ts

import DarkfeatherShrine from './DarkfeatherShrine';
import ColdmoonHarbour from './ColdmoonHarbour';
import CoinCave from './CoinCave';

export default function MoreTransformations(maplebirch: typeof window.maplebirch): void {
  DarkfeatherShrine(maplebirch);
  ColdmoonHarbour(maplebirch);
  CoinCave(maplebirch);

  maplebirch.tool.onInit(() => {
    maplebirch.tool.patch.traits.add({
      title: 'Transformation Traits',
      name: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:name'),
      colour: 'teal',
      has: () => maplebirch.get('MoreTransformations')!.foxfire,
      text: () => maplebirch.t('deadwood-reblooms:Traits:foxfire:text')
    });
  });

  maplebirch.tool.inject({
    locationPassage: {
      // 神社参道接在地点说明后。手动找鸟只放在老教堂墓地的岔路口。
      Forest: [
        { srcmatch: /<<elseif \$eventskip gte 1>>[^<]*<br><br>/g, applyafter: '\n\t\t<<deadwood-raven-shrine-path>>\n', expected: 5 },
        { src: '<<if $forest gte 10 and $forest lte 14>>', applyafter: '\n\t\t<<deadwood-raven-link>>', expected: 1 }
      ],
      Park: [
        {
          src: '<<if $leftleg is "bound" or $rightleg is "bound">>',
          applybefore: '<<icon "raven-shrine/bench.png">><<lanLink ["Sit on a park bench", "到公园长椅上坐坐"] "Deadwood Park Bench">><</lanLink>><br>\n',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      Widgets: [
        // 共用反抗结算在最终多人分流前缩放一次，不依赖其它模组追加的目标参数。
        {
          srcmatch: /(<<widget "defiance">>(?:(?!<<\/widget>>)[\s\S])*?)(?=<<if \$enemyno gte 2>>)/,
          applyafter: '<<if maplebirch.get("MoreTransformations")?.Undead.active>><<set _thedamage *= 0.5>><</if>>',
          expected: 1
        },
        {
          srcmatch: /<<set \$arousal \+= (_args\[0\]|_change)>>/,
          to: '<<set $arousal += (maplebirch.get("MoreTransformations")?.Undead.arousal($1) ?? $1)>>',
          expected: 1
        }
      ],
      'Widgets Sleep': [
        // 诅咒与原有噩梦只结算一次，冻结和回放不额外触发诅咒压力。
        {
          src: '<<if $nightmares gte 1 and $controlled is 0>>',
          to: '<<if ($nightmares gte 1 and $controlled is 0) or (maplebirch.get("MoreTransformations")?.Undead.active and !$statFreeze and !$replayScene and !$frozenValues)>>',
          expected: 1
        },
        // 原版逐项扣除疲劳，合计本小时恢复后乘 0.5，时间推进与其它睡眠结算不变。
        {
          srcmatch: /(<<set \$tiredness -= 200>>[\s\S]*?<<set \$tiredness -= \$_bonusFatigueLoss>>)/,
          to: '<<set $_undeadSleepStart to $tiredness>>$1<<if maplebirch.get("MoreTransformations")?.Undead.active>><<set $tiredness to $_undeadSleepStart - ($_undeadSleepStart - $tiredness) * 0.5>><</if>>',
          expected: 1
        },
        {
          src: '<<set $arousal += 10>>',
          to: '<<set $arousal += (maplebirch.get("MoreTransformations")?.Undead.arousal(10) ?? 10)>>',
          expected: 1
        }
      ],
      'Widgets Wraith': [
        {
          src: '<<set $arousal += (_args[0] * 3)>>',
          to: '<<set $arousal += (maplebirch.get("MoreTransformations")?.Undead.arousal(_args[0] * 3) ?? _args[0] * 3)>>',
          expected: 1
        }
      ],
      'Widgets Mirror': [
        {
          src: '<<if _animal>>',
          applyafter: '<<set _mirrorAnimal to _animal>><<for _animal range ["cat", "cow", "wolfgirl", "harpy", "fox"].filter(name => V[name] > 1)>>',
          expected: 1
        },
        {
          srcmatch: /(<<if \$(cat|cow|wolfgirl|harpy|fox) gt 1)(>>)(?=\s*<<if _(?:cat|cow|wolf|bird|fox)\.)/g,
          to: '$1 and _animal is "$2"$3',
          expected: 5
        },
        {
          srcmatch: /(<<set \$_chimeraOptions to \{[\s\S]*?<<set \$_chimeraEnabled[^\r\n]*>>)/,
          to: `</div><</for>><<set _animal to _mirrorAnimal>>$1<div @class="'settingsToggleItemWide' + $_chimeraEnabled">`,
          expected: 1
        }
      ],
      'Widgets Forest': [
        {
          src: '<<addinlineevent "safeforest_easytrail" 0.33>>',
          applybefore: '<<deadwood-raven-events>>\n\t',
          expected: 1
        }
      ],
      'Widgets Combat Tentacle Adv': [
        // 捕获原版放逐之前的生命与次数，按实际伤害结算，兼容原版增强模块的伤害加成。
        {
          srcmatch: /<<if \(\$leftaction is "leftbanish" and \$leftactionTarget is _tentacle\.id\)\s*or \(\$rightaction is "rightbanish" and \$rightactionTarget is _tentacle\.id\)>>/,
          applyafter: '<<set _foxfireHealth to _tentacle.tentaclehealth>><<set _foxfireUses to $angelBanish>>',
          expected: 1
        },
        {
          srcmatch: /<<tentacle_record "banish" [^>\r\n]+ \* _multi>>\s*<<tentacleadvdisable _tentacle>>/,
          applyafter: '<<if $angelBanish lt _foxfireUses>><<deadwood-foxfire _tentacle `_foxfireHealth - _tentacle.tentaclehealth`>><</if>>',
          expected: 1
        }
      ]
    }
  });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-raven-link', passage: 'Churchyard' });
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-undead-moon', passage: ['Pirate Deck', 'Beach'] });
}
