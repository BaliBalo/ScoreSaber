/* eslint-disable require-atomic-updates */
const request = require('request-promise-native');

module.exports = async function addBeatSaverData(item) {
	if (!item || !item.id) {
		return;
	}
	let song;
	try {
		// Save request in data folder ?
		// A specific hash shouldn't have its metadata changed too much
		song = await request({
			uri: 'https://beatsaver.com/api/maps/by-hash/' + item.id.toLowerCase(),
			json: true
		});
	} catch(e) { }
	if (!song) {
		console.log('No beatsaver data found for ' + item.name + ' by ' + item.mapper + ' (' + item.uid + ')');
		return;
	}
	item.beatSaverKey = song.key;
	item.downloads = song.stats.downloads;
	item.upvotes = song.stats.upVotes;
	item.downvotes = song.stats.downVotes;
	item.rating = song.stats.rating * 100;
	// item.beatSaverLink = 'https://beatsaver.com/beatmap/' + song.key;
	item.download = 'https://beatsaver.com' + song.downloadURL;
	let allCharacteristics = song.metadata && song.metadata.characteristics;
	let stdCharacteristics = allCharacteristics && allCharacteristics.find(e => e.name === 'Standard');
	let characteristics = stdCharacteristics && stdCharacteristics.difficulties && stdCharacteristics.difficulties[item.diff[0].toLowerCase() + item.diff.slice(1)];
	if (characteristics) {
		item.duration = characteristics.duration;
		item.noteCount = characteristics.notes;
		// item.obstacleCount = characteristics.obstacles;
		// item.bombsCount = characteristics.bombs;
		item.njs = characteristics.njs;
	}
};

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
