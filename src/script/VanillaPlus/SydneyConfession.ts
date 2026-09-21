type PassagePatch = { src?: string; srcmatch?: RegExp; to?: string; applyafter?: string; applybefore?: string };

export const sydneyConfessionPassages: Record<string, PassagePatch[]> = {
  'Temple Confess Self Temptation Goad': [
    {
      srcmatch: /<<case "Sydney">>\s*<<run statusCheck\("Sydney"\)>>\s*<<if \$sydneyromance gte 1>>/,
      to: `<<case "Sydney">>
		<<run statusCheck("Sydney")>>
		<<if isLoveInterest("Sydney") and $sydneySeen.includes("confessionRevealed")>>
			<<deadwood-reblooms-sydney-confession-cross-over>>
		<<elseif $sydneyromance gte 1>>`
    }
  ]
};

export default function (maplebirch: typeof window.maplebirch) {
  // 扩展悉尼告解分支，同时保留原版恋爱条件作为回退。
  maplebirch.tool.zone.inject({ locationPassage: sydneyConfessionPassages });
}
