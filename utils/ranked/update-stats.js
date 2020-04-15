// item.downloads = song.stats.downloads;
// item.upvotes = song.stats.upVotes;
// item.downvotes = song.stats.downVotes;
// item.rating = song.stats.rating * 100;

const { promiseSequence, timetag } = require('../../utils');
const ranked = require('../../utils/ranked');
const rankedUpdate = require('../../utils/ranked/update');
const beatsaver = require('../../utils/beatsaver');

async function updateStats(log) {
	if (log === true) {
		console.log(timetag(), 'Started update of beatsaver stats');
	}

	let existing = await ranked.find({});
	console.log(timetag(), 'Stats update: ' + existing.length + ' maps to process');
	await promiseSequence(existing, async (item, i) => {
		if (log === true && (i % 50) === 0) {
			console.log(timetag(), 'Stats update: ' + i + ' / ' + existing.length);
		}
		await beatsaver.addData(item);
		const { _id, ...update } = item;
		const result = await ranked.update({ _id }, { $set: update });
		if (result !== 1) {
			console.log(timetag(), 'Stats update result ' + result + ' for ' + item);
		}
		return ++i;
	});
	await rankedUpdate.setTime();

	if (log === true) {
		console.log(timetag(), 'Finsihed update of beatsaver stats');
	}
}

if (require.main === module) {
	updateStats(true);
} else {
	module.exports = updateStats;
}
