// ./src/module/main.ts

import DoLP from '../compat/DoLP';
import DoLX from '../compat/DoLX';
import DeadwoodReblooms from './DeadwoodReblooms';
import UnLockCheatAndCombatStatusDisplay from './UnLockCheatAndCombatStatusDisplay';
import LongerCombat from './LongerCombat';
import MoreLoveInterestsAndNPCAvatars from './MoreLoveInterestsAndNPCAvatars';
import IncantationCheatCollection from './IncantationCheatCollection';
import CelestialAnomalies from './CelestialAnomalies';
import MoreTransformations from './MoreTransformations';
import NPCSidebarPortrait from './NPCSidebarPortrait';
import VanillaPlus from './VanillaPlus';
import Finance from './Finance';
import DynamicMusic from './DynamicMusic';
import LifeSimulation from './LifeSimulation';
import Orchard from './Orchard';
import Sydney from './Sydney';
import Robin from './Robin';
import Whitney from './Whitney';
import Kylar from './Kylar';
import BirdTower from './BirdTower';

(function (maplebirch): void {
  'use strict';
  DoLP(maplebirch);
  DoLX(maplebirch);
  maplebirch.define('DeadwoodReblooms', new DeadwoodReblooms(maplebirch), ['var']);
  maplebirch.define('UnLockCheatAndCombatStatusDisplay', new UnLockCheatAndCombatStatusDisplay(maplebirch), ['DeadwoodReblooms', 'tool']);
  maplebirch.define('LongerCombat', new LongerCombat(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('MoreLoveInterestsAndNPCAvatars', new MoreLoveInterestsAndNPCAvatars(maplebirch), ['DeadwoodReblooms', 'tool']);
  maplebirch.define('IncantationCheatCollection', new IncantationCheatCollection(maplebirch), ['DeadwoodReblooms']);
  maplebirch.define('CelestialAnomalies', new CelestialAnomalies(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('MoreTransformations', new MoreTransformations(maplebirch), ['DeadwoodReblooms', 'char']);
  maplebirch.define('NPCSidebarPortrait', new NPCSidebarPortrait(maplebirch), ['DeadwoodReblooms', 'npc']);
  maplebirch.define('Finance', new Finance(maplebirch), ['DeadwoodReblooms', 'var', 'char', 'npc']);
  maplebirch.define('VanillaPlus', new VanillaPlus(maplebirch), ['DeadwoodReblooms', 'var', 'char', 'npc']);
  maplebirch.define('Sydney', new Sydney(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('Robin', new Robin(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('Whitney', new Whitney(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('Kylar', new Kylar(maplebirch), ['DeadwoodReblooms', 'var']);
  maplebirch.define('BirdTower', new BirdTower(maplebirch), ['DeadwoodReblooms', 'var', 'char']);
  maplebirch.define('LifeSimulation', new LifeSimulation(maplebirch), ['DeadwoodReblooms', 'var', 'combat']);
  maplebirch.define('Orchard', new Orchard(maplebirch), ['DeadwoodReblooms', 'var', 'npc']);
  maplebirch.define('DynamicMusic', new DynamicMusic(maplebirch), ['DeadwoodReblooms', 'audio', 'var']);
})(maplebirch);
