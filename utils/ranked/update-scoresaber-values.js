const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const scoresaber = require('../../utils/scoresaber');

async function getDataFromPage(page, list = []) {
	let data;
	try {
		data = await scoresaber.ranked(page, ~~(Date.now() / 3600000));
	} catch(e) {}
	if (!data?.leaderboards) {
		return;
	}
	let pageSongs = data.leaderboards.map(song => ({
		uid: song.id,
		stars: song.stars,
		pp: song.stars * ranked.PP_PER_STAR,
		scores: song.plays,
		recentScores: song.dailyPlays,
	})).filter(e => e && e.uid);
	list = list.concat(pageSongs);
	if (pageSongs.length) {
		return getDataFromPage(page + 1, list);
	}
	return list;
}

async function updateScoresaberValues(log) {
	if (log === true) {
		console.log(timetag(), 'Started update of scoresaber values');
	}

	let allData = await getDataFromPage(1);
	if (!allData) {
		return console.log(timetag(), '(update-scoresaber-values) Error getting list of maps data');
	}

	let changes = 0;
	await promiseSequence(allData, async ({ uid, ...update }) => {
		// Only update if the row is not already what we need
		const conditions = Object.entries(update).reduce((conditions, [key, value]) => {
			conditions[key] = { $ne: value };
			return conditions;
		}, { uid });
		changes += await ranked.update(conditions, { $set: update });
	});
	if (changes) {
		await rankedUpdate.setTime();
	}
	if (log === true) {
		console.log(timetag(), 'Updated scoresaber values for ' + changes + ' maps');
	}
}

if (require.main === module) {
	updateScoresaberValues(true);
} else {
	module.exports = updateScoresaberValues;
}
