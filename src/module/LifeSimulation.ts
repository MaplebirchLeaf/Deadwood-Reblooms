import Module from './Module';
import AcademicHonours from './LifeSimulation/AcademicHonours';
import School, { DEFAULT_SCHOOL_STATE } from './LifeSimulation/School';

export const DEFAULT_HISTORY_PROJECT_STATE = {
  // 项目进度和证据结果都写入 V.LifeSimulation；重新读档后直接恢复当前阶段。
  status: 'none' as 'none' | 'ongoing' | 'done' | 'won',
  source: 'none' as 'none' | 'paintingward' | 'paintingsnake',
  availableDay: 0,
  deadline: 0,
  assistant: false,
  kylar: 'none' as 'none' | 'help' | 'sabotage',
  kylarStreet: false,
  kylarPrepared: false,
  archive: 0,
  museum: 0,
  recovery: 'none' as 'none' | 'recorded' | 'rushed',
  ruin: 0,
  draft: 0,
  final: 0
};

class LifeSimulation extends Module {
  static readonly variables = {
    historyProject: DEFAULT_HISTORY_PROJECT_STATE,
    school: DEFAULT_SCHOOL_STATE
  };

  public readonly exposed = true;
  public readonly academics = new AcademicHonours();
  public readonly school = new School();

  public constructor(core: typeof maplebirch) {
    super(core, 'LifeSimulation', LifeSimulation.variables);
  }
}

declare module '@scml-dol-maplebirch/types' {
  interface Extensions {
    readonly LS: LifeSimulation;
  }
}

export default LifeSimulation;
