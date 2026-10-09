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

  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-reblooms-life-simulation-school-office-options'], passage: "Head's Office" });
  maplebirch.tool.addTo('CustomLinkZone', { widget: [-1, 'deadwood-school-council-link'], passage: 'Hallways' });
  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-life-simulation-school-journal');

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

  maplebirch.tool.inject({
    locationPassage: {
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

  // 地点由正文写入后再处理衣物，随后仍由原版 effects 计算暴露与服装状态。
  maplebirch.tool.onInit(() => {
    const effects = maplebirch.tool.macro.Macro.get('effects')?.handler;
    if (typeof effects !== 'function') return;
    maplebirch.tool.macro.define('effects', function () {
      const school = maplebirch.get('LifeSimulation')?.school;
      if (school && (V.LifeSimulation?.school?.clothesStored || school.requiresNudity)) {
        this.output.append(maplebirch.SugarCube.Wikifier.wikifyEval('<<deadwood-reblooms-life-simulation-school-sync-clothes>>'));
      }
      return effects.call(this);
    });
  });

  maplebirch.tool.inject({
    locationPassage: {
      'School Front Courtyard': [
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
      Hallways: [
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 2
        },
        // 储物柜前的链接数随留堂和特殊事件变化，按原版储物柜定位公告栏。
        {
          srcmatch: /<<lockericon>><<link \[\[[^\]\n]+\|School Lockers]]>/,
          applybefore: '<<deadwood-reblooms-life-simulation-school-board-link>>',
          expected: 1
        }
      ],
      'School Infirmary Kylar Walk': [
        {
          src: '<<set $location to "arcade">><<set $bus to "starfish">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
          expected: 1
        },
        {
          src: '<<set $location to "park">><<set $bus to "park">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
          expected: 1
        }
      ],
      'Sydney Walk': [
        // 在原版留堂条件上追加学生身份检查，其余限制照常保留。
        {
          srcmatchgroup: /\$detention gte 1(?= and \$daily\.school\.detentionAttended isnot 1)/g,
          applyafter: ' and $LifeSimulation.school.role is "student"',
          expected: 1
        },
        {
          src: '<<set $location to "town">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
          expected: 1
        }
      ],
      'Sydney Walk Shopping': [
        {
          src: '<<set $exit to "library">><<set $location to "park">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
          expected: 1
        }
      ],
      'Sydney Walk Beach': [
        {
          src: '<<set $exit to "library">><<set $location to "town">>',
          applyafter: '<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
          expected: 1
        }
      ]
    },
    widgetPassage: {
      'Widgets Changing Room': [
        // 四个正常离校链接共用此宏。拦截留堂时也只恢复一次。
        {
          src: '<<storeon "school pool girls" "return">>',
          applyafter: '\n\t<<deadwood-reblooms-life-simulation-school-restore-clothes>>',
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
