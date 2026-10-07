// ./src/script/DeadwoodReblooms.ts

import Cheats from './DeadwoodReblooms/Cheats';
import Tips from './DeadwoodReblooms/Tips';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

  Cheats(maplebirch);
  Tips(maplebirch);

  maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-Options');
  maplebirch.tool.addTo('Statistics', 'deadwood-reblooms-statistics');
  maplebirch.char.use(
    'post',
    options => {
      if (V.options.maplebirch.hideEarSlimeParasites !== true) return;
      if (options.breasts_parasite === 'parasite') options.breasts_parasite = '';
      if (options.penis_parasite?.startsWith('ear-slime-')) options.penis_parasite = '';
      if (options.clit_parasite === 'parasite') options.clit_parasite = '';
      options.ear_slime_panties = '';
    },
    'main'
  );
  maplebirch.tool.addTo(
    'HintMobile',
    () =>
      V.options.maplebirch.modhint === 'mobile' && V.options.sidebarStats !== 'disabled'
        ? "<input type='button' class='saveMenuButton DeadwoodRebloomsHintMobile' onclick='maplebirch.get(\"DeadwoodReblooms\").open()'>"
        : '',
    () => {
      if (!V.options.maplebirch.mobile_history || !maplebirch.host.sugarcube.require().Config.history.controls) return '';
      const backward = document.getElementById('history-backward') as HTMLButtonElement | null;
      if (!backward) return '';
      return `<button id="deadwood-mobile-history" type="button" class="stat deadwood-mobile-history"
        ${backward.disabled ? 'disabled aria-disabled="true"' : ''} onclick="document.getElementById('history-backward')?.click()"><span class="fa" aria-hidden="true">&#xe825;</span></button>`;
    }
  );
  maplebirch.tool.addTo('MobileStats', () => {
    if (!V.options.maplebirch.mobile_status_bars) return '';
    queueMicrotask(() => {
      if (!V.options.maplebirch.mobile_status_bars) return;
      const mobile = document.getElementById('mobileStats');
      if (!mobile) return;
      for (const marker of mobile.querySelectorAll<HTMLElement>('mouse[data-deadwood-stat]')) {
        const stat = marker.parentElement;
        if (!stat || stat.querySelector('.meter, .rightMeter')) continue;
        const name = marker.dataset.deadwoodStat === 'fatigue' ? 'tiredness' : marker.dataset.deadwoodStat;
        const source = document.getElementById(`${name}caption`)?.querySelector<HTMLElement>('.meter, .rightMeter');
        if (!source) continue;
        const meter = source.cloneNode(true) as HTMLElement;
        meter.className = 'meter deadwood-mobile-status-bar';
        meter.removeAttribute('id');
        for (const child of meter.querySelectorAll('[id]')) child.removeAttribute('id');
        meter.setAttribute('role', 'meter');
        meter.setAttribute('aria-label', marker.querySelector('span')?.textContent?.trim() ?? '');
        meter.setAttribute('aria-valuemin', '0');
        meter.setAttribute('aria-valuemax', '100');
        const width = Number.parseFloat(meter.querySelector<HTMLElement>('div')?.style.width ?? '0');
        meter.setAttribute('aria-valuenow', String(Number.isFinite(width) ? Math.clamp(width, 0, 100) : 0));
        stat.append(meter);
        stat.classList.add('deadwood-mobile-status');
      }
    });
    return '';
  });
  maplebirch.tool.addTo('MenuBig', () =>
    V.options.maplebirch.modhint === 'desktop' ? "<<lanButton 'Deadwood Reblooms' 'upper'>><<run maplebirch.get(\"DeadwoodReblooms\").open()>><</lanButton>>" : ''
  );
  // 给原版衣柜加入搜索，并把身体涂写设置嵌入镜子界面。
  maplebirch.tool.inject({
    widgetPassage: {
      // 只给原版移动端属性标记名称，保留显示条件、翻译和数值提示。
      mobileStats: [
        {
          srcmatch: /(<<mobileStatsColor "(pain|arousal|fatigue|stress|innocence|trauma|control|allure|drunk|drugged|hallucinogen)">>[\s\S]*?<mouse class="tooltip-centertop")/g,
          to: '$1 data-deadwood-stat="$2"',
          expected: 11
        }
      ],
      'Widgets Wardrobe': [
        // 在主衣柜的类型列表初始化前插入双语搜索框，不依赖上一个 if 分支的结尾格式。
        {
          src: '<<set _outfitTypes to setup.clothingLayer.torso_inner>>',
          applybefore:
            '<<lanSwitch "Search: " "搜索：">><<textbox "$DeadwoodReblooms.wardrobeSearch" $DeadwoodReblooms.wardrobeSearch>><<lanButton "confirm" "capitalize" "style:height:36px;padding:0 12px;line-height:1;">><<run Dynamic.render()>><</lanButton>><br>\n\t\t',
          expected: 1
        },
        // 物品数据刚取出时立即过滤，避免匹配前一个 if 的结尾和后续 HTML。
        {
          src: '<<set _itemData to setup.clothes[_wardrobe_list][clothesIndex(_wardrobe_list,_item)]>>',
          applyafter: [
            '<<if $DeadwoodReblooms.wardrobeSearch isnot "">>',
            '<<language>>',
            '<<option "CN">>',
            '<<if !_itemData.cn_name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch.toLowerCase())>><<continue>><</if>>',
            '<<option "EN">>',
            '<<if !_itemData.name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch.toLowerCase())>><<continue>><</if>>',
            '<</language>><</if>>'
          ].join(''),
          expected: 1
        }
      ],
      'Widgets Mirror': [
        // 在镜子设置的下一项控件前插入身体刻字组件，保持原版设置网格的 HTML 层级不变。
        {
          srcmatch: /<div class="settingsToggleItemWide">(?=(?:(?!<\/div>)[\s\S])*<<listbox "\$player\.bodyshape" autoselect>>)/,
          applybefore: '<<DeadwoodRebloomsBodyWriting>>\n\t\t',
          expected: 1
        }
      ]
    }
  });

  $(document).on('change', 'input[name="radiobutton--bodywritingcolor"]', function () {
    if (!maplebirch.services.modules.initPhase.preInitCompleted) return;
    if (T.bodywriting.color === 'custom') {
      maplebirch.SugarCube.Wikifier.wikifyEval('<<replace "#DeadwoodRebloomsBodyWriting">><br><<lanSwitch "Custom Color" "自定义颜色">>: <<textbox "_bodywriting.custom" "#FFFFFF">><</replace>>');
      const colorInput = $('#textbox--bodywritingcustom') as any;
      if (typeof colorInput.spectrum === 'function') {
        colorInput.spectrum({
          theme: 'sp-dark',
          color: T.bodywriting.custom ?? '#FFFFFF',
          showInput: true,
          showInitial: true,
          chooseText: maplebirch.t('choose'),
          cancelText: maplebirch.t('cancel'),
          preferredFormat: 'hex',
          change: function (color: { toHexString: () => any }) {
            T.bodywriting.custom = color.toHexString();
          }
        });
      } else {
        colorInput.attr('type', 'color');
      }
    } else {
      maplebirch.SugarCube.Wikifier.wikifyEval('<<replace "#DeadwoodRebloomsBodyWriting">><</replace>>');
    }
  });

  $(document).on('input', 'input[name="textbox--bodywritingcustom"]', function () {
    if (!maplebirch.services.modules.initPhase.preInitCompleted) return;
    let color = this.value;
    if (!color.startsWith('#')) color = '#' + color;
    const preview = document.getElementById('colorPreviewBox');
    if (preview && /^#[0-9A-F]{3,6}$/i.test(color)) preview.style.backgroundColor = color;
  });
}
