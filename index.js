const path = require('path');
const express = require('express');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const request = require('request');
const CronJob = require('cron').CronJob;
const { timetag } = require('./utils');
const auth = require('./utils/auth');
const ranked = require('./utils/ranked');
const rankedUpdate = require('./utils/ranked/update');
const checkNew = require('./utils/ranked/check-new');
const removeUnranks = require('./utils/ranked/remove-unranks');
const removeDupes = require('./utils/ranked/remove-dupes');
const removePartial = require('./utils/ranked/remove-partial');
const updateStarDiff = require('./utils/ranked/update-star-diff');
const top200 = require('./utils/top200');
const app = express();
const port = 2148;

app.use(cookieParser());
app.set('etag', 'strong');

// Enable only on specific endpoints for which we want cross-origin requests allowed (none for now)
// const cors = require('cors');
// app.use(cors());

let serveStaticFiles = express.static('client', { extensions: ['html'], cacheControl: false });
app.use(['/client'], serveStaticFiles);
app.get(['/favicon.ico', '/robots.txt'], serveStaticFiles);
// Proxy requests (to avoid front-end cross-origin requests issues)
app.use('/proxy', (req, res) => req.pipe(request('https://scoresaber.com' + req.url)).pipe(res));

// Custom urls - if string, makes a client file available at root
//   e.g. 'thing' makes `client/thing.html` available at `/thing`
[
	{ url: '/', file: 'client/index.html' },
	'peepee',
	'overlay',
	'playlist-maker',
].forEach(data => {
	if (typeof data === 'string') {
		data = { url: '/' + data, file: 'client/' + data + '.html' };
	}
	if (!data.url || !data.file) {
		return;
	}
	app.get(data.url, (req, res) => res.sendFile(path.resolve(__dirname, data.file)));
});

app.get('/ranked', async (req, res) => {
	// caching already handled by nginx
	let timestamp = await rankedUpdate.getTime();
	let after = req.get('If-Modified-Since');
	if (after && timestamp <= +new Date(after)) {
		return res.status(304).end();
	}
	res.append('Last-Modified', new Date(timestamp).toUTCString());
	let list = await ranked.find({});
	res.send({ list, timestamp });
});

top200.autoUpdate();
app.get(/^\/top-?200(\.bplist)?/, async (req, res) => {
	let { at, data } = await top200.get();
	res.append('Last-Modified', at);
	res.append('Content-Disposition', 'attachment; filename="top200.bplist"');
	res.send(data);
});

const execTask = (fn, ...args) => async (req, res) => {
	try {
		console.log(timetag(), 'Manually executing task from ' + req.baseUrl + req.path);
		let result = await fn(...args);
		console.log(timetag(), 'Finished executing ' + req.baseUrl + req.path);
		let message = 'Done';
		if (result !== undefined) {
			message += ' - ' + result;
		}
		res.send(message);
	} catch(e) {
		console.log(timetag(), 'Error during task', e);
		res.status(500).send('Error');
	}
};
const limiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100
});
app.all('/admin/check-new', limiter, auth.check, execTask(checkNew, true));
app.all('/admin/check-new/full', limiter, auth.check, execTask(checkNew.full, true));
app.all('/admin/remove-unranks', limiter, auth.check, execTask(removeUnranks));
app.all('/admin/remove-dupes', limiter, auth.check, execTask(removeDupes));
app.all('/admin/remove-partial', limiter, auth.check, execTask(removePartial));
app.all('/admin/update-star-diff', limiter, auth.check, execTask(updateStarDiff));

if (!process.argv.includes('--dev')) {
	new CronJob('0 */5 * * * *', checkNew, null, true);
	new CronJob('0 0 * * * *', removeUnranks, null, true);
}

app.listen(port, () => console.log(timetag(), 'Scoresaber server listening (port ' + port + ')'));
