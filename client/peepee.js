/* global WebFont */

function triggerAnimation(el, name) {
	if (!el) {
		return;
	}
	el.classList.remove(name);
	el.offsetWidth;
	el.classList.add(name);
}

function round(n, p = 0) {
	return n.toFixed(p).replace(/\.?0*$/, '');
}

function create(tag, className, text, title) {
	let elem = document.createElement(tag);
	if (className != undefined) {
		elem.className = className;
	}
	if (text != undefined) {
		elem.textContent = text;
	}
	if (title != undefined) {
		elem.title = title;
	}
	return elem;
}
let div = create.bind(null, 'div');
let selectOption = (text, value) => {
	let elem = create('option');
	elem.textContent = text;
	elem.value = value;
	return elem;
};
let link = (href, className, text, title, target) => {
	let elem = create('a', className, text, title);
	elem.href = href;
	if (target) {
		elem.target = target;
	}
	return elem;
};

function fetchJSON(url) {
	return fetch(url).then(r => r.json());
}
function fetchHTML(url) {
	return fetch(url).then(r => r.text()).then(text => {
		let parser = new DOMParser();
		return parser.parseFromString(text, 'text/html');
	});
}
function fetchScoreSaber(id, page, sort = 1) {
	return fetchHTML('/proxy/u/'+id+'?sort='+sort+'&page='+(page || 1));
}
// Negative mod already included in the displayed percentage
let MODS = {
	GN: .04,
	DA: .02,
	FS: .08,
};
function getMultFromMods(modString) {
	return modString ? modString.split(',').reduce((mult, mod) => mult + (MODS[mod.trim()] || 0), 1) : 1;
}

let LEADERBOARD_SCORES_PER_PAGE = 12;
async function getScoreAtRank(leaderboard, rank) {
	if (!leaderboard || !rank) {
		console.log('Invalid score at rank request', leaderboard, rank);
		return 0;
	}
	let page = Math.ceil(rank / LEADERBOARD_SCORES_PER_PAGE);
	let indexOnPage = rank - (page - 1) * LEADERBOARD_SCORES_PER_PAGE;
	try {
		let doc = await fetchHTML('/proxy/leaderboard/'+leaderboard+'?page='+(page || 1));
		if (!doc) {
			return 0;
		}
		let row = doc.querySelector('.ranking tbody tr:nth-child('+indexOnPage+')');
		if (!row) {
			return 0;
		}
		let cell = row.querySelector('.percentage');
		let match = (cell && cell.textContent || '').match(/[\d.]+/);
		if (!match) {
			return 0;
		}
		let mods = row.querySelector('.mods');
		let mult = getMultFromMods(mods && mods.textContent);
		return match[0] * mult;
	} catch(e) {
		console.log('Error getting score at rank', e);
		return 0;
	}
}
function getDuration(song) {
	let minutesFloat = song.duration / song.bpm;
	let minutes = Math.floor(minutesFloat);
	let seconds = Math.round((minutesFloat - minutes) * 60);
	return minutes + ':' + ('0' + seconds).slice(-2);
}

const PER_PAGE = 8;
const PP_DECAY = .965;

const ppCurve = [
	{ at: 0, value: 0 },
	{ at: 15, value: .04 },
	{ at: 28, value: .15 },
	{ at: 40, value: .31 },
	{ at: 58, value: .41 },
	{ at: 68, value: .49 },
	{ at: 82, value: .81 },
	{ at: 93.5, value: .99 },
	{ at: 96, value: 1.02 },
	{ at: 100, value: 1.04 },
	{ at: 112, value: 1.06 },
	{ at: Infinity, value: 1.06 }
];
function ppFromScore(score) {
	if (!score || score <= 0) {
		return 0;
	}
	let index = ppCurve.findIndex(o => o.at >= score);
	let from = ppCurve[index - 1];
	let to = ppCurve[index];
	let progress = (score - from.at) / (to.at - from.at);
	return from.value + (to.value - from.value) * progress;
}

function getImageSrc(el) {
	if (!el) {
		return null;
	}
	// Not .src cause it automatically expends the path
	let src = el.getAttribute('src');
	if (!src.match(/^https?:\/\//)) {
		src = 'https://scoresaber.com' + (src[0] === '/' ? '' : '/') + src;
	}
	return src;
}

// document.body.classList.add('step-results');

(async function() {
	WebFont.load({
		custom: {
			families: ['NeonTubes']
		}
	});

	let userForm = document.getElementById('user');
	let profileInput = document.getElementById('profile');
	let userFetchInfo = document.getElementById('user-fetch-info');

	let history = [];
	try {
		let savedHistory = JSON.parse(localStorage.getItem('history'));
		if (Array.isArray(savedHistory)) {
			history = savedHistory;
		}
	} catch(e) { /* Nothing */ }
	let $history = document.querySelector('.history');
	history.slice(0, 5).forEach(user => {
		if (!user || !user.avatar || !user.rank || !user.name) {
			return;
		}
		let line = div('line');
		line.onclick = () => {
			profileInput.value = user.id;
			onSubmit();
		};
		let avatar = div('avatar');
		avatar.style.backgroundImage = 'url('+user.avatar+')';
		line.appendChild(avatar);
		line.appendChild(div('rank', user.rank.toLocaleString()));
		line.appendChild(div('name', user.name));
		$history.appendChild(line);
	});

	let user = {};
	let playerSongs = {};
	let rankedMaps = {};
	let lastUpdate = Date.now();
	let rankedMapsUpdate = 0;
	let rankedMapsPromise = fetchJSON('/ranked');
	let fullPP = 0;
	function parseUser(id, doc) {
		let nameEl = doc.querySelector('h5.title');
		let name = nameEl && nameEl.textContent.trim();
		if (!name) {
			throw new Error('Invalid Profile');
		}
		let avatarEl = doc.querySelector('.avatar img');
		let countryEl = nameEl.querySelector('img');
		let dataEl = doc.querySelector('h5.title ~ ul');
		let data = dataEl && dataEl.textContent || '';
		let rankMatch = data.match(/#([\d,]+) /);
		let ppMatch = data.match(/([\d,.]+)pp/);
		let user = {
			id,
			name,
			avatar: getImageSrc(avatarEl),
			country: getImageSrc(countryEl),
			rank: rankMatch ? +rankMatch[1].replace(/\D/g, '') : 0,
			pp: ppMatch ? +ppMatch[1].replace(/[^\d.]/g, '') : 0
		};
		history = history.filter(u => u && u.id !== user.id);
		history.unshift(user);
		history = history.slice(0, 5);
		try {
			localStorage.setItem('history', JSON.stringify(history));
		} catch(e) { /* Nothing */ }
		return user;
	}
	function parsePage(doc) {
		if (!doc) {
			return;
		}
		let rows = [...doc.querySelectorAll('table.ranking.songs tbody tr')];
		return rows.map(row => {
			let leaderboardLink = row.querySelector('a[href*="/leaderboard/"]');
			let uidMatch = leaderboardLink && leaderboardLink.href.match(/\/leaderboard\/(\d+)/);
			if (!uidMatch) {
				return;
			}
			let uid = +uidMatch[1];
			let ppEl = row.querySelector('.ppValue');
			let pp = ppEl && +ppEl.textContent;
			let rankEl = row.querySelector('.rank');
			let rankMatch = rankEl && rankEl.textContent.match(/#?([\d,]+)/);
			let timeEl = row.querySelector('.time');
			let timeValue = Date.now();
			if (timeEl) {
				let dateStr = (timeEl.title || '').replace(/^.*(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}).*$/, '$1T$2Z');
				timeValue = +new Date(dateStr) || timeValue;
			}
			let weightedEl = row.querySelector('.ppWeightedValue');
			let weightedMatch = weightedEl && weightedEl.textContent.match(/([\d.]+)/);
			let scoreEl = row.querySelector('.scoreBottom');
			let scoreMatch = scoreEl && scoreEl.textContent.match(/([\d.]+)%/);
			let score = (scoreMatch && +scoreMatch[1]) || 0;
			let modMatch = scoreEl && scoreEl.textContent.match(/\(([^)]+)\)/);
			let mult = getMultFromMods(modMatch && modMatch[1]);
			return {
				uid,
				rank: rankMatch && +rankMatch[1].replace(/\D/g, '') || Infinity,
				at: timeValue,
				userPP: pp,
				weighted: weightedMatch && +weightedMatch[1] || 0,
				// Actual percentage, used for PP calc etc.
				score: score * mult,
				// Score displayed
				modScore: score
			};
		}).filter(e => e);
	}
	async function getPages(id, from = 1) {
		userFetchInfo.textContent = 'Getting scores page '+from+'...';
		let doc = await fetchScoreSaber(id, from);
		if (from === 1) {
			user = parseUser(id, doc);
		}
		let parsed = parsePage(doc);
		if (parsed) {
			let len = parsed.length;
			parsed = parsed.map(song => {
				let base = rankedMaps[song.uid];
				if (!base) return;
				return Object.assign({}, base, song);
			}).filter(e => e);
			parsed.forEach(e => playerSongs[e.uid] = e);
			if (len === PER_PAGE) {
				// There is (probably) more
				return getPages(id, from + 1);
			}
		}
	}
	async function getRecentScores(id, since, page = 1) {
		let doc = await fetchScoreSaber(id, page, 2);
		if (page === 1) {
			user = parseUser(id, doc);
		}
		let parsed = parsePage(doc);
		if (parsed) {
			let oldest = Math.min(...parsed.map(song => song.at));
			parsed = parsed.map(song => {
				let base = rankedMaps[song.uid];
				if (!base) return;
				return Object.assign({}, base, song);
			}).filter(e => e);
			parsed.forEach(e => playerSongs[e.uid] = e);
			if (oldest >= since) {
				return getRecentScores(id, since, page + 1);
			}
		}
	}
	async function refresh() {
		if (!user || !user.id) {
			return;
		}
		document.body.classList.add('refreshing');
		try {
			let since = lastUpdate;
			lastUpdate = Date.now();
			await getRecentScores(user.id, since);
		} catch(e) { /* Nothing */ }
		fullPP = getFullPPWithUpdate(0, 0);
		updatePlayerProfile();
		played.update();
		unplayed.update();
		updateEstCurve();
		document.body.classList.remove('refreshing');
	}

	function getFullPPWithUpdate(uid, pp) {
		let scores = Object.values(playerSongs).filter(song => song.uid !== uid).map(song => song.userPP);
		if (pp) {
			scores.push(pp);
		}
		scores.sort((a, b) => b - a);
		let mult = 1;
		let result = scores.reduce((total, score, i) => total + score * (mult *= (i ? PP_DECAY : 1)), 0);
		// return Math.max(result, fullPP);
		return result;
	}

	function updateEstimate(song, score) {
		if (song.score && song.score >= score) {
			song.estimateScore = song.score;
			song.estimatePP = song.userPP;
			song.estimateFull = fullPP;
			return;
		}
		song.estimateScore = score;
		song.estimatePP = song.pp * ppFromScore(score);
		song.estimateFull = getFullPPWithUpdate(song.uid, song.estimatePP);
	}

	function getScoreEstimate(stars) {
		let now = Date.now();
		let decay = 1000 * 60 * 60 * 24 * 15;
		let scores = Object.values(playerSongs);
		let maxStars = Math.max(...scores.map(e => e.stars));
		let data = scores.reduce((o, score) => {
			let d = 2 * (stars - score.stars);
			let time = 1 + Math.max(now - score.at, 0) / decay;
			let weight = 1 / (1 + d * d * time);
			o.weight += weight;
			o.sum += score.score * weight;
			return o;
		}, { weight: 0, sum: 0 });
		let result = data.weight ? data.sum / data.weight : 0;
		if (stars > maxStars) {
			let d = stars - maxStars;
			result /= (1 + d * d);
		}
		return result;
	}

	let estCurve = document.getElementById('score-est-curve');
	let estCurveCtx = estCurve.getContext('2d');
	function updateEstCurve() {
		let ctx = estCurveCtx;
		ctx.clearRect(0, 0, estCurve.width, estCurve.height);
		ctx.strokeStyle = 'white';
		let numPoints = 100;
		let maxStars = 12;
		let maxPercentage = 1.2;
		let marginX = 34;
		let marginY = 20;
		ctx.fillStyle = 'white';
		ctx.font = '12px Calibri,Candara,Segoe,"Segoe UI",Optima,Arial,sans-serif';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'right';
		[...Array(5)].forEach((e, i) => {
			i += 1;
			ctx.fillText(20 * i + '%', marginX - 4, (estCurve.height - marginY) * (1 - (i / 5) / maxPercentage), marginX - 4);
		});
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.fillText('star diff', 0, (estCurve.height - marginY) + 4);
		ctx.textAlign = 'center';
		[...Array(maxStars - 1)].forEach((e, i) => {
			let star = i + 1;
			ctx.fillText(star, marginX + (estCurve.width - marginX) * star / maxStars, (estCurve.height - marginY) + 4);
		});
		ctx.strokeStyle = 'rgba(255, 255, 255, .1)';
		ctx.beginPath();
		[...Array(11)].forEach((e, i) => {
			i += 1;
			let y = (estCurve.height - marginY) * (1 - (i / 10) / maxPercentage);
			ctx.moveTo(marginX, y);
			ctx.lineTo(estCurve.width, y);
		});
		ctx.stroke();
		ctx.strokeStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(marginX, 0);
		ctx.lineTo(marginX, estCurve.height - marginY);
		ctx.lineTo(estCurve.width, estCurve.height - marginY);
		ctx.stroke();
		ctx.fillStyle = 'rgba(120, 10, 0, .9)';
		ctx.globalCompositeOperation = 'lighter';
		Object.values(playerSongs).forEach(song => {
			let x = marginX + (song.stars / maxStars) * (estCurve.width - marginX);
			let y = (estCurve.height - marginY) * (1 - (song.score / 100) / maxPercentage);
			ctx.fillRect(x - 1, y - 1, 2, 2);
		});
		ctx.globalCompositeOperation = 'source-over';
		ctx.beginPath();
		for (let i = 0; i < numPoints; i++) {
			let p = i / (numPoints - 1);
			let score = getScoreEstimate(p * maxStars) / 100;
			let x = marginX + p * (estCurve.width - marginX);
			let y = (estCurve.height - marginY) * (1 - score / maxPercentage);
			ctx.lineTo(x, y);
		}
		ctx.stroke();
	}

	let $profile = {
		avatar: document.querySelector('.player .avatar'),
		flag: document.querySelector('.player .flag'),
		name: document.querySelector('.player .name'),
		rank: document.querySelector('.player .rank'),
		pp: document.querySelector('.player .pp'),
	};
	function updatePlayerProfile() {
		$profile.avatar.style.backgroundImage = 'url('+user.avatar+')';
		$profile.flag.style.backgroundImage = 'url('+user.country+')';
		$profile.name.textContent = user.name;
		$profile.rank.textContent = user.rank.toLocaleString();
		$profile.pp.textContent = user.pp.toLocaleString();
	}

	let difficulties = {
		ExpertPlus: { className: 'expert-plus', display: 'Expert+' },
	};
	let methods = [
		{
			name: 'Score est.',
			run: element => {
				updateEstimate(element, getScoreEstimate(element.stars));
			},
			async: false
		},
		{
			name: 'Rank',
			run: async element => {
				let rank = user.rank;
				let key = 'scoreAtRank'+rank;
				if (!element.hasOwnProperty(key)) {
					let score = 0;
					if (rank <= element.scores) {
						score = await getScoreAtRank(element.uid, rank);
					}
					element[key] = score;
				}
				updateEstimate(element, element[key]);
			},
			async: true
		},
		{
			name: 'Max pp',
			run: element => {
				updateEstimate(element, 94.333333);
			},
			async: false
		}
	];
	class List {
		constructor(elem, title, methods, elements = []) {
			this.elem = elem;
			this.title = title;
			this.methods = methods;
			this.method = methods[0];
			this.elements = elements;
			this.displayed = 20;
			this.onScroll = this.onScroll.bind(this);
			elem.innerHTML = '';
			let header = div('list-header');
			let titleEl = div('list-title', title);
			header.appendChild(titleEl);
			let method = div('method');
			let methodSelect = create('select');
			methods.forEach((method, i) => {
				let opt = selectOption(method.name, i);
				methodSelect.appendChild(opt);
			});
			methodSelect.onchange = () => {
				this.changeMethod(methods[methodSelect.value]);
			};
			method.appendChild(methodSelect);
			header.appendChild(method);
			elem.appendChild(header);
			this.content = div('list-content');
			this.content.addEventListener('scroll', this.onScroll);
			elem.appendChild(this.content);
			this.update();
			this.onScroll();
		}

		changeMethod(method) {
			if (this.method === method) {
				return;
			}
			this.content.scrollTop = 0;
			this.displayed = 20;
			this.method = method;
			this.update();
			this.onScroll();
		}

		onScroll() {
			if (this.content.scrollTop + this.content.clientHeight > this.content.scrollHeight - 50) {
				this.displayMore();
			}
		}

		displayMore() {
			if (this.display >= this.elements.length) {
				return;
			}
			this.displayed += 10;
			this.refresh();
		}

		createMarkup(element) {
			let el = div('element');

			let left = div('left');
			let pic = div('pic');
			pic.style.backgroundImage = 'url(https://scoresaber.com/imports/images/songs/'+element.id+'.png)';
			left.appendChild(pic);
			let nameGroup = div('name-group');
			let nameAndArtist = div('name-and-artist');
			nameAndArtist.title = element.name + ' - ' + element.artist;
			nameAndArtist.appendChild(create('span', 'name', element.name));
			nameAndArtist.appendChild(create('span', 'sep'));
			nameAndArtist.appendChild(create('span', 'artist', element.artist));
			nameGroup.appendChild(nameAndArtist);
			nameGroup.appendChild(div('mapper', element.mapper));
			let srcDiff = element.diff || 'Easy';
			let diff = difficulties[srcDiff] || {};
			let difficultyAndScore = div('difficulty-and-score');
			difficultyAndScore.appendChild(create('span', 'difficulty ' + (diff.className || srcDiff.toLowerCase()), diff.display || srcDiff));
			if (element.score) {
				let scoreAndRank = create('span', 'score-and-rank');
				scoreAndRank.appendChild(create('span', 'score', element.score));
				scoreAndRank.appendChild(create('span', 'sep'));
				scoreAndRank.appendChild(create('span', 'rank', element.rank.toLocaleString()));
				difficultyAndScore.appendChild(scoreAndRank);
			}
			nameGroup.appendChild(difficultyAndScore);
			left.appendChild(nameGroup);
			el.appendChild(left);

			let middle = div('middle');
			middle.appendChild(div('pot-title', 'Potential'));
			element._potScore = div('pot-score');
			middle.appendChild(element._potScore);
			let potPP = div('pot-pp');
			element._potPP = create('span');
			potPP.appendChild(element._potPP);
			element._potInc = create('span', 'increase', null, 'Total (weighted) pp change');
			potPP.appendChild(element._potInc);
			middle.appendChild(potPP);
			el.appendChild(middle);

			let right = div('right');
			let important = div('important');
			important.appendChild(div('star-difficulty', element.stars, 'Star difficulty'));
			important.appendChild(div('upvotes', element.upvotes, 'Upvotes'));
			important.appendChild(div('downvotes', element.downvotes, 'Downvotes'));
			right.appendChild(important);
			let secondary = div('secondary');
			secondary.appendChild(div('duration', getDuration(element), 'Duration'));
			secondary.appendChild(div('bpm', round(element.bpm, 2), 'BPM'));
			secondary.appendChild(div('notes', element.noteCount, 'Notes count'));
			secondary.appendChild(div('obstacles', element.obstacleCount, 'Obstacles count'));
			right.appendChild(secondary);
			let links = div('links');
			links.appendChild(link(element.download, 'download', null, 'Download map', '_blank'));
			links.appendChild(link(element.beatSaverLink, 'beatsaver', null, 'Open on BeatSaver', '_blank'));
			links.appendChild(link('https://scoresaber.com/leaderboard/' + element.uid, 'leaderboards', null, 'ScoreSaber leaderboard', '_blank'));
			right.appendChild(links);
			el.appendChild(right);

			element.markup = el;
		}

		async update() {
			let elements = this.elements;
			let method = this.method;
			let updating = Date.now();
			if (this.updating) {
				this.elem.classList.remove('loading');
			}
			this.updating = updating;
			if (method.async) {
				this.elem.classList.add('loading');
				elements.forEach(el => updateEstimate(el, 0));
			}
			this.refresh();
			for (let i = 0; i < elements.length; i++) {
				if (method.async) {
					await method.run(elements[i]);
					if (this.updating !== updating) {
						return;
					}
					this.refresh();
				} else {
					method.run(elements[i]);
				}
			}
			if (method.async) {
				this.elem.classList.remove('loading');
			} else {
				this.refresh();
			}
			this.updating = false;
		}

		refresh() {
			while (this.content.firstChild) {
				this.content.removeChild(this.content.firstChild);
			}
			this.elements.sort((b, a) => {
				return (a.estimateFull || 0) - (b.estimateFull || 0);
			});
			this.elements.slice(0, this.displayed).forEach(el => {
				if (!el.markup) {
					this.createMarkup(el);
				}
				if (el.estimateScore === undefined) {
					updateEstimate(el, 0);
				}
				el._potScore.textContent = round(el.estimateScore, 2) + '%';
				el._potPP.textContent = round(el.estimatePP, 2) + 'pp';
				el._potInc.textContent = round(Math.max(el.estimateFull - fullPP, 0), 2);
				this.content.appendChild(el.markup);
			});
		}
	}

	let unplayed = new List(document.querySelector('.list.unplayed'), 'Not played', methods);
	let played = new List(document.querySelector('.list.played'), 'To improve', methods);

	let lastUpdateElement = document.getElementById('last-update');
	async function onSubmit(e) {
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		let idMatch = profileInput.value.match(/\d{5,}/);
		if (!idMatch) {
			triggerAnimation(userForm, 'invalid');
			return;
		}
		let id = idMatch[0];
		userFetchInfo.textContent = 'Getting user infos...';
		userForm.classList.add('loading');
		profileInput.disabled = true;
		lastUpdate = Date.now();
		try {
			let rankedMapsData = await rankedMapsPromise;
			rankedMaps = rankedMapsData.list.reduce((rankedMaps, map) => {
				rankedMaps[map.uid] = map;
				return rankedMaps;
			}, {});
			rankedMapsUpdate = rankedMapsData.timestamp;
			lastUpdateElement.textContent = new Date(rankedMapsUpdate).toString();
			await getPages(id);
			fullPP = getFullPPWithUpdate(0, 0);
			updatePlayerProfile();
			played.elements = Object.values(playerSongs);
			unplayed.elements = rankedMapsData.list.filter(song => {
				return !playerSongs.hasOwnProperty(song.uid);
			});
			played.update();
			unplayed.update();
			document.body.classList.add('step-results');
			updateEstCurve();
		} catch(err) {
			console.log(err);
			triggerAnimation(userForm, 'invalid');
		}
		profileInput.disabled = false;
		userForm.classList.remove('loading');
	}
	userForm.addEventListener('submit', onSubmit);
	profileInput.addEventListener('paste', () => setTimeout(onSubmit, 0));
	profileInput.addEventListener('focus', () => profileInput.select());

	document.getElementById('refresh').addEventListener('click', refresh);
})();
