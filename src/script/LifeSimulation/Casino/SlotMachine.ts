// ./src/script/LifeSimulation/Casino/SlotMachine.ts

import { slotSymbols } from '../../../module/LifeSimulation/Casino/SlotMachine';

export default function SlotMachine(core: typeof maplebirch): void {
  core.tool.inject({
    locationPassage: {
      Arcade: [{ src: '<<set _kylarLocation to getKylarLocation()>>', applybefore: '<<deadwood-slot-entry>>\n\t\t', expected: 1 }]
    }
  });

  core.tool.macro.defineS('deadwood-slot-machine', () => {
    const slots = core.get('LifeSimulation')?.casino.slots;
    if (!slots) return;
    const currentPassage = core.passage.title;
    const root = document.createElement('div');
    root.id = 'deadwood-slot-machine';
    const reels = document.createElement('div');
    reels.className = 'slot-reels';
    reels.setAttribute('aria-hidden', 'true');
    const result = document.createElement('p');
    result.className = 'slot-result';
    result.setAttribute('role', 'status');
    const spin = document.createElement('button');
    spin.type = 'button';
    spin.textContent = lanSwitch('Insert £5 and spin (0:01)', '投入 £5 并转动 (0:01)');
    spin.addEventListener('click', () => {
      if (spin.disabled || !slots.canPlay) return;
      spin.disabled = true;
      core.SugarCube.Wikifier.wikifyEval('<<deadwood-slot-spin>>');
      // 时间事件若已带走玩家，不把强制事件覆盖成机台页面。
      if (core.passage.title === currentPassage) core.SugarCube.Engine.play(currentPassage);
    });
    const animate = slots.animateNext && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    slots.animateNext = false;
    root.append(reels, result, spin);
    spin.className = 'slot-spin';
    spin.disabled = true;
    const images = Promise.all([...slotSymbols.map(symbol => `img/misc/icon/casino/slots/${symbol.image}.png`), 'img/misc/icon/casino/slots/panel.png'].map(path => loadImage(path)));

    const startAnimations: (() => Animation)[] = [];
    slots.state.reels.forEach((index, axis) => {
      const reel = document.createElement('div');
      reel.className = 'slot-reel';
      const strip = document.createElement('div');
      const sequence = animate ? [...Array.from({ length: 12 }, (_, n) => (n + axis) % slotSymbols.length), index] : [index];
      for (const symbol of sequence) {
        const cell = document.createElement('span');
        const icon = document.createElement('img');
        icon.width = icon.height = 30;
        icon.alt = lanSwitch(...slotSymbols[symbol].name);
        icon.draggable = false;
        icon.dataset.symbol = String(symbol);
        cell.append(icon);
        strip.append(cell);
      }
      reel.append(strip);
      reels.append(reel);
      if (animate) {
        strip.style.transform = 'translateY(-528px)';
        startAnimations.push(() => strip.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-528px)' }], { duration: 650 + axis * 350, easing: 'cubic-bezier(.15,.65,.25,1)' }));
      }
    });
    const showResult = () => {
      result.replaceChildren(core.SugarCube.Wikifier.wikifyEval('<<deadwood-slot-result>>'));
      spin.disabled = !slots.canPlay;
    };
    result.textContent = lanSwitch('The three reels wait behind the glass.', '三条转轮静静地停在玻璃后。');
    void images
      .then(sources => {
        for (const icon of reels.querySelectorAll<HTMLImageElement>('img')) {
          const source = sources[Number(icon.dataset.symbol)];
          if (typeof source !== 'string') throw new Error('Slot symbol image is unavailable.');
          icon.src = source;
        }
        const panel = sources[slotSymbols.length];
        if (typeof panel === 'string') reels.style.backgroundImage = `url("${panel}")`;
        if (!animate) return showResult();
        result.textContent = lanSwitch('The reels are turning…', '转轮正在转动……');
        // 节点插入并取得贴图后再启动，避免未插入的动画提前结束。
        requestAnimationFrame(() => {
          if (!root.isConnected) return;
          void Promise.all(startAnimations.map(start => start().finished.catch(() => undefined))).then(() => {
            if (root.isConnected) showResult();
          });
        });
      })
      .catch(error => {
        console.warn('Slot machine images could not be loaded:', error);
        showResult();
      });
    return root;
  });
}
