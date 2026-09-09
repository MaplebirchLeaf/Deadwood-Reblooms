// ./src/module/constants.ts

export const version = maplebirch.modUtils.getMod('deadwood-reblooms')!.version;

export const defaults: {
  rand: {
    seed: null;
    history: never[];
    index: number;
  };
  wardrobeSearch: string;
  activeTab: string;
} = {
  rand: {
    seed: null,
    history: [],
    index: 0
  },
  wardrobeSearch: '',
  activeTab: 'Hint'
};
