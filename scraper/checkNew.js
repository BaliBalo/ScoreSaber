const { promiseSequence, timetag, setLastUpdate, ranked } = require('../utils');
const addBeatSaverData = require('./addBeatSaverData');
const scoresaber = require('./scoresaber');

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

async function addNew(songsRaw) {
	const existing = (await ranked.find({ uid: { $in: songsRaw.map(e => e.uid) } })).map(e => e.uid);
	let newRanked = songsRaw.filter(e => !existing.includes(e.uid));
	if (!newRanked.length) {
		return 0;
	}
	let songs = newRanked.map(song => {
		// Only Standard for now
		let diffMatch = song.diff.match(/^_(Easy|Normal|Hard|Expert|ExpertPlus)_SoloStandard$/);
		if (!diffMatch || !song.stars) {
			return;
		}
		let scores = song.scores;
		if (typeof scores === 'string') {
			scores = +scores.replace(/,/g, '') || scores;
		}
		return {
			uid: song.uid,
			id: song.id,
			name: song.name,
			artist: song.songAuthorName,
			mapper: song.levelAuthorName,
			bpm: song.bpm,
			diff: diffMatch[1],
			scores: scores,
			recentScores: song['24hr'],
			stars: song.stars,
			pp: song.stars * PP_PER_STAR
		};
	}).filter(e => e);
	await promiseSequence(songs, addBeatSaverData);
	if (songs.length) {
		await ranked.insert(songs);
		await setLastUpdate();
		let multiline = songs.length > 1;
		let desc = songs.map(song => (multiline ? '  * ' : '') + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), 'New ranked map' + (multiline ? 's:\n' : ': ') + desc.join('\n'));
	}
	return songs.length;
}

async function checkFromPage(page) {
	// console.log(timetag(), 'Checking new ranks page ' + page);
	let data;
	try {
		data = await scoresaber.recentRanks(page);
	} catch(e) {}
	if (!data || !data.songs || !data.songs.length) {
		return;
	}
	if (addNew(data.songs)) {
		return checkFromPage(page + 1);
	}
}

async function _checkFull(page) {
	let data;
	try {
		data = await scoresaber.ranked(page);
	} catch(e) {}
	if (!data || !data.songs || !data.songs.length) {
		return;
	}
	addNew(data.songs);
	return _checkFull(page + 1);
}
async function checkFull() {
	_checkFull(1);
}

if (require.main === module) {
	checkFromPage(1);
} else {
	module.exports = async () => checkFromPage(1);
	module.exports.full = async () => checkFull();
}
