const { timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const scoresaber = require('../../utils/scoresaber');

async function getIdsFromPage(page, list = []) {
	// console.log(timetag(), 'Getting page ' + page);
	let data;
	try {
		data = await scoresaber.ranked(page, ~~(Date.now() / 3600000));
	} catch(e) {}
	if (!data?.leaderboards) {
		return;
	}
	let ids = data.leaderboards.map(song => song.id).filter(e => e);
	list = list.concat(ids);
	if (ids.length) {
		return getIdsFromPage(page + 1, list);
	}
	return list;
}

async function run() {
	let allIds = await getIdsFromPage(1);
	if (!allIds) {
		return console.log(timetag(), '(remove-unranks) Error getting list of map ids');
	}
	let condition = { uid: { $nin: allIds } };
	let toRemove = await ranked.find(condition);
	if (toRemove.length) {
		await ranked.remove(condition, { multi: true });
		await rankedUpdate.setTime();

		let desc = toRemove.map(song => '  - ' + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), 'Removed ' + toRemove.length + ' map' + (toRemove.length > 1 ? 's' : '') + ' from ranked list:\n' + desc.join('\n'));
	}
}

if (require.main === module) {
	run();
} else {
	module.exports = run;
}
