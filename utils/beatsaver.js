/* eslint-disable require-atomic-updates */
const request = require('request-promise-native');
const { timetag } = require('../utils');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function beatsaverData(hash, retries = 2) {
	try {
		await wait(100);
		return await request({
			uri: 'https://api.beatsaver.com/maps/hash/' + hash,
			json: true,
			headers: { 'User-Agent': 'Peepee/1.0.0' }
		});
	} catch(err) {
		if (err.statusCode !== 404 && retries && retries > 0) {
			await wait(3000);
			return beatsaverData(hash, retries - 1);
		}
		throw err;
	}
}

async function addData(item, cache) {
	if (!item || !item.id) {
		return;
	}
	let hash = item.id.toLowerCase();
	let song;
	try {
		let getter;
		if (cache && typeof cache === 'object') {
			if (!cache[hash]) {
				cache[hash] = beatsaverData(hash);
			}
			getter = cache[hash];
		} else {
			getter = beatsaverData(hash);
		}
		song = await getter;
	} catch(e) {
		// delete e.response;
		// console.log('(beatsaver error)', e);
	}
	if (!song) {
		console.log(timetag(), 'No beatsaver data found for ' + item.name + ' by ' + item.mapper + ' (' + item.uid + ' - ' + hash + ')');
		return;
	}
	item.beatSaverKey = song.id;
	item.durationSeconds = song.metadata.duration;
	item.bpm = song.metadata.bpm;
	item.downloads = song.stats.downloads;
	item.upvotes = song.stats.upvotes;
	item.downvotes = song.stats.downvotes;
	item.rating = song.stats.score * 100;
	let matching = song.versions.find(version => version.hash === hash);
	if (!matching) {
		console.log(timetag(), 'WARNING! Found beatsaver data for ' + item.name + ' (' + item.uid + ' - ' + hash + ') does not have a matching version. Using latest.');
		matching = song.versions[song.versions.length - 1];
	}
	item.download = matching.downloadURL;
	let characteristics = matching.diffs.find(diff => diff.characteristic === 'Standard' && diff.difficulty === item.diff);
	if (characteristics) {
		// item.duration = characteristics.length;
		item.noteCount = characteristics.notes;
		// item.obstacleCount = characteristics.obstacles;
		// item.bombsCount = characteristics.bombs;
		item.njs = characteristics.njs;
	}
}

module.exports = {
	addData: addData
};
