const { timetag, setLastUpdate, ranked } = require('../utils');
const scoresaber = require('./scoresaber');

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
	if (!allIds) {
		return console.log('Error getting list of map ids');
	}
	let condition = { uid: { $nin: allIds } };
	let toRemove = await ranked.find(condition);
	if (toRemove.length) {
		await ranked.remove(condition, { multi: true });
		await setLastUpdate();

		let desc = toRemove.map(song => '  - ' + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), 'Removed ' + toRemove.length + ' map' + (toRemove.length > 1 ? 's' : '') + ' from ranked list:\n' + desc.join('\n'));
	}
}

if (require.main === module) {
	run();
} else {
	module.exports = run;
}
