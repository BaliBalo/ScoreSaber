const fs = require('fs');
const path = require('path');
const { timetag, promiseMapSequence } = require('../utils');
const getJSON = require('../utils/getJSON');
const factorization = require('./factorization');

const dataFolder = path.resolve(__dirname, '../data');

async function pause(duration) {
	return new Promise(res => setTimeout(res, duration));
}

async function getMaps() {
	// Temp get it through request - use utils/ranked once live
	const result = await getJSON('https://scoresaber.balibalo.xyz/ranked');
	return result.list.sort((a, b) => b.stars - a.stars).map(e => e.uid);
}
async function getPlayers() {
	// 200 users (page 1 to 4)
	let users = [];
	for (let page = 1; page <= 4; page++) {
		const result = await getJSON('https://scoresaber.com/api/players/' + page);
		users = users.concat(result.map(e => e.playerid));
		await pause(100);
	}
	return users;
}

const getPlayerScores = (() => {
	async function getAllScores(id, page = 1, scores = []) {
		const result = await getJSON('https://scoresaber.com/api/player/' + id + '/scores/top/' + page);
		const pageScores = result.scores;
		scores = scores.concat(pageScores);
		if (pageScores.length && pageScores[pageScores.length - 1].pp) {
			await pause(20);
			return getAllScores(id, page + 1, scores);
		}
		return scores;
	}

	return async (playerId, maps) => {
		let allScores = await getAllScores(playerId);
		let scoresMap = allScores.reduce((scores, score) => {
			scores[score.leaderboardId] = Math.max(0, score.uScore || score.score) / score.maxScoreEx;
			return scores;
		}, {});
		return maps.map(leaderboard => scoresMap[leaderboard] || null);
	};
})();

async function getAllPlayersScores(players, maps) {
	return promiseMapSequence(players, async (player, i) => {
		if (i) {
			await pause(200);
		}
		console.log(timetag(), 'Getting scores for user ' + player + ' (' + (i + 1) + '/' + players.length + ')');
		return getPlayerScores(player, maps);
	});
}

async function getData() {
	const file = path.resolve(dataFolder, 'ml-source.json');
	try {
		return JSON.parse(await fs.promises.readFile(file));
	} catch { /* ignore */ }

	const players = await getPlayers();
	const maps = await getMaps();
	const scores = await getAllPlayersScores(players, maps);

	const data = { players, maps, scores };
	try {
		await fs.promises.writeFile(file, JSON.stringify(data));
	} catch { /* ignore */ }

	return data;
}

(async () => {
	// let mat = [
	// 	[1, .6, 0, .2],
	// 	[.8, 0, 0, .2],
	// 	[.2, .2, 0, 1],
	// 	[.2, 0, 0, .8],
	// 	[0, .2, 1, .8],
	// ];
	// const all = [...Array(50)].map(() => factorization(mat, { features: 4, steps: 5000 }))
	// console.log(all.reduce((v, e) => v + e.error, 0) / all.length);
	// return;
	try {
		const data = await getData();
		let itemsFeatures;
		let usersFeatures;
		let scores = data.scores.map(row => row.map(score => score * score * score * score));
		let count = 0;
		while (++count) {
			console.log(timetag(), 'Running global iteration ' + count);
			const result = factorization(scores, { itemsFeatures, usersFeatures, features: 10, steps: 30000 });
			await fs.promises.writeFile(path.resolve(dataFolder, 'ml-result.json'), JSON.stringify(result));
			console.log('Current error:', result.error, '-', result.reconstructed[0].slice(0, 5).map(v => (100 * Math.pow(v, 1 / 4)).toFixed(2)).join(' '));
			itemsFeatures = result.itemsFeatures;
			usersFeatures = result.usersFeatures;
		}
		// console.log(timetag(), 'End');
	} catch (e) {
		console.log('ERROR RUNNING ML STUFF', e);
	}
})();
