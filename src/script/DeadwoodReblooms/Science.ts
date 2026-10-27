// ./src/script/DeadwoodReblooms/Science.ts

export default function (maplebirch: typeof window.maplebirch): void {
  // 只在原版首次条件之前加裸体差分，其余衣着状态仍走原版课堂流程。
  maplebirch.tool.inject({
    locationPassage: {
      'Science Event3': [
        {
          src: '<<if $scienceprogression gte 4',
          to: '<<if $scienceprogression gte 1 and $delinquency gte 10 and ["over_upper", "over_lower", "upper", "lower", "under_upper", "under_lower"].every(slot => $worn[slot].type.includes("naked"))>><<deadwood-science-already-undressed>><<elseif $scienceprogression gte 4',
          expected: 1
        }
      ],
      'Science Undress': [
        // 专属页面只提供当次场景上下文，原版衣着分支与数值仍由原文处理。
        {
          srcmatch: /<<nervously>>[^<\r\n，,]*[，,]/g,
          to: '<<if $passage is "Deadwood Science Demonstration">><<nervously>><<lanSwitch " stand before the class," "站在全班面前，">><<else>>$&<</if>>',
          expected: 5
        },
        {
          srcmatch: /<<person1>>(?:(?!<br><br>)[\s\S])*?(?:Don't forget your clothes|别忘了你的衣服)(?:(?!<br><br>)[\s\S])*?(?=<br><br>)/g,
          to: '<<if $passage is "Deadwood Science Demonstration">><<deadwood-science-return>><<else>>$&<</if>>',
          expected: 3
        },
        {
          srcmatch: /<<link \[\[([^\]]+)\|Science Undress Desk\]\]>>/g,
          to: '<<link "$1" `$passage is "Deadwood Science Demonstration" ? "Deadwood Science Desk" : "Science Undress Desk"`>>',
          expected: 4
        },
        {
          srcmatch: /<<link \[\[([^\]]+)\|Science Refusal\]\]>>/g,
          to: '<<link "$1" `$passage is "Deadwood Science Demonstration" ? "Deadwood Science Refusal" : "Science Refusal"`>>',
          expected: 2
        }
      ],
      'Science Undress Desk': [
        {
          srcmatch: /<<person1>>(?:(?!<br><br>)[\s\S])*?(?:Don't forget your clothes|别忘了你的衣服)(?:(?!<br><br>)[\s\S])*?(?=<br><br>)/g,
          to: '<<if $passage is "Deadwood Science Desk">><<deadwood-science-return>><<else>>$&<</if>>',
          expected: 1
        }
      ],
      'Science Refusal': [
        {
          srcmatch: /((?:<<if \$phase is 3>>|<<elseif \$phase is 4>>)\s*)([\s\S]*?)(?=<br><br>)/g,
          to: '$1<<if $passage is "Deadwood Science Refusal">><<deadwood-science-refusal>><<else>>$2<</if>>',
          expected: 2
        }
      ]
    }
  });
}
