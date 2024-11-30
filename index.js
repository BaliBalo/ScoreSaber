const fs = require('fs');
const path = require('path');
const express = require('express');
const { Readable } = require('stream');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const CronJob = require('cron').CronJob;
const { timetag } = require('./utils');
const auth = require('./utils/auth');
const ranked = require('./utils/ranked');
const rankedUpdate = require('./utils/ranked/update');
const checkNew = require('./utils/ranked/check-new');
const removeUnranks = require('./utils/ranked/remove-unranks');
const removeDupes = require('./utils/ranked/remove-dupes');
const removePartial = require('./utils/ranked/remove-partial');
const updateScoresaberValues = require('./utils/ranked/update-scoresaber-values');
const updateStats = require('./utils/ranked/update-stats');
const Playlist = require('./utils/playlist');
const top200 = require('./utils/top200');

const app = express();
const port = 2148;

const isDev = process.argv.includes('--dev');

fs.mkdirSync(path.resolve(__dirname, 'data'), { recursive: true });

app.use(cookieParser());
app.set('etag', 'strong');

// Enable only on specific endpoints for which we want cross-origin requests allowed (none for now)
// const cors = require('cors');
// app.use(cors());

let serveStaticFiles = express.static('client', { extensions: ['html'], cacheControl: false });
app.use(['/client'], serveStaticFiles);
app.get(['/favicon.ico', '/robots.txt'], serveStaticFiles);
// Proxy requests (to avoid front-end cross-origin requests issues)
const proxy = base => async (req, res) => {
	const response = await fetch(base + req.url);
	res.status(response.status);
	Readable.fromWeb(response.body).pipe(res);
};
app.use('/scoresaber-api', proxy('https://scoresaber.com/api'));

// Custom urls - if string, makes a client file available at root
//   e.g. 'thing' makes `client/thing.html` available at `/thing`
[
	{ url: '/', file: 'pages/index.html' },
	'peepee',
	'overlay',
	'playlist-maker',
].forEach((data) => {
	if (typeof data === 'string') {
		data = { url: `/${data}`, file: 'pages/' + data + '.html' };
	}
	if (!data.url || !data.file) {
		return;
	}
	if (isDev) {
		app.get(data.url, async (req, res) => {
			try {
				// TODO: way to disable that? To use compressed files in dev and simulate prod environment
				//   maybe via query string, e.g. /page?compressed
				let content = await fs.promises.readFile(path.resolve(__dirname, data.file), 'utf8');
				content = content.replace(/\/client\/([^"' /]+)\.min\.js/g, '/dev/pages/$1.js');
				res.send(content);
			} catch (e) {
				console.error(e);
				res.sendStatus(500);
			}
		});
	} else {
		app.get(data.url, (req, res) => res.sendFile(path.resolve(__dirname, data.file)));
	}
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

const customPlaylist = new Playlist({ author: 'Peepee' });
let customPlaylistImage = customPlaylist.setImageFromFile(path.resolve(__dirname, 'client/scoresaber.png'));
app.get('/custom-playlist/:filename', async (req, res) => {
	await customPlaylistImage;
	// Make a copy to ensure no weird race conditions
	let pl = new Playlist(customPlaylist);
	if (req.query.t) {
		pl.title = req.query.t;
	}
	if (req.query.s) {
		pl.setSongsFromHashes(req.query.s.split('.').filter(e => e));
	} else if (req.query.i) {
		let uids = req.query.i.split('.').map(e => +e).filter(e => e);
		let fromDb = await ranked.find({ uid: { $in: uids } });
		let maps = fromDb.reduce((o, e) => (o[e.uid] = e, o), {});
		pl.setSongs(uids.map(e => maps[e]).filter(e => e));
	}
	if (!pl.songs.length) {
		return res.status(400).end();
	}
	res.append('Content-Disposition', 'attachment; filename="' + req.params.filename.replace(/"/g, '_') + '"');
	res.set('Cache-Control', 'no-store');
	res.send(pl.toJSON());
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
	} catch (e) {
		console.log(timetag(), 'Error during task', e);
		res.status(500).send('Error');
	}
};
const execLongTask = (fn, ...args) => execTask(() => {
	// do not await the long task
	fn(...args);
});

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 100
});
app.all('/admin/check-new', limiter, auth.check, execTask(checkNew, true));
app.all('/admin/check-new/full', limiter, auth.check, execTask(checkNew.full, true));
app.all('/admin/remove-unranks', limiter, auth.check, execTask(removeUnranks));
app.all('/admin/remove-dupes', limiter, auth.check, execTask(removeDupes));
app.all('/admin/remove-partial', limiter, auth.check, execTask(removePartial));
app.all('/admin/update-scoresaber-values', limiter, auth.check, execTask(updateScoresaberValues, true));
app.all('/admin/update-stats', limiter, auth.check, execLongTask(updateStats, true));

if (isDev) {
	app.use(['/dev/pages'], express.static('pages', { cacheControl: false }));
} else {
	new CronJob('0 */5 * * * *', checkNew, null, true);
	new CronJob('0 6 23 * * *', checkNew.full, null, true);
	new CronJob('0 1 */6 * * *', removeUnranks, null, true);
	new CronJob('0 7 0 * * *', updateStats, null, true);
	new CronJob('0 12 0 * * *', updateScoresaberValues, null, true);
}

app.listen(port, () => console.log(timetag(), 'Scoresaber server listening (port ' + port + ')'));
