// ./src/script/LifeSimulation/Medicine.ts

import { MEDICINES } from '../../module/LifeSimulation/Medicine';

export default function Medicine(maplebirch: typeof window.maplebirch): void {
  const medicine = () => maplebirch.get('LifeSimulation')!.medicine;

  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-medicine-shop'], passage: 'Pharmacy' });

  maplebirch.tool.patch.traits.add(
    ...MEDICINES.flatMap(item => [
      {
        title: 'Medicinal Traits',
        name: () => medicine().name(item.id),
        colour: 'green',
        has: () => medicine().active(item.id),
        text: () => `${lanSwitch('You have taken ', '你已经服用了')}${medicine().name(item.id)}${lanSwitch('. ', '。')}${lanSwitch(item.description[0], item.description[1])}`
      },
      {
        title: 'Medicinal Traits',
        name: () => lanSwitch(`${medicine().name(item.id)} dependence`, `${medicine().name(item.id)}依赖`),
        colour: 'purple',
        has: () => medicine().level(item.id) > 0,
        text: () => {
          const level = medicine().level(item.id);
          if (level === 1) return lanSwitch('You are beginning to rely on these tablets. Going without can leave you uneasy.', '你开始依赖这些药片，停用后可能感到不安。');
          return level === 2
            ? lanSwitch('You have become accustomed to these tablets. Some effects have weakened, and going without leaves you uneasy.', '你已经习惯了这些药片，部分药效有所减弱，停用后会感到不安。')
            : lanSwitch(
                'You find it difficult to go without these tablets. Some effects have weakened, and the dependence takes longer to subside.',
                '你很难不依靠这些药片，部分药效有所减弱，依赖需要更长时间才能消退。'
              );
        }
      }
    ])
  );
  maplebirch.tool.inject({
    locationPassage: {
      "Doctor Harper's Office": [
        // 已敲门并载入哈珀，原版诊疗事件尚未开始。中英文共用这个逻辑锚点。
        {
          src: '<<if !$harper_appointments.hypnosis_intro>>',
          applybefore: '<<deadwood-medicine-review>>\n\n',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      Widgets: [
        {
          src: '<<set $_gain to _args[1] || 1>>',
          applyafter: '\n\t\t<<if $_gain gt 0 and maplebirch.get("LifeSimulation")>><<set $_gain *= maplebirch.get("LifeSimulation").medicine.focus>><</if>>',
          expected: 1
        }
      ],
      'Widgets Sleep': [
        {
          src: '<<if !($sleeptrouble is 1 and $controlled is 0 and !$hypnosis_traits.slumber)>>',
          to: '<<if !($sleeptrouble is 1 and $controlled is 0 and !$hypnosis_traits.slumber) or (maplebirch.get("LifeSimulation") and maplebirch.get("LifeSimulation").medicine.sleepy)>>',
          expected: 1
        }
      ]
    }
  });
}
