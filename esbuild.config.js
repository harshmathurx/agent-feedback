const esbuild = require('esbuild');
const { sassPlugin } = require('esbuild-sass-plugin');

const watch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: {
    content: './src/content/index.ts',
    background: './src/background/service-worker.ts',
  },
  bundle: true,
  outdir: './build',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: !watch,
  plugins: [sassPlugin()],
};

if (watch) {
  esbuild.context(buildOptions).then(ctx => {
    ctx.watch();
    console.log('👀 Watching for changes...');
  });
} else {
  esbuild.build(buildOptions).then(() => {
    console.log('✅ Build complete');
  });
}
