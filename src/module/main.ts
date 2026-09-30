import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import LongerCombat from './LongerCombat';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import IncantationCheatCollection from './IncantationCheatCollection';
import CelestialAnomalies from './CelestialAnomalies';
import MoreTransformations from './MoreTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import DynamicMusic from './DynamicMusic';
import LifeSimulation from './LifeSimulation';
import Sydney from './Sydney';
import Robin from './Robin';
import Whitney from './Whitney';
import Kylar from './Kylar';

(function (maplebirch): void {
  'use strict';
  maplebirch.define('DR', new DeadwoodReblooms(maplebirch), ['var']);
  maplebirch.define('UCACSD', new UnLockCheatAndCombatStatusDisplay(maplebirch), ['DR', 'tool']);
  maplebirch.define('LongerCombat', new LongerCombat(maplebirch), ['DR', 'var']);
  maplebirch.define('MLIANPCA', new MoreLoveInterestsAndNPCAvatars(maplebirch), ['DR', 'tool']);
  maplebirch.define('ICC', new IncantationCheatCollection(maplebirch), ['DR']);
  maplebirch.define('CA', new CelestialAnomalies(maplebirch), ['DR', 'var']);
  maplebirch.define('MoreTransformations', new MoreTransformations(maplebirch), ['DR', 'char']);
  maplebirch.define('NPCSidebarPortrait', new NPCSidebarPortrait(maplebirch), ['DR', 'npc']);
  maplebirch.define('VP', new VanillaPlus(maplebirch), ['DR', 'var', 'char']);
  // 模块 ID 与存档字段分离；旧存档仍使用 V.*Expansion。
  maplebirch.define('Sydney', new Sydney(maplebirch), ['DR', 'var']);
  maplebirch.define('Robin', new Robin(maplebirch), ['DR', 'var']);
  maplebirch.define('Whitney', new Whitney(maplebirch), ['DR', 'var']);
  maplebirch.define('Kylar', new Kylar(maplebirch), ['DR', 'var']);
  maplebirch.define('LS', new LifeSimulation(maplebirch), ['DR', 'var']);
  maplebirch.define('DM', new DynamicMusic(maplebirch), ['DR', 'audio', 'var']);
})(maplebirch);
