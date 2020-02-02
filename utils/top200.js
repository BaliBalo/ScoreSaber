const fs = require('fs');
const path = require('path');
const { once } = require('../utils');
const ranked = require('./ranked');
const rankedUpdate = require('./ranked/update');

let at = new Date().toUTCString();
let data = {
	playlistTitle: 'Top 200 Ranked',
	playlistAuthor: 'ScoreSaber',
	image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
	songs: []
};

async function update() {
	try {
		// let query = ranked.find({}).sort({ stars: -1 }).limit(200);
		// let list = await promisify(query.exec.bind(query))();
		let list = await ranked.find({});
		list = list.sort((a, b) => b.stars - a.stars).filter((song, i, self) => self.findIndex(t => t.id === song.id) === i);
		data.songs = list.slice(0, 200).map(e => ({ hash: e.id, songName: e.name }));
		at = new Date().toUTCString();
	} catch(e) {}
}

const setup = once(async () => {
	try {
		let scoresaber200Image = await fs.promises.readFile(path.resolve(__dirname, 'client/scoresaber200.png'), { encoding: 'base64' });
		data.image = 'data:image/png;base64,' + scoresaber200Image;
	} catch(e) {}
	await update();
});

async function get() {
	await setup();
	return { at, data };
}

module.exports = {
	get,
	update,
	autoUpdate: () => rankedUpdate.addListener(update),
};
