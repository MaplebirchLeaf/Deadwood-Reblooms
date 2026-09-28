import AcademicHonours from './LifeSimulation/AcademicHonours';
import HistoryProject from './LifeSimulation/HistoryProject';
import Gym from './LifeSimulation/Gym';
import School from './LifeSimulation/School';
import SchoolNPCs from './LifeSimulation/SchoolNPCs';

export default function LifeSimulation(maplebirch: typeof window.maplebirch): void {
  AcademicHonours(maplebirch);
  HistoryProject(maplebirch);
  Gym(maplebirch);
  School(maplebirch);
  SchoolNPCs(maplebirch);
}
