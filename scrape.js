const request = require('request-promise');

async function getSong(item) {
	if (!item || !item.id) {
		return;
	}
	// Save request in data folder ?
	// A specific hash shouldn't have its metadata changed too much
	await request('https://beatsaver.com/api/songs/search/hash/' + id);
}

function getPage() {
	// http://scoresaber.com/api.php?function=get-leaderboards&cat=3&page=1&limit=20
}

function getAll() {
	
}


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
// 							"1": 1115,
// 							"0": 1049,
// 							"3": 178,
// 							"2": 173,
// 							"6": 216,
// 							"5": 184,
// 							"4": 147,
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
