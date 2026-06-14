import type { CarryItemConfig } from '../module/reblooms/CarryShared';
import './solarEclipse';

(function (maplebirch) {
  'use strict';
  maplebirch.tool.addTo('HintMobile', 'DeadwoodRebloomsHintMobile');
  maplebirch.tool.addTo('MenuBig', 'DeadwoodRebloomsHintDesktop');
  maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-Options');

  // prettier-ignore
  maplebirch.tool.zone.inject({
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: ')<</if>>\n\t\t<br>',
          applyafter:'\n\t\t<<lanSwitch "Search: " "搜索：">><<textbox "$DeadwoodReblooms.wardrobeSearch" $DeadwoodReblooms.wardrobeSearch>><div class="outfitContainer no-numberify" style="display: inline-block;"><<lanButton "confirm" "capitalize">><<run Dynamic.render()>><</lanButton>></div><br>'
        },
        {
          src: '<</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">',
          to: '<</if>>\n\t\t\t<<if $DeadwoodReblooms.wardrobeSearch isnot "">><<run $DeadwoodReblooms.wardrobeSearch.toLowerCase()>><<language>><<option "CN">><<if !_itemData.cn_name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><<option "EN">><<if !_itemData.name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><</language>><</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">'
        }
      ],
      'Widgets Mirror': [{ src: '</div>\n\t\t</div>\n\t\t<div class="settingsToggleItemWide">', to: '</div>\n\t\t</div>\n\t\t<<DeadwoodRebloomsBodyWriting>>\n\t\t<div class="settingsToggleItemWide">' }]
    }
  });

  maplebirch.tool.onInit(() => {
    setup.maplebirch.content.push(`
      <div id='ConsoleCheat'>
        <details class='cheat-section' open>
          <summary class='cheat-section'><span class='gold'><<lanSwitch 'Cheating Collection' '作弊集'>></span></summary>
          <div id='maplebirch-cheat-panel' class='searchButtons'><<= maplebirch.rebloom.cheat.panel>></div>
          <div id='maplebirch-cheat-search' class='searchButtons'><<= maplebirch.rebloom.cheat.search>></div>
          <div id='maplebirch-cheat-status' class=''></div><div id='maplebirch-cheat-content' class='settingsGrid'><<= maplebirch.rebloom.cheat.content>></div>
        </details>
      </div>
      <details class='deadwood-reblooms-playback'>
        <summary class='deadwood-reblooms-playback-summary'><span class='red'><<lanSwitch 'Music Player' '音乐播放器'>></span></summary>
        <div id='deadwood-reblooms-playback' class='deadwood-reblooms-playback-content'><<DeadwoodRebloomsPlayback 'deadwood-reblooms'>></div>
      </details>
    `);

    setup.DeadwoodReblooms ??= {};
    setup.DeadwoodReblooms.items ??= {} as Record<string, CarryItemConfig>;
  });

  $(document).on('change', 'input[name="radiobutton--bodywritingcolor"]', function () {
    if (!maplebirch.modules.initPhase.preInitCompleted) return;
    if (T.bodywriting.color === 'custom') {
      $.wiki('<<replace "#DeadwoodRebloomsBodyWriting">><br><<lanSwitch "Custom Color" "自定义颜色">>: <<textbox "_bodywriting.custom" "#FFFFFF">><</replace>>');

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
      $.wiki('<<replace "#DeadwoodRebloomsBodyWriting">><</replace>>');
    }
  });

  $(document).on('input', 'input[name="textbox--bodywritingcustom"]', function () {
    if (!maplebirch.modules.initPhase.preInitCompleted) return;
    let color = this.value;
    if (!color.startsWith('#')) color = '#' + color;
    let preview = document.getElementById('colorPreviewBox');
    if (preview && /^#[0-9A-F]{3,6}$/i.test(color)) preview.style.backgroundColor = color;
  });
})(maplebirch);

export {};
