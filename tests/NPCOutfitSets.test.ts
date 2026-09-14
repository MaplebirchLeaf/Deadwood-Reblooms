import { expect, test } from 'bun:test';
import NPCOutfitSets from '../src/script/NamedNPCSidebarPortrait/NPCOutfitSets';

test('registers outfit-set initialization for all configured NPCs', () => {
  const callbacks: Array<() => void> = [];

  NPCOutfitSets({ tool: { onInit: (callback: () => void) => callbacks.push(callback) } } as never);

  expect(callbacks).toHaveLength(4);
});
