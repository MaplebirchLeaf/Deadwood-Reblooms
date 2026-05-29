import path from 'node:path';
import { existsSync } from 'node:fs';
import { rspack, type Configuration } from '@rspack/core';
import { production } from './scripts/production';

const entryNames = ['module', 'script', 'game', 'preload', 'earlyload', 'inject_early'] as const;

type EntryName = (typeof entryNames)[number];

function resolveEntry(rootDir: string, name: EntryName): string | null {
  const entryPath = path.join(rootDir, 'src', name, 'main.ts');
  return existsSync(entryPath) ? entryPath : null;
}

function resolveEntries(rootDir: string): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const entryName of entryNames) {
    const entry = resolveEntry(rootDir, entryName);
    if (entry) entries[entryName] = entry;
  }
  return entries;
}

const rootDir = __dirname;

export default (_env: unknown, argv: { mode?: string }): Configuration => {
  const isProduction = argv.mode === 'production';
  const entry = resolveEntries(rootDir);
  if (Object.keys(entry).length === 0) throw new Error('No rspack entries found. Add one of src/module/main.ts, src/script/main.ts, src/game/main.ts, src/preload/main.ts, src/earlyload/main.ts, or src/inject_early/main.ts.');

  const config: Configuration = {
    entry,
    output: {
      path: path.resolve(rootDir, 'dist'),
      filename: '[name].js',
      clean: true
    },
    devtool: isProduction ? false : 'inline-source-map',
    resolve: {
      extensions: ['.ts', '.js', '.twee'],
      alias: {
        '@': path.resolve(rootDir, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.(css|twee)$/,
          resourceQuery: /raw/,
          type: 'asset/source'
        },
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: { parser: { syntax: 'typescript' } },
              env: { targets: '> 0.5%, not dead, not ie 11' }
            }
          },
          type: 'javascript/auto'
        }
      ]
    },
    performance: { hints: false }
  };

  return isProduction ? { ...config, ...production(rspack) } : config;
};
