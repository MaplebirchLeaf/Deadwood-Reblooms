// ./src/script/DeadwoodReblooms.ts

import type { MaplebirchCore } from '@scml-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-Options');
  maplebirch.tool.addTo('HintMobile', () =>
    V.options.maplebirch.modhint === 'mobile' && V.options.sidebarStats !== 'disabled' ? "<input type='button' class='saveMenuButton DeadwoodRebloomsHintMobile' onclick='maplebirch.DR.open()'>" : ''
  );
  maplebirch.tool.addTo('MenuBig', () => (V.options.maplebirch.modhint === 'desktop' ? "<<lanButton 'Deadwood Reblooms' 'upper'>><<run maplebirch.DR.open()>><</lanButton>>" : ''));
  maplebirch.tool.zone.inject({
    widgetPassage: {
      'Widgets Wardrobe': [
        {
          src: ')<</if>>\n\t\t<br>',
          applyafter:
            '\n\t\t<<lanSwitch "Search: " "搜索：">><<textbox "$DeadwoodReblooms.wardrobeSearch" $DeadwoodReblooms.wardrobeSearch>><<lanButton "confirm" "capitalize" "style:height:36px;padding:0 12px;line-height:1;">><<run Dynamic.render()>><</lanButton>><br>'
        },
        {
          src: '<</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">',
          to: '<</if>>\n\t\t\t<<if $DeadwoodReblooms.wardrobeSearch isnot "">><<run $DeadwoodReblooms.wardrobeSearch.toLowerCase()>><<language>><<option "CN">><<if !_itemData.cn_name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><<option "EN">><<if !_itemData.name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><</language>><</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">'
        }
      ],
      'Widgets Mirror': [
        { src: '</div>\n\t\t</div>\n\t\t<div class="settingsToggleItemWide">', to: '</div>\n\t\t</div>\n\t\t<<DeadwoodRebloomsBodyWriting>>\n\t\t<div class="settingsToggleItemWide">' }
      ]
    }
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
    const preview = document.getElementById('colorPreviewBox');
    if (preview && /^#[0-9A-F]{3,6}$/i.test(color)) preview.style.backgroundColor = color;
  });
}
