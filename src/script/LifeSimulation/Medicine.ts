import { MEDICINES } from '../../module/LifeSimulation/Medicine';

export default function Medicine(core: typeof maplebirch): void {
  const medicine = () => core.get('LifeSimulation')!.medicine;
  // 正常推进由时间事件结算，gate 只补结算载入或直接跳时后已经到期的药效。
  core.dynamic.regStateEvent('gate', 'life-simulation-medicine-expiry', {
    cond: () => core.get('LifeSimulation')?.medicine?.expired === true,
    action: () => medicine().tick()
  });
  core.dynamic.regStateEvent('gate', 'life-simulation-medicine-notices', {
    forceExit: false,
    cond: () => V.combat !== 1 && core.get('LifeSimulation')?.medicine?.pending === true,
    output: 'print maplebirch.get("LifeSimulation").medicine.flush()'
  });
  core.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-medicine-shop'], passage: 'Pharmacy' });
  core.dynamic.regStateEvent('gate', 'life-simulation-medicine-sale', {
    forceExit: true,
    cond: () => Boolean(core.get('LifeSimulation')) && MEDICINES.some(item => V.pharmacyItem?.type === `deadwood-${item.id}`),
    output: 'deadwood-medicine-sale',
    extra: { passage: ['Pharmacy Sale'] }
  });
  core.tool.patch.traits.add(
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
  core.tool.inject({
    locationPassage: {
      "Doctor Harper's Office": [
        {
          // 已敲门并载入哈珀，原版诊疗事件尚未开始。中英文共用这个逻辑锚点。
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
