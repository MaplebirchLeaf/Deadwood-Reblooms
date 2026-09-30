// ./src/module/constants/celestial-anomalies.ts

// 模块 CelestialAnomalies 的存档结构，对应 V.CelestialAnomalies。
export interface CelestialAnomaliesState {
  /** 日食的排期状态。 */
  solarEclipse: {
    /** 本次排期使用的随机种子，0 表示尚未生成。 */
    seed: number;
    /** 已触发但尚未结算的日食事件队列。 */
    stored: unknown[];
  };
  /** 流星雨的排期状态。 */
  meteorShower: {
    /** 本次排期使用的随机种子，0 表示尚未生成。 */
    seed: number;
    /** 已触发但尚未结算的流星雨事件队列。 */
    stored: unknown[];
  };
}

export const DEFAULT_CELESTIAL_ANOMALIES_STATE: CelestialAnomaliesState = {
  solarEclipse: {
    seed: 0,
    stored: []
  },
  meteorShower: {
    seed: 0,
    stored: []
  }
};
