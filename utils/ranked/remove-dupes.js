const { timetag } = require('../../utils');
const ranked = require('../../utils/ranked');

module.exports = async function removeDupes() {
	let all = await ranked.find({});
	let dupes = all.reduce((dupes, song) => {
		if (!dupes[song.uid]) {
			dupes[song.uid] = [];
		} else {
			dupes[song.uid].push(song._id);
		}
		return dupes;
	}, {});
	let toRemove = [].concat(...Object.values(dupes));
	if (!toRemove.length) {
		return 0;
	}
	console.log(timetag(), 'REMOVING ' + toRemove.length + ' DUPES');
	return ranked.remove({ _id: { $in: toRemove } }, { multi: true });
};
