const fs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const { promiseSequence, timetag } = require('./utils');

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.1;

async function addBeatSaverData(item) {
	if (!item || !item.id) {
		return;
	}
	// Save request in data folder ?
	// A specific hash shouldn't have its metadata changed too much
	const data = await request({
		uri: 'https://beatsaver.com/api/songs/search/hash/' + item.id,
		json: true
	});
	const song = data.songs[0];
	if (!song) {
		return;
	}
	item.beatSaverKey = song.key;
	item.downloads = song.downloadCount;
	item.upvotes = song.upVotes;
	item.downvotes = song.downVotes;
	item.rating = song.rating;
	item.beatSaverLink = song.linkUrl;
	item.download = song.downloadUrl;
	let diffData = song.difficulties[item.diff];
	if (diffData) {
		item.duration = diffData.stats.time;
		item.noteCount = diffData.stats.notes;
		item.obstacleCount = diffData.stats.obstacles;
	}
}

async function getFromPage(page, list = []) {
	console.log(timetag(), 'Getting page ' + page);
	const data = await request({
		uri: 'http://scoresaber.com/api.php?function=get-leaderboards&cat=3&limit=20&page=' + page,
		json: true
	});
	let songs = data.songs.map(song => {
		let diffMatch = song.diff.match(/^_(Easy|Normal|Hard|Expert|ExpertPlus)_SoloStandard$/);
		if (!diffMatch) {
			return;
		}
		return {
			uid: song.uid,
			id: song.id,
			name: song.name,
			artist: song.songSubName,
			mapper: song.author,
			bpm: song.bpm,
			diff: diffMatch[1],
			scores: song.scores,
			recentScores: song['24hr'],
			stars: song.stars,
			pp: song.stars * PP_PER_STAR
		};
	}).filter(e => e);
	await promiseSequence(songs, addBeatSaverData);
	list = list.concat(songs);
	if (data.songs.length) {
		return getFromPage(page + 1, list);
	}
	return list;
}

async function getAll() {
	try {
		let list = await getFromPage(1);
		fs.writeFileSync(path.resolve(__dirname, 'data/ranked.json'), JSON.stringify(list));
	} catch(err) {
		console.log('Error scraping scoresaber', err);
	}
}

getAll();

// Scoresaber:
// {
//     "songs": [
//         {
//             "uid": 101208,
//             "id": "5EC73C4DBD293FA7B7F794E38C8A9E6F",
//             "name": "Happppy song",
//             "songSubName": "SOOOO",
//             "author": "Hexagonial",
//             "bpm": 226,
//             "diff": "_ExpertPlus_SoloStandard",
//             "scores": "920",
//             "24hr": 34,
//             "stars": 9.91,
//             "image": "\/imports\/images\/songs\/5EC73C4DBD293FA7B7F794E38C8A9E6F.png"
//         },
//         ...



// BeatSaver:
// {
// 	"songs": [
// 		{
// 			"id": 7368,
// 			"key": "7368-7133",
// 			"name": "SakiZ - osu!memories",
// 			"description": "...",
// 			"uploader": "psyc0pathic",
// 			"uploaderId": 4747,
// 			"songName": "osu!memories",
// 			"songSubName": "SakiZ",
// 			"authorName": "Various Mappers",
// 			"bpm": 180,
// 			"difficulties": {
// 				"ExpertPlus": {
// 					"difficulty": "ExpertPlus",
// 					"rank": 5,
// 					"audioPath": "osu.ogg",
// 					"jsonPath": "ExpertPlus.json",
// 					"stats": {
// 						"time": 1391.0390625,
// 						"slashstat": {
// 							"0": 1049,
// 							"1": 1115,
// 							"2": 173,
// 							"3": 178,
// 							"4": 147,
// 							"5": 184,
// 							"6": 216,
// 							"7": 187,
// 							"8": 120
// 						},
// 						"events": 4341,
// 						"notes": 3369,
// 						"obstacles": 24
// 					}
// 				}
// 			},
// 			"downloadCount": 29047,
// 			"playedCount": 570,
// 			"upVotes": 357,
// 			"upVotesTotal": 0,
// 			"downVotes": 35,
// 			"downVotesTotal": 0,
// 			"rating": 84.27,
// 			"version": "7368-7133",
// 			"createdAt": {
// 				"date": "2018-10-24 03:08:36.000000",
// 				"timezone_type": 3,
// 				"timezone": "UTC"
// 			},
// 			"linkUrl": "https://beatsaver.com/browse/detail/7368-7133",
// 			"downloadUrl": "https://beatsaver.com/download/7368-7133",
// 			"coverUrl": "https://beatsaver.com/storage/songs/7368/7368-7133.jpg",
// 			"hashMd5": "01fe311706315676e2fd2aa3b8737ec7",
// 			"hashSha1": "9054c16bc879bb895cffe83630d6c957f1f60cc5"
// 		}
// 	],
// 	"total": 1
// }
