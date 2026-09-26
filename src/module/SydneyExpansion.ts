import Module from './Module';

class SydneyExpansion extends Module {
  static readonly variables = {
    robinHalloweenYear: 0,
    whitneyHalloweenYear: 0,
    halloweenYear: 0,
    christmasYear: 0,
    halloweenRestYear: 0,
    christmasRestYear: 0,
    sirrisHalloweenVisitYear: 0,
    dormVisited: false,
    dormScene: 'bed',
    halloweenTalkYear: 0,
    christmasTalkYear: 0,
    readDay: -1,
    talkDay: -1,
    teaseDay: -1,
    wardrobeDay: -1
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'SydneyExpansion', SydneyExpansion.variables);
  }
}

export default SydneyExpansion;
