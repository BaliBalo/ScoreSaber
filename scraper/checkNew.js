const { promiseSequence, timetag, setLastUpdate, ranked } = require('../utils');
const addBeatSaverData = require('./addBeatSaverData');
const scoresaber = require('./scoresaber');

// const Datastore = require('nedb');
// const ranked = new Datastore({ filename: path.resolve(__dirname, '../data/ranked.db'), autoload: true });
// const findRanked = promisify(ranked.find.bind(ranked));
// const insertRanked = promisify(ranked.insert.bind(ranked));

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

async function checkFromPage(page) {
	// console.log(timetag(), 'Checking new ranks page ' + page);
	let data;
	try {
		data = await scoresaber.recentRanks(page);
	} catch(e) {}
	if (!data || !data.songs || !data.songs.length) {
		return;
	}
	const existing = (await ranked.find({ uid: { $in: data.songs.map(e => e.uid) } })).map(e => e.uid);
	let newRanked = data.songs.filter(e => !existing.includes(e.uid));
	if (!newRanked.length) {
		// console.log(timetag(), 'Done checking new ranked maps');
		return;
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
		let multiline = songs.length > 1;
		let desc = songs.map(song => (multiline ? '  * ' : '') + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')');
		console.log(timetag(), 'New ranked map' + (multiline ? 's:\n' : ': ') + desc.join('\n'));
		await ranked.insert(songs);
		await setLastUpdate();
	}

	if (!existing.includes(data.songs[data.songs.length - 1].uid)) {
		// newRanked.length === data.length
		//  ^ dangerous cause if a new map is ranked while we check the page, it will push everything down
		//    and the next page would only have the first item processed
		//    checking only the last item only breaks if a full page of new ranks is created while processing a page
		return checkFromPage(page + 1);
	}
}

if (require.main === module) {
	checkFromPage(1);
} else {
	module.exports = async () => checkFromPage(1);
}

// Scoresaber:
// {
// 	"songs": [
// 		{
// 			 "uid": 175671,
// 			 "id": "EA08458FFE4336A205E1CBAE539183E697845358",
// 			 "name": "Great Distance",
// 			 "songSubName": "feat.chelly",
// 			 "songAuthorName": "ryo (supercell)",
// 			 "levelAuthorName": "Uninstaller",
// 			 "bpm": 197,
// 			 "diff": "_Expert_SoloStandard",
// 			 "scores": "639",
// 			 "scores_day": 99,
// 			 "ranked": 1,
// 			 "stars": 4.49,
// 			 "image": "\/imports\/images\/songs\/EA08458FFE4336A205E1CBAE539183E697845358.png"
// 		},
// 		...
