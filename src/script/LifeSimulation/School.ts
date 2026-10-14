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
  maplebirch.tool.addTo('BeforeLinkZone', { widget: 'deadwood-reblooms-life-simulation-school-clothes-link', passage: 'School Lockers' });

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

  // 校规要求只提供主动更衣选择；原版束缚、课时和耳部史莱姆事件仍先检查。
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

  maplebirch.tool.inject({
    locationPassage: {
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
      'Swimming Lesson': [
        // 已获批的校规不再触发旧裸体泳课的礼顿惩罚，不修改原版全班任务记录。
        { src: '$swimnudecounter gte 10 and $swimall isnot 1', applyafter: ' and !maplebirch.get("LifeSimulation").school.allowsNudity', expected: 1 }
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
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 2
        },
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
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 2
        },
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
        // 校规许可时开放公共区域；礼顿的特殊事件条件与随机遭遇不变。
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
      ]
    }
  });
}
