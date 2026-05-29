import path from 'node:path';
import { rm } from 'node:fs/promises';

async function clean(rootDir: string) {
  const distDir = path.join(rootDir, 'dist');
  const packageDir = path.join(rootDir, 'package');
  await rm(distDir, { recursive: true, force: true });
  console.log('✓ dist目录已清理');
  await rm(packageDir, { recursive: true, force: true });
  console.log('✓ package目录已清理');
}

async function prep() {
  const rootDir = path.join(import.meta.dir, '..');
  try {
    await clean(rootDir);
  } catch (err) {
    console.error('构建准备阶段出错:', err);
    process.exit(1);
  }
}

void prep();