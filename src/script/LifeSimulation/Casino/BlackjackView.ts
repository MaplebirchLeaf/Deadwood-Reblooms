// ./src/script/LifeSimulation/Casino/BlackjackView.ts

import { cardImage, cardReady } from './PlayingCards';
import type Blackjack from '../../../module/LifeSimulation/Casino/Blackjack';
import { blackjackPassage, blackjackScore, type PlayingCard } from '../../../module/LifeSimulation/Casino/Blackjack';

const names: Record<string, string> = { Robin: '罗宾', Whitney: '惠特尼', Kylar: '凯拉尔', Sydney: '悉尼' };
type Seat = 'player' | 'dealer' | 'partner';

/** Twee 负责提示与选项；这里只处理牌面、动画和防止重复操作。 */
export default class BlackjackView {
  public readonly root = document.createElement('div');
  private readonly controls = document.createElement('div');
  private readonly loads: Promise<unknown>[] = [];
  private readonly animated: { image: HTMLImageElement; delay: number; reveal: boolean }[] = [];

  public constructor(
    private readonly core: typeof maplebirch,
    private readonly game: Blackjack
  ) {
    this.root.id = 'deadwood-blackjack';
    const table = document.createElement('div');
    table.className = 'blackjack-table';
    const state = game.state;
    const animation = game.animation;
    game.animation = null;
    const opponent = state.venue === 'home' && state.companion ? lanSwitch(state.companion, names[state.companion] ?? state.companion) : lanSwitch('Dealer', '庄家');
    table.append(this.hand('dealer', opponent, state.dealer, state.phase === 'player', animation));
    if (state.partner) table.append(this.hand('partner', lanSwitch(state.partner, names[state.partner] ?? state.partner), state.partner_cards, state.phase === 'player', animation));
    table.append(this.hand('player', lanSwitch('Your hand', '你的牌'), state.player, false, animation));
    this.root.append(table, this.core.SugarCube.Wikifier.wikifyEval('<<deadwood-blackjack-status>>'));
    this.controls.className = 'blackjack-controls';
    this.controls.append(this.core.SugarCube.Wikifier.wikifyEval('<<deadwood-blackjack-controls>>'));
    this.root.append(this.controls);
    for (const button of this.controls.querySelectorAll<HTMLButtonElement>('button[data-action]')) {
      button.disabled = button.dataset.disabled === 'true';
      button.addEventListener('click', () => {
        if (button.disabled || this.controls.inert) return;
        this.controls.inert = true;
        const action = button.dataset.action!;
        const macro = ['start', 'hit', 'stand'].includes(action) ? 'deadwood-blackjack-action' : 'deadwood-blackjack-choice';
        this.core.SugarCube.Wikifier.wikifyEval(`<<${macro} '${action}' ${JSON.stringify(button.dataset.value ?? '')}>>`);
        if (this.core.passage.title === blackjackPassage) this.core.SugarCube.Engine.play(blackjackPassage);
      });
    }
    void cardReady(
      this.controls,
      this.loads,
      animation
        ? () =>
            this.animated.map(({ image, delay, reveal }) =>
              image.animate(
                reveal
                  ? [
                      { transform: 'rotateY(90deg)', opacity: 0.3 },
                      { transform: 'rotateY(0)', opacity: 1 }
                    ]
                  : [
                      { transform: 'translateY(-10px)', opacity: 0 },
                      { transform: 'translateY(0)', opacity: 1 }
                    ],
                { duration: 240, delay, fill: 'backwards', easing: 'ease-out' }
              )
            )
        : undefined
    );
  }

  private hand(seat: Seat, label: string, cards: PlayingCard[], hidden: boolean, animation: Blackjack['animation']): HTMLElement {
    const row = document.createElement('div');
    row.className = 'blackjack-hand';
    const heading = document.createElement('div');
    heading.className = 'blackjack-heading';
    if (this.game.state.match_lost_seats.includes(seat)) {
      heading.textContent = `${label} — ${lanSwitch('Out of the game', '已出局')}`;
      row.append(heading);
      return row;
    }
    const score = document.createElement('span');
    score.className = 'blackjack-score';
    score.textContent = cards.length === 0 ? '' : hidden ? '?' : String(blackjackScore(cards));
    if (!hidden && Number(score.textContent) > 21) score.classList.add('red');
    heading.append(`${label} `, score);
    const fan = document.createElement('div');
    fan.className = 'blackjack-cards';
    row.append(heading, fan);
    const displayed: (PlayingCard | null)[] = cards.length ? cards : [null, null];
    displayed.forEach((card, index) => {
      const { image, ready } = cardImage(card, hidden && index === 1);
      this.loads.push(ready);
      fan.append(image);
      if (animation === 'deal' || (animation === 'hit' && seat === 'player' && index === displayed.length - 1) || (animation === 'reveal' && seat !== 'player' && index > 0)) {
        this.animated.push({ image, delay: animation === 'deal' ? (index * 2 + (seat !== 'player' ? 1 : 0)) * 80 : index * 60, reveal: animation === 'reveal' && index === 1 });
      }
    });
    return row;
  }
}
