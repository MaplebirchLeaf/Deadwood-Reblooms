import { describe, expect, test } from 'bun:test';
import { load as loadYaml } from 'js-yaml';

async function outfit(key: string): Promise<Record<string, any>> {
  const path = new URL(`../public/named-npc-clothes/${key}.yaml`, import.meta.url);
  return (loadYaml(await Bun.file(path).text()) as Record<string, Record<string, any>>)[key];
}

describe('Sydney footwear', () => {
  test('pairs temple robes with suitable shoes', async () => {
    expect((await outfit('nun_habit')).feet?.name).toBe('sandals');
    expect((await outfit('monk_habit')).feet?.name).toBe('sandals');
    expect((await outfit('initiate_robes')).feet?.name).toBe('sandals');
    expect((await outfit('sexy_nun_habit')).feet?.name).toBe('sandals');
  });

  test('keeps swimwear and adult-shop costumes barefoot', async () => {
    for (const key of ['school_swim_shorts', 'school_swimsuit', 'beach_shorts', 'bikini', 'speedo', 'microkini', 'cow_onesie', 'babydoll_lingerie']) {
      expect((await outfit(key)).feet).toBeUndefined();
    }
  });
});
