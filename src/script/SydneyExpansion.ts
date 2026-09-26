import Festivals from './SydneyExpansion/Festivals';
import SydneyChastity from './SydneyExpansion/SydneyChastity';
import SydneyConfession from './SydneyExpansion/SydneyConfession';
import SydneyDorm from './SydneyExpansion/SydneyDorm';
import SydneyScience from './SydneyExpansion/SydneyScience';

export default function (maplebirch: typeof window.maplebirch): void {
  Festivals(maplebirch);
  SydneyChastity(maplebirch);
  SydneyConfession(maplebirch);
  SydneyDorm(maplebirch);
  SydneyScience(maplebirch);
}
