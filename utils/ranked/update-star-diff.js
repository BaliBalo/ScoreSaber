const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const scoresaber = require('../../utils/scoresaber');

async function getDataFromPage(page, list = []) {
	let data;
	try {
		data = await scoresaber.ranked(page, ~~(Date.now() / 3600000));
	} catch(e) {}
	if (!data || !data.songs) {
		return;
	}
	let pageSongs = data.songs.map(song => ({ uid: song.uid, stars: song.stars, pp: song.stars * ranked.PP_PER_STAR })).filter(e => e && e.uid);
	list = list.concat(pageSongs);
	if (pageSongs.length) {
		return getDataFromPage(page + 1, list);
	}
	return list;
}

async function updateStarDiff() {
	console.log(timetag(), 'Started update of all star diff and PP values');

	let allData = await getDataFromPage(1);
	if (!allData) {
		return console.log(timetag(), '(update-star-diff) Error getting list of maps data');
	}

	await promiseSequence(allData, async ({ uid, ...update }) => {
		const result = await ranked.update({ uid }, { $set: update });
		if (result !== 1) {
			console.log('Star diff update result ' + result + ' for ' + uid);
		}
	});
	await rankedUpdate.setTime();

	console.log(timetag(), 'Updated all star diff and PP values');
}

if (require.main === module) {
	updateStarDiff();
} else {
	module.exports = updateStarDiff;
}
