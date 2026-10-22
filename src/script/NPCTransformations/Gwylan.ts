// ./src/script/NPCTransformations/Gwylan.ts

import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

export default function Gwylan(maplebirch: MaplebirchCore): void {
  // 注册和同步不受立绘模块开关控制，玩法也能查询同一份原版狐化状态。
  maplebirch.npc.Transformation.add('Gwylan', 'fox', {
    levels: [1],
    type: 'fox',
    parts: { fox_ears: {}, fox_tail: {} },
    sidebar(nnpc) {
      const isVisible = (part: 'ears' | 'tail') => !!maplebirch.get('NPCSidebarPortrait') && ['visible', 'revealed'].includes(T.gwylanTF?.[part]);
      nnpc.fox_ears_type = isVisible('ears') ? 'default' : 'disabled';
      nnpc.fox_tail_type = isVisible('tail') ? 'default' : 'disabled';
    }
  });
}
