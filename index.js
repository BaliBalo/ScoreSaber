const fs = require('fs');
const path = require('path');
const express = require('express');
const request = require('request');
const CronJob = require('cron').CronJob;
// const cors = require('cors');
const {
	timetag,
	addUpdateListener,
	getLastUpdate,
	ranked,
	removeDupes
} = require('./utils');
const checkNew = require('./scraper/checkNew');
const removeUnranks = require('./scraper/removeUnranks');
let auth = {};
try {
	auth = require('./data/auth');
} catch(e) {}
const app = express();
const port = 2148;

function checkAuth(req, res, next) {
	let key = req.query.key;
	if (!key) {
		return res.status(401).end('Unauthorized');
	}
	let user = auth && auth.keys && auth.keys[key];
	if (!user) {
		return res.status(401).end('Unauthorized');
	}
	res.locals.user = user;
	next();
}

const paths = {
	index: 'client/index.html',
	peepee: 'client/peepee.html',
	overlay: 'client/overlay.html',
};
Object.keys(paths).forEach(key => paths[key] = path.resolve(paths[key]));

app.set('etag', 'strong');

// app.use(cors());

let serveStaticFiles = express.static('client', { extensions: ['html'] });
app.use(['/client'], serveStaticFiles);
app.get(['/favicon.ico', '/robots.txt'], serveStaticFiles);
app.get('/', (req, res) => res.sendFile(paths.index));
app.get('/peepee', (req, res) => res.sendFile(paths.peepee));
app.get('/overlay', (req, res) => res.sendFile(paths.overlay));
app.use('/proxy', (req, res) => req.pipe(request('https://scoresaber.com' + req.url)).pipe(res));

app.get('/ranked', async (req, res) => {
	// caching already handled by nginx
	let timestamp = await getLastUpdate();
	let after = req.get('If-Modified-Since');
	if (after && timestamp <= +new Date(after)) {
		return res.status(304).end();
	}
	res.append('Last-Modified', new Date(timestamp).toUTCString());
	let list = await ranked.find({});
	res.send({ list, timestamp });
});

let top200 = {
	playlistTitle: 'Top 200 Ranked',
	playlistAuthor: 'ScoreSaber',
	image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	songs: []
};
try {
	let scoresaber200Image = fs.readFileSync(path.resolve('client/scoresaber200.png'));
	top200.image = 'data:image/png;base64,' + Buffer.from(scoresaber200Image).toString('base64');
} catch(e) {}
let top200Update = new Date().toUTCString();
async function updateTop200() {
	try {
		// let query = ranked.find({}).sort({ stars: -1 }).limit(200);
		// let list = await promisify(query.exec.bind(query))();
		let list = await ranked.find({});
		list = list.sort((a, b) => b.stars - a.stars).filter((song, i, self) => self.findIndex(t => t.id === song.id) === i);
		top200.songs = list.slice(0, 200).map(e => ({ hash: e.id, songName: e.name }));
		top200Update = new Date().toUTCString();
	} catch(e) {}
}
addUpdateListener(updateTop200);
// fs.watch(lastUpdateFile, updateTop200);

app.get(/^\/top-?200(\.bplist)?/, (req, res) => {
	res.append('Last-Modified', top200Update);
	res.append('Content-Disposition', 'attachment; filename="top200.bplist"');
	res.send(top200);
});

const execTask = fn => async (req, res) => {
	try {
		console.log(timetag(), 'Manually executing task from ' + req.baseUrl + req.path);
		let result = await fn();
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
app.all('/admin/check-new', checkAuth, execTask(checkNew));
app.all('/admin/check-new/full', checkAuth, execTask(checkNew.full));
app.all('/admin/remove-unranks', checkAuth, execTask(removeUnranks));
app.all('/admin/remove-dupes', checkAuth, execTask(removeDupes));

if (!process.argv.includes('--dev')) {
	new CronJob('0 */5 * * * *', checkNew, null, true);
	new CronJob('0 0 */2 * * *', removeUnranks, null, true);
}

(async function() {
	await updateTop200();
	app.listen(port, () => console.log(timetag(), 'Scoresaber server listening (port '+port+')'));
})();
