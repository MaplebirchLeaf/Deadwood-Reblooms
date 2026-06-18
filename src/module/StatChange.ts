// ./src/module/StatChange.ts

(function (maplebirch) {
  'use strict';
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

  // 饥饿
  macro.create('lhunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, -1, 'red'));
  macro.create('llhunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, -2, 'red'));
  macro.create('lllhunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, -3, 'red'));
  macro.create('ghunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, 1, 'green'));
  macro.create('gghunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, 2, 'green'));
  macro.create('ggghunger', () => macro.statChange(`${lanSwitch('Hunger', '饥饿')}`, 3, 'green'));

  // 口渴
  macro.create('lthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -1, 'red'));
  macro.create('llthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -2, 'red'));
  macro.create('lllthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, -3, 'red'));
  macro.create('gthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 1, 'green'));
  macro.create('ggthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 2, 'green'));
  macro.create('gggthirsty', () => macro.statChange(`${lanSwitch('Thirsty', '口渴')}`, 3, 'green'));
})(maplebirch);
