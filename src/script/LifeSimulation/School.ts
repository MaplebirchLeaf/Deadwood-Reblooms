// ./src/script/LifeSimulation/School.ts

export default function School(maplebirch: typeof window.maplebirch): void {
  // 包装原版校服判断，保留原函数与其他模组继续串联包装的空间。
  maplebirch.tool.onInit(() => {
    const wearingSchoolOutfit = window.wearingSchoolOutfit;
    if (wearingSchoolOutfit) window.wearingSchoolOutfit = () => maplebirch.get('LifeSimulation')!.school.meetsDressCode(wearingSchoolOutfit());

    // 原版的课程提示由 questmarker 独立生成，免听时只关闭学校提醒。
    const events = (setup as typeof setup & { events?: Array<{ name: string; condition: () => boolean; text: string }> }).events;
    for (const event of events ?? []) {
      if (event.name === 'school day') {
        const condition = event.condition;
        event.condition = () => !V.LifeSimulation.school.attendanceExempt && condition.call(event);
      }
      if (event.name === 'tomorrow') {
        event.text = `<<if $LifeSimulation.school.attendanceExempt>><<lanSwitch 'You may attend school tomorrow.' '明天你可以自愿上课。'>><<else>>${event.text}<</if>>`;
      }
      if (event.name === 'no school') {
        event.text = `<<if $LifeSimulation.school.attendanceExempt and Time.schoolDay>><<lanSwitch 'You may attend lessons today.' '今天你可以自愿上课。'>><<else>>${event.text}<</if>>`;
      }
    }
  });

  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-life-simulation-school-journal');
  // 只在储物柜取衣；校门和公告栏只提示衣物去向。
  maplebirch.tool.addTo('BeforeLinkZone', {
    widget: 'deadwood-reblooms-life-simulation-school-clothes-link',
    passage: ['School Front Courtyard', 'School Rear Courtyard', 'School Lockers']
  });

  maplebirch.tool.patch.traits.add(
    {
      title: 'School Traits',
      name: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:attendancePass:name'),
      colour: 'green',
      has: () => V.LifeSimulation.school.attendanceExempt,
      text: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:attendancePass:text')
    },
    {
      title: 'School Traits',
      name: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:prefect:name'),
      colour: 'green',
      has: () => V.LifeSimulation.school.role === 'prefect',
      text: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:prefect:text')
    },
    {
      title: 'School Traits',
      name: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:president:name'),
      colour: 'green',
      has: () => V.LifeSimulation.school.role === 'president',
      text: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:president:text')
    }
  );

  // 教室先检查外衣是否缺失，再检查校服。让符合现行校规的穿着进入原版上课分支。
  const classroomDress = {
    src: '$worn.upper.type.includes("naked") and $worn.lower.type.includes("naked")',
    applyafter: ' and !wearingSchoolOutfit()',
    expected: 1
  };

  // 校规要求只提供主动更衣选择，原版束缚、课时和耳部史莱姆事件仍先检查。
  const classroomChoice = {
    srcmatch: /<<classRoomEarSlime "[^"]+">>(?=\s*<<if \$worn\.upper\.type\.includes\("naked"\))/,
    applyafter: '<<deadwood-reblooms-life-simulation-school-classroom-dress>><<if !_schoolDressRejected>>',
    expected: 1
  };

  // 泳池沿用正常泳课分支，不改变 swimall 所记录的原版全班着装任务。
  const swimmingDress = [
    {
      src: '$exposed gte 2 and $swimall isnot 1',
      applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
      expected: 1
    },
    {
      src: '$worn.lower.type.includes("swim")))',
      applyafter: ' or (maplebirch.get("LifeSimulation").school.allowsNudity and ["upper", "lower", "under_upper", "under_lower"].every(slot => $worn[slot].type.includes("naked")))',
      expected: 1
    }
  ];

  // 合法着装只解除普通通行限制，暴露相关随机事件仍由原版结算。
  const campusNavigationDress = {
    srcmatchgroup: /(?<=<<if !\["early", "late", "earlynoschool", "latenoschool", "daynoschool"\]\.includes\(\$schoolstate\) and )\$exposed gte 1(?=>>)/,
    applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
    expected: 1
  };

  // 只匹配开场躲藏叙述的首个 lewdness 宏，遇到其它宏即停止，不触及随机事件分支。
  const campusHidingDress = {
    srcmatchgroup: /\$exposed gte 1(?=>>(?:(?!<<)[\s\S])*<<lewdness>>)/,
    applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
    expected: 1
  };

  // 只为学生保留原版留堂要求，中庭和走廊共用同一条规则。
  const studentDetention = {
    srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
    applyafter: ' and $LifeSimulation.school.role is "student"',
    expected: 2
  };

  // 校规允许裸体后，检查仍照常进行，只为原版的脱衣、穿衣句补上实际衣物判断。
  const inspectionLower = {
    srcmatch: /(?:You <<nervously>> pull down your \$worn\.lower\.name as instructed, |你<<nervously>>按照指示(?:拉下了你的\$worn\.lower\.cn_name_cap，|将你的\$worn\.lower\.cn_name_cap拉开，))/g,
    to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "stand">><</if>>'
  };
  const inspectionRaise = {
    srcmatch: /(?: and you pull your \$worn\.lower\.name back up|，而你则把你的\$worn\.lower\.cn_name_cap拉了回来)/,
    to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "raise">><</if>>',
    expected: 1
  };
  const inspectionDesk = {
    applybefore: '<<if $worn.lower.name is "naked">><<deadwood-school-inspection-posture "desk" "give">><<else>>',
    expected: 1
  };
  const inspectionDressAgain = {
    srcmatch: /(?:You put your clothes back on and |你重新穿上衣服，并)/g,
    to: '<<if $worn.lower.name isnot "naked" or $worn.under_lower.name isnot "naked">>$&<<else>><<lanSwitch "You " "你">><</if>>'
  };

  maplebirch.tool.inject({
    locationPassage: {
      'School Lockers': [
        {
          srcmatch: /though thankfully, you've yet to have anything stolen from yours\.|不过值得庆幸的是，你的东西还没有被偷过。/,
          to: '<<if $LifeSimulation.school.locker_thefts gt 0>><<lanSwitch "and yours has been forced open before." "你的储物柜也曾被人撬开。">><<else>>$&<</if>>',
          expected: 1
        }
      ],
      'Science Classroom': [{ ...classroomDress }, { ...classroomChoice }, { src: '<<elseif $schoolstate is "morning">>', applybefore: '<</if>>\n', expected: 1 }],
      'Maths Classroom': [{ ...classroomDress }, { ...classroomChoice }, { src: '<<elseif $schoollesson is 1 and ![3, 5].includes(Time.weekDay)>>', applybefore: '<</if>>\n', expected: 1 }],
      'Housekeeping Classroom': [{ ...classroomDress }, { ...classroomChoice }, { src: '<<elseif $schoollesson is 1 and [3, 5].includes(Time.weekDay)>>', applybefore: '<</if>>\n', expected: 1 }],
      'History Classroom': [{ ...classroomDress }, { ...classroomChoice }, { src: '<<elseif $schoolstate is "lunch">>', applybefore: '<</if>>\n', expected: 1 }],
      'English Classroom': [{ ...classroomDress }, { ...classroomChoice }, { src: '<<elseif $schoolstate is "afternoon" and $englishPlay is "ongoing">>', applybefore: '<</if>>\n', expected: 1 }],
      'School Pool': [
        ...swimmingDress.map(rule => ({ ...rule })),
        {
          src: '<<classRoomEarSlime "swimming">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-classroom-dress>>',
          expected: 1
        },
        { src: '<<if $poolroomstate is "own">>', applybefore: '<<if _schoolDressRejected isnot true>>', expected: 1 },
        { srcmatch: /<<\/if>>\s*$/, applyafter: '<</if>>', expected: 1 }
      ],
      'School Swimming Late': swimmingDress.map(rule => ({ ...rule })),
      'Penis Inspection Expose': [{ ...inspectionLower, expected: 4 }, { ...inspectionRaise }],
      'Penis Inspection Flaunt': [
        {
          srcmatch: /(?:Confident, you tug down your \$worn\.lower\.name, |你自信满满，扯下了你(?:的|那破旧的)\$worn\.lower\.cn_name_cap，)/g,
          to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "flaunt">><</if>>',
          expected: 4
        },
        { ...inspectionRaise }
      ],
      'Penis Inspection Flaunt No Penis': [
        {
          srcmatch: /(?:You tug down your \$worn\.lower\.name, |你拽下你的\$worn\.lower\.cn_name_cap，)/,
          to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "stand">><</if>>',
          expected: 1
        },
        {
          srcmatch: /(?:You pull your \$worn\.lower\.name back up and |你把你的\$worn\.lower\.cn_name_cap拉了回去，)/,
          to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "seat">><</if>>',
          expected: 1
        },
        {
          srcmatch: /(?:You cover yourself up slowly, |你慢慢地穿好衣服，)/,
          to: '<<if $worn.lower.name isnot "naked" or $worn.under_lower.name isnot "naked">>$&<<else>><<lanSwitch "You cover yourself with your hands, " "你用手遮住身体，">><</if>>',
          expected: 1
        },
        {
          srcmatch: /(?: as you finish getting dressed|当你穿完衣服时，)/,
          to: '<<if $worn.lower.name isnot "naked" or $worn.under_lower.name isnot "naked">>$&<</if>>',
          expected: 1
        }
      ],
      'Penis Inspection Forced': [
        { ...inspectionLower, expected: 1 },
        {
          srcmatch: /(?:Put your clothes back on and sit down\.|把你的衣服穿上，坐下来吧。)/,
          to: '<<if $worn.lower.name isnot "naked" or $worn.under_lower.name isnot "naked">>$&<<else>><<lanSwitch "Sit down." "坐下来吧。">><</if>>',
          expected: 1
        }
      ],
      'Penis Inspection Forced Defiant': [
        {
          ...inspectionDesk,
          src: '<<if !$worn.under_lower.type.includes("naked")>>',
          applybefore: '<<if $worn.lower.name is "naked">><<deadwood-school-inspection-posture "defiant" true>><<else>>'
        },
        { src: '<<exhibitionism4>>', applybefore: '<</if>>', expected: 1 }
      ],
      'Penis Inspection 2': [
        {
          srcmatch:
            /(?:Your face flushes as you (?:realise most people already know what is in|think about the secret hidden in) your \$worn\.lower\.name\.|你的脸一下子涨得通红，因为你明白大多数人都知道你的\$worn\.lower\.cn_name_cap下有什么。|当你想到隐藏在你的\$worn\.lower\.cn_name_cap中的秘密时，你的脸红了起来。)/g,
          to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "notice">><</if>>',
          expected: 4
        },
        {
          srcmatch: /(?:You feel more conscious of the secret beneath your \$worn\.lower\.name as time goes on\.|随着时间的推移，你对自己\$worn\.lower\.cn_name_cap下面的秘密愈加在意起来。)/,
          to: '<<if $worn.lower.name isnot "naked">>$&<<else>><<deadwood-school-inspection-posture "notice">><</if>>',
          expected: 1
        }
      ],
      'Pussy Inspection Comply': [
        { ...inspectionDesk, src: '<<set _crotchlessPantiesId to 17>>' },
        { src: '<<if maleChance() gt 0>>', applybefore: '<</if>>', expected: 1 }
      ],
      'Pussy Inspection Flaunt No Pussy': [
        { ...inspectionDesk, src: "<<if setup.clothes.lower[clothesIndex('lower', $worn.lower)].skirt is 1>>" },
        { src: '<<exhibitionism4>>', applybefore: '<</if>>', expected: 1 },
        { ...inspectionDressAgain, expected: 1 }
      ],
      'Pussy Inspection Flaunt': [
        { ...inspectionDesk, srcmatch: /<<if \$worn\.under_lower\.(?:name is "naked"|type\.includes\("naked"\))>>/ },
        { src: '<<exhibitionism4>>', applybefore: '<</if>>', expected: 1 },
        { srcmatch: /!\$worn\.under_lower\.(name is "naked"|type\.includes\("naked"\))/, to: 'not ($worn.under_lower.$1)', expected: 1 },
        { ...inspectionDressAgain, expected: 3 }
      ],
      'Pussy Inspection Forced': [
        { ...inspectionDesk, src: '<<if $worn.under_lower.type.includes("naked")>>', applybefore: '<<if $worn.lower.name is "naked">><<deadwood-school-inspection-posture "desk">><<else>>' },
        { src: '<<if $inspection.gender_appearance is "f">>', applybefore: '<</if>>', expected: 1 },
        {
          srcmatch: /(?:You readjust your clothes and |你重新整理你的衣服，)/,
          to: '<<if $worn.lower.name isnot "naked" or $worn.under_lower.name isnot "naked">>$&<<else>><<lanSwitch "You " "你">><</if>>',
          expected: 1
        }
      ],
      'Pussy Inspection Forced Defiant': [
        {
          ...inspectionDesk,
          src: '<<if setup.clothes.lower[clothesIndex(\'lower\', $worn.lower)].skirt is 1 and !$worn.under_lower.type.includes("naked")>>',
          applybefore: '<<if $worn.lower.name is "naked">><<deadwood-school-inspection-posture "defiant">><<else>>'
        },
        { src: '<<exhibitionism4>>', applybefore: '<</if>>', expected: 1 },
        {
          srcmatch: /(?:, or if they just weren't expecting what was beneath your \$worn\.lower\.name|，或者他们只是没有想到在你的\$worn\.lower\.cn_name_cap下面是什么)/,
          to: '<<if $worn.lower.name isnot "naked">>$&<</if>>',
          expected: 1
        }
      ],
      'Swimming Lesson': [
        // 已获批的校规不再触发旧裸体泳课的礼顿惩罚，不修改原版全班任务记录。
        { src: '$swimnudecounter gte 10 and $swimall isnot 1', applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity', expected: 1 },
        // 两个练习入口插在 Focus／Socialise 之后、Daydream 之前，和原版课程选项排在一起。
        { src: '<<daydreamicon>>', applybefore: '<<deadwood-swimming-lesson-link>>', expected: 1 }
      ],
      "Head's Office": [
        {
          srcmatch: /<<getouticon>><<link \[\[[^\]\n]+\|Hallways]]>>(?=<<endevent>><<pass 1>><<set \$daily\.school\.headInterrupted to 1>>)/,
          applybefore: '<<deadwood-reblooms-life-simulation-school-office-options>>\n\t\t\t',
          expected: 1
        }
      ],
      "Bailey's Office": [
        // 贝利只有 7–9 点在办公室，入口仍受原版 _options 限制，避免打断惩罚场景。
        {
          src: '<<baileyRentReclaimOption>> /* Bailey Confiscation System */',
          applybefore: '<<deadwood-reblooms-life-simulation-attendance-link>>\n',
          expected: 1
        }
      ],
      Flats: [
        // 使用原版公寓走廊的普通链接分支，随机事件发生时不会提前展示入口。
        {
          srcmatch: /<<barbicon>><<link \[\[[^\]\n]+\|Barb Street]]>><<\/link>>/,
          applybefore: '<<deadwood-reblooms-life-simulation-bailey-flat-link>>\n',
          expected: 1
        }
      ]
    }
  });

  maplebirch.tool.inject({
    locationPassage: {
      'School Front Courtyard': [
        { ...campusNavigationDress },
        { ...campusHidingDress },
        { ...studentDetention },
        // 仅接管通往 Hallways 的原版一分钟入口，保留中庭其余事件与离校选项。
        {
          srcmatch: /<<entranceicon>><<link \[\[[^\]\n]+\|Hallways]]>><<pass 1>><<\/link>>/,
          to: '<<deadwood-reblooms-life-simulation-school-duty-link>><<deadwood-reblooms-life-simulation-school-entry>>',
          expected: 1
        }
      ],
      'School Rear Courtyard': [{ ...campusNavigationDress }, { ...campusHidingDress }],
      Hallways: [
        { ...campusNavigationDress },
        { ...campusHidingDress },
        // 职位免除强制留堂，仍可在原版留堂入口旁主动参加。
        {
          srcmatch: /<<if \$schoolstate is "afternoon"(?=[^\n]*\$pillory\.tenant\.special\.name)/,
          applybefore: '<<deadwood-school-voluntary-detention>>',
          expected: 1
        },
        { ...studentDetention },
        // 储物柜前的链接数随留堂和特殊事件变化，按原版储物柜定位公告栏。
        {
          srcmatch: /<<lockericon>><<link \[\[[^\]\n]+\|School Lockers]]>/,
          applybefore: '<<deadwood-reblooms-life-simulation-school-board-link>><<deadwood-school-council-link>>',
          expected: 1
        }
      ],
      Canteen: [
        {
          srcmatchgroup: /\$exposed gte 1(?=>>\s*<<if \$schoolstate is "lunch">>)/,
          applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        },
        // 只开放自己的午餐、普通同学交谈与奶昔，不改罗宾重逢及具名 NPC 剧情。
        {
          srcmatchgroup: /(?<=<<(?:if \$daily\.school\.lunchEaten isnot 1|elseif \$daily\.school\.canteenApproach isnot 1|if def \$milkshake and \$milkshake gt 0) and )\$exposed lte 0(?=>>)/g,
          to: '($exposed lte 0 or maplebirch.get("LifeSimulation").school.allowsNudity)',
          expected: 3
        },
        {
          src: '$exposed gte 1 and $schoolstate is "lunch"',
          applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        }
      ],
      'School Library': [
        {
          srcmatchgroup: /\$exposed gte 1(?=>>\s*<<if Time.schoolDay and \$schoolstate isnot "early" and \$schoolstate isnot "late">>)/,
          applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        },
        // 校规许可时开放公共区域，礼顿的特殊事件条件与随机遭遇不变。
        {
          srcmatchgroup: /\$exposed gte 1(?= and Time.schoolDay and \$schoolstate isnot "early" and \$schoolstate isnot "late">>)/,
          applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        },
        {
          // 两个柜台入口的条件在暴露判断后结束，不匹配礼顿的后续条件。
          srcmatchgroup: /\$exposed lte 0(?=>>)/g,
          to: '($exposed lte 0 or maplebirch.get("LifeSimulation").school.allowsNudity)',
          expected: 2
        },
        {
          srcmatchgroup: /(?<=<<projectoptions>>\s*<<if )\$exposed gte 1(?=>>)/,
          applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        }
      ],
      'Sydney Walk': [
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets School': [
        {
          srcmatchgroup: /(?<=<<widget "schoolperiod">>\s*<<if )\$exposed lte 0(?=>>)/,
          applyafter: ' or maplebirch.get("LifeSimulation").school.allowsNudity',
          expected: 1
        }
      ],
      'Widgets Sydney': [
        // 免听只解除针对 PC 的逃课警告；悉尼自己的上课与值班安排照常执行。
        { src: '<<widget "sydneyLibrary">>', applyafter: '<<if $LifeSimulation.school.attendanceExempt>><<unset $daily.sydney.classWarn>><</if>>', expected: 1 },
        {
          src: '($sydneyScience isnot 1 and $schoolstate is "first") or ["fourth", "fifth"].includes($schoolstate)',
          to: '($&) and !$LifeSimulation.school.attendanceExempt',
          expected: 1
        },
        {
          srcmatch: /(?:We're late for science class!|我们上课要迟到了！)/,
          to: '<<if $LifeSimulation.school.attendanceExempt>><<lanSwitch "I\'m late for science class!" "我上课要迟到了！">><<else>>$&<</if>>',
          expected: 1
        },
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 3
        }
      ],
      Social: [
        // Social 是原版 widget，紧邻学校声望卡片插入，保持原版的双列排版。
        {
          src: '<<relation-box-simple _studentBoxConfig>>',
          applyafter: '\n\t\t\t<<deadwood-reblooms-life-simulation-school-social>>',
          expected: 1
        }
      ],
      'Widgets Events Swimming': [
        {
          src: '<<widget "destinationpoolchangingroom">>',
          applyafter: '\n\t<<deadwood-school-pool-private-link>>',
          expected: 1
        }
      ]
    }
  });
}
