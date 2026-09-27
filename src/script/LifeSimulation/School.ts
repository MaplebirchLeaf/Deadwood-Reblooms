interface PassagePatch {
  src?: string;
  srcmatch?: RegExp;
  to?: string;
  applybefore?: string;
  applyafter?: string;
  expected: number;
}

export default function School(maplebirch: typeof window.maplebirch): void {
  maplebirch.tool.onInit(() => {
    setup.feats['Student Council President'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:president:name');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:school:feat:president:description');
      },
      difficulty: 2,
      series: '',
      filter: ['All', 'General']
    };
    setup.feats['Naked School'] ??= {
      get title() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:school:feat:naked:title');
      },
      get desc() {
        return maplebirch.t('deadwood-reblooms:LifeSimulation:school:feat:naked:description');
      },
      difficulty: 4,
      series: '',
      filter: ['All', 'General']
    };
  });
  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-president-feat', {
    output: 'earnFeat "Student Council President"',
    cond: () => V.LifeSimulation?.school?.role === 'president'
  });
  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-naked-school-feat', {
    output: 'earnFeat "Naked School"',
    cond: () => V.LifeSimulation?.school?.dress?.highest === 'mandatoryNudity'
  });

  // 包装原版校服判断，保留原函数与其他模组继续串联包装的空间。
  maplebirch.tool.onInit(() => {
    const wearingSchoolOutfit = window.wearingSchoolOutfit;
    if (wearingSchoolOutfit) window.wearingSchoolOutfit = () => maplebirch.LS.school.acceptsDressCode(wearingSchoolOutfit());

    // 原版的课程提示由 questmarker 独立生成；免听时只关闭学校提醒。
    const events = (setup as typeof setup & { events?: Array<{ name: string; condition: () => boolean; text: string }> }).events;
    for (const event of events ?? []) {
      if (event.name === 'school day') {
        const condition = event.condition;
        event.condition = () => V.LifeSimulation.school.role !== 'president' && condition.call(event);
      }
      if (event.name === 'tomorrow') {
        event.text = `<<if $LifeSimulation.school.role is 'president'>><<lanSwitch 'You may attend school tomorrow.' '明天你可以自愿上课。'>><<else>>${event.text}<</if>>`;
      }
      if (event.name === 'no school') {
        event.text = `<<if $LifeSimulation.school.role is 'president' and Time.schoolDay>><<lanSwitch 'You may attend lessons today.' '今天你可以自愿上课。'>><<else>>${event.text}<</if>>`;
      }
    }
  });

  // 免听凭证只豁免就任后的旷课结算，原版每天的成绩变化照常执行。
  const missedLessons = new Array<{ total: number; message: number; subjects: Record<string, number> } | null>();
  maplebirch.dynamic.regTimeEvent('onBefore', 'life-simulation-school-attendance-before', {
    action: () => {
      if (V.LifeSimulation?.school?.role !== 'president') {
        missedLessons.push(null);
        return;
      }
      missedLessons.push({
        total: V.lessonmissed,
        message: V.lessonmissedtext,
        subjects: { ...V.schoolLessonsMissed }
      });
    }
  });
  maplebirch.dynamic.regTimeEvent('onThread', 'life-simulation-school-attendance-settle', {
    action: data => {
      const previous = missedLessons.pop();
      if (!previous || !data.exactPoints?.day) return;
      V.lessonmissed = previous.total;
      V.lessonmissedtext = 0;
      Object.assign(V.schoolLessonsMissed, previous.subjects);
    }
  });

  maplebirch.tool.addTo('AfterLinkZone', { widget: 'deadwood-reblooms-life-simulation-school-office-options', passage: "Head's Office" });
  maplebirch.tool.addTo('Journal', 'deadwood-reblooms-life-simulation-school-journal');

  maplebirch.tool.patch.traits.add(
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
    },
    {
      title: 'School Traits',
      name: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:attendancePass:name'),
      colour: 'green',
      has: () => V.LifeSimulation.school.role === 'president',
      text: () => maplebirch.t('deadwood-reblooms:LifeSimulation:school:trait:attendancePass:text')
    }
  );

  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-school-clothes', {
    output: 'deadwood-reblooms-life-simulation-school-restore-clothes',
    cond: () => V.LifeSimulation?.school?.clothesStored === true && V.location !== 'school'
  });
  maplebirch.dynamic.regStateEvent('gate', 'life-simulation-school-dress-enforcement', {
    output: 'deadwood-reblooms-life-simulation-school-enforce-clothes',
    cond: () => V.location === 'school' && maplebirch.LS.school.requiresNudity && V.LifeSimulation?.school?.clothesStored !== true
  });

  const schoolPassages: Record<string, PassagePatch[]> = {
    'School Front Courtyard': [
      {
        // 仅接管通往 Hallways 的原版一分钟入口，保留中庭其余事件与离校选项。
        srcmatch: /<<entranceicon>><<link \[\[[^\]\n]+\|Hallways]]>><<pass 1>><<\/link>>/,
        to: '<<deadwood-reblooms-life-simulation-school-duty-link>><<deadwood-reblooms-life-simulation-school-entry>>',
        expected: 1
      }
    ],
    Hallways: [
      {
        // 储物柜前的链接数随留堂和特殊事件变化，按原版储物柜定位公告栏。
        srcmatch: /<<lockericon>><<link \[\[[^\]\n]+\|School Lockers]]>/,
        applybefore: '<<deadwood-reblooms-life-simulation-school-board-link>>',
        expected: 1
      }
    ]
  };

  maplebirch.tool.inject({
    locationPassage: schoolPassages,
    widgetPassage: {
      Social: [
        {
          // Social 是原版 widget；紧邻学校声望卡片插入，保持原版的双列排版。
          src: '<<relation-box-simple _studentBoxConfig>>',
          applyafter: '\n\t\t\t<<deadwood-reblooms-life-simulation-school-social>>',
          expected: 1
        }
      ]
    }
  });
}
