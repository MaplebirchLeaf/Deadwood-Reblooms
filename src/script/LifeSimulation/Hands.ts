// ./src/script/LifeSimulation/Hands.ts

export default function Hands(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.inject({
    widgetPassage: {
      'Widgets variablesStatic': [{ src: '<<set setup.wardrobeSkip to', applybefore: '<<run maplebirch.get("LifeSimulation").hands.setup()>>\n', expected: 1 }],
      'Widgets Clothing': [
        // 损坏主手物品时，只检查该物品，副手鱼竿仍在，不应清除它的鱼饵。
        { src: '<<if $worn.handheld.type.includes("fishing_rod")>>', to: '<<if Array.prototype.includes.call($worn.handheld.type, "fishing_rod")>>', expected: 1 }
      ],
      'Widgets Wardrobe': [
        // 使用一个衣柜标签，两个内部槽仍交给原版存取，避免改写暂存记录。
        { src: '<<set _eIndextemNames to []>>', applybefore: '<<run _equip.push("handheld_left")>>\n', expected: 1 },
        {
          src: '<<elseif $wardrobeOption is "wear">>',
          applyafter: '\n\t\t\t<<if !maplebirch.get("LifeSimulation").hands.prepare(_item, _slot, true)>><<deadwood-hands-duplicate>><<continue>><</if>>',
          expected: 1
        },
        {
          srcmatchgroup: /<<set _wardrobe_list to _args\[0\]>>/g,
          applyafter: '\n\t<<if _wardrobe_list is "handheld">><<deadwood-hands-wardrobe>><</if>>',
          expected: 2
        }
      ],
      // 书包仍遵守原版课堂事件：左手携带不会被误判为忘带，也不会免于损坏。
      'Widgets School Events': [
        { srcmatchgroup: /\$worn\.handheld\.(name|cn_name_cap)\b/g, to: '<<print maplebirch.get("LifeSimulation").hands.item("bookbag").$1>>', expected: 1 },
        { src: '<<handheldruined>>', to: '<<generalRuined `maplebirch.get("LifeSimulation").hands.item("bookbag").slot`>>', expected: 1 }
      ],
      'Ambient Weather And Seasonal Event Widgets': [
        { srcmatchgroup: /\$worn\.handheld\.(name|cn_name_cap)\b/g, to: '<<print maplebirch.get("LifeSimulation").hands.item("rainproof").$1>>', expected: 1 }
      ]
    },
    locationPassage: {
      // 中文原文一处分支遗漏了 $，修正标识符，英文继续使用原判断。
      'Gwylan Walk School Solo': [{ srcmatch: /\$?worn\.handheld\.type\.includes\("bookbag"\)/g, to: '$worn.handheld.type.includes("bookbag")', expected: 2 }],
      // 这里既有裸变量文本，也有 set/if。改物品引用，不接触原版的中英文句子。
      'Gwylan Ocean Breeze': [
        { srcmatch: /\$worn\.handheld/g, to: '_deadwood_bookbag', expected: 12 },
        { src: '<<unset $gwylan_cafe_walk_refused>>', applyafter: '\n<<set _deadwood_bookbag to maplebirch.get("LifeSimulation").hands.item("bookbag") ?? $worn.handheld>>', expected: 1 }
      ],
      'School Passout Gang Rape': [
        { srcmatch: /\$worn\.handheld/g, to: '_deadwood_bookbag', expected: 5 },
        {
          src: '<<if _deadwood_bookbag.type.includes("bookbag")>>',
          applybefore: '<<set _deadwood_bookbag to maplebirch.get("LifeSimulation").hands.item("bookbag") ?? $worn.handheld>>\n',
          expected: 1
        }
      ],
      // 雨伞在任一手都能遮雨，共同撑伞的原版人物对白和天气规则保持原样。
      'Mansion Talk Chat 2': [{ srcmatchgroup: /(<<print )\$worn\.handheld\.(name|cn_name_cap)(>>)/g, to: '$1maplebirch.get("LifeSimulation").hands.item("rainproof").$2$3', expected: 1 }],
      'Robin Walk Home': [{ srcmatchgroup: /\$worn\.handheld\.(name|cn_name_cap)\b/g, to: '<<print maplebirch.get("LifeSimulation").hands.item("rainproof").$1>>', expected: 2 }]
    }
  });

  // 副手伞沿用原版遮罩，头发与头饰都需要接收，浮动 PC 模型也保持一致。
  const secondary_mask = (options: CanvasModelOptionsData) => {
    const item = options.worn?.handheld_left;
    if (maplebirch.get('LifeSimulation') && item?.index > 0 && item.setup?.mask_img === 1) return `img/clothes/handheld/${item.setup.variable}/mask.png`;
  };
  maplebirch.char.use(
    'pre',
    options => {
      const mask = secondary_mask(options);
      if (mask && !options.headMask.includes(mask)) options.headMask.push(mask);
    },
    ['main', maplebirch.char.pet.modelName]
  );
  maplebirch.tool.onInit(() => {
    const layers = window.Renderer.CanvasModels.main.layers;
    maplebirch.char.use(
      Object.fromEntries(
        ['head', 'head_acc', 'head_detail', 'head_back', 'head_back_acc'].map(name => {
          const original = layers[name].masksrcfn;
          return [
            name,
            {
              masksrcfn(this: LayerConfig, options: CanvasModelOptionsData) {
                const source = original?.call(this, options);
                const mask = secondary_mask(options);
                if (!mask || options.worn.over_upper.setup.name === 'kaiju costume') return source;
                const masks = Array.isArray(source) ? source : source ? [source] : [];
                return masks.includes(mask) ? masks : [...masks, mask];
              }
            }
          ];
        })
      ),
      'main',
      { pet: true }
    );
  });

  // 复用原版持物的全部图层，坐标、姿势、左右素材和遮挡规则交给原版。
  const sources = ['right', 'right_acc', 'right_detail', 'left', 'left_acc', 'left_detail', 'back', 'back_acc'];
  maplebirch.char.use(
    Object.fromEntries(
      sources.map(source => {
        const evaluate = (field: string, receiver: any, options: any, fallback: unknown) => {
          const item = options.worn?.handheld_left;
          if (!item?.index) return fallback;
          const native = receiver.model?.layers[`handheld_${source}`];
          if (!native) return fallback;
          const view = {
            ...options,
            handheld_animation: item.setup.name === 'heart hand warmer' ? 'handWarmer' : 'idle',
            worn: { ...options.worn, handheld: item }
          };
          return typeof native[`${field}fn`] === 'function' ? native[`${field}fn`].call(native, view) : (native[field] ?? fallback);
        };
        return [
          `handheld_secondary_${source}`,
          {
            showfn(this: any, options: any): boolean {
              return !!maplebirch.get('LifeSimulation') && !!evaluate('show', this, options, false);
            },
            srcfn(options: any) {
              return evaluate('src', this, options, '');
            },
            zfn(options: any) {
              return Number(evaluate('z', this, options, maplebirch.char.ZIndices.handheld));
            },
            alphafn(options: any) {
              return evaluate('alpha', this, options, 1);
            },
            animationfn(options: any) {
              return evaluate('animation', this, options, 'idle');
            },
            masksrcfn(options: any) {
              return evaluate('masksrc', this, options, undefined);
            },
            filtersfn(options: any) {
              return (evaluate('filters', this, options, []) as string[]).map(filter => filter.replace('worn_handheld', 'worn_handheld_left'));
            },
            wornfn(options: any) {
              return evaluate('worn', this, options, undefined) as CanvasLayerWorn | undefined;
            }
          }
        ];
      })
    ),
    'main',
    { pet: true }
  );

  maplebirch.dynamic.regStateEvent('gate', 'deadwood-hand-capabilities', {
    cond: () => !!V.worn?.handheld && !!V.worn.handheld_left,
    action: () => maplebirch.get('LifeSimulation')?.hands.refresh()
  });
  maplebirch.dynamic.regTimeEvent('onBefore', ':deadwood-hand-capabilities', {
    action: () => maplebirch.get('LifeSimulation')?.hands.refresh()
  });

  // 保留原版宏的上下文，装备前检查，变更后才刷新功能标签。
  for (const name of ['generalWear', 'equipClothesItemFromDefault', 'generalWearFromWardrobe', 'generalOn', 'generalStoreon']) {
    maplebirch.tool.macro.wrap(name, function (next) {
      const hands = maplebirch.get('LifeSimulation')?.hands;
      let slot = this.args[0];
      let item: Record<string, any> | undefined;
      if (name === 'generalWear' || name === 'equipClothesItemFromDefault') {
        item = typeof this.args[1] === 'string' ? setup.clothes[slot]?.find((held: any) => held.name === this.args[1]) : setup.clothes[slot]?.[this.args[1]];
      } else if (name === 'generalWearFromWardrobe') item = (window as typeof window & { selectWardrobe(): Record<string, any> }).selectWardrobe()[slot]?.[this.args[1]];
      else if (name === 'generalOn') item = V.carried[slot];
      else {
        slot = this.args[1];
        const option = this.args[2];
        if (!['wardrobe', 'delete', 'return', 'check'].includes(option) && !V.wardrobes[option] && T.equipSkip?.[slot] !== true) {
          item = V.store[slot]?.find((held: any) => held.location === this.args[0]);
        }
      }
      if (item && hands && !hands.prepare(item, slot)) {
        new maplebirch.SugarCube.Wikifier(this.output, '<<deadwood-hands-duplicate>>');
        return;
      }
      const result = next();
      if (['handheld', 'handheld_left'].includes(slot)) hands?.refresh();
      return result;
    });
  }

  for (const [name, slotArg] of [
    ['generalStrip', 0],
    ['generalUndress', 1]
  ] as const) {
    maplebirch.tool.macro.wrap(name, function (next) {
      const result = next();
      if (['handheld', 'handheld_left'].includes(this.args[slotArg])) maplebirch.get('LifeSimulation')?.hands.refresh();
      return result;
    });
  }

  maplebirch.tool.macro.wrap('generalRuined', function (next) {
    const slot = this.args[0];
    const rod = ['handheld', 'handheld_left'].includes(slot) && Array.prototype.includes.call(V.worn[slot]?.type ?? [], 'fishing_rod');
    const result = next();
    if (rod && V.worn[slot]?.name === 'naked') delete V.fishing.currentBait;
    return result;
  });

  // 快捷宏扩展两个槽，刷新由它们调用的通用宏负责，storeon 无需再次包装。
  for (const name of ['handheldstrip', 'handheldundress', 'handheldon', 'storeonhandheld']) {
    maplebirch.tool.macro.wrap(name, function (next) {
      const result = next();
      if (!maplebirch.get('LifeSimulation')) return result;
      const args = this.args.map((value: unknown) => JSON.stringify(value) ?? 'undefined');
      let code: string;
      switch (name) {
        case 'handheldstrip':
          code = '<<generalStrip "handheld_left">>';
          break;
        case 'handheldon':
          code = '<<generalOn "handheld_left">>';
          break;
        case 'handheldundress':
          code = `<<generalUndress ${args[0]} "handheld_left">>`;
          break;
        default:
          code = `<<generalStoreon ${args[0]} "handheld_left" ${args[1] ?? 'undefined'}>>`;
      }
      new maplebirch.SugarCube.Wikifier(this.output, code);
      return result;
    });
  }

  for (const name of ['wardrobeList', 'oldWardrobeList']) {
    maplebirch.tool.macro.wrap(name, function (next) {
      const result = next();
      if (this.args[0] === 'handheld' && maplebirch.get('LifeSimulation')) new maplebirch.SugarCube.Wikifier(this.output, '<<deadwood-hands-stock>>');
      return result;
    });
  }
  maplebirch.tool.macro.wrap('wardrobewear', function (next) {
    const result = next();
    V.wear_handheld_left = 'none';
    maplebirch.get('LifeSimulation')?.hands.refresh();
    return result;
  });

  maplebirch.tool.macro.wrap('tryOnReset', function (next) {
    const result = next();
    maplebirch.get('LifeSimulation')?.hands.snapshot();
    return result;
  });
  maplebirch.tool.macro.wrap('buyTryOnClothes', function (next) {
    maplebirch.get('LifeSimulation')?.hands.snapshot();
    return next();
  });
}
