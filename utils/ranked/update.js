const fs = require('fs');
const path = require('path');

const lastUpdateFile = path.resolve(__dirname, '../../data/lastUpdate');
// Ensure the last update file exists
try {
	if (!fs.existsSync(lastUpdateFile)) {
		fs.closeSync(fs.openSync(lastUpdateFile, 'w'));
	}
} catch(e) {
	console.log('Error creating last update file', e);
}

let listeners = new Set();
function addListener(fn) {
	if (typeof fn === 'function') {
		listeners.add(fn);
	}
}
function removeListener(fn) {
	listeners.delete(fn);
}
function callListeners() {
	listeners.forEach(fn => {
		try { fn(); } catch(e) {}
	});
}

async function setTime(time) {
	try {
		time = time || Date.now();
		await fs.promises.utimes(lastUpdateFile, time, time);
	} catch(e) {}
	callListeners();
}
async function getTime() {
	try {
		let data = await fs.promises.stat(lastUpdateFile);
		return data.mtimeMs;
	} catch(e) {}
	// If the time can't be read from the file, assume the last update is now
	return Date.now();
}

module.exports = {
	setTime,
	getTime,
	addListener,
	removeListener
};
