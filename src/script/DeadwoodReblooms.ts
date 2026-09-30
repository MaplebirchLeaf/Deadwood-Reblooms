// ./src/script/DeadwoodReblooms.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function (maplebirch: MaplebirchCore) {
  'use strict';

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
  maplebirch.tool.addTo('HintMobile', () =>
    V.options.maplebirch.modhint === 'mobile' && V.options.sidebarStats !== 'disabled'
      ? "<input type='button' class='saveMenuButton DeadwoodRebloomsHintMobile' onclick='maplebirch.get(\"DeadwoodReblooms\").open()'>"
      : ''
  );
  maplebirch.tool.addTo('MenuBig', () =>
    V.options.maplebirch.modhint === 'desktop' ? "<<lanButton 'Deadwood Reblooms' 'upper'>><<run maplebirch.get(\"DeadwoodReblooms\").open()>><</lanButton>>" : ''
  );
  // 给原版衣柜加入搜索，并把身体涂写设置嵌入镜子界面。
  maplebirch.tool.inject({
    widgetPassage: {
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
          srcmatch: /<div class="settingsToggleItemWide">\s*<span class="gold bold">(?:Body shape:|身形：)<\/span>/,
          applybefore: '<<DeadwoodRebloomsBodyWriting>>\n\t\t',
          expected: 1
        }
      ]
    }
  });

  $(document).on('change', 'input[name="radiobutton--bodywritingcolor"]', function () {
    if (!maplebirch.services.modules.initPhase.preInitCompleted) return;
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
    if (!maplebirch.services.modules.initPhase.preInitCompleted) return;
    let color = this.value;
    if (!color.startsWith('#')) color = '#' + color;
    const preview = document.getElementById('colorPreviewBox');
    if (preview && /^#[0-9A-F]{3,6}$/i.test(color)) preview.style.backgroundColor = color;
  });
}
