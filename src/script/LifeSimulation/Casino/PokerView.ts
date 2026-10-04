// ./src/script/LifeSimulation/Casino/PokerView.ts

import { cardImage, cardReady } from './PlayingCards';
import type Holdem from '../../../module/LifeSimulation/Casino/Holdem';
import type ThreeCard from '../../../module/LifeSimulation/Casino/ThreeCard';
import type { PlayingCard } from '../../../module/LifeSimulation/Casino/Blackjack';
import { casinoPassage } from '../../../module/LifeSimulation/Casino';

const holdemPassage = 'Deadwood Reblooms Life Simulation Holdem';
const threeCardPassage = 'Deadwood Reblooms Life Simulation Three Card';

/** Twee 负责桌面、文案与选项；这里只加载牌面、处理加注输入及动画。 */
class TableView {
  public readonly root = document.createElement('div');
  private readonly loads: Promise<unknown>[] = [];
  private readonly images: HTMLImageElement[] = [];

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly mode: 'holdem' | 'three',
    game: Holdem | ThreeCard
  ) {
    this.root.id = mode === 'holdem' ? 'deadwood-holdem' : 'deadwood-three-card';
    this.root.append(core.SugarCube.Wikifier.wikifyEval(`<<deadwood-poker-${mode}-view>>`));
    for (const spot of this.root.querySelectorAll<HTMLElement>('[data-cards]')) {
      const cards = spot.dataset.cards === 'board' ? (game as Holdem).state.board : (game.state.seats[Number(spot.dataset.cards)]?.cards ?? []);
      this.cards(spot, cards, spot.dataset.visible === 'true', Number(spot.dataset.placeholders ?? 0));
    }
    for (const input of this.root.querySelectorAll<HTMLInputElement>('input[data-disabled]')) input.disabled = input.dataset.disabled === 'true';
    for (const button of this.root.querySelectorAll<HTMLButtonElement>('button[data-action]')) {
      button.disabled = button.dataset.disabled === 'true';
      button.addEventListener('click', () => {
        if (button.disabled || this.root.inert) return;
        let amount = Number(button.dataset.amount ?? 0);
        if (mode === 'holdem' && button.dataset.action === 'raise') {
          const input = this.root.querySelector<HTMLInputElement>('.poker-raise input')!;
          if (!input.reportValidity()) return;
          amount = Math.round(Number(input.value) * 100);
        }
        this.act(button.dataset.action!, amount);
      });
    }
  }

  private act(action: string, amount: number): void {
    if (this.root.inert) return;
    this.root.inert = true;
    this.core.SugarCube.Wikifier.wikifyEval(`<<deadwood-casino-table-action '${this.mode}' '${action}' ${amount}>>`);
    const passage = this.mode === 'holdem' ? holdemPassage : threeCardPassage;
    if (this.core.passage.title === passage) this.core.SugarCube.Engine.play(action === 'cashout' ? casinoPassage : passage);
  }

  private cards(parent: HTMLElement, cards: readonly PlayingCard[], visible: boolean, placeholders = 0): void {
    const displayed: (PlayingCard | null)[] = cards.length ? [...cards] : Array.from({ length: placeholders }, () => null);
    for (const card of displayed) {
      const { image, ready } = cardImage(card, !visible);
      this.loads.push(ready);
      parent.append(image);
      this.images.push(image);
    }
  }

  public ready(animate: boolean): HTMLElement {
    void cardReady(
      this.root,
      this.loads,
      animate
        ? () =>
            this.images.map((image, i) =>
              image.animate(
                [
                  { opacity: 0, transform: 'translateY(-6px)' },
                  { opacity: 1, transform: 'translateY(0)' }
                ],
                { duration: 180, delay: i * 25 }
              )
            )
        : undefined
    );
    return this.root;
  }
}

export function holdemView(core: typeof maplebirch, game: Holdem): HTMLElement {
  return new TableView(core, 'holdem', game).ready(game.active);
}

export function threeCardView(core: typeof maplebirch, game: ThreeCard): HTMLElement {
  return new TableView(core, 'three', game).ready(game.state.phase === 'player');
}
