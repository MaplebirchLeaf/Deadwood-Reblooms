// ./src/script/VanillaPlus/HermEjaculation.ts

// 原版每个 ejaculation-* 的女性块门控是「vagina 有、penis 为 none」，双性 NPC 因此整块跳过女性分支。
// 直接放宽门控会让女性块和男性块对同一场高潮各写一遍，读起来像两个人。
// 这里改成显式分支：门控上方插入 <!-- herm XXX -->，双性先走 deadwood-reblooms-ejaculation-herm
// 写阴道那一侧（沿用原版女性块的说辞），男性块保持原样只按 penis 状态写射精。两段分工。
// Kylar 的门控是 <<elseif>>（前面还有一条 sabotaged 分支），必须按 elseif 改写，否则整段 if 链会断。
export default function (maplebirch: typeof window.maplebirch) {
  const branch = (label: string, opener: 'if' | 'elseif') =>
    '\t<!-- herm ' +
    label +
    ' -->\n' +
    '\t<<' +
    opener +
    ' $NPCList[_nn].vagina isnot "none" and $NPCList[_nn].penis isnot "none">><<deadwood-reblooms-ejaculation-herm>>\n' +
    '\t<<elseif $NPCList[_nn].vagina isnot "none" and $NPCList[_nn].penis is "none">>';
  const patch = (label: string, opener: 'if' | 'elseif') => ({
    srcmatch: new RegExp('\\t<<' + opener + ' \\$NPCList\\[_nn\\]\\.vagina isnot "none" and \\$NPCList\\[_nn\\]\\.penis is "none">>'),
    to: branch(label, opener),
    expected: 1
  });
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets Ejaculation-ALEX': [patch('ALEX', 'if')],
      'Widgets Ejaculation-EDEN': [patch('EDEN', 'if')],
      'Widgets Ejaculation-GWYLAN': [patch('GWYLAN', 'if')],
      'Widgets Ejaculation-KYLAR': [patch('KYLAR', 'elseif')],
      'Widgets Ejaculation-LEIGHTON': [patch('LEIGHTON', 'if')],
      'Widgets Ejaculation-ROBIN': [patch('ROBIN', 'if')],
      'Widgets Ejaculation-SYDNEY': [patch('SYDNEY', 'if')]
    }
  });
}
