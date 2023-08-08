const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const beatsaver = require('../../utils/beatsaver');
const scoresaber = require('../../utils/scoresaber');

async function addNew(songsRaw) {
	const existing = (await ranked.find({ uid: { $in: songsRaw.map(e => e.id) } })).map(e => e.uid);
	let newRanked = songsRaw.filter(e => !existing.includes(e.id));
	if (!newRanked.length) {
		return 0;
	}
	let songs = newRanked.map(song => {
		// Only Standard for now
		let diffMatch = song?.difficulty?.difficultyRaw?.match(/^_(Easy|Normal|Hard|Expert|ExpertPlus)_SoloStandard$/);
		if (!diffMatch || !song.stars) {
			return;
		}
		return {
			uid: song.id,
			id: song.songHash,
			name: song.songName,
			artist: song.songAuthorName,
			mapper: song.levelAuthorName,
			diff: diffMatch[1],
			scores: song.plays,
			recentScores: song.dailyPlays,
			maxScore: song.maxScore,
			stars: song.stars,
			pp: song.stars * ranked.PP_PER_STAR
		};
	});
	try {
		let beatsaverCache = {};
		await promiseSequence(songs, song => beatsaver.addData(song, beatsaverCache));
	} catch (e) {}
	songs = songs.filter(e => e?.beatSaverKey);
	if (songs.length) {
		await ranked.insert(songs);
		await rankedUpdate.setTime();
		let desc = songs.map(song => '  + ' + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), songs.length + ' new ranked map' + (songs.length > 1 ? 's' : '') + ':\n' + desc.join('\n'));
	}
	return songs.length;
}

async function checkFromPage(page, log) {
	if (log === true) {
		console.log(timetag(), 'Checking new ranks page ' + page);
	}
	let data;
	try {
		data = await scoresaber.recentRanks(page, ~~(Date.now() / 3600000));
	} catch (e) {}
	if (!data?.leaderboards?.length) {
		return;
	}
	if (await addNew(data.leaderboards)) {
		return checkFromPage(page + 1, log);
	}
}

async function checkFull(page, log) {
	if (log === true) {
		console.log(timetag(), 'Checking new ranks (full) page ' + page);
	}
	let data;
	try {
		data = await scoresaber.ranked(page);
	} catch (e) {}
	if (!data?.leaderboards?.length) {
		return;
	}
	await addNew(data.leaderboards);
	return checkFull(page + 1, log);
}

if (require.main === module) {
	checkFromPage(1, true);
} else {
	module.exports = async (log) => checkFromPage(1, log);
	module.exports.full = async (log) => checkFull(1, log);
}
