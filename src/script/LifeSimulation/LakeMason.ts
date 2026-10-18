// ./src/script/LifeSimulation/LakeMason.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function LakeMason(maplebirch: MaplebirchCore): void {
  maplebirch.tool.inject({
    locationPassage: {
      'Lake Mason': [
        {
          src: '<<link [[Just say hello|Lake Mason Greet]]>><<stress -6>><</link>><<lstress>>\n<br>',
          applyafter: '\n<<deadwood-lake-mason-options>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Mason': [
        {
          src: '<<link [[Flirt (0:30)|Mason Pond Flirt]]>><<pass 30>><<npcincr Mason love -1>><<npcincr Mason lust 1>><</link>><<promiscuous1>><<llove>><<glust>>\n\t\t<br>',
          applyafter: '\n\t\t<<deadwood-mason-pond-options>>',
          expected: 1
        }
      ]
    }
  });
}
