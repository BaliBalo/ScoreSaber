const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const scoresaber = require('../../utils/scoresaber');

function parseNumber(v) {
	if (typeof v === 'string') {
		return +v.replace(/,/g, '') || v;
	}
	return v;
}

async function getDataFromPage(page, list = []) {
	let data;
	try {
		data = await scoresaber.ranked(page, ~~(Date.now() / 3600000));
	} catch(e) {}
	if (!data || !data.songs) {
		return;
	}
	let pageSongs = data.songs.map(song => ({
		uid: song.uid,
		stars: song.stars,
		pp: song.stars * ranked.PP_PER_STAR,
		scores: parseNumber(song.scores),
		recentScores: parseNumber(song.scores_day),
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
		const conditions = { uid };
		// Only update if the row is not already what we need
		Object.keys(update).forEach(k => (conditions[k] = { $ne: update[k] }));
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
