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
    scienceHint: false,
    dormInvited: false,
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
    touchPart: '',
    // 西里斯庄园的邀请、初访、童年对话和每日互动均属于当前存档，不从窗口或 Passage 历史推断。
    estate: {
      invited: false,
      visited: false,
      visitDay: -1,
      familyTalk: '',
      kylarTalk: '',
      studyDay: -1,
      gardenDay: -1,
      kitchenDay: -1,
      roomDay: -1,
      teaseDay: -1
    }
  };

  public constructor(core: typeof maplebirch) {
    super(core, 'SydneyExpansion', SydneyExpansion.variables);
  }
}

export default SydneyExpansion;
