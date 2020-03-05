/* global WebFont */
(async function() {
	const scoresaberRLDelay = 200;
	const USER_SCORES_PER_PAGE = 8;
	const LEADERBOARD_SCORES_PER_PAGE = 12;
	const PP_DECAY = .965;
	const PAUSE_UPDATE = 'PAUSE_UPDATE';
	const MODS = {
		GN: .04,
		DA: .02,
		FS: .08,
		NF: -.5,
		NO: -.05,
		NB: -.1,
		SS: -.3,
		NA: -.3
	};
	const ppCurve = [
		{ at: 0, value: 0 },
		{ at: 45, value: 0.015 },
		{ at: 50, value: 0.03 },
		{ at: 55, value: 0.06 },
		{ at: 60, value: 0.105 },
		{ at: 65, value: 0.16 },
		{ at: 68, value: 0.24 },
		{ at: 70, value: 0.285 },
		{ at: 80, value: 0.563 },
		{ at: 84, value: 0.695 },
		{ at: 88, value: 0.826 },
		{ at: 94.5, value: 1.015 },
		{ at: 95, value: 1.046 },
		{ at: 100, value: 1.12 },
		{ at: 110, value: 1.18 },
		{ at: 114, value: 1.25 },
	];
	const difficulties = {
		ExpertPlus: { className: 'expert-plus', display: 'Expert+' },
	};

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

	function download(data, filename) {
		let link = document.createElement('a');
		link.download = filename;
		link.href = data;
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	function copyToClipboard(str) {
		const el = document.createElement('textarea');
		el.value = str;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	}

	async function pause(duration) {
		await new Promise(res => setTimeout(res, duration));
	}

	function fetchJSON(...args) {
		return fetch(...args).then(r => r.json());
	}
	async function fetchHTML(...args) {
		return fetch(...args).then(r => r.ok ? r.text() : Promise.reject()).then(text => {
			if (text.indexOf('<html') === -1) {
				throw new Error('not an HTML page: ' + text);
			}
			let parser = new DOMParser();
			return parser.parseFromString(text, 'text/html');
		});
	}
	async function fetchScoreSaber(id, page, sort = 1, retries = 2) {
		return fetchHTML('/proxy/u/'+id+'?sort='+sort+'&page='+(page || 1)).catch(async e => {
			if (retries-- > 0) {
				await pause(1000);
				return fetchScoreSaber(id, page, sort, retries);
			}
			throw e;
		});
	}
	function getMultFromMods(modString) {
		return modString ? modString.split(',').reduce((mult, mod) => mult + (MODS[mod.trim()] || 0), 1) : 1;
	}

	async function getScoreAtRank(leaderboard, rank, retries = 2) {
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
			let isOldPercentage = cell && cell.querySelector('span[style*=tomato]');
			return match[0] * mult * (isOldPercentage ? (110 / 115) : 1);
		} catch(e) {
			if (retries-- > 0) {
				await pause(1000);
				return getScoreAtRank(leaderboard, rank, retries);
			}
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

	function ppFromScore(score) {
		if (!score || score <= 0) {
			return 0;
		}
		let index = ppCurve.findIndex(o => o.at >= score);
		if (index === -1) {
			return ppCurve[ppCurve.length - 1].value;
		}
		if (!index) {
			return ppCurve[0].value;
		}
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
	function refreshHistory() {
		$history.innerHTML = '';
		history.slice(0, 5).forEach(user => {
			if (!user || !user.avatar || user.rank == null || !user.name) {
				return;
			}
			let line = div('line');
			line.onclick = () => {
				if (profileInput.disabled) {
					return;
				}
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
	}
	refreshHistory();

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
		refreshHistory();
		return user;
	}
	function parsePage(doc) {
		if (!doc) {
			return;
		}
		let songsTable = doc.querySelector('table.ranking.songs tbody');
		if (!songsTable) {
			throw new Error('Error while parsing results page - maybe scoresaber is having issues?');
		}
		let rows = [...songsTable.querySelectorAll('tr')];
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
			parsed = parsed.filter(song => song.userPP);
			let len = parsed.length;
			parsed = parsed.map(song => {
				let base = rankedMaps[song.uid];
				if (!base) return;
				return Object.assign({}, base, song);
			}).filter(e => e);
			parsed.forEach(e => playerSongs[e.uid] = e);
			if (len === USER_SCORES_PER_PAGE) {
				await pause(scoresaberRLDelay);
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
		// Also update the list of ranked maps
		let newRankedRequest = fetchJSON('/ranked', { headers: { 'If-Modified-Since': new Date(rankedMapsUpdate).toUTCString() } });
		try {
			await newRankedRequest;
			rankedMapsPromise = newRankedRequest;
		} catch(e) {}
		let rankedMapsData = await rankedMapsPromise;
		updateLists(rankedMapsData, playerSongs);
		document.body.classList.remove('refreshing');
	}

	function updateLists(rankedMapsData, playerSongs) {
		played.elements = Object.values(playerSongs);
		unplayed.elements = rankedMapsData.list.filter(song => {
			return !Object.prototype.hasOwnProperty.call(playerSongs, song.uid);
		}).map(e => Object.assign({}, e));
		played.update();
		unplayed.update();
		updateEstCurve();
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
			let d = 2 * Math.abs(stars - score.stars);
			let front = stars > score.stars ? d * d * d : 1;
			let at = score.at || now;
			let time = 1 + Math.max(now - at, 0) / decay;
			let weight = 1 / (1 + d * time * front);
			o.weight += weight;
			o.sum += score.score * weight;
			return o;
		}, { weight: 0, sum: 0 });
		let result = data.weight ? data.sum / data.weight : 0;
		if (stars > maxStars) {
			let d = 2 * Math.abs(stars - maxStars);
			result /= (1 + d * d);
		}
		return result;
	}

	let estCurve = document.getElementById('score-est-curve');
	let estCurveCtx = estCurve.getContext('2d');
	function updateEstCurve(ctx, options) {
		ctx = ctx || estCurveCtx;
		options = options || {};
		let c = ctx.canvas;
		ctx.clearRect(0, 0, c.width, c.height);
		if (options.background) {
			ctx.fillStyle = options.background === true ? '#1e1f26' : options.background;
			ctx.fillRect(0, 0, c.width, c.height);
		}
		ctx.strokeStyle = 'white';
		let numPoints = options.numPoints || 100;
		let maxStars = options.maxStars || 12;
		let maxPercentage = options.maxPercentage || 1.12;
		let marginX = options.marginX || 34;
		let marginY = options.marginY || 20;
		ctx.fillStyle = 'white';
		ctx.font = '12px Calibri,Candara,Segoe,"Segoe UI",Optima,Arial,sans-serif';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'right';
		[...Array(5)].forEach((e, i) => {
			i += 1;
			ctx.fillText(20 * i + '%', marginX - 4, (c.height - marginY) * (1 - (i / 5) / maxPercentage), marginX - 4);
		});
		ctx.textBaseline = 'top';
		ctx.textAlign = 'left';
		ctx.fillText('star diff', 0, (c.height - marginY) + 4);
		ctx.textAlign = 'center';
		[...Array(maxStars - 1)].forEach((e, i) => {
			let star = i + 1;
			ctx.fillText(star, marginX + (c.width - marginX) * star / maxStars, (c.height - marginY) + 4);
		});
		ctx.strokeStyle = 'rgba(255, 255, 255, .1)';
		ctx.beginPath();
		[...Array(11)].forEach((e, i) => {
			i += 1;
			let y = (c.height - marginY) * (1 - (i / 10) / maxPercentage);
			ctx.moveTo(marginX, y);
			ctx.lineTo(c.width, y);
		});
		ctx.stroke();
		ctx.strokeStyle = 'white';
		ctx.beginPath();
		ctx.moveTo(marginX, 0);
		ctx.lineTo(marginX, c.height - marginY);
		ctx.lineTo(c.width, c.height - marginY);
		ctx.stroke();
		ctx.fillStyle = 'rgba(120, 10, 0, .9)';
		ctx.globalCompositeOperation = 'lighter';
		Object.values(playerSongs).forEach(song => {
			let x = marginX + (song.stars / maxStars) * (c.width - marginX);
			let y = (c.height - marginY) * (1 - (song.score / 100) / maxPercentage);
			ctx.fillRect(x - 1, y - 1, 2, 2);
		});
		ctx.globalCompositeOperation = 'source-over';
		ctx.beginPath();
		for (let i = 0; i < numPoints; i++) {
			let p = i / (numPoints - 1);
			let score = getScoreEstimate(p * maxStars) / 100;
			let x = marginX + p * (c.width - marginX);
			let y = (c.height - marginY) * (1 - score / maxPercentage);
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
		best: document.querySelector('.player .stats .best'),
		median: document.querySelector('.player .stats .median'),
	};
	function updatePlayerProfile() {
		$profile.avatar.style.backgroundImage = 'url('+user.avatar+')';
		$profile.flag.style.backgroundImage = 'url('+user.country+')';
		$profile.name.textContent = user.name;
		$profile.name.href = 'https://scoresaber.com/u/' + user.id;
		$profile.rank.textContent = user.rank.toLocaleString();
		$profile.pp.textContent = user.pp.toLocaleString();
		let ranks = Object.values(playerSongs).map(e => e.rank).sort((a, b) => a - b);
		let med = ranks[~~(ranks.length / 2)] || 0;
		let best = ranks[0] || 0;
		let bestCount = ranks.findIndex(e => e !== best);
		if (bestCount === -1) {
			bestCount = ranks.length;
		}
		$profile.best.textContent = best.toLocaleString();
		$profile.best.title = bestCount.toLocaleString() + ' leaderboard' + (bestCount === 1 ? '' : 's');
		$profile.median.textContent = med.toLocaleString();
	}

	let rankScoreCheckCount = 0;
	class SortMethod {
		constructor(list) {
			this.list = list;
			this.async = false;
			this.name = '???';
			this.id = 'unknown';
		}

		createOptionsMarkup() {}

		init() {}

		run(element) {
			updateEstimate(element, 0);
		}
	}

	class SortScoreEst extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Score est.';
			this.id = 'estimate';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}
	}

	class SortRank extends SortMethod {
		constructor(list) {
			super(list);
			this.async = true;
			this.name = 'Score at rank';
			this.id = 'rank';
		}

		createOptionsMarkup() {
			let rankForm = create('form', 'rank-form');
			rankForm.addEventListener('submit', e => e.preventDefault());
			this.rankInput = create('input', 'rank-input');
			this.rankInput.type = 'text';
			this.rankInput.placeholder = (user.rank || 1).toLocaleString() + ' (desired rank)';
			this.rankInput.addEventListener('change', () => {
				if (this.list.method === this) {
					this.list.update();
				}
			});
			rankForm.appendChild(this.rankInput);
			let submit = create('button', 'rank-submit');
			submit.type = 'submit';
			rankForm.appendChild(submit);
			return rankForm;
		}

		init(elements) {
			// elements.forEach(el => updateEstimate(el, getScoreEstimate(el.stars)));
			// elements.sort((a, b) => b.pp - a.pp);
			elements.sort((a, b) => b.stars - a.stars);
			this.rankInput.placeholder = (user.rank || 1).toLocaleString() + ' (desired rank)';
			this.rank = ~~(+this.rankInput.value.replace(/,/g, ''));
			if (!this.rank || this.rank <= 0) {
				this.rank = user.rank || 9999999;
			}
			rankScoreCheckCount = 0;
		}

		async run(element, isCanceled) {
			let rank = this.rank;
			let key = 'scoreAtRank'+rank;
			let usePause = false;
			if (!Object.prototype.hasOwnProperty.call(element, key)) {
				let score = 0;
				let scores = element.scores;
				if (typeof scores === 'string') {
					scores = +scores.replace(/,/g, '') || Infinity;
				}
				if (rank <= scores && rank < (+element.rank || Infinity)) {
					score = await getScoreAtRank(element.uid, rank);
					rankScoreCheckCount++;
					usePause = true;
				}
				// eslint-disable-next-line require-atomic-updates
				element[key] = score;
			}
			if (isCanceled()) {
				return;
			}
			updateEstimate(element, element[key] || 0);
			if (rankScoreCheckCount >= 100) {
				return PAUSE_UPDATE;
			}
			if (usePause) {
				await pause(scoresaberRLDelay);
			}
		}
	}

	class SortWorstRank extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Worst rank';
			this.id = 'worstrank';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}

		sort(elements) {
			return elements.sort((a, b) => {
				return (b.rank || 0) - (a.rank || 0) || b.pp - a.pp;
			});
		}
	}

	class SortBestRank extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Best rank';
			this.id = 'bestrank';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}

		sort(elements) {
			return elements.sort((a, b) => {
				return (a.rank || 0) - (b.rank || 0) || b.pp - a.pp;
			});
		}
	}

	class SortWorstScore extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Worst score';
			this.id = 'worstscore';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}

		sort(elements) {
			return elements.sort((a, b) => {
				return (a.score || 0) - (b.score || 0) || a.pp - b.pp;
			});
		}
	}

	// class SortCompare extends SortMethod {
	// 	constructor(list) {
	// 		super(list);
	// 		this.name = 'Compare';
	// 		this.async = true;
	// 		this.id = 'unknown';
	// 	}
	//
	// 	createOptionsMarkup() {
	// 		let compareForm = create('form', 'compare-form');
	// 		let compareInput = create('input', 'compare-input');
	// 		compareInput.type = 'text';
	// 		compareInput.placeholder = 'compared profile url';
	// 		compareForm.appendChild(compareInput);
	// 		let submit = create('button', 'compare-submit');
	// 		submit.type = 'submit';
	// 		compareForm.appendChild(submit);
	// 		return compareForm;
	// 	}
	//
	// 	init(elements) {
	// 		elements.forEach(el => updateEstimate(el, 0));
	// 		elements.sort((a, b) => b.pp - a.pp);
	//
	// 	}
	//
	// 	async run(element, isCanceled) {
	//
	// 	}
	// }

	class SortRaw extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Fixed score';
			this.id = 'raw';
			this.score = 94.333333;
		}

		createOptionsMarkup() {
			let fixedForm = create('form', 'fixed-form');
			fixedForm.addEventListener('submit', e => e.preventDefault());
			this.fixedInput = create('input', 'fixed-input');
			this.fixedInput.type = 'text';
			this.fixedInput.placeholder = '94.3333%';
			this.fixedInput.maxLength = 10;
			this.fixedInput.addEventListener('change', () => {
				if (this.list.method === this) {
					this.list.update();
				}
			});
			fixedForm.appendChild(this.fixedInput);
			let submit = create('button', 'fixed-submit');
			submit.type = 'submit';
			fixedForm.appendChild(submit);
			return fixedForm;
		}

		init() {
			this.score = parseFloat(this.fixedInput.value.trim()) || 94.333333;
			if (this.score <= 0) {
				this.score = 0.01;
			}
		}

		run(element) {
			updateEstimate(element, this.score);
		}
	}

	let baseMethods = [
		SortScoreEst,
		SortRank,
		// SortCompare,
		SortRaw
	];
	let playedMethods = baseMethods.concat(SortWorstRank, SortBestRank, SortWorstScore);

	class List {
		constructor(elem, title, methods, elements = []) {
			this.elem = elem;
			this.title = title;
			// Copy object to ensure new context
			this.methods = methods.map(Method => new Method(this));
			this.method = this.methods[0];
			this.elements = elements;
			this.displayed = 20;
			this.onScroll = this.onScroll.bind(this);
			elem.innerHTML = '';
			let header = div('list-header');
			let titleEl = div('list-title', title);
			this.titleEl = titleEl;
			let playlist = create('button', 'playlist', '', 'Create a playlist');
			playlist.onclick = this.createPlaylist.bind(this);
			titleEl.appendChild(playlist);
			header.appendChild(titleEl);
			let methodWrapper = div('method-wrapper');
			let method = div('method');
			let methodSelect = create('select');
			this.methods.forEach((method, i) => {
				let opt = selectOption(method.name, i);
				methodSelect.appendChild(opt);
			});
			methodSelect.onchange = () => {
				this.changeMethod(this.methods[methodSelect.value]);
			};
			method.appendChild(methodSelect);
			let unpause = create('button', 'unpause', '', 'Keep going');
			unpause.addEventListener('click', () => {
				if (this.updating) {
					return;
				}
				this.update();
			});
			method.appendChild(unpause);
			methodWrapper.appendChild(method);
			this.methods.forEach(method => {
				let markup = method.createOptionsMarkup();
				if (markup) {
					methodWrapper.appendChild(markup);
				}
			});
			header.appendChild(methodWrapper);
			elem.appendChild(header);
			this.content = div('list-content');
			this.content.addEventListener('scroll', this.onScroll);
			elem.appendChild(this.content);
			this.update();
			this.onScroll();
		}

		createPlaylist() {
			// eslint-disable-next-line no-alert
			let count = +prompt('Number of items to include in the playlist', 50);
			if (!count) {
				return;
			}
			let date = (new Date()).toISOString().slice(0, 10);
			let songs = this.elements.filter(e => e.id).slice(0, count).map(e => ({ hash: e.id, songName: e.name }));
			let data = {
				playlistTitle: this.title + ' (' + date + ')',
				playlistAuthor: 'Peepee',
				image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAF7klEQVR4Ae2dT4hbVRTGz315SToztjh1dJKM/6hFRLoQdakuuihF0O5F6KoIIm50IbhSBHEjbnUjCi61UCnajVCo4kIpFjcK/qFY3igt7YxJk5nJy5WALWTMnHdefTdz7z3fQGlfzvdOzvm+3/QlaZox5OBreXn5QJIkvzhorbnlC1mWfVC1AUnVDdEvLAcAQFh5VT4tAKjc0rAaAoCw8qp8WgBQuaVhNQQAYeVV+bQAoHJLw2oIAMLKq/JpAUDllobV0EjHbbVarxpjnpXo7+mk5o3X7nhCooVG5sDJ091fPz/Ty2VqWs+y7HGJNpWIxhpjzINE9KRE32wka0cPL0ik0Agd+O78xiIRjX8Vfhlj1gpF/wpwCZA6FanODQCGRpH6tWtr1Wr2uos7dwOAi0mV9zSGrAsLAIALVwPqCQACCsvFqADAhasB9QQAAYXlYlQA4MLVgHoCgIDCcjFqurS01JY0vreV76kldn2bdupTk4Mrpp8PulNftTImoaRe39YGh0UOtO6q1Q/cJ/atnufLh4p6juum3W5PDXH7yW+eWKNjT8lei0ibdVpcuXN7Cxz/HwcWWkTpnKjD5qal+x/9TaTFJUBkU7wiABBvtqLNAIDIpnhFACDebEWbAQCRTfGKAEC82Yo2AwAim+IVAYB4sxVtBgBENsUrAgDxZivaTPyuYFG3GYo251+iUW1lhvcou6tm7z0yoz9lYg9UwQIwbB6mvPawBxZOjtDofxgUALgETOan7ggAqIt8cmEAMOmHuiMAoC7yyYUBwKQf6o68exZgzd7xG5UKg7ACTWETCMg7ALr7zxGZZmE09cFnNH/teKFupgJTp97iF6K7rG+comb3LZHWpcg7AOTLbpH5z3tU5We7UTbImn2i1pbmRTrXIjwGcO2w5/0BgOcBuR4PALh22PP+AMDzgFyPBwBcO+x5/2CfBYwfbY/S8edWFXzZASX5xQIRX7ZmgWyyxIvGVSP+r1vFvWak8A6AhatPE1HxX0z92z+iXvNUoU3J8CdauHasUMcJho0jNNj7Nie5WasPPqV04/TN453+kIz+2qk009u9AyAZXRIa4OfnUCWji5RufSPcYfdlxd9quz8jJnDoAABwaG4IrQFACCk5nBEAODQ3hNYAIISUHM4IAByaG0Jr754G+mnakAwNZKPZTZnOE1WwAMytv0iWGoU22vQh6i0WvzDDNTL2b7rt8iOcJNhasAAkw59Fpg9rHRrVHhBpdxIZK/74/Z1aeHs7HgN4G81sBgMAs/HZ23sBAN5GM5vBAMBsfPb2XgCAt9HMZrBgnwWI7Rl1Kcl/F8unCf17+/m0KW/ttugBGP/bfHr16K25o+AsXAIUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IoAgHNHQQ0AKAiZWxEAcO4oqAEABSFzKwIAzh0FNQCgIGRuRQDAuaOgBgAUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IoAgHNHQQ0AKAiZWxEAcO4oqAEABSFzKwIAzh0FNQCgIGRuRQDAuaOgBgAUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IrjTwp9hRPcqJ08O/fcV983H7txzP1+6OCIXn5+nZOgVsKBWqNJFy5coS+/nROdlec2J6J3JOI0y7J3JUKi9goRiQC4srZFJ56J96dsyPyqUtWlr88N6P1P9kmb9rMse10ixiVA4lLEGgAQcbiS1QCAxKWINQAg4nAlqwEAiUsRawBAxOFKVgMAEpci1gCAiMOVrFbmZwZdIqIfJE17fdp/9vyeuyVaaGQOZJfTP4joR5margt1ZKTCMrpOp3PEWnumzDnQ8g5Ya4+vrq5+zKvKV3EJKO9ZVGcAgKjiLL8MACjvWVRnAICo4iy/DAAo71lUZwCAqOIsvwwAKO9ZVGcAgKjiLL/MP1IivdJqKho+AAAAAElFTkSuQmCC',
				songs: songs
			};
			let nameSlug = this.title.replace(/[\W-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
			let content = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
			download(content, nameSlug + '-' + date + '.bplist');
		}

		changeMethod(method) {
			if (this.method === method) {
				return;
			}
			if (this.method) {
				this.elem.classList.remove('method-' + this.method.id);
			}
			this.content.scrollTop = 0;
			this.displayed = 20;
			this.method = method;
			if (this.method) {
				this.elem.classList.add('method-' + this.method.id);
			}
			this.update();
			this.onScroll();
		}

		onScroll() {
			if (this.content.scrollTop + this.content.clientHeight > this.content.scrollHeight - 50) {
				this.displayMore();
			}
		}

		displayMore() {
			if (this.displayed >= this.elements.length) {
				return;
			}
			this.displayed += 20;
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
			if (element.score || element.score === 0) {
				let scoreAndRank = create('span', 'score-and-rank');
				scoreAndRank.appendChild(create('span', 'score', round(element.score, 2)));
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
			if (element.upvotes !== undefined) {
				important.appendChild(div('upvotes', element.upvotes, 'Upvotes'));
			}
			if (element.downvotes !== undefined) {
				important.appendChild(div('downvotes', element.downvotes, 'Downvotes'));
			}
			right.appendChild(important);
			let secondary = div('secondary');
			if (element.duration) {
				secondary.appendChild(div('duration', getDuration(element), 'Duration'));
			}
			secondary.appendChild(div('bpm', round(element.bpm, 2), 'BPM'));
			// secondary.appendChild(div('notes', element.noteCount, 'Notes count'));
			// secondary.appendChild(div('obstacles', element.obstacleCount, 'Obstacles count'));
			right.appendChild(secondary);
			let links = div('links');
			if (element.beatSaverKey) {
				let bsr = create('button', 'bsr', null, 'Copy !bsr request');
				bsr.addEventListener('click', () => copyToClipboard('!bsr ' + element.beatSaverKey));
				links.appendChild(bsr);
			}
			if (element.download) {
				let dl = link(element.download, 'download', null, 'Download map', '_blank');
				dl.addEventListener('click', e => {
					if (e.button !== 0) {
						return;
					}
					e.preventDefault();
					let iframe = document.createElement('iframe');
					iframe.style.display = 'none';
					document.body.appendChild(iframe);
					let done = () => {
						window.removeEventListener('blur', onBlur);
						document.body.removeChild(iframe);
					};
					let timeout = setTimeout(function () {
						done();
						location.href = element.download;
					}, 500);
					let onBlur = () => {
						clearTimeout(timeout);
						done();
					};
					window.addEventListener('blur', onBlur);
					iframe.contentWindow.location.href = 'beatsaver://' + element.beatSaverKey;
				});
				links.appendChild(dl);
			}
			if (element.beatSaverKey) {
				links.appendChild(link('https://beatsaver.com/beatmap/' + element.beatSaverKey, 'beatsaver', null, 'Open on BeatSaver', '_blank'));
			}
			links.appendChild(link('https://scoresaber.com/leaderboard/' + element.uid, 'leaderboards', null, 'ScoreSaber leaderboard', '_blank'));
			right.appendChild(links);
			el.appendChild(right);

			element.markup = el;
		}

		async update() {
			let elements = this.elements;
			let count = elements.length;
			this.titleEl.title = count + ' leaderboard' + (count === 1 ? '' : 's');
			let method = this.method;
			let updating = Date.now();
			this.elem.classList.remove('paused');
			if (this.updating) {
				this.elem.classList.remove('loading');
			}
			this.updating = updating;
			if (method.async) {
				this.elem.classList.add('loading');
			}
			await method.init(elements);
			this.refresh();
			let isCanceled = () => this.updating !== updating;
			for (let i = 0; i < elements.length; i++) {
				let result = await method.run(elements[i], isCanceled);
				if (method.async) {
					if (isCanceled()) {
						return;
					}
					this.refresh();
				}
				if (result === PAUSE_UPDATE) {
					this.elem.classList.add('paused');
					break;
				}
			}
			if (method.async) {
				this.elem.classList.remove('loading');
			} else {
				this.refresh();
			}
			this.updating = false;
		}

		defaultSort(elements) {
			return elements.sort((a, b) => {
				return (b.estimateFull || 0) - (a.estimateFull || 0) || b.pp - a.pp;
			});
		}

		refresh() {
			while (this.content.firstChild) {
				this.content.removeChild(this.content.firstChild);
			}
			let sort = this.method.sort || this.defaultSort;
			this.elements = sort(this.elements);
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

	let unplayed = new List(document.querySelector('.list.unplayed'), 'Not played', baseMethods);
	let played = new List(document.querySelector('.list.played'), 'To improve', playedMethods);

	let lastUpdateElement = document.getElementById('last-update');
	async function onSubmit(e) {
		if (e && e.preventDefault) {
			e.preventDefault();
		}
		// Prevent double submit
		if (userForm.classList.contains('loading')) {
			return;
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
			playerSongs = {};
			await getPages(id);
			fullPP = getFullPPWithUpdate(0, 0);
			updatePlayerProfile();
			updateLists(rankedMapsData, playerSongs);
			// Debugging
			window.playerSongs = playerSongs;
			document.body.classList.add('step-results', 'user-' + id);
		} catch(err) {
			console.log(err);
			triggerAnimation(userForm, 'invalid');
		}
		// eslint-disable-next-line require-atomic-updates
		profileInput.disabled = false;
		userForm.classList.remove('loading');
	}
	userForm.addEventListener('submit', onSubmit);
	profileInput.addEventListener('paste', () => setTimeout(onSubmit, 0));
	profileInput.addEventListener('focus', () => profileInput.select());

	document.getElementById('back').addEventListener('click', () => {
		profileInput.value = '';
		document.body.classList.remove('step-results');
	});
	document.getElementById('refresh').addEventListener('click', refresh);
	document.getElementById('export-curve').addEventListener('click', () => {
		let c = document.createElement('canvas');
		c.width = 800;
		c.height = 400;
		updateEstCurve(c.getContext('2d'), {
			background: true,
			numPoints: 500
		});
		let nameSlug = (user.name || '').replace(/[\W-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
		download(c.toDataURL(), nameSlug + '-score-curve.png');
	});
})();
