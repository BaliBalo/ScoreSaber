/* eslint-disable require-atomic-updates */
const request = require('request-promise-native');

async function addData(item) {
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
	let diffCamelCase = item.diff[0].toLowerCase() + item.diff.slice(1);
	let characteristics = stdCharacteristics && stdCharacteristics.difficulties && stdCharacteristics.difficulties[diffCamelCase];
	if (characteristics) {
		item.duration = characteristics.duration;
		item.noteCount = characteristics.notes;
		// item.obstacleCount = characteristics.obstacles;
		// item.bombsCount = characteristics.bombs;
		item.njs = characteristics.njs;
	}
}

module.exports = {
	addData: addData
};
