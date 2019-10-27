const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const lastUpdateFile = path.resolve(__dirname, 'data/lastUpdate');

const Datastore = require('nedb');
const ranked = new Datastore({ filename: path.resolve(__dirname, 'data/ranked.db'), autoload: true });

function promiseSequence(array, fn, data) {
	if (array === undefined || array === null) {
		return Promise.resolve(array);
	}
	if (!Array.isArray(array)) {
		array = [array];
	}
	if (typeof fn !== 'function') {
		return Promise.all(array);
	}
	return array.reduce((promise, el) => promise.then(d => fn(el, d)), Promise.resolve(data));
}

const pad2 = v => ('0'+v).slice(-2);

const timetag = (d = new Date()) => {
	let date = [d.getDate(), d.getMonth() + 1, d.getYear() % 100].map(pad2).join('/');
	let time = [d.getHours(), d.getMinutes(), d.getSeconds()].map(pad2).join(':');
	return '[' + date + ' ' + time + ']';
};

// Ensure the last update file exists
try {
	if (!fs.existsSync(lastUpdateFile)) {
		fs.closeSync(fs.openSync(lastUpdateFile, 'w'));
	}
} catch(e) {
	console.log('Error creating last update file', e);
}
let updatesListeners = [];
function addUpdateListener(fn) {
	if (typeof fn === 'function') {
		updatesListeners.push(fn);
	}
}
async function setLastUpdate(time) {
	try {
		time = time || Date.now();
		await fs.promises.utimes(lastUpdateFile, time, time);
	} catch(e) {}
	updatesListeners.forEach(fn => {
		try {
			fn();
		} catch(e) {}
	});
}
async function getLastUpdate() {
	try {
		let data = await fs.promises.stat(lastUpdateFile);
		return data.mtimeMs;
	} catch(e) {}
	return Date.now();
}

module.exports = {
	promiseSequence,
	timetag,
	setLastUpdate,
	getLastUpdate,
	lastUpdateFile,
	addUpdateListener,
	ranked: {
		db: ranked,
		find: promisify(ranked.find.bind(ranked)),
		insert: promisify(ranked.insert.bind(ranked)),
		remove: promisify(ranked.remove.bind(ranked)),
	}
};
