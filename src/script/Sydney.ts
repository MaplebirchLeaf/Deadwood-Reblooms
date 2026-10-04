// ./src/script/Sydney.ts

import Festivals from './Sydney/Festivals';
import SydneyChastity from './Sydney/SydneyChastity';
import SydneyConfession from './Sydney/SydneyConfession';
import SydneyDorm from './Sydney/SydneyDorm';
import SydneyScience from './Sydney/SydneyScience';
import SirrisEstate from './Sydney/SirrisEstate';
import Work from './Sydney/Work';
import Baths from './Sydney/Baths';

export default function (maplebirch: typeof window.maplebirch): void {
  Festivals(maplebirch);
  SydneyChastity(maplebirch);
  SydneyConfession(maplebirch);
  SydneyDorm(maplebirch);
  SydneyScience(maplebirch);
  SirrisEstate(maplebirch);
  Work(maplebirch);
  Baths(maplebirch);
}
