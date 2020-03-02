const { spawn } = require('child_process');

const script = spawn('bash', ['-c', 'for f in client/*.js; do if [ "$f" != "${f%.min.js}" ] ; then continue; fi; npx terser $f --compress --mangle -o ${f%.js}.min.js; done']);

script.stdout.on('data', data => console.log(data));
script.stderr.on('data', data => console.error(data));
script.on('close', code => {
	console.log('Done - exit code:', code);
	process.exit(code);
});
