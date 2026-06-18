import path from 'node:path';
import { copyFile, readdir, readFile } from 'node:fs/promises';
import AdmZip from 'adm-zip';
import { load as loadYaml } from 'js-yaml';
import { readPackageJSON } from 'pkg-types';

export interface ScmlPlugin {
  modName: string;
  addonName: string;
  modVersion: string;
  params?: unknown;
}

interface ScmlConfig {
  nickName: unknown;
  alias?: string[];
  dependenceInfo: Array<{ modName: string; version: string }>;
  addonPlugin?: ScmlPlugin[];
}

interface RootPackage {
  name: string;
  version: string;
  scml: ScmlConfig;
}

export interface PackageInfo {
  name: string;
  version: string;
  gameVersion: string;
  baseName: string;
}

export interface PackageAsset {
  fileName: string;
  buffer: Buffer;
}

interface ScanOptions {
  base?: string;
  prefix?: string;
  excludes?: string[];
}

interface TweePatcherRule {
  passage: string;
  findString: string;
  replace?: string;
  replaceFile?: string;
}

interface ReplacePatcherRule {
  from: string;
  to: string;
  fileName: string;
}

interface BootFileLists {
  styleFileList: string[];
  tweeFileList: string[];
  additionFile: string[];
}

interface BeautySelectorParams {
  type: string;
  imgFileList: string[];
}

const BEAUTY_SELECTOR_TYPE = 'Deadwood-Reblooms-Images';

const scriptFileLists = {
  scriptFileList: ['dist/game.js'],
  scriptFileList_preload: ['dist/preload.js'],
  scriptFileList_earlyload: ['dist/earlyload.js'],
  scriptFileList_inject_early: ['dist/inject_early.js', 'dist/spectrum.js']
} as const;

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);
const ADDITION_EXTENSIONS = new Set(['.json', '.yaml', '.yml']);

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

async function scan(dir: string, { base = '', prefix = '', excludes = [] }: ScanOptions = {}): Promise<Map<string, Buffer>> {
  const out = new Map<string, Buffer>();
  try {
    const entries = (await readdir(dir, { withFileTypes: true })).sort((left, right) => left.name.localeCompare(right.name));
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const normalizedFullPath = normalizePath(fullPath);
      if (excludes.some(exclude => entry.name === exclude || normalizedFullPath.includes(exclude))) continue;

      const relPath = normalizePath(path.join(prefix, base, entry.name));
      if (entry.isDirectory()) {
        const subFiles = await scan(fullPath, { base: relPath, excludes });
        subFiles.forEach((buffer, filePath) => out.set(filePath, buffer));
        continue;
      }

      out.set(relPath, await readFile(fullPath));
    }
  } catch {}
  return out;
}

function upsertPlugin(plugins: ScmlPlugin[], match: (plugin: ScmlPlugin) => boolean, next: ScmlPlugin | null, toFront = false): void {
  const index = plugins.findIndex(match);
  if (index === -1) {
    if (!next) return;
    if (toFront) plugins.unshift(next);
    else plugins.push(next);
    return;
  }

  if (!next) return;
  plugins[index] = next;

  if (toFront && index > 0) {
    const [plugin] = plugins.splice(index, 1);
    plugins.unshift(plugin);
  }
}

function parseYamlList<T>(content: string, normalize: (item: Record<string, unknown>) => T | null): T[] {
  try {
    const parsed = loadYaml(content);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => item != null && typeof item === 'object' && !Array.isArray(item))
      .map(normalize)
      .filter((item): item is T => item != null);
  } catch {
    return [];
  }
}

function buildRules(content: string, type: 'twee'): TweePatcherRule[];
function buildRules(content: string, type: 'patcher'): ReplacePatcherRule[];
function buildRules(content: string, type: 'twee' | 'patcher'): Array<TweePatcherRule | ReplacePatcherRule> {
  return parseYamlList(content, item => {
    const source = String(item[type === 'twee' ? 'findString' : 'from'] ?? '');
    const before = typeof item.before === 'string' ? item.before : '';
    const after = typeof item.after === 'string' ? item.after : '';
    const relative = before || after ? `${before}${source}${after}` : undefined;

    if (type === 'patcher') {
      const rule: ReplacePatcherRule = {
        from: source,
        to: typeof item.to === 'string' ? item.to : (relative ?? ''),
        fileName: String(item.fileName ?? '')
      };
      return rule.from && rule.to && rule.fileName ? rule : null;
    }

    const rule: TweePatcherRule = {
      passage: String(item.passage ?? ''),
      findString: source
    };
    if (typeof item.replace === 'string') rule.replace = item.replace;
    else if (typeof item.replaceFile === 'string') rule.replaceFile = item.replaceFile;
    else if (relative != null) rule.replace = relative;
    return rule.passage && rule.findString ? rule : null;
  });
}

function collectImageFiles(files: string[]): string[] {
  return files.filter(filePath => IMAGE_EXTENSIONS.has(path.extname(filePath).toLowerCase()));
}

function BeautySelectorImageFiles(files: string[]): string[] {
  return collectImageFiles(files).filter(filePath => {
    const normalized = normalizePath(filePath);
    if (normalized.startsWith('dist/')) return false;
    return normalized.split('/')[0] === 'img';
  });
}

function AdditionDirs(imgFileList: string[]): string[] {
  const dirs = new Set<string>();
  for (const filePath of imgFileList) {
    const dir = normalizePath(path.dirname(filePath));
    if (!dir || dir === '.' || dir.startsWith('dist/')) continue;
    dirs.add(dir.split('/')[0]);
  }
  return [...dirs].sort();
}

function BeautySelectorParams(imgFileList: string[]): BeautySelectorParams | null {
  if (!imgFileList.length) return null;
  return {
    type: BEAUTY_SELECTOR_TYPE,
    imgFileList: [...imgFileList].sort()
  };
}

function BootFileLists(files: string[]): BootFileLists {
  const styleFileList: string[] = [];
  const tweeFileList: string[] = [];
  const additionFile: string[] = [];

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext)) continue;
    if (ext === '.css') styleFileList.push(filePath);
    else if (ext === '.twee') tweeFileList.push(filePath);
    else if (ADDITION_EXTENSIONS.has(ext)) additionFile.push(filePath);
  }

  return {
    styleFileList,
    tweeFileList,
    additionFile
  };
}

function filterExistingFiles(fileSet: Set<string>, fileList: readonly string[]): string[] {
  return fileList.filter(filePath => fileSet.has(filePath));
}

function buildFrameworkPlugin(distFileSet: Set<string>): ScmlPlugin | null {
  const params: { language: string[]; module?: string[]; script?: string[] } = { language: ['CN', 'EN'] };
  if (distFileSet.has('dist/module.js')) params.module = ['dist/module.js'];
  if (distFileSet.has('dist/script.js')) params.script = ['dist/script.js'];
  if (!params.module && !params.script) return null;
  return {
    modName: 'maplebirch',
    addonName: 'maplebirchAddon',
    modVersion: '^4.1.0',
    params
  };
}

function buildAddonPlugins(
  addonPlugin: ScmlPlugin[],
  distFileSet: Set<string>,
  beautySelectorParams: BeautySelectorParams | null,
  tweePatcherRules: TweePatcherRule[],
  replacePatcherRules: ReplacePatcherRule[]
): ScmlPlugin[] {
  upsertPlugin(addonPlugin, plugin => plugin.modName === 'maplebirch' && plugin.addonName === 'maplebirchAddon', buildFrameworkPlugin(distFileSet), true);

  upsertPlugin(
    addonPlugin,
    plugin => plugin.modName === 'BeautySelectorAddon' && plugin.addonName === 'BeautySelectorAddon',
    beautySelectorParams
      ? {
          modName: 'BeautySelectorAddon',
          addonName: 'BeautySelectorAddon',
          modVersion: '^2.0.0',
          params: beautySelectorParams
        }
      : null
  );

  upsertPlugin(
    addonPlugin,
    plugin => plugin.modName === 'TweeReplacer' && plugin.addonName === 'TweeReplacerAddon',
    tweePatcherRules.length
      ? {
          modName: 'TweeReplacer',
          addonName: 'TweeReplacerAddon',
          modVersion: '1.0.0',
          params: tweePatcherRules
        }
      : null
  );

  upsertPlugin(
    addonPlugin,
    plugin => plugin.modName === 'ReplacePatcher' && plugin.addonName === 'ReplacePatcherAddon',
    replacePatcherRules.length
      ? {
          modName: 'ReplacePatcher',
          addonName: 'ReplacePatcherAddon',
          modVersion: '1.0.0',
          params: {
            js: replacePatcherRules
          }
        }
      : null
  );

  return addonPlugin;
}

export async function resolvePackageInfo(rootDir: string): Promise<PackageInfo> {
  const pkg = (await readPackageJSON(rootDir)) as RootPackage;
  if (!pkg?.name) throw new Error('package.json missing name');
  if (!pkg?.version) throw new Error('package.json missing version');

  const gameVersion = pkg.scml?.dependenceInfo?.find(dep => dep.modName === 'GameVersion')?.version.match(/\d+(\.\d+)*/)?.[0];
  if (!gameVersion) throw new Error('package.json scml.dependenceInfo missing GameVersion');

  return {
    name: pkg.name,
    version: pkg.version,
    gameVersion,
    baseName: `${pkg.name}-${gameVersion}-v${pkg.version}`
  };
}

export function devZipFileName(name: string, version: string): string {
  return `${name}-${version}.mod.zip`;
}

export async function createZip(rootDir: string): Promise<Buffer> {
  const pkg = (await readPackageJSON(rootDir)) as RootPackage;
  if (!pkg?.name || !pkg?.version) throw new Error('package.json missing name/version');
  if (!pkg.scml?.nickName || !Array.isArray(pkg.scml.dependenceInfo)) throw new Error('package.json missing scml.nickName / scml.dependenceInfo');

  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');
  await Promise.all([
    copyFile(path.join(rootDir, 'node_modules', 'spectrum-colorpicker', 'spectrum.js'), path.join(distDir, 'spectrum.js')),
    copyFile(path.join(rootDir, 'node_modules', 'spectrum-colorpicker', 'spectrum.css'), path.join(distDir, 'spectrum.css'))
  ]);

  const [publicFiles, sourceTweeFiles, sourceStyleFiles, distFiles, tweePatcherRulesRaw, replacePatcherRaw] = await Promise.all([
    scan(publicDir),
    scan(path.join(rootDir, 'src', 'twee')),
    scan(path.join(rootDir, 'src', 'styles')),
    scan(distDir, { prefix: 'dist', excludes: ['/types/', '\\types\\'] }),
    readFile(path.join(rootDir, 'src', 'TweeReplacer.yaml'), 'utf8').catch(() => ''),
    readFile(path.join(rootDir, 'src', 'ReplacePatcher.yaml'), 'utf8').catch(() => '')
  ]);

  const zip = new AdmZip();
  publicFiles.forEach((buffer, filePath) => zip.addFile(filePath, buffer));
  sourceTweeFiles.forEach((buffer, filePath) => zip.addFile(filePath, buffer));
  sourceStyleFiles.forEach((buffer, filePath) => zip.addFile(filePath, buffer));
  distFiles.forEach((buffer, filePath) => zip.addFile(filePath, buffer));

  const allFiles = [...publicFiles.keys(), ...sourceTweeFiles.keys(), ...sourceStyleFiles.keys(), ...distFiles.keys()].sort();
  const distFileSet = new Set(distFiles.keys());
  const bootFileLists = BootFileLists(allFiles);
  const beautySelectorImageFiles = BeautySelectorImageFiles(allFiles);
  const beautySelectorParams = BeautySelectorParams(beautySelectorImageFiles);
  const additionDirs = AdditionDirs(beautySelectorImageFiles);
  const tweePatcherRules = buildRules(tweePatcherRulesRaw, 'twee');
  const replacePatcherRules = buildRules(replacePatcherRaw, 'patcher');
  const addonPlugin = buildAddonPlugins(
    Array.isArray(pkg.scml.addonPlugin) ? pkg.scml.addonPlugin.map(plugin => ({ ...plugin })) : [],
    distFileSet,
    beautySelectorParams,
    tweePatcherRules,
    replacePatcherRules
  );

  const boot = {
    name: pkg.name,
    nickName: pkg.scml.nickName,
    alias: pkg.scml.alias ?? [],
    version: pkg.version,

    imgFileList: [],
    styleFileList: bootFileLists.styleFileList,
    tweeFileList: bootFileLists.tweeFileList,
    additionFile: bootFileLists.additionFile,

    scriptFileList: filterExistingFiles(distFileSet, scriptFileLists.scriptFileList),
    scriptFileList_preload: filterExistingFiles(distFileSet, scriptFileLists.scriptFileList_preload),
    scriptFileList_earlyload: filterExistingFiles(distFileSet, scriptFileLists.scriptFileList_earlyload),
    scriptFileList_inject_early: filterExistingFiles(distFileSet, scriptFileLists.scriptFileList_inject_early),

    additionDir: additionDirs,
    additionBinaryFile: [],

    addonPlugin,
    dependenceInfo: pkg.scml.dependenceInfo
  };

  zip.addFile('boot.json', Buffer.from(JSON.stringify(boot, null, 2)));
  return zip.toBuffer();
}

export async function createZipPackage(rootDir: string): Promise<PackageAsset> {
  const info = await resolvePackageInfo(rootDir);
  return {
    fileName: `${info.baseName}.mod.zip`,
    buffer: await createZip(rootDir)
  };
}
