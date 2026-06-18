// ./src/script/combat.ts

(function (maplebirch) {
  'use strict';

  maplebirch.tool.zone.inject({
    widgetPassage: {
      'Widgets Effects Man': [
        {
          srcmatchgroup: /<<actionskick \$feettarget>><<defiance 5 \$feettarget>>/g,
          to: '<<deadwood-reblooms-action-kick $feettarget>>'
        }
      ]
    }
  });
})(maplebirch);
