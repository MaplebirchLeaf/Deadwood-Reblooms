// ./src/script/VanillaPlus/Promiscuity.ts

export default function (maplebirch: typeof window.maplebirch) {
  const available = () => V.VanillaPlus.lock.promiscuity && V.enemytype === 'man' && !V.npcSub;
  const target = (index: number) => V.NPCList?.[index];
  const reachable = (npc: any) => npc?.stance !== 'topface' && npc.location?.genitals === 0 && npc.location?.head !== 'genitals';
  const penisFree = () => !(window as any).playerChastity('penis');
  const direct = (action: string, target: string) =>
    `<<set _vanillaPlusPromiscuity to $VanillaPlus.traits.promiscuity>><<set _vanillaPlusPromiscuityIgnore to $promiscuityIgnore>><<set _vanillaPlusPromiscuityTarget to ${target}>><<set $promiscuityIgnore to true>><<set $${action}>>`;
  const text = (key: string, values: Record<string, string> = {}) => {
    let result = maplebirch.t(`deadwood-reblooms.VanillaPlus.promiscuity.${key}`);
    for (const [name, value] of Object.entries(values)) result = result.replaceAll(`{${name}}`, value);
    return result;
  };
  const straddle = (index: number) => {
    const npc = target(index);
    if (!npc) return '';
    return text('action.straddle', { his: npc.pronouns.his });
  };

  maplebirch.tool.onInit(() => {
    setup.feats['Every Inch'] ??= {
      get title() {
        return text('feat.title');
      },
      get desc() {
        return text('feat.description');
      },
      difficulty: 3,
      series: '',
      filter: ['All', 'Stats']
    };
  });

  maplebirch.dynamic.regStateEvent('gate', 'promiscuity-max', {
    output: 'earnFeat "Every Inch"',
    cond: () => maplebirch.VP.promiscuity.max && !V.feats.currentSave['Every Inch']
  });
  maplebirch.dynamic.regStateEvent('gate', 'promiscuity-unlock', {
    output: 'deadwood-reblooms-promiscuity-unlock',
    cond: () => maplebirch.VP.promiscuity.unlock
  });

  maplebirch.combat.CombatAction.reg(
    {
      id: 'promiscuity-receive-vaginal',
      actionType: 'vaginaaction',
      cond: () => available() && V.player.vaginaExist && !V.vaginause && target(V.vaginatarget)?.penis === 0 && reachable(target(V.vaginatarget)),
      display: () => straddle(V.vaginatarget),
      value: () => 'VanillaPlusPromiscuityReceiveVaginal',
      color: 'meek',
      effect: direct('vaginaaction to "vaginatopenis"', '$vaginatarget')
    },
    {
      id: 'promiscuity-receive-anal',
      actionType: 'anusaction',
      cond: () => available() && !V.anususe && target(V.anustarget)?.penis === 0 && reachable(target(V.anustarget)),
      display: () => straddle(V.anustarget),
      value: () => 'VanillaPlusPromiscuityReceiveAnal',
      color: 'meek',
      effect: direct('anusaction to "anustopenis"', '$anustarget')
    },
    {
      id: 'promiscuity-press-vaginal',
      actionType: 'penisaction',
      cond: () => available() && V.player.penisExist && !V.penisuse && penisFree() && target(V.penistarget)?.vagina === 0 && reachable(target(V.penistarget)),
      display: () => {
        const npc = target(V.penistarget);
        return text('action.pressVagina', { his: npc.pronouns.his });
      },
      value: () => 'VanillaPlusPromiscuityPressVaginal',
      color: 'meek',
      effect: direct('penisaction to "penistovagina"', '$penistarget')
    },
    {
      id: 'promiscuity-press-anal',
      actionType: 'penisaction',
      cond: () => {
        const npc = target(V.penistarget);
        return available() && V.player.penisExist && !V.penisuse && penisFree() && !!npc && [0, 'none'].includes(npc.vagina) && [0, 'none'].includes(npc.penis) && reachable(npc);
      },
      display: () => {
        const npc = target(V.penistarget);
        return text('action.pressAnus', { his: npc.pronouns.his });
      },
      value: () => 'VanillaPlusPromiscuityPressAnal',
      color: 'meek',
      effect: direct('penisaction to "penistoanus"', '$penistarget')
    }
  );

  maplebirch.tool.zone.inject({
    widgetPassage: {
      Cheats: [
        {
          src: '$promiscuity "promiscuity" {reverse: true}',
          to: '$promiscuity "promiscuity" {max: $VanillaPlus.lock.promiscuity ? 150 : 100, reverse: true}'
        }
      ],
      'Widgets Effects Man': [
        {
          src: '<<widget "effectsman">>',
          applyafter:
            '<<if $consensual is 1 and $enemytype is "man" and maplebirch.VP.promiscuity.record({ hands: [$leftaction, $rightaction], feet: $feetaction, mouth: $mouthaction, penis: $penisaction, vagina: $vaginaaction, anus: $anusaction, chest: $chestaction, thigh: $thighaction }) and $VanillaPlus.lock.promiscuity>><<combatpromiscuity6>><</if>>'
        },
        {
          src: '<<if $mouthaction is "ask" and $askAction is "askchoke" and $askedtochoke isnot 1>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request>>\n\t\t'
        },
        {
          src: '<<effectsvaginatopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "vagina">>'
        },
        {
          src: '<<effectsanustopenis>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "anus">>'
        },
        {
          src: '<<effectspenistovagina>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-vagina">>'
        },
        {
          src: '<<effectspenistoanus>>',
          applyafter: '<<deadwood-reblooms-promiscuity-direct-result "penis-anus">>'
        }
      ],
      'Widgets Effects Vagina': [
        {
          src: '<<if combatSkillCheck("vaginal", $vaginatarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("vaginal", $vaginatarget)>>'
        }
      ],
      'Widgets Effects Anus': [
        {
          src: '<<if combatSkillCheck("anal", $anustarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("anal", $anustarget)>>'
        }
      ],
      'Widgets Effects Penis': [
        {
          src: '<<if combatSkillCheck("penile", $penistarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("penile", $penistarget)>>'
        },
        {
          src: '<<if combatSkillCheck("penile", $penistarget)>>',
          to: '<<if _vanillaPlusPromiscuity or combatSkillCheck("penile", $penistarget)>>'
        }
      ],
      'Widgets Actions Speak': [
        {
          src: '<<set _askValues to Object.values(_askActions)>>',
          applybefore: '<<deadwood-reblooms-promiscuity-request-options>>\n\t\t'
        }
      ],
      'Widgets Promiscuity': [
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? 150 : 20 * $_n>>'
        },
        {
          src: '<<set $_scaledPromiscuityMax to 20 * $_n>>',
          to: '<<set $_scaledPromiscuityMax to $_n is 6 and $VanillaPlus.lock.promiscuity ? 150 : 20 * $_n>>'
        },
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        },
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        }
      ],
      'Widgets Clamp': [
        {
          src: '<<set $promiscuity to Math.clamp($promiscuity, 0, 100)>>',
          to: "<<set $promiscuity to Math.clamp($promiscuity, maplebirch.VP.minimum('promiscuity'), $VanillaPlus.lock.promiscuity ? 150 : 100)>>"
        }
      ]
    }
  });
}
