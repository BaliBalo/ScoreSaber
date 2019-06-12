const fs = require('fs');
const path = require('path');
const request = require('request-promise-native');
const { promiseSequence, timetag } = require('./utils');

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

async function addBeatSaverData(item) {
	if (!item || !item.id) {
		return;
	}
	// Save request in data folder ?
	// A specific hash shouldn't have its metadata changed too much
	const data = await request({
		uri: 'https://beatsaver.com/api/maps/by-hash/' + item.id.toLowerCase(),
		json: true
	});
	const song = data;
	if (!song) {
		return;
	}
	item.beatSaverKey = song.key;
	item.downloads = song.stats.downloads;
	item.upvotes = song.stats.upVotes;
	item.downvotes = song.stats.downVotes;
	item.rating = song.stats.rating * 100;
	item.beatSaverLink = 'https://beatsaver.com/beatmap/52d7' + song.key;
	item.download = 'https://beatsaver.com' + song.downloadURL;
	// let diffData = song.difficulties[item.diff];
	// if (diffData) {
	// 	item.duration = diffData.stats.time;
	// 	item.noteCount = diffData.stats.notes;
	// 	item.obstacleCount = diffData.stats.obstacles;
	// }
}

async function getFromPage(page, list = []) {
	console.log(timetag(), 'Getting page ' + page);
	const data = await request({
		uri: 'http://scoresaber.com/api.php?function=get-leaderboards&cat=3&ranked=1&limit=20&page=' + page,
		json: true
	});
	let songs = data.songs.map(song => {
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
			artist: song.songSubName,
			mapper: song.author,
			bpm: song.bpm,
			diff: diffMatch[1],
			scores: scores,
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
		fs.writeFileSync(path.resolve(__dirname, 'data/ranked.json'), JSON.stringify({
			list,
			timestamp: Date.now()
		}));
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
// 	"metadata": {
// 		"difficulties": {
// 			"easy": false,
// 			"normal": false,
// 			"hard": false,
// 			"expert": false,
// 			"expertPlus": true
// 		},
// 		"characteristics": [],
// 		"songName": "Milk Crown on Sonnetica",
// 		"songSubName": "nameless",
// 		"songAuthorName": "Hexagonial",
// 		"levelAuthorName": "hexagonial",
// 		"bpm": 255
// 	},
// 	"stats": {
// 		"downloads": 19359,
// 		"plays": 0,
// 		"upVotes": 316,
// 		"downVotes": 69,
// 		"rating": 0.767376195194179,
// 		"heat": "515.0139858"
// 	},
// 	"description": "An extremely hard map commissioned by Kaoura! Send thanks to him for providing you with this challenge map. :)\r\n\r\nDiscord: discord.gg/EVU9At2 (For updates regarding my maps/commissions, notifications for my streams, and a way to contact me)",
// 	"deletedAt": null,
// 	"_id": "5cff621348229f7d88fc8106",
// 	"key": "3036",
// 	"name": "nameless - Milk Crown on Sonnetica",
// 	"uploader": {
// 		"_id": "5cff0b7398cc5a672c84f2fb",
// 		"username": "hexagonial"
// 	},
// 	"uploaded": "2019-01-22T23:45:58.000Z",
// 	"hash": "cfca2fe00bcc418dc9ecf64d92fc01ceec52c375",
// 	"downloadURL": "/api/download/key/3036",
// 	"coverURL": "/cdn/3036/cfca2fe00bcc418dc9ecf64d92fc01ceec52c375.jpg"
// }
