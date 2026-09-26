type PassagePatch = { src?: string; srcmatch?: RegExp; to?: string; applyafter?: string; applybefore?: string; expected: number };

export const sydneyConfessionPassages: Record<string, PassagePatch[]> = {
  'Temple Confess Self Temptation Goad': [
    // 扩展 Sydney 的 switch 分支：已揭露告解且为恋爱对象时先显示越过隔板选项，否则回退原版恋爱判断。
    {
      src: '<<if $sydneyromance gte 1>>',
      to: `<<if isLoveInterest("Sydney") and $sydneySeen.includes("confessionRevealed")>>
			<<deadwood-reblooms-sydney-confession-cross-over>>
		<<elseif $sydneyromance gte 1>>`,
      expected: 1
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  // 扩展悉尼告解分支，同时保留原版恋爱条件作为回退。
  maplebirch.tool.inject({ locationPassage: sydneyConfessionPassages });
}
