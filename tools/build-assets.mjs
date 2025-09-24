import { build as esbuild } from 'esbuild';
import chokidar from 'chokidar';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import cssnano from 'cssnano';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const scriptsDir = path.join(srcDir, 'scripts');
const outDir = path.join(root, 'public', 'assets');
const cssEntries = [
  {
    source: path.join(srcDir, 'css', 'style.css'),
    destination: path.join(outDir, 'styles.min.css'),
  },
  {
    source: path.join(srcDir, 'css', 'lem-quote.css'),
    destination: path.join(outDir, 'lem-quote.min.css'),
  },
];

const scriptEntries = [
  {
    entry: path.join(scriptsDir, 'nav.js'),
    outfile: path.join(outDir, 'nav.min.js'),
    bundle: true,
    format: 'esm',
  },
  {
    entry: path.join(scriptsDir, 'includes.js'),
    outfile: path.join(outDir, 'js', 'includes.js'),
    bundle: false,
  },
  {
    entry: path.join(scriptsDir, 'review-schema.js'),
    outfile: path.join(outDir, 'js', 'review-schema.js'),
    bundle: false,
  },
];

const args = new Set(process.argv.slice(2));
const watchMode = args.has('--watch');
const withSourceMaps = args.has('--sourcemap');

const log = (message) => console.log(`[assets] ${message}`);

async function ensureOutDir() {
  await fs.mkdir(outDir, { recursive: true });
}

async function buildScripts() {
  await ensureOutDir();
  await Promise.all(
    scriptEntries.map(async ({ entry, outfile, bundle, format }) => {
      await fs.mkdir(path.dirname(outfile), { recursive: true });
      const options = {
        entryPoints: [entry],
        bundle,
        minify: true,
        sourcemap: withSourceMaps,
        outfile,
        target: 'es2018',
        platform: 'browser',
        logLevel: 'silent',
        legalComments: 'none',
      };

      if (format && bundle) {
        options.format = format;
      }

      await esbuild(options);
      log(`Built ${path.relative(root, outfile)}`);
    }),
  );
}

async function buildStyles() {
  await ensureOutDir();
  await Promise.all(
    cssEntries.map(async ({ source, destination }) => {
      const css = await fs.readFile(source, 'utf8');
      const result = await postcss([cssnano({ preset: 'default' })]).process(css, {
        from: source,
        to: destination,
      });
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, result.css, 'utf8');
      log(`Built ${path.relative(root, destination)}`);
    }),
  );
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
