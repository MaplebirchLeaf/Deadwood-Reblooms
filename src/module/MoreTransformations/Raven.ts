// ./src/module/MoreTransformations/Raven.ts

import message from '@/assets/transformations/raven.yaml';
import Transformation, { type TransformationOption } from './Transformation';
import type { MaplebirchCore } from '@scml-dol-maplebirch/types';

const WINGS = [
  { type: 'demon', id: 'demonraven', slot: 'demon_wings_type', label: ['Demon raven wings:', '恶魔渡鸦羽翼：'] },
  { type: 'angel', id: 'angelraven', slot: 'angel_wings_type', label: ['Angel raven wings:', '天使渡鸦羽翼：'] },
  { type: 'fallenAngel', id: 'fallenraven', slot: 'fallen_wings_type', label: ['Fallen angel raven wings:', '堕天使渡鸦羽翼：'] }
] as const;

class Raven extends Transformation {
  constructor() {
    super(
      'raven',
      'physical',
      {
        parts: [
          { name: 'eyes', tfRequired: 2, label: () => lanSwitch('Eyes', '眼睛') },
          { name: 'plumage', tfRequired: 4, label: () => lanSwitch('Plumage', '覆羽') },
          { name: 'tail', tfRequired: 4, label: () => lanSwitch('Tail', '尾羽') },
          { name: 'wings', tfRequired: 6, label: () => lanSwitch('Wings', '羽翼') }
        ],

        traits: [
          { name: 'sharpEyes', tfRequired: 2 },
          { name: 'ravenFeathers', tfRequired: 4 }
        ],

        message: maplebirch.yaml.load(message) as TransformationOption['message'],

        decayConditions: [() => V.maplebirch.transformation.raven.build >= 1, () => V.worn.neck.name !== 'raven feather necklace'],

        suppressConditions: [sourceName => sourceName !== 'raven', () => V.worn.neck.name !== 'raven feather necklace'],

        chimeras: WINGS.map(({ type, id, label: [en, cn] }) => ({ name: id, part: 'wings', sources: ['raven', type], label: () => lanSwitch(en, cn) })),

        pre: Raven.pre,

        layers: () =>
          Raven.layers('main', {
            bird_eyes: 'eyes',
            bird_plumage: 'plumage',
            bird_tail: 'tail',
            bird_wings_left: 'wings',
            bird_wings_right: 'wings'
          }),

        translations: {
          raven: { EN: 'Raven', CN: '渡鸦' }
        }
      },
      {
        pre: Raven.pre,
        layers: () =>
          Raven.layers('combatMainPc', {
            birdEyes: 'eyes',
            birdPlumage: 'plumage',
            birdTailBack: 'tail',
            birdTailFront: 'tail',
            birdWingsBack: 'wings',
            birdWingsFront: 'wings'
          })
      }
    );
  }

  /** 每帧判断融合，只改绘制选项，保留镜子里实际选择的部件。 */
  private static pre(options: CanvasModelOptionsData): void {
    options.raven_wings = '';
    if (options.hide_all || options.show_tf === false || options.transformations?.raven?.wings?.show === false) return;
    const parts = V.transformationParts;
    const blend = WINGS.find(({ type, id, slot }) => {
      if (![parts?.raven?.wings, parts?.[type]?.wings].every(part => typeof part === 'string' && isPartEnabled(part)) || !isChimeraEnabled(id, 'wings')) return false;
      const wings = options.transformations?.[type]?.wings;
      return wings ? wings.show === true && wings.type === type : options[slot] === parts[type].wings;
    });
    if (!blend) return;
    options.raven_wings = blend.type === 'fallenAngel' ? (parts.fallenAngel.wings.includes('fallenplus') ? 'fallenplus' : 'fallen') : blend.type;
    const wings = options.transformations?.[blend.type]?.wings;
    // 融合贴图已经包含神性羽根，只隐藏原翼，光环仍沿用所选转化。
    if (wings) wings.show = false;
    else options[blend.slot] = 'hidden';
  }

  /** 为原版图层提供局部鸟类参数，贴图使用自建渡鸦资源。 */
  private static options(options: CanvasModelOptionsData, part: string): CanvasModelOptionsData {
    const style = V.transformationParts?.raven?.[part] ?? 'disabled';
    const raven = options.transformations?.raven?.[part];
    const fusion = part === 'wings' && isPartEnabled(style) ? options.raven_wings : '';
    return {
      ...options,
      [`bird_${part}_type`]: fusion ? `default-${fusion}` : style,
      bird_wing_left: options.bird_wing_left ?? 'idle',
      bird_wing_right: options.bird_wing_right ?? 'idle',
      bird_wings_layer: V.tfwingslayer ?? 'back',
      bird_tail_layer: V.taillayer ?? 'back',
      demon_tail_state: part === 'tail' ? 'idle' : options.demon_tail_state,
      transformations: {
        ...options.transformations,
        bird: {
          ...options.transformations?.bird,
          [part]: {
            ...options.transformations?.bird?.[part],
            ...raven,
            type: 'bird',
            state: part === 'tail' ? 'default' : (raven?.state ?? 'default'),
            style: fusion || 'default',
            inFront: raven?.inFront ?? fusion === 'demon',
            show: isPartEnabled(style) && raven?.show !== false
          }
        }
      }
    };
  }

  private static layer(original: LayerConfig, part: string): LayerConfig {
    const shadow = (options: CanvasModelOptionsData) => Raven.options(options, part);
    const layer: LayerConfig = {
      ...original,
      filters: [],
      showfn: options => !options.hide_all && !!original.showfn?.(shadow(options)),
      srcfn: options => {
        const source = original.srcfn?.call(original, shadow(options)) ?? original.src;
        return typeof source === 'string' ? source.replace('/transformations/bird/', '/transformations/raven/') : source;
      }
    };
    for (const key of ['zfn', 'masksrcfn', 'animationfn'] as const) {
      const fn = original[key];
      if (fn) layer[key] = options => fn.call(original, shadow(options));
    }
    // 原版尾羽生成器读取其他动物的恶魔混合尾，鸦尾保持自己的形态。
    if (part === 'tail' && original.srcfn && !original.animationfn) layer.srcfn = () => 'img/transformations/raven/tail-idle/default.png';
    return layer;
  }

  private static layers(model: 'main' | 'combatMainPc', parts: Record<string, string>): CanvasLayerMap {
    const layers: CanvasLayerMap = {};
    for (const [name, part] of Object.entries(parts)) layers[`raven_${name}`] = Raven.layer(window.Renderer.CanvasModels[model].layers[name], part);
    return layers;
  }

  private get flock() {
    return V.MoreTransformations.raven;
  }

  public get met(): boolean {
    return this.flock.met;
  }

  /** 与原版森林安全事件共用地点，追猎期间不提供停留互动。 */
  public get available(): boolean {
    return V.location === 'forest' && V.combat !== 1 && !V.possessed && V.foresthunt < 1 && Time.dayState !== 'night' && !Weather.bloodMoon;
  }

  public get food(): string | undefined {
    return ['blackberry', 'strawberry', 'apple'].find(key => (V.foodstuff?.[key]?.amount ?? 0) > 0);
  }

  public get canFeed(): boolean {
    return this.available && this.flock.fed !== Time.days && this.food !== undefined && !window.pcAreArmsBound('both');
  }

  public get canCall(): boolean {
    return this.available && this.met && this.flock.called !== Time.days && !V.daily.no_sing && !V.worn.face.type.includes('gag');
  }

  public get canPreen(): boolean {
    const feathers = V.transformationParts?.raven?.plumage;
    return this.available && this.met && this.flock.preened !== Time.days && typeof feathers === 'string' && isPartEnabled(feathers) && !window.pcAreArmsBound('both');
  }

  /** 奖励只在玩家选择动作时结算，正文重绘与读档不会重复增加点数。 */
  public act(action: 'visit' | 'follow' | 'feed' | 'call' | 'preen'): boolean {
    if (!this.available) return false;
    let gain = 0;
    let minutes = 5;
    switch (action) {
      case 'visit':
        if (!this.met) return false;
        break;
      case 'follow':
        if (this.met) return false;
        gain = 5;
        minutes = 15;
        V.forest = Math.min(100, V.forest + 10);
        break;
      case 'feed': {
        if (!this.canFeed) return false;
        const food = this.food!;
        V.foodstuff[food].amount--;
        gain = this.met ? 2 : 5;
        this.flock.fed = Time.days;
        break;
      }
      case 'call':
        if (!this.canCall) return false;
        gain = 1;
        minutes = 10;
        this.flock.called = Time.days;
        break;
      case 'preen':
        if (!this.canPreen) return false;
        gain = 1;
        minutes = 10;
        this.flock.preened = Time.days;
        break;
    }
    this.flock.met = true;
    this.flock.action = action;
    // 使用原版宏，使转化压制、时间事件和森林追猎计时继续正常结算。
    maplebirch.SugarCube.Wikifier.wikifyEval(`<<transform 'raven' ${gain}>><<pass ${minutes}>>${action === 'preen' ? '<<stress -3>>' : action === 'call' ? '<<tiredness 1>>' : ''}`);
    return true;
  }

  /** 只供已核对的击打结算使用，不修改通用 pain 或 violence 宏。 */
  public get armour(): number {
    const feathers = V.transformationParts?.traits?.ravenFeathers;
    return V.combat === 1 && typeof feathers === 'string' && isPartEnabled(feathers) ? 0.85 : 1;
  }

  public get speech(): number {
    return V.combat === 1 && (V.maplebirch?.transformation?.raven?.level ?? 0) >= 6 ? 1.25 : 1;
  }

  /** 与原版复合犄角一样按转化阶段解锁，镜子开关只控制外观。 */
  public get omen(): boolean {
    return (V.maplebirch?.transformation?.raven?.level ?? 0) >= 6 && V.fallenangel >= 4;
  }

  public get retry(): boolean {
    return this.omen && this.flock.disparaged === 1;
  }

  protected override extend(maplebirch: MaplebirchCore): void {
    const descriptions = () => {
      const item = setup.clothes.neck.find((item: Record<string, string>) => item.variable === 'raven_feather_necklace');
      if (item) item.description = maplebirch.t('deadwood-reblooms:clothes:raven_feather_necklace:description');
    };
    maplebirch.tool.onInit(descriptions);
    maplebirch.on(':language', descriptions);

    maplebirch.tool.patch.traits.add(
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:ravenFeathers:name'),
        colour: 'black',
        has: () => {
          const feathers = V.transformationParts?.traits?.ravenFeathers;
          return typeof feathers === 'string' && isPartEnabled(feathers);
        },
        text: () => maplebirch.t('deadwood-reblooms:Traits:ravenFeathers:text')
      },
      {
        title: 'General Traits',
        name: () => {
          const name = maplebirch.t('deadwood-reblooms:Traits:raven:gender');
          return name + (V.player.sex === 'h' ? lanSwitch(' (⚥)', '(⚥)') : '');
        },
        colour: 'black',
        has: () => (V.maplebirch?.transformation?.raven?.level ?? 0) >= 6,
        text: () => maplebirch.t('deadwood-reblooms:Traits:raven:text')
      },
      {
        title: 'General Traits',
        name: () => maplebirch.t('deadwood-reblooms:Traits:ominousVoice:name'),
        colour: 'black',
        has: () => this.omen,
        text: () => maplebirch.t('deadwood-reblooms:Traits:ominousVoice:text')
      }
    );

    // 原版以 hitstat 标记击打。只匹配同一行的疼痛结算，排除颈部束缚与窒息。
    const impact = /<<violence ([1-9]\d*)>>(?=(?:(?!<<violence|<<bruise neck>>)[^\r\n])*<<hitstat>>)/g;
    const armour = "`maplebirch.get('MoreTransformations').Raven.armour`";
    const speech = "maplebirch.get('MoreTransformations').Raven.speech";
    const hits = (expected: number) => ({ srcmatchgroup: impact, to: `<<violence $1 1 1 ${armour}>>`, expected });
    maplebirch.tool.inject({
      widgetPassage: {
        'Widgets Combat Man-Combat': [
          hits(40),
          {
            src: '<<violence `($spankobject is "paddle" ? 10 : 5)` 1 1 1 _n>>',
            to: `<<violence \`($spankobject is "paddle" ? 10 : 5)\` 1 1 ${armour} _n>>`,
            expected: 1
          },
          ...[5, 20, 2].map(amount => ({ src: `<<violence ${amount} 1 1 1 _n>>`, to: `<<violence ${amount} 1 1 ${armour} _n>>`, expected: 1 }))
        ],
        'Widgets Combat Beast': [hits(4)],
        'Widgets Combat Tentacle Test': [hits(6)],
        'Widgets Combat Tentacle Adv': [hits(6)],
        'Widgets Actions Speak': [
          // 只放宽讥讽的第二次机会，保留原版发声、目标与自愿状态的外层判断。
          {
            srcmatch: /\$angelforgive isnot 1(?= and \$enemytype is "man")/,
            to: `($angelforgive isnot 1 or maplebirch.get('MoreTransformations').Raven.retry)`,
            expected: 1
          }
        ],
        'Widgets End Combat': [
          {
            src: '<<set $angelforgive to 0>>',
            applyafter: '<<set $MoreTransformations.raven.disparaged to 0>>',
            expected: 1
          }
        ],
        'Widgets Effects Man': [
          hits(13),
          // 在原版清空动作前，用临时变量记录本次融合资格。
          {
            src: '<<if $mouthaction is "mock" or $mouthaction is "disparage">>',
            applyafter: `<<set _ravenOmen to $mouthaction is "disparage" and $combat is 1 and $consensual isnot 1 and $enemytype is "man" and ($angelforgive isnot 1 or maplebirch.get('MoreTransformations').Raven.retry) and maplebirch.get('MoreTransformations').Raven.omen>>`,
            expected: 1
          },
          // 发声失败不会到达这里，不扣次数。计数随存档保存，读档不会补回机会。
          {
            src: '<<set $mockaction to $NPCList[$mouthtarget].insecurity>>',
            applyafter: '<<if _ravenOmen>><<set $MoreTransformations.raven.disparaged to $angelforgive is 1 ? $MoreTransformations.raven.disparaged + 1 : 1>><</if>>',
            expected: 1
          },
          // 融合讥讽保留鸦化言语加成，只为创伤减轻和自控恢复再加一倍。
          // 三个表达式限定在嘲讽分支内，自控翻倍不影响自愿遭遇的 submission。
          {
            srcmatch:
              /(<<actionsmock>><<set \$speechdemand to 1>>\s*<<brat `)1 \+ \$englishtrait(` \$mouthtarget>>)([\s\S]*?<<submission `)1 \+ \$englishtrait(` \$mouthtarget>>\s*<<else>>\s*<<combatcontrol `)1 \+ \$englishtrait/,
            to:
              `$1($englishtrait + 1) * ${speech}$2` +
              `<<if _ravenOmen>><<combattrauma \`-($englishtrait + 1) * ${speech}\`>><<if $pain gt 0>><<set _ravenPain to $pain>><<set $pain *= 0.85>><<painclamp>><<if $pain lt _ravenPain>><<lpain>><</if>><</if>><</if>>` +
              `$3($englishtrait + 1) * ${speech}$4($englishtrait + 1) * ${speech} * (_ravenOmen ? 2 : 1)`,
            expected: 1
          },
          // 在原版演说倍率之后相乘，保留目标、拒绝分支与技能等级。
          { srcmatchgroup: /1 \+ \$englishtrait\b/g, to: `(1 + $englishtrait) * ${speech}`, expected: 7 },
          { srcmatchgroup: /\(10 \* \$englishtrait\)/g, to: `(10 * $englishtrait) * ${speech}`, expected: 3 },
          {
            srcmatchgroup: /Math\.clamp\((?:25|100) - \$englishtrait \* 20, (?:\$enemyangermax \/ -[24]|0), \$enemyangermax \/ 2\)/g,
            to: `$& * ${speech}`,
            expected: 6
          }
        ]
      }
    });
  }
}

export default Raven;
