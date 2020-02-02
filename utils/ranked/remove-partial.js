// Remove maps with partial data (i.e. without beatsaver data)

const { timetag } = require('../../utils');
const ranked = require('../../utils/ranked');

module.exports = async function removePartial() {
	let toRemove = await ranked.find({ beatSaverKey: { $exists: false } });
	if (!toRemove.length) {
		return 0;
	}
	let message = 'REMOVING ' + toRemove.length + ' PARTIAL MAPS:\n';
	message += toRemove.map(song => '  - ' + [song.mapper, song.name, song.diff].join(' - ') + ' (' + song.uid + ')').join('\n');
	console.log(timetag(), message);
	return ranked.remove({ _id: { $in: toRemove.map(e => e._id) } }, { multi: true });
};
