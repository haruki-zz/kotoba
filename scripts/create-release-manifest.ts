import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

type ReleaseFile = {
  path: string;
  size: number;
  sha256: string;
};

const walkFiles = (root: string): string[] => {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath);
    }
    return [fullPath];
  });

  return files;
};

const hashFile = (filePath: string) => {
  const hash = crypto.createHash('sha256');
  const content = fs.readFileSync(filePath);
  hash.update(content);
  return hash.digest('hex');
};

const resolveGitSha = () => {
  const envSha = process.env.GITHUB_SHA;
  if (envSha) return envSha;

  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch {
    return 'unknown';
  }
};

function run() {
  const workspaceRoot = process.cwd();
  const pkgPath = path.join(workspaceRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { name: string; version: string };

  const distDir = path.join(workspaceRoot, 'dist', 'renderer');
  if (!fs.existsSync(distDir)) {
    throw new Error('dist/renderer does not exist. Run `pnpm build` first.');
  }

  const files: ReleaseFile[] = walkFiles(distDir)
    .map((absolutePath) => {
      const relPath = path.relative(workspaceRoot, absolutePath).split(path.sep).join('/');
      const stat = fs.statSync(absolutePath);

      return {
        path: relPath,
        size: stat.size,
        sha256: hashFile(absolutePath),
      };
    })
    .sort((a, b) => a.path.localeCompare(b.path));

  const manifest = {
    name: pkg.name,
    version: pkg.version,
    gitSha: resolveGitSha(),
    generatedAt: new Date().toISOString(),
    fileCount: files.length,
    totalSize: files.reduce((sum, file) => sum + file.size, 0),
    files,
  };

  const outputDir = path.join(workspaceRoot, 'dist', 'release');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `manifest-v${pkg.version}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));

  // eslint-disable-next-line no-console
  console.log(`[release] Manifest written to ${outputPath}`);
}

try {
  run();
} catch (error) {
  // eslint-disable-next-line no-console
  console.error('[release] Failed to build release manifest', error);
  process.exit(1);
}
