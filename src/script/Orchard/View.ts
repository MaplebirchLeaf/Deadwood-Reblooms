// ./src/script/Orchard/View.ts

import type Orchard from '../../module/Orchard';
import type { OrchardSite, OrchardTool, OrchardReceipt } from '../../module/Orchard';
import { species, harvestTiers, harvestDays, moistureDays, orchardSites, clearingStepMinutes, offSeasonYieldMultiplier, type OrchardSpecies, type OrchardFruit } from '../../module/Orchard/Species';

const tools: readonly [OrchardTool, string, string][] = [
  ['plant', 'Plant', '播种'],
  ['water', 'Water', '浇水'],
  ['fertiliser', 'Fertilise', '施肥'],
  ['harvest', 'Pick', '采收'],
  ['shovel', 'Shovel', '铲子']
];

const seasons: Record<string, [string, string]> = {
  spring: ['Spring', '春季'],
  summer: ['Summer', '夏季'],
  autumn: ['Autumn', '秋季'],
  winter: ['Winter', '冬季']
};

function fruitName(type: OrchardFruit): string {
  return type === 'blood_lemon' ? lanSwitch('Blood lemon', '血柠') : lanSwitch(species[type].name[0], species[type].name[1]);
}

/** 沿用原版 foodstufficon 的食品图标目录。 */
function fruitImage(type: OrchardFruit): HTMLImageElement {
  const food = setup.foodstuff[type];
  return image(`img/misc/icon/tending/${food.icon}`);
}

/** 图片经框架读取 BSA 资源，成功取得地址后再设置 src，避免显示破图。 */
function image(path: string): HTMLImageElement {
  const element = document.createElement('img');
  element.className = 'icon';
  element.width = element.height = 30;
  element.alt = '';
  element.draggable = false;
  element.setAttribute('aria-hidden', 'true');
  void Promise.resolve()
    .then(() => loadImage(path))
    .then(source => {
      if (typeof source === 'string') element.src = source;
      else console.warn(`果园贴图无法加载：${path}`);
    })
    .catch(error => console.warn(`果园贴图无法加载：${path}`, error));
  return element;
}

export default class OrchardView {
  private readonly grid = document.createElement('div');
  private readonly detail = document.createElement('div');
  private readonly tray = document.createElement('div');
  private readonly supplies = document.createElement('div');
  private readonly summary = document.createElement('div');
  private readonly notice?: OrchardReceipt;
  private get selected(): number {
    return Math.min(this.orchard.state.selected, this.orchard.state[this.site].length - 1);
  }
  private set selected(value: number) {
    this.orchard.state.selected = value;
  }
  private get tool(): OrchardTool {
    return this.orchard.state.tool;
  }
  private set tool(value: OrchardTool) {
    this.orchard.state.tool = value;
  }
  private pending: number | null = null;

  public constructor(
    private readonly orchard: Orchard,
    private readonly site: OrchardSite,
    private readonly root: HTMLElement
  ) {
    this.notice = orchard.notice;
    root.id = 'deadwood-orchard';
    this.grid.className = 'deadwood-orchard-grid';
    this.tray.className = 'deadwood-orchard-tools';
    this.detail.className = 'deadwood-orchard-detail';
    this.detail.setAttribute('aria-live', 'polite');
    const scene = document.createElement('div');
    scene.className = 'deadwood-orchard-scene';
    scene.append(this.grid, this.tray);
    this.supplies.className = 'deadwood-orchard-supplies';
    this.summary.className = 'deadwood-orchard-summary';
    root.append(scene, this.summary, this.detail, this.supplies);
    for (const [tool, en, cn] of tools) {
      let dropped = false;
      const button = this.button(lanSwitch(en, cn), () => {
        if (dropped) {
          dropped = false;
          return;
        }
        this.tool = tool;
        this.pending = null;
        this.render();
      });
      button.dataset.tool = tool;
      const label = document.createElement('span');
      label.textContent = lanSwitch(en, cn);
      button.replaceChildren(this.toolIcon(tool), label);
      button.setAttribute('aria-pressed', String(tool === this.tool));
      this.tray.append(button);
      let ghost: HTMLElement | null = null;
      button.addEventListener('pointerdown', event => {
        if (!this.orchard.canWork) return;
        dropped = false;
        this.tool = tool;
        this.pending = null;
        this.render();
        button.setPointerCapture(event.pointerId);
        ghost = this.toolIcon(tool);
        ghost.id = 'deadwood-orchard-drag';
        document.body.append(ghost);
        ghost.style.left = `${event.clientX - 15}px`;
        ghost.style.top = `${event.clientY - 15}px`;
      });
      button.addEventListener('pointermove', event => {
        if (!ghost) return;
        ghost.style.left = `${event.clientX - 15}px`;
        ghost.style.top = `${event.clientY - 15}px`;
      });
      button.addEventListener('pointerup', event => {
        ghost?.remove();
        ghost = null;
        const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-orchard-tree]');
        if (hit && this.grid.contains(hit)) {
          dropped = true;
          this.apply(Number(hit.dataset.orchardTree));
        }
      });
      button.addEventListener('pointercancel', () => {
        ghost?.remove();
        ghost = null;
      });
      this.orchard.core.once(':passageinit', () => {
        ghost?.remove();
      });
    }
    this.render();
  }

  private button(text: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = text;
    button.addEventListener('click', action);
    return button;
  }

  private link(text: string, action: () => void): HTMLAnchorElement {
    const link = document.createElement('a');
    // 原版内部操作链接不设置 href，避免 SugarCube 将其归为外部链接。
    link.className = 'macro-link link-internal';
    link.textContent = text;
    $(link).ariaClick({ namespace: '.macros', role: 'button' }, action);
    return link;
  }

  private render(): void {
    this.grid.replaceChildren();
    const trees = this.orchard.state[this.site].filter(tree => tree !== null);
    const clearing = this.orchard.state.clearing[this.site];
    const opened = clearing.filter(minutes => minutes === 0).length;
    const ready = trees.filter(tree => this.orchard.ripe(tree)).length;
    const dry = trees.filter(tree => this.orchard.stage(tree) < 2 && tree.moisture === 0).length;
    this.summary.replaceChildren(document.createTextNode(lanSwitch(`There are ${opened} cleared plots here.`, `这里有 ${opened} 块开垦好的土地。`)));
    const status = document.createElement('span');
    if (dry) {
      status.className = 'purple';
      status.textContent = lanSwitch(` ${dry} young ${dry === 1 ? 'tree needs' : 'trees need'} water.`, ` ${dry} 棵幼树需要浇水。`);
    }
    this.summary.append(status);
    if (ready) {
      const fruit = document.createElement('span');
      fruit.className = 'green';
      fruit.textContent = lanSwitch(` ${ready} ${ready === 1 ? 'tree is' : 'trees are'} ready for picking.`, ` ${ready} 棵果树已经可以采收。`);
      this.summary.append(fruit);
    }
    if (!this.orchard.cleared(this.site, this.selected)) this.selected = clearing.findIndex(minutes => minutes === 0);
    const stages = [lanSwitch('Seedling', '幼苗'), lanSwitch('Sapling', '树苗'), lanSwitch('Mature tree', '成树')];
    this.orchard.state[this.site].forEach((tree, index) => {
      if (!this.orchard.cleared(this.site, index)) return;
      const stage = this.orchard.stage(tree);
      const soil = this.orchard.state.soil[this.site][index];
      const label = `${index + 1} · ${tree ? `${lanSwitch(species[tree.species].name[0], species[tree.species].name[1])} · ${stages[stage]}` : lanSwitch('Empty', '空地')}`;
      const button = this.button('', () => this.apply(index));
      button.dataset.orchardTree = String(index);
      button.className = 'deadwood-orchard-plot';
      button.classList.toggle('watered', !!tree?.moisture);
      button.classList.toggle('fertilised', !!tree?.fertiliser || soil.quality > soil.baseQuality);
      button.classList.toggle('ready', this.orchard.ripe(tree));
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(index === this.selected));
      if (tree) {
        const key = (['seedling', 'sapling', 'mature'] as const)[stage];
        button.append(image(species[tree.species].images[key]));
        if (this.orchard.ripe(tree)) {
          const type = tree.fruit.some(crop => crop.type === 'blood_lemon') ? 'blood_lemon' : tree.fruit[0].type;
          const fruit = fruitImage(type);
          fruit.className = 'deadwood-orchard-fruit';
          const count = document.createElement('span');
          count.className = 'deadwood-orchard-count';
          count.textContent = String(tree.fruit.reduce((total, crop) => total + crop.amount, 0));
          count.setAttribute('aria-hidden', 'true');
          button.append(fruit, count);
          button.setAttribute('aria-label', `${label} · ${lanSwitch('Ready to pick', '可以采收')} · ${count.textContent}`);
        }
      }
      this.grid.append(button);
    });
    for (const button of this.tray.querySelectorAll('button')) {
      button.setAttribute('aria-pressed', String(button.dataset.tool === this.tool));
      button.disabled = !this.orchard.canWork;
      if (button.dataset.tool === 'plant' && !this.orchard.varieties.length) button.disabled = true;
      if (button.dataset.tool === 'fertiliser' && V.fertiliser.current < 1) button.disabled = true;
    }
    const tree = this.orchard.state[this.site][this.selected];
    const soil = this.orchard.state.soil[this.site][this.selected];
    this.detail.replaceChildren();
    const label = document.createElement('span');
    label.className = 'gold';
    label.textContent = lanSwitch(`Plot ${this.selected + 1} (`, `第 ${this.selected + 1} 块土地（`);
    const quality = document.createElement('span');
    quality.className = ['blue', 'lblue', 'teal', 'green'][soil.quality - 1];
    quality.textContent = lanSwitch(['Poor soil', 'Decent soil', 'Good soil', 'Excellent soil'][soil.quality - 1], ['贫瘠的土壤', '普通的土壤', '肥沃的土壤', '沃腴的土壤'][soil.quality - 1]);
    label.append(quality, document.createTextNode(lanSwitch('):', '）：')));
    this.detail.append(label, document.createElement('br'));
    if (tree) {
      const stage = this.orchard.stage(tree);
      const status = document.createElement('span');
      status.className = ['blue', 'lblue', 'teal'][stage];
      status.textContent = `${lanSwitch(species[tree.species].name[0], species[tree.species].name[1])} · ${stages[stage]}`;
      this.detail.append(status);
      if (stage < 2) {
        const water = document.createElement('span');
        water.className = tree.moisture > 0 ? 'green' : 'purple';
        water.textContent = tree.moisture > 0 ? lanSwitch(' The soil is watered.', ' 土壤已经浇过水。') : lanSwitch(' The soil is dry.', ' 土壤干燥。');
        this.detail.append(water);
        const progress = document.createElement('progress');
        progress.max = species[tree.species].matureDays;
        progress.value = tree.growth;
        progress.setAttribute('aria-label', lanSwitch('Growth towards maturity', '幼树生长进度'));
        this.detail.append(progress);
      } else {
        const tier = harvestTiers.filter(tier => tree.harvests >= tier.harvests).length - 1;
        this.detail.append(document.createTextNode(` · ${lanSwitch(['Small tree', 'Medium tree', 'Large tree'][tier], ['小果树', '中等果树', '大果树'][tier])}`));
        const totals: Partial<Record<OrchardFruit, number>> = {};
        for (const crop of tree.fruit) totals[crop.type] = (totals[crop.type] ?? 0) + crop.amount;
        const fruit = document.createElement('div');
        for (const [type, amount] of Object.entries(totals)) {
          const item = document.createElement('span');
          item.className = type === 'blood_lemon' ? 'red' : 'green';
          item.append(fruitImage(type as OrchardFruit), document.createTextNode(`${fruitName(type as OrchardFruit)} × ${amount} `));
          fruit.append(item);
        }
        this.detail.append(fruit);
        if (tree.fruit.length === harvestDays) {
          const full = document.createElement('div');
          full.className = 'green';
          full.textContent = lanSwitch('The branches are laden with ripe fruit.', '枝头挂满了成熟的水果。');
          this.detail.append(full);
        }
      }
      if (tree.fertiliser > 0 || soil.quality > soil.baseQuality) {
        const fertilised = document.createElement('div');
        fertilised.className = 'green';
        fertilised.textContent = lanSwitch('The soil has been fertilised.', '土壤已经施过肥。');
        this.detail.append(fertilised);
      }
      if (soil.fertiliserCooldown > 0) {
        const wait = document.createElement('div');
        wait.textContent = lanSwitch(`Wait ${soil.fertiliserCooldown} days before fertilising again.`, `再等 ${soil.fertiliserCooldown} 天才能继续施肥。`);
        this.detail.append(wait);
      }
    } else this.detail.append(document.createTextNode(lanSwitch('The soil is ready for planting.', '土壤已经可以种植。')));
    this.renderSupplies();
    // 当页切换工具仍保留回执，离开页面后随本实例释放。
    if (this.notice) this.receipt(this.notice);
    if (this.pending !== null) {
      const warning = document.createElement('span');
      warning.className = 'red';
      warning.textContent = lanSwitch(' Remove this tree? It cannot be recovered.', ' 铲除这棵树？移除后无法恢复。');
      this.detail.append(
        warning,
        document.createElement('br'),
        this.toolIcon('shovel'),
        this.link(lanSwitch('Confirm removal', '确认铲除'), () => this.perform(this.selected)),
        document.createElement('br'),
        image('img/misc/icon/refuse.png'),
        this.link(lanSwitch('Cancel', '取消'), () => {
          this.pending = null;
          this.render();
        })
      );
    }
  }

  private toolIcon(tool: OrchardTool): HTMLElement {
    const paths = {
      plant: species[this.orchard.state.seed].images.seedling,
      water: 'img/misc/icon/watering-can.gif',
      fertiliser: 'img/misc/icon/fertiliser.png',
      harvest: 'img/misc/icon/orchard-harvest.png',
      shovel: 'img/misc/icon/dig.png'
    };
    return image(paths[tool]);
  }

  private renderSupplies(): void {
    this.supplies.replaceChildren();
    const data = species[this.orchard.state.seed];
    const label = document.createElement('label');
    label.append(document.createTextNode(lanSwitch('Seeds: ', '种子：')));
    const select = document.createElement('select');
    for (const key of this.orchard.varieties) {
      const variety = species[key];
      const option = document.createElement('option');
      option.value = key;
      option.textContent = lanSwitch(variety.name[0], variety.name[1]);
      select.append(option);
    }
    if (!this.orchard.varieties.length) {
      const option = document.createElement('option');
      option.textContent = lanSwitch('No seeds discovered', '尚未发现种子');
      select.append(option);
      select.disabled = true;
    }
    if (this.orchard.varieties.length) select.value = this.orchard.state.seed;
    select.addEventListener('change', () => {
      this.orchard.state.seed = select.value as OrchardSpecies;
      const button = this.tray.querySelector('[data-tool="plant"]')!;
      button.firstElementChild?.replaceWith(this.toolIcon('plant'));
      this.render();
    });
    label.append(select);
    const stock = document.createElement('div');
    stock.textContent = lanSwitch(`You have ${V.fertiliser.current} ${V.fertiliser.current === 1 ? 'bag' : 'bags'} of fertiliser.`, `你有 ${V.fertiliser.current} 袋肥料。`);
    const season = document.createElement('div');
    const offSeasonPercent = Math.round(offSeasonYieldMultiplier * 100);
    season.textContent = `${lanSwitch('Peak season: ', '丰产季节：')}${data.fruitSeasons.map(key => lanSwitch(...seasons[key])).join(' / ')}${lanSwitch(`. Other seasons yield ${offSeasonPercent}% of the normal harvest.`, `。其他季节产量为正常收成的 ${offSeasonPercent}%。`)}`;
    this.supplies.append(label, stock);
    if (this.orchard.varieties.length) this.supplies.append(season);
    else {
      const hint = document.createElement('div');
      hint.textContent = lanSwitch(
        'Look for seeds while gathering fruit. Temple garden work can reveal lime seeds, and the supermarket sells cherry seeds.',
        '采摘水果时可以发现种子。神殿花园工作可发现酸橙种子，超市另售樱桃种子。'
      );
      this.supplies.append(hint);
    }
    const next = this.orchard.state.clearing[this.site].findIndex(minutes => minutes > 0);
    if (next !== -1 && this.orchard.canWork && !(this.site === 'farm' && this.orchard.farmInterrupted)) {
      const minutes = Math.min(clearingStepMinutes, this.orchard.state.clearing[this.site][next]);
      const clearing = document.createElement('div');
      clearing.className = 'deadwood-orchard-clearing';
      clearing.append(
        this.toolIcon('shovel'),
        this.link(lanSwitch(`Clear more land (0:${String(minutes).padStart(2, '0')})`, `继续开垦土地 (0:${String(minutes).padStart(2, '0')})`), () => this.perform(next, 'shovel')),
        this.orchard.core.SugarCube.Wikifier.wikifyEval('<<ggtiredness>>')
      );
      const remaining = this.orchard.state.clearing[this.site][next];
      if (remaining < orchardSites[this.site].clearingMinutes) {
        const progress = document.createElement('progress');
        progress.max = orchardSites[this.site].clearingMinutes;
        progress.value = progress.max - remaining;
        progress.setAttribute('aria-label', lanSwitch('Land clearing progress', '开垦进度'));
        clearing.append(progress);
      }
      this.supplies.append(clearing);
      if (this.site === 'farm' && this.orchard.canAskAlex) {
        const help = document.createElement('div');
        help.append(
          this.toolIcon('shovel'),
          this.link(lanSwitch(`Ask Alex to help clear (0:${String(minutes / 2).padStart(2, '0')})`, `请艾利克斯一起开垦 (0:${String(minutes / 2).padStart(2, '0')})`), () =>
            this.perform(next, 'shovel', true)
          ),
          this.orchard.core.SugarCube.Wikifier.wikifyEval('<<gtiredness>>')
        );
        this.supplies.append(help);
      }
    }
    const tree = this.orchard.state[this.site][this.selected];
    if (this.site === 'farm' && this.orchard.canAskAlex && tree) {
      const help = document.createElement('div');
      if (this.orchard.ripe(tree)) {
        help.append(
          this.toolIcon('harvest'),
          this.link(lanSwitch('Ask Alex to help pick (0:05)', '请艾利克斯一起采果 (0:05)'), () => this.perform(this.selected, 'harvest', true))
        );
      } else if (this.orchard.stage(tree) < 2 && tree.moisture < moistureDays) {
        help.append(
          this.toolIcon('water'),
          this.link(lanSwitch('Ask Alex to help water (0:02:30)', '请艾利克斯一起浇水 (0:02:30)'), () => this.perform(this.selected, 'water', true))
        );
      }
      if (help.firstElementChild) this.supplies.append(help);
    }
  }

  private apply(index: number): void {
    this.selected = index;
    if (this.tool === 'shovel' && this.orchard.state[this.site][index]) {
      this.pending = index;
      this.render();
    } else this.perform(index);
  }

  private perform(index: number, tool = this.tool, helped = false): void {
    const minutes = this.orchard.act(this.site, index, tool, helped);
    this.pending = null;
    if (!minutes) {
      this.render();
      const text = document.createElement('span');
      text.className = 'purple';
      text.textContent = lanSwitch(' You cannot do that here now.', ' 现在无法这样操作。');
      this.detail.append(text);
      return;
    }
    // 操作时间走原版 pass，避免自建时钟漏掉日程、天气和跨日事件。
    const clearing = this.orchard.notice?.clearing !== undefined;
    const pass = Number.isInteger(minutes) ? `<<pass ${minutes}>>` : `<<pass ${Math.round(minutes * 60)} 'sec'>>`;
    this.orchard.core.SugarCube.Wikifier.wikifyEval(
      `${this.site === 'farm' ? `<<farm_count ${minutes}>>` : ''}${clearing ? `<<physique ${minutes / 10}>><<tiredness ${minutes / 10}>>` : '<<tiredness 1>><<tending 1>>'}${pass}`
    );
    if (this.orchard.notice?.clearing === 0) this.selected = index;
    const interrupted = this.site === 'farm' && this.orchard.farmInterrupted;
    if (interrupted) {
      this.orchard.core.SugarCube.Engine.play('Farm Fields');
      return;
    }
    this.orchard.notice ??= { tool };
    this.orchard.core.SugarCube.Engine.play('Deadwood Reblooms Orchard');
  }

  private receipt(receipt: OrchardReceipt): void {
    const { tool } = receipt;
    const result = document.createElement('div');
    const messages = {
      plant: ['You sow the seeds and cover them with soil.', '你播下种子，轻轻覆上一层土。'],
      water: ['Water slowly soaks into the soil around the roots.', '水慢慢渗入树根周围的土壤。'],
      fertiliser: ['You work the fertiliser into the soil.', '你把肥料拌入土里。'],
      harvest: receipt.donated
        ? ['You leave a share of the fruit for the kitchen and put yours away.', '你给厨房留下一份水果，把自己的收成收好。']
        : ['You pick the ripe fruit and put them away.', '你采下成熟的水果，把它们收好。'],
      shovel:
        receipt.clearing === undefined
          ? ['You remove the tree and fill the hole.', '你移除果树，把坑填平。']
          : receipt.clearing === 0
            ? ['You pull out the last roots and level the ground.', '你拔出最后几根草根，把土地整平。']
            : ['You loosen the earth and pull out another tangle of roots.', '你松开泥土，又清出一片纠缠的草根。']
    };
    result.append(document.createTextNode(lanSwitch(...messages[tool])));
    if (receipt.helped) result.append(document.createTextNode(lanSwitch(' Alex works alongside you, then returns to the paperwork.', ' 艾利克斯帮你干完这阵活，随后回去处理账务。')));
    if (receipt.clearing === 0) {
      const ready = document.createElement('span');
      ready.className = 'green';
      ready.textContent = lanSwitch(' This plot is ready for planting.', ' 这里已经可以种树了。');
      result.append(ready);
    }
    result.append(this.orchard.core.SugarCube.Wikifier.wikifyEval(receipt.clearing === undefined ? '<<gtiredness>><<gtending>>' : '<<ggtiredness>>'));
    if (receipt.donated) result.append(this.orchard.core.SugarCube.Wikifier.wikifyEval('<<ggrace monk>>'));
    if (receipt.kept) {
      const kept = document.createElement('div');
      for (const [type, amount] of Object.entries(receipt.kept)) {
        const item = document.createElement('span');
        item.className = type === 'blood_lemon' ? 'red' : 'green';
        item.textContent = `${fruitName(type as OrchardFruit)} × ${amount} `;
        kept.append(item);
      }
      result.append(kept);
    }
    this.detail.append(result);
  }
}
