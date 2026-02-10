const { spawnSync } = require('child_process');

const PRETTIER_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.json',
  '.css',
  '.scss',
  '.html',
  '.md',
  '.yml',
  '.yaml',
]);

function getChangedFiles() {
  const diff = spawnSync(
    'git',
    ['diff', '--name-only', '-z', '--diff-filter=ACMRTUXB', 'HEAD'],
    { encoding: 'utf8' }
  );

  if (diff.status !== 0) {
    process.stderr.write(diff.stderr || 'Failed to list changed files.\n');
    process.exit(diff.status || 1);
  }

  return diff.stdout
    .split('\0')
    .filter(Boolean)
    .filter((file) => {
      const dotIndex = file.lastIndexOf('.');
      if (dotIndex === -1) return false;
      const ext = file.slice(dotIndex).toLowerCase();
      return PRETTIER_EXTENSIONS.has(ext);
    });
}

const files = getChangedFiles();

if (files.length === 0) {
  process.stdout.write('No changed files to check with Prettier.\n');
  process.exit(0);
}

const prettier = spawnSync('npx', ['prettier', '--check', ...files], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(prettier.status || 0);
