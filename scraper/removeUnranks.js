const { timetag, setLastUpdate, ranked } = require('../utils');
const scoresaber = require('./scoresaber');

// const Datastore = require('nedb');
// const ranked = new Datastore({ filename: path.join(__dirname, '../data/ranked.db'), autoload: true });
// const removeRanked = promisify(ranked.remove.bind(ranked));

async function getIdsFromPage(page, list = []) {
	// console.log(timetag(), 'Getting page ' + page);
	let data;
	try {
		data = await scoresaber.ranked(page);
	} catch(e) {}
	if (!data || !data.songs) {
		return;
	}
	let pageSongs = data.songs.map(song => song.uid).filter(e => e);
	list = list.concat(pageSongs);
	if (pageSongs.length) {
		return getIdsFromPage(page + 1, list);
	}
	return list;
}

async function run() {
	let allIds = await getIdsFromPage(1);
	let removed = await ranked.remove({ uid: { $nin: allIds } }, { multiple: true });
	if (removed) {
		console.log(timetag(), 'Removed ' + removed + ' map' + (removed !== 1 ? 's' : '') + ' from ranked list');
		await setLastUpdate();
	}
}

if (require.main === module) {
	run();
} else {
	module.exports = run;
}
