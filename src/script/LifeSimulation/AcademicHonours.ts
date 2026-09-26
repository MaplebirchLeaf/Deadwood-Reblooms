export default function (maplebirch: typeof window.maplebirch) {
  const text = (subject: string, key: 'name' | 'text') => maplebirch.t(`deadwood-reblooms:LifeSimulation:academic:${subject}:${key}`);

  const honours = [
    { subject: 'science', colour: 'green' },
    { subject: 'maths', colour: 'green' },
    { subject: 'english', colour: 'green' },
    { subject: 'history', colour: 'green' }
  ] as const;

  maplebirch.tool.patch.traits.add(
    ...honours.map(({ subject, colour }) => ({
      title: 'School Traits',
      name: () => text(subject, 'name'),
      colour,
      has: () => maplebirch.LS.academics.has(subject),
      text: () => text(subject, 'text')
    }))
  );
}
