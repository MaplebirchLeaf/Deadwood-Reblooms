// ./src/script/Sydney/Festivals.ts

export default function (maplebirch: typeof window.maplebirch) {
  // 只在当前剧情的收尾页提供下一站入口，错过后不另设补看入口。
  maplebirch.tool.addTo(
    'BeforeLinkZone',
    { widget: 'deadwood-reblooms-halloween-robin-guide', passage: ['Robin Trick Hug', 'Robin Trick Talk', 'Robin Trick Kiss Finish'] },
    { widget: 'deadwood-reblooms-halloween-kylar-guide', passage: ['Whitney Trick 7', 'Whitney Trick Sex Finish'] },
    {
      widget: 'deadwood-reblooms-halloween-sydney-guide',
      passage: [
        'Kylar Halloween Town',
        'Kylar Halloween Sex Finish',
        'Kylar Halloween Alone',
        'Kylar Halloween Thank',
        'Kylar Halloween Whitney Kiss',
        'Kylar Halloween Whitney Apologise',
        'Kylar Halloween Whitney Silent',
        'Kylar Halloween Skulduggery Pull'
      ]
    },
    { widget: 'deadwood-reblooms-halloween-sydney-accompany-guide', passage: 'Kylar Halloween Accompany' }
  );
}
