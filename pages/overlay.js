const qs = location.search.slice(1).split('&').filter(e => e).reduce((qs, e) => {
	let split = e.split('=');
	qs[split[0]] = split.length > 1 ? split[1] : true;
	return qs;
}, {});
if (qs.debug) document.body.classList.add('debug');
if (qs.hideSongInfo) document.body.classList.add('hideSongInfo');
if (qs.hideScoreInfo) document.body.classList.add('hideScoreInfo');
function formatTime(millis) {
	let minutesFloat = millis / 60000;
	let minutes = Math.floor(minutesFloat);
	let seconds = Math.floor((minutesFloat - minutes) * 60);
	return minutes + ':' + ('0' + seconds).slice(-2);
}
async function fetchJSON(...args) {
	return (await fetch(...args)).json();
}
async function scoresaberAPI(path, query) {
	let qs = '';
	if (query) {
		let searchParams = new URLSearchParams(query);
		qs = '?' + searchParams.toString();
	}
	return await fetchJSON('/scoresaber-api' + path + qs);
}
const dom = {
	playerImage: document.querySelector('.playerImage'),
	pp: document.querySelector('.pp'),
	playerRank: document.querySelector('.playerRank'),
	playerCountryRank: document.querySelector('.playerCountryRank'),
	songImage: document.querySelector('.songImage'),
	songName: document.querySelector('.songName'),
	songAuthor: document.querySelector('.songAuthor'),
	songMapper: document.querySelector('.songMapper .value'),
	songDiff: document.querySelector('.songMapper .difficulty'),
	misses: document.querySelector('.misses .value'),
	combo: document.querySelector('.combo .value'),
	multiplier: document.querySelector('.combo .multiplier'),
	percentage: document.querySelector('.percentage .value'),
	score: document.querySelector('.percentage .score'),
	rank: document.querySelector('.rank .value'),
	time: document.querySelector('.time .value'),
	length: document.querySelector('.time .max'),
	progress: document.querySelector('.timeIndicator'),
};
const playerID = typeof qs.u === 'string' && qs.u.length > 5 && qs.u;
let refreshingUser = false;
async function refreshUser() {
	if (!playerID || refreshingUser) {
		return;
	}
	refreshingUser = true;
	try {
		let data = await scoresaberAPI('/player/' + playerID + '/full');
		dom.pp.textContent = (data.pp || 0).toLocaleString() + 'pp';
		dom.playerRank.textContent = '#' + (data.rank || 0).toLocaleString();
		dom.playerCountryRank.textContent = '#' + (data.countryRank || 0).toLocaleString();
		let countryCodePoints = [...data.country.toLowerCase()].map(c => (c.codePointAt(0) + 127365).toString(16));
		let countryFlag = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${countryCodePoints.join('-')}.svg`;
		dom.playerCountryRank.style.backgroundImage = 'url("' + countryFlag + '")';
		dom.playerImage.src = data.profilePicture;
	} catch (e) { console.log('err', e); }
	refreshingUser = false;
}
refreshUser();

const ppCurve = [
	{ at: 0, value: 0 },
	{ at: 0.6, value: 0.18223233667439062 },
	{ at: 0.65, value: 0.5866010012767576 },
	{ at: 0.7, value: 0.6125565959114954 },
	{ at: 0.75, value: 0.6451808210101443 },
	{ at: 0.8, value: 0.6872268862950283 },
	{ at: 0.825, value: 0.7150465663454271 },
	{ at: 0.85, value: 0.7462290664143185 },
	{ at: 0.875, value: 0.7816934560296046 },
	{ at: 0.9, value: 0.825756123560842 },
	{ at: 0.91, value: 0.8488375988124467 },
	{ at: 0.92, value: 0.8728710341448851 },
	{ at: 0.93, value: 0.9039994071865736 },
	{ at: 0.94, value: 0.9417362980580238 },
	{ at: 0.95, value: 1 },
	{ at: 0.955, value: 1.0388633331418984 },
	{ at: 0.96, value: 1.0871883573850478 },
	{ at: 0.965, value: 1.1552120359501035 },
	{ at: 0.97, value: 1.2485807759957321 },
	{ at: 0.9725, value: 1.3090333065057616 },
	{ at: 0.975, value: 1.3807102743105126 },
	{ at: 0.9775, value: 1.4664726399289512 },
	{ at: 0.98, value: 1.5702410055532239 },
	{ at: 0.9825, value: 1.697536248647543 },
	{ at: 0.985, value: 1.8563887693647105 },
	{ at: 0.9875, value: 2.058947159052738 },
	{ at: 0.99, value: 2.324506282149922 },
	{ at: 0.99125, value: 2.4902905794106913 },
	{ at: 0.9925, value: 2.685667856592722 },
	{ at: 0.99375, value: 2.9190155639254955 },
	{ at: 0.995, value: 3.2022017597337955 },
	{ at: 0.99625, value: 3.5526145337555373 },
	{ at: 0.9975, value: 3.996793606763322 },
	{ at: 0.99825, value: 4.325027383589547 },
	{ at: 0.999, value: 4.715470646416203 },
	{ at: 0.9995, value: 5.019543595874787 },
	{ at: 1, value: 5.367394282890631 },
];
function ppFromScore(percentage) {
	if (!percentage || percentage <= 0) {
		return 0;
	}
	let index = ppCurve.findIndex(o => o.at >= percentage);
	if (index === -1) {
		return ppCurve.at(-1).value;
	}
	if (!index) {
		return ppCurve.at(0).value;
	}
	let from = ppCurve[index - 1];
	let to = ppCurve[index];
	let progress = (percentage - from.at) / (to.at - from.at);
	return from.value + progress * (to.value - from.value);
}

let ppFromHash = {};
fetch('/ranked').then(r => r.ok ? r.json() : Promise.reject()).then((data) => {
	ppFromHash = data.list.reduce((ppFromHash, leaderboard) => {
		if (leaderboard.id && leaderboard.diff) {
			ppFromHash[leaderboard.id + '-' + leaderboard.diff] = leaderboard.pp;
		}
		return ppFromHash;
	}, {});
}).catch(() => {});
let rawMaxScore = 0;
let songPP = 0;
let songDuration = 0;
let songStart = 0;
let songPaused = null;
let timeUpdater = (function () {
	let timer = null;
	let update = () => {
		let to = songPaused || Date.now();
		let current = Math.max(Math.min(to - songStart, songDuration), 0) || 0;
		dom.time.textContent = formatTime(current);
		dom.progress.style.transform = 'scaleX(' + (songDuration ? current / songDuration : 0) + ')';
		timer = requestAnimationFrame(update);
	};
	return {
		start: () => {
			if (timer) {
				return;
			}
			timer = requestAnimationFrame(update);
		},
		stop: () => {
			cancelAnimationFrame(timer);
			timer = null;
		}
	};
})();

function updateCombo(perf) {
	dom.combo.textContent = perf.combo.toLocaleString();
}
function updateMultiplier(perf) {
	dom.multiplier.textContent = 'x' + perf.multiplier;
}
function updateMisses(perf) {
	dom.misses.textContent = perf.missedNotes.toLocaleString();
}
function updateScore(perf) {
	if (songPP) {
		let currentPercentage = perf.score / rawMaxScore;
		let currentPP = songPP * ppFromScore(currentPercentage);
		dom.score.textContent = Math.floor(currentPP).toLocaleString() + 'pp';
	} else {
		dom.score.textContent = (perf.score || 0).toLocaleString();
	}
}
function updatePercentage(perf) {
	dom.percentage.textContent = (perf.currentMaxScore ? 100 * perf.score / perf.currentMaxScore : 0).toFixed(2) + '%';
}

const events = {
	hello: (status) => {
		if (status.game.scene === 'Song') {
			events.songStart(status);
		}
	},
	songStart: (status) => {
		document.body.classList.add('inSong');
		if (status.performance.combo === status.performance.passedNotes) {
			document.body.classList.add('fc');
		}
		let beatmap = status.beatmap;
		dom.songName.textContent = beatmap.songName || '???';
		dom.songAuthor.textContent = beatmap.songAuthorName || 'Unknown author';
		dom.songMapper.textContent = beatmap.levelAuthorName || '';
		const difficulty = beatmap.difficulty || 'Unknown';
		const codeFriendlyDiff = difficulty.replace('+', 'Plus');
		dom.songDiff.textContent = difficulty;
		dom.songDiff.className = 'difficulty ' + codeFriendlyDiff;
		dom.songImage.src = 'data:image/png;base64,' + (beatmap.songCover || 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');
		rawMaxScore = beatmap.maxScore / status.mod.multiplier;
		songPP = (beatmap.songHash && ppFromHash[beatmap.songHash + '-' + codeFriendlyDiff]) || 0;
		console.log(beatmap.songHash + '-' + codeFriendlyDiff, ppFromHash);
		songDuration = beatmap.length || 0;
		songStart = beatmap.start || 0;
		songPaused = beatmap.paused || null;
		dom.length.textContent = formatTime(songDuration);
		updateCombo(status.performance);
		updateMultiplier(status.performance);
		updateMisses(status.performance);
		events.scoreChanged(status);
		timeUpdater.start();
	},
	finished: () => {
		timeUpdater.stop();
		setTimeout(refreshUser, 5000);
	},
	failed: () => {
		timeUpdater.stop();
	},
	menu: () => {
		document.body.classList.remove('inSong');
		timeUpdater.stop();
	},
	obstacleEnter: (status) => {
		document.body.classList.remove('fc');
		updateCombo(status.performance);
		updateMultiplier(status.performance);
	},
	bombCut: (status) => {
		document.body.classList.remove('fc');
		updateCombo(status.performance);
		updateMultiplier(status.performance);
	},
	noteCut: (status) => {
		updateCombo(status.performance);
		updateMultiplier(status.performance);
	},
	noteMissed: (status) => {
		document.body.classList.remove('fc');
		updateCombo(status.performance);
		updateMultiplier(status.performance);
		updateMisses(status.performance);
		updatePercentage(status.performance);
	},
	pause: (status) => {
		songPaused = status.beatmap.paused;
	},
	resume: (status) => {
		songPaused = null;
		songStart = status.beatmap.start;
	},
	scoreChanged: (status) => {
		let perf = status.performance;
		dom.rank.textContent = perf.rank;
		updateScore(perf);
		updatePercentage(perf);
	},
};

function connect() {
	var socket = new WebSocket('ws://' + (qs.ip || 'localhost') + ':' + (qs.port || '6557') + '/socket');
	socket.addEventListener('message', (message) => {
		var data = JSON.parse(message.data);
		var event = events[data.event];

		if (typeof event === 'function') {
			event(data.status, data.time);
		}
	});
	socket.addEventListener('close', () => {
		console.log('Socket error - reconnecting in 3s');
		setTimeout(connect, 3000);
	});
}
connect();
