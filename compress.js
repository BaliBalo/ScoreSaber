const path = require('path');
const fs = require('fs').promises;
const util = require('util');
// const { spawn } = require('child_process');
const { fork } = require('child_process');
const { minify } = require('terser');
const sass = util.promisify(require('node-sass').render);
const glob = util.promisify(require('glob'));

async function compileJS(file) {
	try {
		let result = await minify(await fs.readFile(file, 'utf8'));
		let dest = path.resolve(__dirname, 'client', path.basename(file, '.js') + '.min.js');
		await fs.writeFile(dest, result.code, 'utf8');
		console.log('[JS] Compiled ' + file);
	} catch (e) {
		console.log('[JS] Error compiling ' + file, e);
	}
}
async function compileCSS(file) {
	try {
		let result = await sass({ file, outputStyle: 'compressed' });
		let dest = path.resolve(__dirname, 'client', path.basename(file, '.scss') + '.css');
		await fs.writeFile(dest, result.css, 'utf8');
		console.log('[CSS] Compiled ' + file);
	} catch (e) {
		console.log('[CSS] Error compiling ' + file, e);
	}
}

let patterns = [
	{ pattern: 'pages/*.js', action: compileJS },
	{ pattern: 'pages/*.scss', action: compileCSS }
];

(async () => {
	if (!process.argv.includes('--watch')) {
		try {
			await Promise.all(patterns.map(async ({ pattern, action }) => {
				let files = await glob(pattern);
				for (let file of files) {
					await action(file);
				}
			}));
		} catch (code) {
			console.log('Error - exit code:', code);
			return process.exit(code);
		}
		console.log('All files compressed!');
		return;
	}

	// Watch mode
	const chokidar = require('chokidar');
	patterns.forEach(({ pattern, action }) => {
		chokidar.watch(pattern).on('change', action).on('add', action);
	});
	console.log('Watching files!');

	if (process.argv.includes('--serve')) {
		fork('index.js', ['--dev']);
	}
})();
