import { build as esbuild } from 'esbuild';
import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import cssnano from 'cssnano';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const cssSrc = path.join(srcDir, 'css', 'style.css');
const scriptsDir = path.join(srcDir, 'scripts');
const outDir = path.join(root, 'public', 'assets');
const jsOut = path.join(outDir, 'nav.min.js');
const cssOut = path.join(outDir, 'styles.min.css');

const args = new Set(process.argv.slice(2));
const watchMode = args.has('--watch');
const withSourceMaps = args.has('--sourcemap');

const log = (message) => console.log(`[assets] ${message}`);

async function ensureOutDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function buildScripts() {
  await ensureOutDir();
  await esbuild({
    entryPoints: [path.join(scriptsDir, 'nav.js')],
    bundle: true,
    minify: true,
    sourcemap: withSourceMaps,
    outfile: jsOut,
    target: 'es2018',
    format: 'esm',
  });
  log(`Built ${path.relative(root, jsOut)}`);
}

async function buildStyles() {
  await ensureOutDir();
  const source = await fs.readFile(cssSrc, 'utf8');
  const result = await postcss([
    tailwindcss({ config: path.join(root, 'tailwind.config.cjs') }),
    autoprefixer(),
    cssnano({ preset: 'default' }),
  ]).process(source, {
    from: cssSrc,
    to: cssOut,
  });
  await fs.writeFile(cssOut, result.css, 'utf8');
  log(`Built ${path.relative(root, cssOut)}`);
}

async function buildAll(reason = 'manual run') {
  log(`Starting build (${reason})`);
  await Promise.all([buildScripts(), buildStyles()]);
  log('Build complete');
}

function watch() {
  const watcher = chokidar.watch(
    [path.join(scriptsDir, '**/*.{js,ts}'), path.join(srcDir, 'css', '**/*.css')],
    { ignoreInitial: true },
  );

  watcher.on('all', async (event, filePath) => {
    const relative = path.relative(root, filePath);
    try {
      if (relative.endsWith('.css')) {
        await buildStyles();
      } else {
        await buildScripts();
      }
    } catch (error) {
      console.error(`[assets] Build failed for ${relative}:`, error);
    }
  });

  log('Watching for changes…');
}

const run = async () => {
  try {
    await buildAll(watchMode ? 'watch initial build' : 'manual run');
  } catch (error) {
    console.error('[assets] Build failed:', error);
    process.exitCode = 1;
    if (!watchMode) {
      return;
    }
  }

  if (watchMode) {
    watch();
    // keep process alive
    await new Promise(() => {});
  }
};

run();
