// ./src/script/DeadwoodReblooms.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

  maplebirch.tool.addTo('Options', 'Deadwood-Reblooms-Options');
  maplebirch.tool.addTo('Cheats', 'deadwood-reblooms-cheats');
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
  maplebirch.tool.addTo('HintMobile', () =>
    V.options.maplebirch.modhint === 'mobile' && V.options.sidebarStats !== 'disabled' ? "<input type='button' class='saveMenuButton DeadwoodRebloomsHintMobile' onclick='maplebirch.DR.open()'>" : ''
  );
  maplebirch.tool.addTo('MenuBig', () => (V.options.maplebirch.modhint === 'desktop' ? "<<lanButton 'Deadwood Reblooms' 'upper'>><<run maplebirch.DR.open()>><</lanButton>>" : ''));
  // 给原版衣柜加入搜索，并把身体涂写设置嵌入镜子界面。
  maplebirch.tool.zone.inject({
    widgetPassage: {
      'Widgets Wardrobe': [
        // 在衣柜筛选与物品列表之间插入双语搜索框，搜索确认后仍调用原版 Dynamic.render 刷新列表。
        {
          src: ')<</if>>\n\t\t<br>',
          applyafter:
            '\n\t\t<<lanSwitch "Search: " "搜索：">><<textbox "$DeadwoodReblooms.wardrobeSearch" $DeadwoodReblooms.wardrobeSearch>><<lanButton "confirm" "capitalize" "style:height:36px;padding:0 12px;line-height:1;">><<run Dynamic.render()>><</lanButton>><br>',
          expected: 1
        },
        // 在每件衣柜物品渲染前加入语言对应的名称过滤，不修改物品数据与后续穿戴操作。
        {
          src: '<</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">',
          to: '<</if>>\n\t\t\t<<if $DeadwoodReblooms.wardrobeSearch isnot "">><<run $DeadwoodReblooms.wardrobeSearch.toLowerCase()>><<language>><<option "CN">><<if !_itemData.cn_name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><<option "EN">><<if !_itemData.name_cap.toLowerCase().includes($DeadwoodReblooms.wardrobeSearch)>><<continue>><</if>><</language>><</if>>\n\t\t\t<div class="wardrobeItem wardrobe-action no-numberify">',
          expected: 1
        }
      ],
      'Widgets Mirror': [
        // 在镜子设置的下一项控件前插入身体刻字组件，保持原版设置网格的 HTML 层级不变。
        {
          src: '</div>\n\t\t</div>\n\t\t<div class="settingsToggleItemWide">',
          to: '</div>\n\t\t</div>\n\t\t<<DeadwoodRebloomsBodyWriting>>\n\t\t<div class="settingsToggleItemWide">',
          expected: 1
        }
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
