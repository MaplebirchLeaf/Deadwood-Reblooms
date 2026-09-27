import path from 'node:path';
import os from 'node:os';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { modPackageInfo } from './zip';

const rootDir = path.join(import.meta.dir, '..');
const tool = path.join(rootDir, 'tools/dol-mod-protection-tools/src/zip-to-modpack.ts');
const packageDir = path.join(rootDir, 'package');
const info = await modPackageInfo(rootDir);
const zipNames = [`${info.baseName}.mod.zip`, `${info.name}-audio-${info.gameVersion}-v${info.version}.mod.zip`];
const temporaryDir = await mkdtemp(path.join(os.tmpdir(), 'deadwood-protected-release-'));

try {
  for (const zipName of zipNames) {
    const input = path.join(packageDir, zipName);
    const output = input.replace(/\.mod\.zip$/, '.modpack');
    await stat(input);

    // 无凭证模式仍需工具生成 auth.json。生成的私钥只写进临时目录，永不进入 Release 产物。
    const child = Bun.spawn(
      [process.execPath, 'run', tool, '--input', input, '--out', output, '--auto-auth', '--no-credential-password', '--keys-out', path.join(temporaryDir, `${zipName}.keys.json`)],
      { cwd: rootDir, stdout: 'inherit', stderr: 'inherit' }
    );
    if ((await child.exited) !== 0) throw new Error(`加密失败: ${zipName}`);
    if ((await stat(output)).size === 0) throw new Error(`加密产物为空: ${output}`);
    console.log(`Protected release package: ${output}`);
  }
} finally {
  await rm(temporaryDir, { recursive: true, force: true });
}
