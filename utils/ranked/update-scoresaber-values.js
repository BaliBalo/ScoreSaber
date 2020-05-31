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
		recentScores: parseNumber(song['24hr']),
	})).filter(e => e && e.uid);
	list = list.concat(pageSongs);
	if (pageSongs.length) {
		return getDataFromPage(page + 1, list);
	}
	return list;
}

async function updateScoresaberValues() {
	console.log(timetag(), 'Started update of scoresaber values');

	let allData = await getDataFromPage(1);
	if (!allData) {
		return console.log(timetag(), '(update-scoresaber-values) Error getting list of maps data');
	}

	await promiseSequence(allData, async ({ uid, ...update }) => {
		const result = await ranked.update({ uid }, { $set: update });
		if (result !== 1) {
			console.log('Scoresaber values update result ' + result + ' for ' + uid);
		}
	});
	await rankedUpdate.setTime();

	console.log(timetag(), 'Updated all scoresaber values');
}

if (require.main === module) {
	updateScoresaberValues();
} else {
	module.exports = updateScoresaberValues;
}
