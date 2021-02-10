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

const filePattern = 'pages/*.js';
const command = (file) => 'npx terser "' + file + '" --compress --mangle -o "client/$(basename "' + file + '" .js).min.js"';

(async () => {
	if (!process.argv.includes('--watch')) {
		try {
			await run('for f in ' + filePattern + '; do ' + command('$f') + '; done');
		} catch(code) {
			console.log('Error - exit code:', code);
			return process.exit(code);
		}
		console.log('All JS files compressed!');
		return process.exit();
	}

	// Watch mode
	const chokidar = require('chokidar');
	let recompile = async file => {
		try {
			await run(command(file));
			console.log('Recompiled ' + file);
		} catch(code) {
			console.log('Error compiling ' + file + ' - code:', code);
		}
	};
	chokidar.watch(filePattern).on('change', recompile).on('add', recompile);
	console.log('Watching JS files!');
})();
