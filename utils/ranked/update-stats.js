const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const beatsaver = require('../../utils/beatsaver');

async function updateStats(log) {
	if (log === true) {
		console.log(timetag(), 'Started update of beatsaver stats');
	}

	let existing = await ranked.find({});
	let updatedCount = 0;
	let beatsaverCache = {};
	await promiseSequence(existing, async (item, i) => {
		if (log === true && (i % 50) === 0) {
			console.log(timetag(), 'Stats update: ' + i + ' / ' + existing.length);
		}
		const previous = { ...item };
		await beatsaver.addData(item, beatsaverCache);
		if (Object.keys(item).find(k => item[k] !== previous[k])) {
			const { _id, ...update } = item;
			await ranked.update({ _id }, { $set: update });
			updatedCount++;
		}
		return ++i;
	}, 0);
	if (updatedCount) {
		await rankedUpdate.setTime();
	}

	if (log === true) {
		console.log(timetag(), 'Finsihed update of beatsaver stats for ' + updatedCount + ' maps');
	}
}

if (require.main === module) {
	updateStats(true);
} else {
	module.exports = updateStats;
}
