// ./src/script/VanillaPlus/PenisSize.ts

export const npc_size_patch = {
  srcmatch: /(<<switch \$NPCList\[(\$mouthtarget|_n|_nn)\]\.penissize>>\s*)(?=<<case (?:3 )?4>>)/
};

export default function (maplebirch: typeof window.maplebirch) {
  // 原版 effects 尚未覆盖增长到 7、缩回 6，在正文前提示并消费对应消息。
  maplebirch.dynamic.regStateEvent('gate', 'deadwood-size-seven-change', {
    cond: () => !!V.effectsmessage && !V.statFreeze && !V.silenceNotifications && (V.penisgrowthmessage === 7 || V.penisshrinkmessage === 6),
    output: 'deadwood-reblooms-size-seven-change'
  });

  const npc_prototype = maplebirch.npc.NamedNPC.prototype;
  const describe = npc_prototype.bodyPartdescription;
  npc_prototype.bodyPartdescription = function () {
    const generated = Object.entries(this.descCache ?? {}).some(([key, value]) => key.startsWith('deadwood_penis_') && value === this.penisdesc);
    if (generated) this.penisdesc = 'penis';
    describe.call(this);
    const extended = this.penissize === 5 && Object.entries(this.descCache).some(([key, value]) => key.startsWith('penis_') && value === this.penisdesc);
    if (extended) {
      const language = maplebirch.services.translator.language === 'CN' ? 'CN' : 'EN';
      this.penisdesc = this.descCache[`deadwood_penis_${language}_5`] ||= (
        language === 'CN' ? ['骇人肉棒', '慑人肉棒', '可怖肉棒'] : ['gargantuan penis', 'intimidating penis', 'terrifying penis']
      ).either();
    }
  };

  // 保留原版的体毛尺寸、滤镜与遮挡，只替换侧栏主图及存在的寄生覆盖图。
  maplebirch.char.use(
    'pre',
    options => {
      if (V.player?.penissize !== 7 || options.mannequin || !options.penis) return;
      options.penis = options.penis.replace(/-6$/, '-7');
      if (V.worn.genitals.name === 'chastity parasite' && options.penis_parasite?.includes('ear-slime')) {
        options.ear_slime_size = 3;
        options.penis_parasite = 'ear-slime-3';
      }
      if (!options.penis_parasite?.endsWith('-7')) return;
      const folder = options.penis_parasite.includes('ear-slime') ? `body/${options.balls ? 'penis' : 'penis-no-balls'}` : 'body/parasites';
      if (maplebirch.host.modLoader.resources.has(`img/${folder}/${options.penis_parasite}.png`) !== true) {
        options.penis_parasite = options.penis_parasite.replace(/-7$/, '-6');
      }
    },
    'main'
  );

  // NPC 第 5 档复用侧栏第 7 档图片，只修改本次渲染参数。
  maplebirch.char.use(
    'pre',
    (options, model) => {
      const sidebar = V.options.maplebirch.npcsidebar;
      const enabled = sidebar.model && (model?.name === 'main' ? sidebar.show : sidebar.pet?.enabled);
      for (const slot of ['nnpc', 'previous'] as const) {
        const nnpc = options.maplebirch?.[slot];
        if (!nnpc) continue;
        if (!enabled || !nnpc.show || !nnpc.model || !V.npc?.includes(nnpc.name) || (slot === 'previous' && !sidebar.second_model)) {
          nnpc.penis = false;
          nnpc.penis_size = 0;
          continue;
        }
        if (!nnpc.penis || Math.round(nnpc.bodydata?.penissize ?? 1) !== 5) continue;
        const penis = nnpc.penis.replace(/-6$/, '-7');
        const folder = nnpc.balls ? 'penis' : 'penis-no-balls';
        if (maplebirch.host.modLoader.resources.has(`img/body/${folder}/${penis}.png`) !== true) continue;
        nnpc.penis_size = 7;
        nnpc.penis = penis;
      }
    },
    ['main', 'npc-pet-nnpc', 'npc-pet-previous']
  );

  // 原版近景的贞操锁寄生虫只提供 0–6 号素材，这里仅调整图片索引。
  maplebirch.char.use(
    'pre',
    options => {
      if (V.player?.penissize !== 7) return;
      if (options.chastity === 'chastity-parasite-7') options.chastity = 'chastity-parasite-6';
      if (options.penis?.size === 'chastity-parasite-7') options.penis.size = 'chastity-parasite-6';
    },
    ['combatClosePenis', 'combatCloseVagina']
  );

  maplebirch.char.use(
    'pre',
    options => {
      const penis = options.penis;
      if (!options.showPcPenis || options.npcDouble || penis?.doublePen || penis?.base !== 'sex') return;
      if (!['machine', 'tentacle'].includes(penis.penetratedType) && window.playerPenisSize() >= 6) penis.size = 6;
    },
    'combatXrayPenis'
  );
  maplebirch.char.use(
    'pre',
    (options, model) => {
      const penetrator = options[model?.name === 'combatXrayVagina' ? 'vagina' : 'anus'];
      if (!options.showNpcPenis || !penetrator?.show || penetrator.doublePen || penetrator.base !== 'sex') return;
      if (V.NPCList?.[penetrator.npc]?.penissize !== 5) return;
      if (['human', 'plant'].includes(penetrator.npcType) && ['penis', 'strapon', 'tentacle'].includes(penetrator.penetratorSprite)) penetrator.size = 6;
    },
    ['combatXrayVagina', 'combatXrayArse']
  );

  const clamp = { src: 'Math.clamp($player.penissize, 0, 6)', to: 'Math.clamp($player.penissize, 0, 7)', expected: 1 };
  const size = /<<switch \$player\.penissize>>\s*(?=<<case 6>>)/g;
  // 用尺寸分支作锚点，保留原文并避免依赖英文句子。
  const scene = /(<<switch \$player\.penissize>>(?:(?!<<\/switch>>)[\s\S])*?)(<<case 6>>)/;
  const remaining = /(<<switch \$player\.penissize>>(?:(?!<<case 7>>|<<\/switch>>)[\s\S])*?)(<<case 6>>)/g;
  const widgetPassage: typeof maplebirch.tool.zone.widgetPassage = {
    // 设置与名称仍使用原版数据表，现有存档的个人尺寸上限不强制改写。
    'Widgets variablesStatic': [{ srcmatch: /<<set setup\.penisSizes to \[[^\]\n]+\]>>/, applyafter: '<<run setup.penisSizes.push(lanSwitch("gargantuan", "骇人"))>>', expected: 1 }],
    gameStartOnly: [{ src: '<<set $penissizemax to 6>>', to: '<<set $penissizemax to 7>>', expected: 1 }],
    'Widgets Clamp': [clamp],
    // 6→7 需要更长的积累区间，末尾钳制和统计百分比使用相同边界。
    'Widgets physicalAdjustments': [
      clamp,
      {
        src: '$penisgrowthtimer lte 0 and $player.penissize lt',
        to: '$penisgrowthtimer lte ($player.penissize is 6 ? -1400 : 0) and $player.penissize lt',
        expected: 1
      },
      {
        srcmatchgroup: /(<<set \$player\.penissize \+= 1>>\s*<<set \$penisgrowthtimer \+= )700/,
        to: '$1($player.penissize is 7 ? 2100 : 700)',
        expected: 1
      },
      {
        src: '$penisgrowthtimer gte 1000 and $player.penissize gt 2',
        to: '$penisgrowthtimer gte ($player.penissize is 7 ? 2400 : 1000) and $player.penissize gt 2 and ($player.penissize isnot 7 or $penissizemin lt 7)',
        expected: 1
      },
      {
        srcmatchgroup: /(<<set \$player\.penissize -= 1>>\s*<<set \$penisgrowthtimer -= )700/,
        to: '$1($player.penissize is 6 ? 2100 : 700)',
        expected: 1
      },
      {
        src: 'Math.clamp($penisgrowthtimer, 0, 1000)',
        to: 'Math.clamp($penisgrowthtimer, $player.penissize is 6 ? -1400 : 0, $player.penissize is 7 ? 2400 : 1000)',
        expected: 1
      }
    ],
    Statistics: [
      { src: '<<set $_penisGrowthMin to 0>>', to: '<<set $_penisGrowthMin to ($player.penissize is 6 ? -1400 : 0)>>', expected: 1 },
      { src: '<<set $_penisGrowthMax to 1000>>', to: '<<set $_penisGrowthMax to ($player.penissize is 7 ? 2400 : 1000)>>', expected: 1 }
    ],
    'Widgets Text': [{ srcmatch: /<<case 6>><<set _text_output to "[^"\n]+">>/, applybefore: '<<case 7>><<set _text_output to lanSwitch("gargantuan", "骇人")>>', expected: 1 }],
    'Widgets Settings': [
      {
        srcmatch: /<<set _penisNames to \[[^\]\n]+\]>>/g,
        applyafter: '<<set _penisNames[5] to setup.penisSizes[7].toUpperFirst()>>',
        expected: 3
      }
    ],
    'Body Comment Random Flavour Text Widgets': [
      { src: '$player.penissize is 6', to: '$player.penissize gte 6', expected: 1 },
      {
        src: '<<set _possibilities to _big_penis_all>>',
        applyafter: '<<if $player.penissize is 7 and !playerHasStrapon() and !playerChastity("penis")>><<deadwood-reblooms-size-seven-remarks>><</if>>',
        expected: 1
      }
    ],
    'Widgets Audience': [
      {
        srcmatch: size,
        applyafter: '<<case 7>><<deadwood-reblooms-size-seven-audience>>',
        expected: 2
      }
    ],
    'Widgets Speech': [clamp, { src: '<<switch Math.clamp($player.penissize, 0, 7)>>', applyafter: '<<case 7>><<deadwood-reblooms-size-seven-speech>>', expected: 1 }],
    // 中英文此段的判断数量不同。只在对白读取时将第 7 档映射到原版最大档。
    'Widgets speech-Whitney': [{ srcmatchgroup: /\$player\.penissize\b/g, to: 'Math.min($player.penissize, 6)' }],
    'Widgets Ejaculation-GWYLAN': [{ srcmatch: size, applyafter: '<<case 7>><<deadwood-reblooms-size-seven-gwylan-ejaculation>>', expected: 2 }],
    'Widgets speech-GWYLAN': [{ srcmatch: size, applyafter: '<<case 7>><<deadwood-reblooms-size-seven-gwylan-speech>>', expected: 1 }],
    'Trash Compare Widgets': [{ srcmatchgroup: scene, to: '$1<<case 7>><<deadwood-reblooms-size-seven-trash>>$2', expected: 1 }]
  };
  const locationPassage: typeof maplebirch.tool.zone.locationPassage = {
    // 无 g 的 srcmatch 只改第一个尺寸分支，后续分支沿用原版大尺寸正文。
    'Gwylan Ritual Sex Gwylan Riding': [
      { srcmatch: scene, to: '$1<<case 7>><<bodyliquid "penis" "goo">><<deadwood-reblooms-size-seven-riding>>$2', expected: 2 },
      { srcmatchgroup: remaining, to: '$1<<case 6 7>>', expected: 1 }
    ],
    'Gwylan Ritual Sex Gwylan Doggy': [
      { srcmatch: scene, to: '$1<<case 7>><<deadwood-reblooms-size-seven-doggy>>$2', expected: 2 },
      { srcmatchgroup: remaining, to: '$1<<case 6 7>>', expected: 1 }
    ],
    'Gwylan Ritual Sex Gwylan Riding Nopen': [{ srcmatchgroup: scene, to: '$1<<case 7>><<deadwood-reblooms-size-seven-grind>>$2', expected: 1 }],
    'Gwylan Ritual Inspect': [{ srcmatchgroup: remaining, to: '$1<<case 6 7>>', expected: 1 }],
    'School Infirmary Robin CD Penetrate': [{ srcmatchgroup: scene, to: '$1<<case 7>><<deadwood-reblooms-size-seven-robin>>$2', expected: 1 }],
    'Livestock Penis': [
      { srcmatch: scene, to: '$1<<case 6 7>>', expected: 2 },
      { srcmatchgroup: remaining, to: '$1<<case 7>><<deadwood-reblooms-size-seven-livestock>>$2', expected: 1 }
    ],
    'Livestock Job Harper 3 Obey': [{ srcmatchgroup: remaining, to: '$1<<case 6 7>>', expected: 1 }]
  };

  for (const [passage, widget, contexts] of [
    ['Widgets Effects Man', 'deadwood-npc-size-five-effects-man', ['swallow']],
    [
      'Widgets Combat Man-Combat',
      'deadwood-npc-size-five-combat-man',
      [
        'vagina-repeat',
        'vagina-first',
        'vagina-double-repeat',
        'vagina-double-first',
        'anus-obstructed-repeat',
        'anus-obstructed-first',
        'anus-repeat',
        'anus-first',
        'anus-double-obstructed',
        'anus-double-repeat',
        'anus-double-first'
      ]
    ],
    [
      'Widgets Ejaculation',
      'deadwood-npc-size-five-ejaculation',
      ['consensual-vagina', 'consensual-vagina-double', 'consensual-anus', 'consensual-mouthentrance', 'consensual-mouth', 'forced-vagina', 'forced-anus', 'forced-mouthentrance', 'forced-mouth']
    ]
  ] as const) {
    widgetPassage[passage] = contexts.map((context, index) => ({
      ...npc_size_patch,
      // 局部变量不跨 widget 继承，阻挡物名称由原版调用处传入。
      to: `$1<<case 5>><<${widget} $2 '${context}'${context.includes('anus-obstructed') ? ' $_buttplug' : ''}>>\n`,
      expected: contexts.length - index
    }));
  }

  // 保留原版大尺寸台词与触发条件，这里只让第 7 档进入已有分支。
  const large = { srcmatchgroup: /\$player\.penissize is 6\b/g, to: '$player.penissize gte 6' };
  for (const [passage, expected] of [
    ['Widgets Home Events', 1],
    ['Widgets Changing Room', 2],
    ['Widgets School Events', 1],
    ['Widgets Events Swimming', 1]
  ] as const)
    widgetPassage[passage] = [{ ...large, expected }];

  for (const [passage, expected] of [
    ['Bath', 1],
    ['Bath Ask', 1],
    ['Farm Shower', 2],
    ['Swimming Lesson Naked Backstroke', 1],
    ['School Detention', 2],
    ['Avery Office Warming Paperwork 3', 4]
  ] as const)
    locationPassage[passage] = [{ ...large, expected }];

  maplebirch.tool.inject({ widgetPassage, locationPassage });
}
