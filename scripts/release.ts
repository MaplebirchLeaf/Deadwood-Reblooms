import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const legacyBranch = 'dol-v0.5.11.9';
const version = JSON.parse(await Bun.file(`${root}/package.json`).text()).version as string;

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] }).trim();
}

function packageAt(ref: string): { version: string; scml: { dependenceInfo: { modName: string; version: string }[] } } {
  return JSON.parse(git('show', `${ref}:package.json`));
}

function gameVersion(pkg: ReturnType<typeof packageAt>): string | undefined {
  return pkg.scml.dependenceInfo.find(item => item.modName === 'GameVersion')?.version;
}

if (git('branch', '--show-current') !== 'main') throw new Error('Run bun release from the main branch.');
if (git('status', '--porcelain')) throw new Error('Commit all release changes before running bun release.');

const legacy = packageAt(legacyBranch);
const current = packageAt('main');
const releaseTag = `v${version}`;
const legacyTag = `dol-0.5.11.9-${releaseTag}`;

if (legacy.version !== version) throw new Error(`Unexpected legacy package version: ${legacy.version}`);
if (current.version !== version) throw new Error(`Unexpected main package version: ${current.version}`);
if (gameVersion(current) !== '>=0.5.12.13' || gameVersion(legacy) !== '>=0.5.11.9') throw new Error('The two branches do not target the expected game versions.');
if (!Bun.file(`${root}/.github/release-notes/${releaseTag}.md`).size) throw new Error(`Missing release notes for ${releaseTag}.`);

for (const file of ['src/module/LifeSimulation.ts', 'src/module/VanillaPlus/RealEstate.ts', 'src/twee/LifeSimulation/Gym.twee', 'src/twee/RealEstate.twee']) {
  if (git('show', `main:${file}`) !== git('show', `${legacyBranch}:${file}`)) throw new Error(`Commit the shared ${file} changes on both branches before release.`);
}
for (const ref of ['main', legacyBranch]) {
  for (const asset of ['public/img/misc/icon/gym.png', 'public/img/misc/locations/gym/base.png', 'public/img/misc/locations/gym/snow.png', 'public/img/misc/locations/gym/emissive.png']) {
    git('cat-file', '-e', `${ref}:${asset}`);
  }
}

const tagCommit = (tag: string): string | null => {
  try {
    git('show-ref', '--verify', '--quiet', `refs/tags/${tag}`);
    return git('rev-parse', `${tag}^{commit}`);
  } catch {
    return null;
  }
};

for (const [tag, ref, message] of [
  [legacyTag, legacyBranch, `Deadwood Reblooms ${releaseTag} for DoL 0.5.11.9`],
  [releaseTag, 'main', `Deadwood Reblooms ${releaseTag}`]
]) {
  const commit = git('rev-parse', ref);
  const existing = tagCommit(tag);
  if (existing && existing !== commit) throw new Error(`${tag} points to a different commit.`);
  if (!existing) git('tag', '-a', tag, '-m', message, ref);
}

// 同一次推送同时发布两个源码分支和标签，主标签触发 CI 时旧版标签已可检出。
git('push', '--atomic', 'origin', `refs/heads/${legacyBranch}`, 'refs/heads/main', `refs/tags/${legacyTag}`, `refs/tags/${releaseTag}`);
console.log(`Pushed ${releaseTag} and ${legacyTag}. The release workflow will build both game versions.`);
