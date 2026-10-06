// ./src/script/LifeSimulation.ts

import AcademicHonours from './LifeSimulation/AcademicHonours';
import HistoryProject from './LifeSimulation/HistoryProject';
import Gym from './LifeSimulation/Gym';
import School from './LifeSimulation/School';
import SchoolNPCs from './LifeSimulation/SchoolNPCs';
import Weapons from './LifeSimulation/Weapons';
import Medicine from './LifeSimulation/Medicine';
import Casino from './LifeSimulation/Casino';

export default function LifeSimulation(maplebirch: typeof window.maplebirch): void {
  AcademicHonours(maplebirch);
  HistoryProject(maplebirch);
  Gym(maplebirch);
  School(maplebirch);
  SchoolNPCs(maplebirch);
  Weapons(maplebirch);
  Medicine(maplebirch);
  Casino(maplebirch);
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-body-growth-clinic-link'], passage: 'Hospital Foyer' });
}
