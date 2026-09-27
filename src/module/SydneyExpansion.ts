import Module from './Module';

class SydneyExpansion extends Module {
  // 年份与日期标记阻止节庆和日常对话重复触发；dormScene 只记录神殿宿舍当前入口。
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
    wardrobeDay: -1,
    gardenDay: -1,
    quartersDay: -1,
    trialTalkDay: -1,
    touchDay: -1,
    touchPart: ''
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'SydneyExpansion', SydneyExpansion.variables);
  }
}

export default SydneyExpansion;
