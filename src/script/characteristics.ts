// ./src/script/characteristics.ts

(function (maplebirch) {
  'use strict';

  // 时间衰减
  maplebirch.dynamic.regTimeEvent('onMin', 'hunger&thirst', {
    cond: () => Number.isFinite(V.DeadwoodReblooms?.satiety) && Number.isFinite(V.DeadwoodReblooms?.hydration),
    action: data => {
      const minutes = data.triggeredByAccumulator?.count ?? 1;
      V.DeadwoodReblooms.satiety -= minutes;
      V.DeadwoodReblooms.hydration -= minutes;
    },
    accumulate: { unit: 'min', target: 1 }
  });

  function pre(options: any) {
    options.DeadwoodReblooms ??= {};
    options.DeadwoodReblooms['hunger&thirst'] = V.DeadwoodReblooms?.satiety <= 2000 || V.DeadwoodReblooms?.hydration <= 800;
    if (options.DeadwoodReblooms['hunger&thirst']) {
      options.mouth = 'frown';
      options.eyes_half = true;
    }
  }

  maplebirch.char.use('pre', pre);
})(maplebirch);
