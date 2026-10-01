import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await Bun.file(`${root}/package.json`).text()) as { version: string; scml: { dependenceInfo: { modName: string; version: string }[] } };
const releaseTag = `v${pkg.version}`;

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'] }).trim();
}

if (git('branch', '--show-current') !== 'main') throw new Error('Run bun release from the main branch.');
if (git('status', '--porcelain')) throw new Error('Commit all release changes before running bun release.');
if (pkg.scml.dependenceInfo.find(item => item.modName === 'GameVersion')?.version !== '>=0.5.12.13') throw new Error('The release must target DoL 0.5.12.13.');
if (!Bun.file(`${root}/.github/release-notes/${releaseTag}.md`).size) throw new Error(`Missing release notes for ${releaseTag}.`);

let tagged: string | null = null;
try {
  tagged = git('rev-parse', `${releaseTag}^{commit}`);
} catch {
  // 首次发布时尚未创建标签。
}
if (tagged && tagged !== git('rev-parse', 'HEAD')) throw new Error(`${releaseTag} points to a different commit.`);
if (!tagged) git('tag', '-a', releaseTag, '-m', `Deadwood Reblooms ${releaseTag}`);

git('push', '--atomic', 'origin', 'refs/heads/main', `refs/tags/${releaseTag}`);
console.log(`Pushed ${releaseTag}. The release workflow will build DoL 0.5.12.13 and the optional audio package.`);
