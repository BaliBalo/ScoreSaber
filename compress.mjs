import { resolve as resolvePath, basename } from 'node:path';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fork } from 'node:child_process';
import { minify } from 'terser';
import { compile, compileAsync } from 'sass';
import chokidar from 'chokidar';

const WATCH = process.argv.includes('--watch');
const SERVE = process.argv.includes('--serve');
const SRC_FOLDER = resolvePath(import.meta.dirname, './pages');
const DEST_FOLDER = resolvePath(import.meta.dirname, './client');

async function compileJS(file) {
	try {
		let result = await minify(await readFile(file, 'utf8'), { toplevel: true, compress: { ecma: '2020' } });
		let dest = resolvePath(DEST_FOLDER, basename(file, '.js') + '.min.js');
		await writeFile(dest, result.code, 'utf8');
		console.log('[JS] Compiled ' + basename(file));
	} catch (e) {
		console.log('[JS] Error compiling ' + file, e);
		if (!WATCH) throw e;
	}
}
async function compileCSS(file) {
	try {
		const fn = WATCH ? compileAsync : compile;
		let result = await fn(file, { style: 'compressed' });
		let dest = resolvePath(DEST_FOLDER, basename(file, '.scss') + '.css');
		await writeFile(dest, result.css, 'utf8');
		console.log('[CSS] Compiled ' + basename(file));
	} catch (e) {
		console.log('[CSS] Error compiling ' + file, e);
		if (!WATCH) throw e;
	}
}

let actions = [
	{ pattern: /\.js$/i, action: compileJS },
	{ pattern: /\.scss$/i, action: compileCSS }
];
async function processFile(path) {
	let matchingActions = actions.filter(({ pattern }) => pattern.test(path));
	return Promise.all(matchingActions.map(({ action }) => action(path)));
}

(async () => {
	if (!WATCH) {
		try {
			const files = await readdir(SRC_FOLDER);
			const fullFiles = files.map(filename => resolvePath(SRC_FOLDER, filename));
			await Promise.all(fullFiles.map(processFile));
		} catch (error) {
			console.log('Error:', error);
			return process.exit(typeof error === 'number' ? error : undefined);
		}
		console.log('All files compressed!');
		return;
	}

	// Watch mode
	chokidar.watch(SRC_FOLDER).on('change', processFile).on('add', processFile);
	console.log('Watching files for changes!');

	if (SERVE) {
		fork('index.js', ['--dev']);
	}
})();
