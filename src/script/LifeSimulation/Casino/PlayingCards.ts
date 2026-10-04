// ./src/script/LifeSimulation/Casino/PlayingCards.ts

import type { PlayingCard } from '../../../module/LifeSimulation/Casino/Blackjack';

const suits: Record<string, string> = { Hearts: '红心', Diamonds: '方块', Spades: '黑桃', Clubs: '梅花' };

/** 两种牌桌共用原生牌面、替代文本与贴图加载。 */
export function cardImage(card: PlayingCard | null, hidden: boolean) {
  const image = document.createElement('img');
  image.width = 40;
  image.height = 56;
  image.draggable = false;
  const face = card && !hidden;
  image.alt = face ? lanSwitch(`${card.name} of ${card.suits}`, `${suits[card.suits] ?? card.suits}${card.name}`) : lanSwitch('Face-down card', '背面朝上的牌');
  const file = face ? `${card.suits.toLowerCase()}-${card.name.toLowerCase()}` : 'back';
  const ready = Promise.resolve(loadImage(`img/misc/icon/blackjack/${file}.png`)).then(source => {
    if (typeof source !== 'string') throw new Error(`Card image missing: ${file}`);
    image.src = source;
  });
  return { image, ready };
}

/** 顺序等待贴图、入场帧和动画；离开页面时允许动画取消，始终恢复操作。 */
export async function cardReady(controls: HTMLElement, loads: readonly Promise<unknown>[], animate?: () => Animation[]): Promise<void> {
  controls.inert = true;
  try {
    await Promise.all(loads);
    if (!animate || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    if (!controls.isConnected) return;
    await Promise.allSettled(animate().map(animation => animation.finished));
  } catch (error) {
    console.warn('Card images or animation could not be prepared:', error);
  } finally {
    controls.inert = false;
  }
}
