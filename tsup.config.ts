import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'deadwood-reblooms': 'src/module/main.ts'
  },
  format: ['esm'],
  outDir: 'dist/types',
  clean: false,
  dts: {
    only: true,
    compilerOptions: {
      ignoreDeprecations: '6.0'
    }
  },
  tsconfig: 'tsconfig.json'
});
