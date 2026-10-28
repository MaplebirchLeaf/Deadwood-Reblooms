// ./src/script/VanillaPlus/HermEjaculation.ts

const NPCS = ['ALEX', 'EDEN', 'GWYLAN', 'KYLAR', 'LEIGHTON', 'ROBIN', 'SYDNEY'] as const;
const branch = /([ \t]*)<<(if|elseif)(\s+\$NPCList\[_nn\]\.vagina\s+isnot\s+["']none["']\s+and\s+\$NPCList\[_nn\]\.penis\s+is\s+["']none["']>>)/;

const patch = (name: string) => ({
  srcmatch: branch,
  to: `$1<!-- Herm ${name} -->\n$1<<$2 $NPCList[_nn].vagina isnot "none" and $NPCList[_nn].vagina isnot "clothed" and $NPCList[_nn].penis isnot "none">>\n\t<<deadwood-reblooms-ejaculation-herm>>\n$1<<elseif$3`,
  expected: 1
});

export default function (maplebirch: typeof window.maplebirch) {
  maplebirch.tool.inject({
    widgetPassage: Object.fromEntries(NPCS.map(name => [`Widgets Ejaculation-${name}`, [patch(name)]]))
  });
}
