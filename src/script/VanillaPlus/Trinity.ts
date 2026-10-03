// ./src/script/VanillaPlus/Trinity.ts

export default function (maplebirch: typeof window.maplebirch) {
  // 复用原版本次祈祷的 $rng。81–90 共十个结果，保留三种原版存在的区间。
  maplebirch.tool.inject({
    locationPassage: {
      'Temple Prayer': [
        {
          src: '<<if $rng is 100 or $rng gte 91 and $worn.neck.name is "holy pendant">>',
          to:
            '<<if maplebirch.get("VanillaPlus").divineTransformations.canContact and $rng gte 81 and $rng lte 90>>' +
            '<<deadwood-trinity-contact>>' +
            '<<elseif $rng is 100 or $rng gte 91 and $worn.neck.name is "holy pendant">>' +
            '<<run maplebirch.get("VanillaPlus").divineTransformations.record("holy")>>',
          expected: 1
        },
        {
          src: '<<elseif $rng is 99 or $rng gte 91 and $worn.neck.name is "stone pendant">>',
          applyafter: '<<run maplebirch.get("VanillaPlus").divineTransformations.record("stone")>>',
          expected: 1
        },
        {
          src: '<<elseif $rng is 98 or $rng gte 91 and $worn.neck.name is "dark pendant">>',
          applyafter: '<<run maplebirch.get("VanillaPlus").divineTransformations.record("dark")>>',
          expected: 1
        }
      ]
    }
  });

  maplebirch.tool.patch.traits.add({
    title: 'Special Traits',
    name: () => maplebirch.t('deadwood-reblooms:VanillaPlus:divineTransformations:trait:trinity:name'),
    colour: 'deadwood-trinity',
    has: () => maplebirch.get('VanillaPlus')!.divineTransformations.trinity,
    text: () => maplebirch.t('deadwood-reblooms:VanillaPlus:divineTransformations:trait:trinity:text')
  });
}
