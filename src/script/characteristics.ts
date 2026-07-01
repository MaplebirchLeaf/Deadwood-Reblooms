// ./src/script/characteristics.ts

(function (maplebirch) {
  'use strict';

  const decayRates = [0.65, 0.8, 1, 1.25, 1.5] as const;

  /** 按当前状态区间逐段计算衰减量，确保跨日跳时也能正确穿过各级阈值。 */
  function decay(value: number, max: number, minutes: number, scale = 1): number {
    let current = Math.clamp(value, 0, max);
    let remaining = Math.max(0, minutes);

    while (current > 0 && remaining > 0) {
      const band = Math.min(decayRates.length - 1, Math.max(0, Math.ceil((current / max) * decayRates.length) - 1));
      const floor = (max / decayRates.length) * band;
      const rate = decayRates[band] * scale;
      if (!Number.isFinite(rate) || rate <= 0) break;
      const duration = (current - floor) / rate;
      const elapsed = Math.min(remaining, duration);
      current -= elapsed * rate;
      remaining -= elapsed;
    }

    return value - current;
  }

  // 时间衰减
  maplebirch.dynamic.regTimeEvent('onMin', 'hunger&thirst', {
    cond: () => Number.isFinite(V.DeadwoodReblooms?.satiety) && Number.isFinite(V.DeadwoodReblooms?.hydration),
    action: data => {
      const minutes = data.min ?? 1;
      C.DeadwoodReblooms.satiety -= decay(C.DeadwoodReblooms.satiety, 10000, minutes, 1.2);
      C.DeadwoodReblooms.hydration -= decay(C.DeadwoodReblooms.hydration, 4000, minutes, 1);
    }
  });

  function pre(options: any) {
    options.DeadwoodReblooms ??= {};
    options.DeadwoodReblooms['hunger&thirst'] = C.DeadwoodReblooms?.satiety <= 2000 || C.DeadwoodReblooms?.hydration <= 800;
    if (options.DeadwoodReblooms['hunger&thirst']) {
      options.mouth = 'frown';
      options.eyes_half = true;
    }
  }

  maplebirch.char.use('pre', pre);
})(maplebirch);
