const path = require('path');
const { once } = require('../utils');
const Playlist = require('./playlist');
const ranked = require('./ranked');
const rankedUpdate = require('./ranked/update');

let at = new Date().toUTCString();
let playlist = new Playlist({ title: 'Top 200 Ranked', author: 'ScoreSaber' });

async function update() {
	try {
		// let query = ranked.find({}).sort({ stars: -1 }).limit(200);
		// let list = await promisify(query.exec.bind(query))();
		let list = await ranked.find({});
		playlist.setSongs(list.sort((a, b) => b.stars - a.stars), 200);
		at = new Date().toUTCString();
	} catch(e) {}
}

const setup = once(async () => {
	try {
		await playlist.setImageFromFile(path.resolve(__dirname, '../client/scoresaber200.png'));
	} catch(e) {}
	await update();
});

async function get() {
	await setup();
	return { at, data: playlist.toJSON() };
}

module.exports = {
	get,
	update,
	autoUpdate: () => rankedUpdate.addListener(update),
};
