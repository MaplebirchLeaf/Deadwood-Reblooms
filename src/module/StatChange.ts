// ./src/module/StatChange.ts

(function (maplebirch) {
  'use strict';

  maplebirch.once(':sugarcube', () => {
    const macro = maplebirch.tool.macro;

    // 容貌
    macro.create('lbeauty', () => {
      if (!V.settings.blindStatsEnabled) return macro.statChange(`${lanSwitch('Beauty', '容貌')}`, -1, 'red');
      return document.createDocumentFragment();
    });
    macro.create('llbeauty', () => {
      if (!V.settings.blindStatsEnabled) return macro.statChange(`${lanSwitch('Beauty', '容貌')}`, -2, 'red');
      return document.createDocumentFragment();
    });
    macro.create('lllbeauty', () => {
      if (!V.settings.blindStatsEnabled) return macro.statChange(`${lanSwitch('Beauty', '容貌')}`, -3, 'red');
      return document.createDocumentFragment();
    });

    // 意志
    macro.create('lwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -1, 'lblue'));
    macro.create('llwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -2, 'lblue'));
    macro.create('lllwillpower', () => macro.statChange(`${lanSwitch('Willpower', '意志')}`, -3, 'lblue'));

    // 理智
    macro.create('lsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, -1, 'red'));
    macro.create('llsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, -2, 'red'));
    macro.create('lllsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, -3, 'red'));
    macro.create('gsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, 1, 'green'));
    macro.create('ggsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, 2, 'green'));
    macro.create('gggsanity', () => macro.statChange(`${lanSwitch('Sanity', '理智')}`, 3, 'green'));

    // 口渴
    macro.create('lthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -1, 'green'));
    macro.create('llthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -2, 'green'));
    macro.create('lllthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -3, 'green'));
    macro.create('gthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 1, 'red'));
    macro.create('ggthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 2, 'red'));
    macro.create('gggthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 3, 'red'));
  });
})(maplebirch);
