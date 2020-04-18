const { spawn } = require('child_process');

async function run(command) {
	return new Promise((resolve, reject) => {
		const script = spawn('bash', ['-c', command]);
		script.stdout.on('data', data => console.log(data));
		script.stderr.on('data', data => console.error(data));
		script.on('close', code => {
			if (!code) {
				return resolve();
			}
			reject(code);
		});
	});
}

(async () => {
	if (!process.argv.includes('--watch')) {
		try {
			await run('for f in pages/*.js; do npx terser "$f" --compress --mangle -o client/$(basename "$f" .js).min.js; done');
		} catch(code) {
			console.log('Error - exit code:', code);
			return process.exit(code);
		}
		console.log('All JS files compressed!');
		return process.exit();
	}

	// Watch mode
	const path = require('path');
	const chokidar = require('chokidar');
	let recompile = async file => {
		try {
			await run('npx terser "' + file + '" --compress --mangle -o "' + path.resolve(__dirname, 'client', path.basename(file, '.js') + '.min.js') + '"');
			console.log('Recompiled ' + file);
		} catch(code) {
			console.log('Error compiling ' + file + ' - code:', code);
		}
	};
	chokidar.watch('pages/*.js').on('change', recompile).on('add', recompile);
	console.log('Watching JS files!');
})();
