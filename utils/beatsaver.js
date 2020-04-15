/* eslint-disable require-atomic-updates */
const request = require('request-promise-native');
const { timetag } = require('../utils');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function beatsaverData(hash, retries = 2) {
	try {
		await wait(100);
		return await request({
			uri: 'https://beatsaver.com/api/maps/by-hash/' + hash,
			json: true
		});
	} catch(err) {
		if (retries && retries > 0) {
			await wait(3000);
			return beatsaverData(hash, retries - 1);
		}
		throw err;
	}
}

async function addData(item) {
	if (!item || !item.id) {
		return;
	}
	let song;
	try {
		song = await beatsaverData(item.id.toLowerCase());
	} catch(e) {
		console.log('(beatsaver error)', e);
	}
	if (!song) {
		console.log(timetag(), 'No beatsaver data found for ' + item.name + ' by ' + item.mapper + ' (' + item.uid + ' - ' + item.id.toLowerCase() + ')');
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
