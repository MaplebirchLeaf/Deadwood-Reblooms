// ./src/module/constants/life-simulation.ts

import type { SchoolState } from '../LifeSimulation/School';
import { DEFAULT_SCHOOL_STATE } from '../LifeSimulation/School';

/** 健身房的票种与会员档位。visit 是单次票，其余为按期会员。 */
export type GymPlan = 'visit' | 'week' | 'month' | 'year' | 'lifetime';

/** 历史课题的进行状态。 */
export interface HistoryProjectState {
  /** 项目总状态；won 表示已获奖。 */
  status: 'none' | 'ongoing' | 'done' | 'won';
  /** 证据来源；对应两处原版画作的取得路线。 */
  source: 'none' | 'paintingward' | 'paintingsnake';
  /** 项目可开始的游戏日。 */
  availableDay: number;
  /** 提交截止的游戏日。 */
  deadline: number;
  /** 是否有助手协助。 */
  assistant: boolean;
  /** 凯拉尔的介入方式；sabotage 表示破坏。 */
  kylar: 'none' | 'help' | 'sabotage';
  /** 凯拉尔是否已在街头出现。 */
  kylarStreet: boolean;
  /** 凯拉尔是否已做好准备。 */
  kylarPrepared: boolean;
  /** 档案研究进度。 */
  archive: number;
  /** 博物馆研究进度。 */
  museum: number;
  /** 受灾后的应对方式；rushed 表示仓促处理。 */
  recovery: 'none' | 'recorded' | 'rushed';
  /** 灾损程度。 */
  ruin: number;
  /** 草稿完成度。 */
  draft: number;
  /** 终稿完成度。 */
  final: number;
}

/** 健身房的会员与当日状态。 */
export interface GymState {
  /** 上次购买单次票的游戏日；-1 表示今天还没买。 */
  ticket_day: number;
  /** 当前会员档位；none 表示没有会员。 */
  membership: Exclude<GymPlan, 'visit'> | 'none';
  /** 会员到期时间戳；lifetime 档不使用。 */
  expires_at: number;
  /** 当日已完成的锻炼次数，用于限制收益。 */
  sessions_today: number;
  /** 当日是否已洗过澡，避免重复结算清洁度。 */
  washed_today: boolean;
  /** 当日进行中的项目；空串表示未选择。 */
  activity: '' | 'weights' | 'run' | 'stretch' | 'deck-run';
  /** 多伦的健身房日程：当天只决定一次是否出现，互动也只结算一次。 */
  doren_checked_day: number;
  doren_present: boolean;
  doren_interaction_day: number;
}

// 模块 LifeSimulation 的存档结构，对应 V.LifeSimulation。
export interface LifeSimulationState {
  /** 历史课题的进度与证据结果。 */
  historyProject: HistoryProjectState;
  /** 校园生活的全部状态。 */
  school: SchoolState;
  /** 健身房的会员与当日状态。 */
  gym: GymState;
}

// 项目进度和证据结果都写入 V.LifeSimulation；重新读档后直接恢复当前阶段。
export const DEFAULT_LIFE_SIMULATION_STATE: LifeSimulationState = {
  historyProject: {
    status: 'none',
    source: 'none',
    availableDay: 0,
    deadline: 0,
    assistant: false,
    kylar: 'none',
    kylarStreet: false,
    kylarPrepared: false,
    archive: 0,
    museum: 0,
    recovery: 'none',
    ruin: 0,
    draft: 0,
    final: 0
  },
  school: DEFAULT_SCHOOL_STATE,
  gym: {
    ticket_day: -1,
    membership: 'none',
    expires_at: 0,
    sessions_today: 0,
    washed_today: false,
    activity: '',
    doren_checked_day: -1,
    doren_present: false,
    doren_interaction_day: -1
  }
};
