/* global WebFont */

// TODO: split this file...

(async function () {
	document.body.classList.add('js-loaded');

	const scoresaberRLDelay = 200;
	const USER_SCORES_PER_PAGE = 100;
	const LEADERBOARD_SCORES_PER_PAGE = 12;
	const PLAYERS_PER_PAGE = 50;
	const PP_DECAY = .965;
	const PAUSE_UPDATE = Symbol('pause');
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
	const difficulties = {
		ExpertPlus: { className: 'expert-plus', display: 'Expert+' },
	};

	const MAP_STYLE = 1;
	const MUSIC_GENRE = 2;
	const tags = [
		{ type: MAP_STYLE, name: 'Accuracy', slug: 'accuracy' },
		{ type: MAP_STYLE, name: 'Balanced', slug: 'balanced' },
		{ type: MAP_STYLE, name: 'Challenge', slug: 'challenge' },
		{ type: MAP_STYLE, name: 'Dance', slug: 'dance-style' },
		{ type: MAP_STYLE, name: 'Fitness', slug: 'fitness' },
		{ type: MAP_STYLE, name: 'Speed', slug: 'speed' },
		{ type: MAP_STYLE, name: 'Tech', slug: 'tech' },
		{ type: MUSIC_GENRE, name: 'Alternative', slug: 'alternative' },
		{ type: MUSIC_GENRE, name: 'Ambient', slug: 'ambient' },
		{ type: MUSIC_GENRE, name: 'Anime', slug: 'anime' },
		{ type: MUSIC_GENRE, name: 'Classical & Orchestral', slug: 'classical-orchestral' },
		{ type: MUSIC_GENRE, name: 'Comedy & Meme', slug: 'comedy-meme' },
		{ type: MUSIC_GENRE, name: 'Dance', slug: 'dance' },
		{ type: MUSIC_GENRE, name: 'Drum and Bass', slug: 'drum-and-bass' },
		{ type: MUSIC_GENRE, name: 'Dubstep', slug: 'dubstep' },
		{ type: MUSIC_GENRE, name: 'Electronic', slug: 'electronic' },
		{ type: MUSIC_GENRE, name: 'Folk & Acoustic', slug: 'folk-acoustic' },
		{ type: MUSIC_GENRE, name: 'Funk & Disco', slug: 'funk-disco' },
		{ type: MUSIC_GENRE, name: 'Hardcore', slug: 'hardcore' },
		{ type: MUSIC_GENRE, name: 'Hip Hop & Rap', slug: 'hip-hop-rap' },
		{ type: MUSIC_GENRE, name: 'Holiday', slug: 'holiday' },
		{ type: MUSIC_GENRE, name: 'House', slug: 'house' },
		{ type: MUSIC_GENRE, name: 'Indie', slug: 'indie' },
		{ type: MUSIC_GENRE, name: 'Instrumental', slug: 'instrumental' },
		{ type: MUSIC_GENRE, name: 'J-Pop', slug: 'j-pop' },
		{ type: MUSIC_GENRE, name: 'J-Rock', slug: 'j-rock' },
		{ type: MUSIC_GENRE, name: 'Jazz', slug: 'jazz' },
		{ type: MUSIC_GENRE, name: 'K-Pop', slug: 'k-pop' },
		{ type: MUSIC_GENRE, name: 'Kids & Family', slug: 'kids-family' },
		{ type: MUSIC_GENRE, name: 'Metal', slug: 'metal' },
		{ type: MUSIC_GENRE, name: 'Nightcore', slug: 'nightcore' },
		{ type: MUSIC_GENRE, name: 'Pop', slug: 'pop' },
		{ type: MUSIC_GENRE, name: 'Punk', slug: 'punk' },
		{ type: MUSIC_GENRE, name: 'R&B', slug: 'rb' },
		{ type: MUSIC_GENRE, name: 'Rock', slug: 'rock' },
		{ type: MUSIC_GENRE, name: 'Soul', slug: 'soul' },
		{ type: MUSIC_GENRE, name: 'Speedcore', slug: 'speedcore' },
		{ type: MUSIC_GENRE, name: 'Swing', slug: 'swing' },
		{ type: MUSIC_GENRE, name: 'Techno', slug: 'techno' },
		{ type: MUSIC_GENRE, name: 'Trance', slug: 'trance' },
		{ type: MUSIC_GENRE, name: 'TV & Film', slug: 'tv-movie-soundtrack' },
		{ type: MUSIC_GENRE, name: 'Video Game', slug: 'video-game-soundtrack' },
		{ type: MUSIC_GENRE, name: 'Vocaloid', slug: 'vocaloid' },
	];

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
	function clamp(n, m, M) {
		return n < m ? m : n > M ? M : n;
	}
	function lerp(p, a, b) {
		return a + p * (b - a);
	}
	function ilerp(v, a, b, limit) {
		const r = (v - a) / (b - a);
		return limit ? clamp(r, 0, 1) : r;
	}
	function scale(v, fromMin, fromMax, toMin, toMax) {
		return lerp(ilerp(v, fromMin, fromMax), toMin, toMax);
	}

	function pad2(n) {
		return ('0' + n).slice(-2);
	}
	function standardDate(date, withSeconds) {
		let datePart = date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
		let timePart = pad2(date.getHours()) + ':' + pad2(date.getMinutes());
		if (withSeconds) {
			timePart += ':' + pad2(date.getSeconds());
		}
		return datePart + ' ' + timePart;
	}
	const dateDistance = (() => {
		const SECOND = 1000;
		const MINUTE = 60 * SECOND;
		const HOUR = 60 * MINUTE;
		const DAY = 24 * HOUR;
		const MONTH = 30 * DAY;

		let convert = (ms, unit) => ~~(ms / unit);
		let plural = (count, word) => count + ' ' + word + (count !== 1 && count !== -1 ? 's' : '');

		function getDateDistanceString(date, fromDate) {
			let diff = fromDate - date;
			let dist = Math.abs(diff);
			if (dist < MINUTE) {
				return plural(convert(diff, SECOND), 'second');
			}
			if (dist < HOUR) {
				return plural(convert(diff, MINUTE), 'minute');
			}
			if (dist < DAY) {
				return plural(convert(diff, HOUR), 'hour');
			}
			if (dist < MONTH) {
				return plural(convert(diff, DAY), 'day');
			}
			let months = dateDiffInMonths(date, fromDate);
			if (Math.abs(months) < 12) {
				return plural(months, 'month');
			}
			let years = ~~(months / 12);
			return plural(years, 'year');
		}
		function dateDiffInMonths(date, fromDate) {
			let years = fromDate.getFullYear() - date.getFullYear();
			let months = fromDate.getMonth() - date.getMonth();
			return months + 12 * years;
		}

		return date => getDateDistanceString(date, new Date()) + ' ago';
	})();

	function create(tag, className, text, title) {
		let elem = document.createElement(tag);
		if (className != undefined) {
			elem.className = className;
		}
		if (text != undefined) {
			Array.isArray(text) ? elem.append(...text) : elem.append(text);
		}
		if (title != undefined) {
			elem.title = title;
		}
		return elem;
	}
	let div = create.bind(null, 'div');
	let span = create.bind(null, 'span');
	let textInput = (className, value, placeholder) => {
		let elem = create('input', className);
		if (value) {
			elem.value = value;
		}
		if (placeholder) {
			elem.placeholder = placeholder;
		}
		return elem;
	};
	let selectOption = (text, value) => {
		let elem = create('option', '', text);
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
		let el = link(data);
		el.download = filename;
		el.style.display = 'none';
		document.body.appendChild(el);
		el.click();
		document.body.removeChild(el);
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
	async function getUserData(id) {
		let data = await scoresaberAPI('/player/' + id + '/full');
		return {
			id: data.id,
			name: data.name,
			avatar: data.profilePicture,
			country: data.country,
			rank: data.rank,
			pp: data.pp,
			rankedPlays: data.scoreStats?.rankedPlayCount || '??'
		};
	}
	async function getUserScores(user, page, sort = 'top', limit) {
		let results = await scoresaberAPI('/player/' + user + '/scores', {
			sort,
			limit: limit || USER_SCORES_PER_PAGE,
			page: +page || 1,
		});

		return results.playerScores.map(({ score, leaderboard }) => {
			return {
				uid: leaderboard.id,
				rank: score.rank,
				at: +new Date(score.timeSet),
				userPP: score.pp,
				weighted: score.pp * score.weight,
				maxScore: leaderboard.maxScore,
				score: score.baseScore / leaderboard.maxScore,
				modScore: score.modifiedScore / leaderboard.maxScore
			};
		});
	}

	async function getLeaderboardScores(leaderboard, page) {
		let data = await scoresaberAPI('/leaderboard/by-id/' + leaderboard + '/scores', { page: +page || 1 });
		return (data.scores || []).map(score => ({
			rank: score.rank,
			at: +new Date(score.timeSet),
			userPP: score.pp,
			weighted: score.pp * score.weight,
			scoreRaw: score.baseScore,
			modScoreRaw: score.modifiedScore
		}));
	}
	async function getPlayers(page) {
		let data = await scoresaberAPI('/players', { page: +page || 1 });
		return data.players.map(player => ({
			id: player.id,
			name: player.name,
			rank: player.rank,
			pp: player.pp,
			country: player.country
		}));
	}

	async function fetchRanked(modifiedSince) {
		let options;
		if (modifiedSince) {
			options = { headers: { 'If-Modified-Since': modifiedSince.toUTCString() } };
		}
		let rankedMapsData = await fetchJSON('/ranked', options);
		updateLastUpdate(rankedMapsData);
		return rankedMapsData;
	}

	async function getScoreAtRank(leaderboard, rank, retries = 2) {
		if (!leaderboard?.uid || !rank) {
			console.log('Invalid score at rank request', leaderboard, rank);
			return 0;
		}
		let page = Math.ceil(rank / LEADERBOARD_SCORES_PER_PAGE);
		let indexOnPage = rank - (page - 1) * LEADERBOARD_SCORES_PER_PAGE - 1;
		try {
			let scores = await getLeaderboardScores(leaderboard?.uid, page);
			return (scores[indexOnPage]?.scoreRaw || 0) / leaderboard.maxScore;
		} catch (e) {
			if (retries-- > 0) {
				await pause(1000);
				return getScoreAtRank(leaderboard, rank, retries);
			}
			console.log('Error getting score at rank', e);
			return 0;
		}
	}
	async function getPlayerAtRank(rank, retries = 2) {
		if (!rank) {
			console.log('Invalid player at rank request', rank);
			return null;
		}
		let page = Math.ceil(rank / PLAYERS_PER_PAGE);
		let indexOnPage = rank - (page - 1) * PLAYERS_PER_PAGE - 1;
		try {
			let players = await getPlayers(page);
			return players[indexOnPage]?.id;
		} catch (e) {
			if (retries-- > 0) {
				await pause(1000);
				return getPlayerAtRank(rank, retries);
			}
			console.log('Error getting player at rank', e);
			return null;
		}
	}
	function getDuration(song) {
		let secondsTotal = song.durationSeconds || (60 * song.duration / song.bpm);
		let minutes = Math.floor(secondsTotal / 60);
		let seconds = Math.round(secondsTotal % 60);
		return minutes + ':' + ('0' + seconds).slice(-2);
	}

	function applyCurve(pos, points) {
		if (!points.length || typeof pos !== 'number' || Number.isNaN(pos)) {
			return 0;
		}
		let index = points.findIndex(o => o.at >= pos);
		if (index === -1) {
			return points.at(-1).value;
		}
		if (!index) {
			return points.at(0).value;
		}
		let from = points[index - 1];
		let to = points[index];
		return scale(pos, from.at, to.at, from.value, to.value);
	}

	try {
		WebFont.load({ custom: { families: ['NeonTubes'] } });
	} catch { /* Nothing */ }

	let userForm = document.getElementById('user');
	let profileInput = document.getElementById('profile');
	let userFetchInfo = document.getElementById('user-fetch-info');

	let history = [];
	try {
		let savedHistory = JSON.parse(localStorage.getItem('history'));
		if (Array.isArray(savedHistory)) {
			history = savedHistory;
		}
	} catch { /* Nothing */ }
	let $history = document.querySelector('.history');
	function refreshHistory() {
		$history.innerHTML = '';
		history.slice(0, 5).forEach((user) => {
			if (!user || !user.avatar || user.rank == null || user.name == null) {
				return;
			}
			let line = create('button', 'line');
			line.addEventListener('click', () => {
				if (profileInput.disabled) {
					return;
				}
				profileInput.value = user.id;
				onSubmit();
			});
			let avatar = div('avatar');
			avatar.style.backgroundImage = `url(${user.avatar})`;
			line.appendChild(avatar);
			line.appendChild(div('rank', user.rank.toLocaleString()));
			line.appendChild(div('name', user.name));
			$history.appendChild(line);
		});
	}
	function pushToHistory(user) {
		history = history.filter(u => u && u.id !== user.id);
		history.unshift(user);
		history = history.slice(0, 5);
		try {
			localStorage.setItem('history', JSON.stringify(history));
		} catch { /* Nothing */ }
		refreshHistory();
	}
	refreshHistory();

	let filters = {};
	function filtersFromString(str) {
		let data = JSON.parse(str, (key, value) => /^-?Infinity$/.test(value) ? +value : value);
		data.tags = data.tags?.map?.(tag => tags.find(t => t.slug === tag)).filter(e => e);
		return data;
	}
	function stringifyFilters(filters) {
		return JSON.stringify(
			{
				...filters,
				tags: filters.tags.map(filter => filter?.slug).filter(e => e)
			},
			(key, val) => typeof val === 'number' && Math.abs(val) === Infinity ? val + '' : val
		);
	}
	function sanitizeFilters() {
		filters.scoreFrom = +filters.scoreFrom || 0;
		filters.scoreTo = isNaN(+filters.scoreTo) ? Infinity : +filters.scoreTo;
		filters.starsFrom = +filters.starsFrom || 0;
		filters.starsTo = isNaN(+filters.starsTo) ? Infinity : +filters.starsTo;
		if (!Array.isArray(filters.hiddenMaps)) {
			filters.hiddenMaps = [];
		}
		if (!Array.isArray(filters.tags)) {
			filters.tags = [];
		}
	}
	function loadFilters() {
		filters = {
			scoreFrom: 0,
			scoreTo: Infinity,
			starsFrom: 0,
			starsTo: Infinity,
			hiddenMaps: [],
			tags: []
		};
		try {
			let saved = filtersFromString(localStorage.getItem('peepee-filters'));
			Object.assign(filters, saved);
			sanitizeFilters();
		} catch { /* Nothing */ }
	}
	loadFilters();
	async function updateFilters(newFilters) {
		filters = newFilters;
		try {
			localStorage.setItem('peepee-filters', stringifyFilters(newFilters));
		} catch { /* Nothing */ }
		// updateLists(await rankedMapsPromise, playerSongs);
		played.refresh();
		unplayed.refresh();
	}
	async function hideMap(uid) {
		let hiddenMaps = filters.hiddenMaps || [];
		hiddenMaps.push(uid);
		updateFilters({ ...filters, hiddenMaps });
	}
	function autosizeInput(input) {
		let ghost = span();
		let inputStyle = getComputedStyle(input);
		Object.assign(ghost.style, {
			position: 'absolute',
			top: '-99px',
			left: '-99px',
			height: '0',
			whiteSpace: 'pre',
			overflow: 'hidden',
			visibility: 'hidden',
			font: inputStyle.font,
			letterSpacing: inputStyle.letterSpacing,
			padding: inputStyle.padding,
		});
		let checkSize = () => {
			ghost.textContent = input.value || input.placeholder || ' ';
			input.style.width = (ghost.clientWidth + 1) + 'px';
		};
		document.body.appendChild(ghost);
		input.addEventListener('input', checkSize);
		checkSize();
		return {
			check: checkSize,
			stop: () => {
				input.removeEventListener('input', checkSize);
				document.body.removeChild(ghost);
			}
		};
	}

	function showModal(options) {
		let resolve;
		let promise = new Promise(_resolve => resolve = _resolve);

		let cleared = false;
		let clear = async () => {
			if (cleared) return;
			cleared = true;
			options.dispose?.();
			resolve(container.returnValue);
			await Promise.allSettled(container.getAnimations().map(animation => animation.finished));
			container.remove();
		};

		let container = create('dialog', ['modal', options.class].filter(e => e).join(' '));

		if (options.title) {
			let title = create('h2', null, options.title);
			container.append(title);
		}
		let content = div('content');
		content.append(...options.content);
		container.append(content);

		if (options.buttons) {
			let buttons = div('buttons');
			buttons.append(...options.buttons);
			container.append(buttons);
		}

		container.addEventListener('close', clear);
		document.body.append(container);
		container.showModal();
		options.onShow?.();

		return promise;
	}

	function tagSelector(selectedValues = []) {
		let values = selectedValues.slice();
		let selectionWrapper = span('selection-wrapper');
		let input = textInput(null, '', 'Select a tag...');
		input.id = 'tag-selector-input';
		let asi = autosizeInput(input);
		let suggestions = div('tag-selector-suggestions');
		suggestions.popover = 'manual';
		suggestions.tabIndex = -1;

		let wrapper = create('label', 'tag-selector', [selectionWrapper, input, suggestions]);
		wrapper.htmlFor = input.id;
		wrapper.tabIndex = -1;

		let update = () => {
			selectionWrapper.innerHTML = '';
			selectionWrapper.append(...values.map((value) => {
				let removeButton = create('button', 'remove', '×');
				let tag = div(`tag type-${value.type}`, [value.name, removeButton]);
				removeButton.addEventListener('click', (e) => {
					e.preventDefault();
					e.stopPropagation();
					values = values.filter(v => v !== value);
					update();
					requestAnimationFrame(() => input.focus());
				});
				return tag;
			}));
			updateSuggestions();
		};

		let updateSuggestions = () => {
			let search = input.value.toLowerCase();
			let matchingTags = tags.filter(tag => (
				!values.includes(tag) && (tag.name.toLowerCase().includes(search) || tag.slug.includes(search))
			));

			suggestions.innerHTML = '';
			suggestions.append(...matchingTags.map((suggestion, i) => {
				let tag = create('button', `tag type-${suggestion?.type} ${!i ? 'selected' : ''}`, suggestion?.name || suggestion.slug);
				tag.tabIndex = -1;
				tag.addEventListener('click', () => {
					values.push(suggestion);
					input.value = '';
					asi.check();
					update();
					requestAnimationFrame(() => input.focus());
				});
				return tag;
			}).filter(e => e));
		};
		input.addEventListener('input', updateSuggestions);
		input.addEventListener('keydown', (e) => {
			if (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey) {
				return;
			}
			if (e.key === 'Backspace' && !input.value && values.length) {
				values.pop();
				update();
				e.preventDefault();
				return;
			}
			let selected = suggestions.querySelector('.selected');

			let useLeftRight = input.selectionStart === input.selectionEnd && input.selectionStart === input.value.length;
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || (useLeftRight && (e.key === 'ArrowLeft' || e.key === 'ArrowRight'))) {
				let next = e.key === 'ArrowDown' || e.key === 'ArrowRight';
				let newElement = selected?.[next ? 'nextElementSibling' : 'previousElementSibling'] || suggestions[next ? 'firstElementChild' : 'lastElementChild'];
				selected?.classList.remove('selected');
				newElement?.classList.add('selected');
				e.preventDefault();
			} else if (e.key === 'Enter') {
				selected?.click();
				e.preventDefault();
			}
		});

		let suggestionVisibilityTimer;
		let showSuggestions = () => {
			cancelAnimationFrame(suggestionVisibilityTimer);
			suggestions.showPopover();
		};
		let hideSuggestions = () => {
			cancelAnimationFrame(suggestionVisibilityTimer);
			suggestionVisibilityTimer = requestAnimationFrame(() => suggestions.hidePopover());
		};
		wrapper.addEventListener('focusin', showSuggestions);
		wrapper.addEventListener('focusout', hideSuggestions);

		update();

		return {
			dom: wrapper,
			get value() { return values; },
			set value(v) {
				values = v;
				update();
			},
			dispose: () => {
				asi.stop();
			},
		};
	}
	async function editFiltersModal(filters = {}) {
		filters = Object.assign({}, filters);
		filters.hiddenMaps = filters.hiddenMaps.slice();
		filters.tags = filters.tags.slice();

		let scoreFrom = textInput(null, filters.scoreFrom);
		let scoreTo = textInput(null, filters.scoreTo);
		let scoreFilter = div('filter score', ['Only show maps if the potential score is between ', scoreFrom, '% and ', scoreTo, '%']);

		let starsFrom = textInput(null, filters.starsFrom);
		let starsTo = textInput(null, filters.starsTo);
		let starsFilter = div('filter stars', ['Only show maps if their ★ difficulty is between ', starsFrom, ' and ', starsTo]);

		let hiddenMapsSelect = create('select', null, filters.hiddenMaps.map((hiddenMap) => {
			let map = rankedMaps[hiddenMap];
			if (!map) return;
			return selectOption(`${map.name} - ${map.artist} (${map.mapper}) | ${map.diff}`, hiddenMap);
		}));
		hiddenMapsSelect.size = 6;
		hiddenMapsSelect.multiple = true;
		let hiddenMapsRemoveButton = create('button', null, 'Unhide selected');
		let hiddenMapsFilter = div('filter hidden-maps', ['Hide these specific maps (right click on a map to add it to this list):', hiddenMapsSelect, hiddenMapsRemoveButton]);

		let tagInput = tagSelector(filters.tags);
		let tagsFilter = div('filter tags', ['Only show maps with these BeatSaver tags:', tagInput.dom]);

		let buttonOk = create('button', 'ok', 'OK');
		buttonOk.addEventListener('click', (e) => {
			validateData();
			let stringValue = JSON.stringify({
				scoreFrom: +scoreFrom.value,
				scoreTo: +scoreTo.value,
				starsFrom: +starsFrom.value,
				starsTo: +starsTo.value,
				hiddenMaps: [...hiddenMapsSelect.options].map(opt => +opt.value),
				tags: tagInput.value
			}, (k, v) => v === Infinity ? 'Infinity' : v);
			e.currentTarget.closest('dialog').close(stringValue);
		});
		let buttonCancel = create('button', 'cancel', 'Cancel');
		buttonCancel.addEventListener('click', e => e.currentTarget.closest('dialog').close());

		let autosizeInputs = [scoreFrom, scoreTo, starsFrom, starsTo].map(autosizeInput);
		let validateData = () => {
			scoreFrom.value = +scoreFrom.value || 0;
			scoreTo.value = !scoreTo.value || isNaN(+scoreTo.value) ? 'Infinity' : +scoreTo.value;
			starsFrom.value = +starsFrom.value || 0;
			starsTo.value = !starsTo.value || isNaN(+starsTo.value) ? 'Infinity' : +starsTo.value;
			autosizeInputs.forEach(asi => asi.check());
		};
		[scoreFrom, scoreTo, starsFrom, starsTo].forEach(input => input.addEventListener('change', validateData));
		validateData();

		let checkHiddenMapsButton = () => hiddenMapsRemoveButton.disabled = !hiddenMapsSelect.selectedOptions.length;
		hiddenMapsSelect.addEventListener('change', checkHiddenMapsButton);
		hiddenMapsRemoveButton.addEventListener('click', () => {
			let index = hiddenMapsSelect.selectedIndex;
			[...hiddenMapsSelect.selectedOptions].forEach(option => hiddenMapsSelect.removeChild(option));
			hiddenMapsSelect.selectedIndex = Math.min(index, hiddenMapsSelect.length - 1);
			checkHiddenMapsButton();
		});
		checkHiddenMapsButton();

		let value = await showModal({
			class: 'filters',
			title: 'FILTERS',
			content: [scoreFilter, starsFilter, hiddenMapsFilter, tagsFilter],
			buttons: [buttonCancel, buttonOk],
			dispose: () => {
				autosizeInputs.forEach(asi => asi.stop());
				tagInput?.dispose();
			},
		});
		return value ? JSON.parse(value, (k, v) => v === 'Infinity' ? Infinity : v) : null;
	}

	let customCurve = [];
	function loadCustomCurve() {
		try {
			let saved = JSON.parse(localStorage.getItem('peepee-custom-curve'));
			if (Array.isArray(saved)) {
				customCurve = saved;
			}
		} catch { /* Nothing */ }
	}
	loadCustomCurve();
	async function updateCustomCurve(curve) {
		customCurve = curve;
		try {
			localStorage.setItem('peepee-custom-curve', JSON.stringify(curve));
		} catch { /* Nothing */ }
		[played, unplayed].forEach((list) => {
			if (list.method instanceof SortCustomCurve) {
				list.update();
			}
		});
	}
	async function editCustomCurveModal(curve = []) {
		curve = structuredClone(curve);
		let instructions = div('instructions', 'Left click to add or move points, right click to remove points');
		let editor = div('editor');

		let canvas = create('canvas', 'preview');
		let ctx = canvas.getContext('2d');
		let pointsDetails = div('points');
		let marginX = 34;
		let marginY = 20;
		let maxPercentage = 1.12;
		let maxStars = 15;
		let selectedPoint = null;
		let grabbed = false;
		let pixelFromPoint = point => ({
			x: lerp(point.at / maxStars, marginX, canvas.width),
			y: lerp(point.value / maxPercentage, canvas.height - marginY, 0)
		});
		let pointFromPixel = pixel => ({
			at: maxStars * ilerp(pixel.x, marginX, canvas.width, true),
			value: maxPercentage * ilerp(pixel.y, canvas.height - marginY, 0, true)
		});

		let draw = () => {
			updateEstCurve(ctx, {
				numPoints: 0,
				marginX, marginY,
				maxPercentage, maxStars,
				playerSongsColor: 'rgbs(136, 238, 255, .7)'
			});
			if (curve.length) {
				ctx.strokeStyle = 'rgba(250, 120, 20, 1)';
				ctx.lineWidth = 2;
				ctx.beginPath();
				let firstPos = pixelFromPoint({ at: 0, value: curve[0].value });
				ctx.moveTo(firstPos.x, firstPos.y);
				curve.forEach((point) => {
					let pos = pixelFromPoint(point);
					ctx.lineTo(pos.x, pos.y);
				});
				let lastPos = pixelFromPoint({ at: maxStars, value: curve[curve.length - 1].value });
				ctx.lineTo(lastPos.x, lastPos.y);
				ctx.stroke();
				ctx.fillStyle = 'rgba(20, 250, 120, 1)';
				ctx.strokeStyle = 'rgba(20, 250, 120, 1)';
				curve.forEach((point) => {
					let pos = pixelFromPoint(point);
					ctx.fillRect(pos.x - 3, pos.y - 3, 6, 6);
					if (point === selectedPoint) {
						ctx.beginPath();
						ctx.arc(pos.x, pos.y, 8, 0, 2 * Math.PI);
						ctx.stroke();
					}
				});
				ctx.lineWidth = 1;
			}
		};

		let updatePoints = () => {
			curve.sort((a, b) => a.at - b.at);
			pointsDetails.innerHTML = '';
			curve.forEach((point) => {
				let elem = div('point');
				let at = div('at', [span('label', 'At: '), span('value', round(point.at, 2) + '★')]);
				let score = div('score', [span('label', 'Score: '), span('value', round(100 * point.value, 2) + '%')]);
				elem.append(at, score);
				pointsDetails.append(elem);
			});
		};

		let onMouseMove = (e) => {
			if (!curve.length) {
				return;
			}
			let rect = canvas.getBoundingClientRect();
			let x = e.clientX - rect.left;
			let y = e.clientY - rect.top;
			if (grabbed) {
				e.preventDefault();
				let edit = pointFromPixel({ x, y });
				Object.assign(selectedPoint, edit);
				updatePoints();
				draw();
				return;
			}
			let distances = curve.map((point) => {
				let px = pixelFromPoint(point);
				let dx = x - px.x;
				let dy = y - px.y;
				return { point, d: dx * dx + dy * dy };
			});
			distances.sort((a, b) => a.d - b.d);
			let newSelection = distances[0].d < 81 ? distances[0].point : null;
			if (selectedPoint !== newSelection) {
				selectedPoint = newSelection;
				draw();
			}
		};
		document.addEventListener('mousemove', onMouseMove);

		canvas.addEventListener('mousedown', (e) => {
			e.preventDefault();
			if (e.button === 2) {
				curve = curve.filter(p => p !== selectedPoint);
				selectedPoint = null;
				updatePoints();
				draw();
				return;
			}
			if (!selectedPoint) {
				let newPoint = pointFromPixel({ x: e.offsetX, y: e.offsetY });
				curve.push(newPoint);
				selectedPoint = newPoint;
				updatePoints();
				draw();
			}
			grabbed = true;
		});
		canvas.addEventListener('contextmenu', e => e.preventDefault());
		let onMouseUp = () => grabbed = false;
		document.addEventListener('mouseup', onMouseUp);

		let onResize = () => {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			draw();
		};
		window.addEventListener('resize', onResize);

		editor.append(canvas, pointsDetails);
		updatePoints();

		let buttonOk = create('button', 'ok', 'OK');
		buttonOk.addEventListener('click', e => e.currentTarget.closest('dialog').close(JSON.stringify(curve)));
		let buttonCancel = create('button', 'cancel', 'Cancel');
		buttonCancel.addEventListener('click', e => e.currentTarget.closest('dialog').close());

		let value = await showModal({
			class: 'custom-curve',
			title: 'CUSTOM CURVE EDITOR',
			content: [instructions, editor],
			buttons: [buttonCancel, buttonOk],
			onShow: onResize,
			dispose: () => {
				window.removeEventListener('resize', onResize);
				document.removeEventListener('mousemove', onMouseMove);
				document.removeEventListener('mouseup', onMouseUp);
			},
		});
		return value ? JSON.parse(value) : null;
	}

	function getPlaylistURL(list, filename, title) {
		let queryString = [];
		if (title) {
			queryString.push('t=' + encodeURIComponent(title));
		}
		// queryString.push('s=' + encodeURIComponent(list.map(m => m.id).join('.')));
		queryString.push('i=' + encodeURIComponent(list.map(m => m.uid).join('.')));
		return '/custom-playlist/' + (filename || 'playlist.bplist') + '?' + queryString.join('&');
	}
	function slugify(str) {
		return str.toLowerCase().replace(/[\W-]+/g, '-').replace(/^-+|-+$/, '');
	}
	async function playlistDownloadModal(maps, options = {}) {
		let defaultCount = 50;

		let titleInput = textInput(null, '', options.title);
		let titleLine = div('line playlist-title', ['Playlist title: ', titleInput]);
		let titleAutosize = autosizeInput(titleInput);

		let count = textInput(null, '', defaultCount);
		count.type = 'number';
		count.min = 1;
		count.max = maps.length;
		let countAutosize = autosizeInput(count);
		let countLine = div('line count', ['Number of items from the top to include in the playlist: ', count]);

		let offset = textInput(null, '', 1);
		offset.type = 'number';
		offset.min = 1;
		offset.max = maps.length;
		let offsetAutosize = autosizeInput(offset);
		let offsetLine = div('line offset', ['Starting from item number: ', offset]);

		let selectedMaps = span(null, 'selection');
		let gain = span(null, '0pp');
		let estimateLine = div('line pp', ['Estimated PP gain for ', selectedMaps, ': ', gain]);
		let oneClickWarningLine = div('playlist warning', ['Warning: too many maps - OneClick™ will likely not work (you can still download the .bplist)']);

		let update = () => {
			let title = titleInput.value.trim() || options.title || '';
			let filename = slugify(title) || 'playlist';
			filename += '.bplist';

			let offsetVal = offset.value.trim();
			let actualOffset = clamp(!offsetVal || Number.isNaN(+offsetVal) ? 1 : Math.floor(offsetVal), 1, maps.length) - 1;
			let val = count.value.trim();
			let actualCount = clamp(!val || Number.isNaN(+val) ? defaultCount : Math.floor(val), 1, maps.length);
			let included = maps.slice(actualOffset, actualOffset + actualCount);
			let unique = included.filter((song, i, self) => song.id && self.findIndex(t => t.id === song.id) === i);

			let selectedSentence = '';
			if (actualOffset === 0) {
				let word = included.length === maps.length ? 'all' : 'top';
				selectedSentence = word + ' ' + included.length + ' leaderboard' + (included.length !== 1 ? 's' : '');
			} else if (included.length === 1) {
				selectedSentence = 'leaderboard at position ' + (actualOffset + 1);
			} else {
				let from = actualOffset + 1;
				let to = actualOffset + included.length;
				selectedSentence = 'leaderboards from ' + from + ' to ' + to + ', inclusive';
			}
			if (unique.length !== included.length) {
				selectedSentence += ' (from ' + unique.length + ' unique song' + (unique.length !== 1 ? 's' : '') + ')';
			}
			selectedMaps.textContent = selectedSentence;

			let estimate = getFullPPWithUpdate(included.map(e => e.uid), included.map(e => e.estimatePP || 0));
			gain.textContent = '+' + round(Math.max(estimate - fullPP, 0), 2) + 'pp';

			// .bplist: use front-end data-url generation to go around potential size limit and reduce server load
			// buttonFile.href = getPlaylistURL(includedMaps, filename, options.title);
			buttonFile.href = playlistDataUrl(included, title);
			buttonFile.download = filename;

			const playlistUrl = new URL(getPlaylistURL(included, filename, title), location.href);
			buttonOneClick.href = 'bsplaylist://playlist/' + playlistUrl;

			let tooLong = buttonOneClick.href.length > 7500;
			oneClickWarningLine.style.display = tooLong ? 'block' : 'none';
		};
		titleInput.addEventListener('input', update);
		count.addEventListener('input', update);
		offset.addEventListener('input', update);

		let buttonDone = create('button', 'done', 'Done');
		let buttonFile = link('#', 'button file', '.bplist');
		let buttonOneClick = link('#', 'button playlist-oneclick', 'OneClick™');
		buttonDone.addEventListener('click', e => e.currentTarget.closest('dialog').close());

		update();

		return showModal({
			class: 'playlist',
			title: 'CREATE A PLAYLIST',
			content: [titleLine, countLine, offsetLine, estimateLine, oneClickWarningLine],
			buttons: [buttonFile, buttonOneClick, buttonDone],
			dispose: () => {
				try {
					titleAutosize.stop();
					countAutosize.stop();
					offsetAutosize.stop();
				} catch { /* Nothing */ }
			},
		});
	}

	let user = {};
	let playerSongs = {};
	let rankedMaps = {};
	let lastUpdate = Date.now();
	let rankedMapsUpdate = 0;
	let rankedMapsPromise = fetchRanked();
	let fullPP = 0;

	function expandScoreData(score) {
		let base = rankedMaps[score.uid];
		return base && Object.assign({}, base, score);
	}
	async function getProfileAndScores(id, options) {
		if (!id) {
			// return { user: {}, scores: {} };
			throw new Error('No user ID specified');
		}
		options = options || {};
		if (options.useCache) {
			try {
				let data = JSON.parse(localStorage.getItem('cached-v2-' + id));
				if (data) {
					return data;
				}
			} catch { /* Nothing */ }
		}
		let user = await getUserData(id);
		if (typeof options.onUserInfo === 'function') {
			options.onUserInfo(user);
		}
		let currentPage = 1;
		let rawScores = [];
		let scores = {};
		for (let hasMore = true; hasMore; currentPage++) {
			// let amount = clamp(user.rankedPlays - rawScores.length, 20, USER_SCORES_PER_PAGE) || USER_SCORES_PER_PAGE;
			let amount = USER_SCORES_PER_PAGE;
			if (typeof options.onProgress === 'function') {
				options.onProgress({ page: currentPage, amount, currentScores: rawScores, user });
			}
			let pageScores = await getUserScores(id, currentPage, 'top', amount);
			if (!pageScores) {
				break;
			}
			pageScores = pageScores.filter(song => song.userPP);
			rawScores.push(...pageScores);
			let len = pageScores.length;
			pageScores = pageScores.map(expandScoreData).filter(e => e);
			pageScores.forEach(e => scores[e.uid] = e);
			if (len === USER_SCORES_PER_PAGE) {
				await pause(scoresaberRLDelay);
			} else {
				hasMore = false;
			}
		}
		if (options.useCache) {
			try {
				localStorage.setItem('cached-' + id, JSON.stringify({ user, scores }));
			} catch { /* Nothing */ }
		}
		return { user, scores, rawScores };
	}
	async function getRecentScores(id, since, options) {
		options = options || {};
		let currentPage = 1;
		let user = await getUserData(id);
		if (typeof options.onUserInfo === 'function') {
			options.onUserInfo(user);
		}
		let rawScores = [];
		let scores = {};
		for (let hasMore = true; hasMore; currentPage++) {
			if (typeof options.onProgress === 'function') {
				options.onProgress(currentPage);
			}
			let scores = await getUserScores(id, currentPage, 'recent', 20);
			if (!scores) {
				break;
			}
			let oldest = Math.min(...scores.map(song => song.at));
			scores = scores.filter(song => song.userPP && song.at > since);
			rawScores.push(...scores);
			scores = scores.map(expandScoreData).filter(e => e);
			scores.forEach(e => scores[e.uid] = e);
			if (oldest >= since) {
				await pause(scoresaberRLDelay);
			} else {
				hasMore = false;
			}
		}
		return { user, scores, rawScores };
	}
	async function refresh() {
		if (!user || !user.id) {
			return;
		}
		document.body.classList.add('refreshing');
		try {
			let since = lastUpdate;
			lastUpdate = Date.now();
			let result = await getRecentScores(user.id, since);
			user = result.user;
			// let historyElement = history.find(e => e.id === user.id);
			// if (historyElement && historyElement.rawScores) {
			// 	let rawScores = historyElement.rawScores.concat(result.rawScores);
			// 	user.rawScores = rawScores;
			// 	user.at = lastUpdate;
			// }
			Object.assign(playerSongs, result.scores);
			pushToHistory(user);
			fullPP = getFullPPWithUpdate(0, 0);
			updatePlayerProfile();
		} catch { /* Nothing */ }
		// Also update the list of ranked maps
		let newRankedRequest = fetchRanked(new Date(rankedMapsUpdate));
		try {
			// If the request fails, just keep the previous data
			await newRankedRequest;
			rankedMapsPromise = newRankedRequest;
		} catch { /* Nothing */ }
		let rankedMapsData = await rankedMapsPromise;
		updateLists(rankedMapsData, playerSongs);
		document.body.classList.remove('refreshing');
	}

	function updateLists(rankedMapsData, playerSongs) {
		played.elements = Object.values(playerSongs).map(e => ({ ...e }));
		unplayed.elements = rankedMapsData.list.filter(song => (
			!(song.uid in playerSongs)
		)).map(e => ({ ...e }));
		played.update();
		unplayed.update();
		updateEstCurve();
		estCurve.parentElement.classList.add('show');
	}

	function getFullPPWithUpdate(replaceMaps, newPP) {
		if (!Array.isArray(replaceMaps)) {
			replaceMaps = replaceMaps ? [replaceMaps] : [];
		}
		let songs = Object.values(playerSongs);
		if (replaceMaps.length) {
			songs = songs.filter(song => !replaceMaps.includes(song.uid));
		}
		let ppList = songs.map(song => song.userPP).concat(newPP).sort((a, b) => b - a);
		let mult = 1;
		let result = ppList.reduce((total, score, i) => total + score * (mult *= (i ? PP_DECAY : 1)), 0);
		// return Math.max(result, fullPP);
		return result;
	}

	function updateEstimate(song, score, waiting) {
		song.waiting = !!waiting;
		if (song.score && song.score >= score) {
			song.estimateScore = song.score;
			song.estimatePP = song.userPP;
			song.estimateFull = fullPP;
			return;
		}
		if (!score) {
			song.estimateScore = 0;
			song.estimatePP = 0;
			song.estimateFull = fullPP;
			return;
		}
		song.estimateScore = score;
		song.estimatePP = song.pp * applyCurve(score, ppCurve);
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

	function playlistDataUrl(elements, title) {
		let songs = elements.map(e => ({ hash: e.id, songName: e.name, difficulties: [{ characteristic: 'Standard', name: e.diff }] }));
		let data = {
			playlistTitle: title,
			playlistAuthor: 'Peepee',
			image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAF7klEQVR4Ae2dT4hbVRTGz315SToztjh1dJKM/6hFRLoQdakuuihF0O5F6KoIIm50IbhSBHEjbnUjCi61UCnajVCo4kIpFjcK/qFY3igt7YxJk5nJy5WALWTMnHdefTdz7z3fQGlfzvdOzvm+3/QlaZox5OBreXn5QJIkvzhorbnlC1mWfVC1AUnVDdEvLAcAQFh5VT4tAKjc0rAaAoCw8qp8WgBQuaVhNQQAYeVV+bQAoHJLw2oIAMLKq/JpAUDllobV0EjHbbVarxpjnpXo7+mk5o3X7nhCooVG5sDJ091fPz/Ty2VqWs+y7HGJNpWIxhpjzINE9KRE32wka0cPL0ik0Agd+O78xiIRjX8Vfhlj1gpF/wpwCZA6FanODQCGRpH6tWtr1Wr2uos7dwOAi0mV9zSGrAsLAIALVwPqCQACCsvFqADAhasB9QQAAYXlYlQA4MLVgHoCgIDCcjFqurS01JY0vreV76kldn2bdupTk4Mrpp8PulNftTImoaRe39YGh0UOtO6q1Q/cJ/atnufLh4p6juum3W5PDXH7yW+eWKNjT8lei0ibdVpcuXN7Cxz/HwcWWkTpnKjD5qal+x/9TaTFJUBkU7wiABBvtqLNAIDIpnhFACDebEWbAQCRTfGKAEC82Yo2AwAim+IVAYB4sxVtBgBENsUrAgDxZivaTPyuYFG3GYo251+iUW1lhvcou6tm7z0yoz9lYg9UwQIwbB6mvPawBxZOjtDofxgUALgETOan7ggAqIt8cmEAMOmHuiMAoC7yyYUBwKQf6o68exZgzd7xG5UKg7ACTWETCMg7ALr7zxGZZmE09cFnNH/teKFupgJTp97iF6K7rG+comb3LZHWpcg7AOTLbpH5z3tU5We7UTbImn2i1pbmRTrXIjwGcO2w5/0BgOcBuR4PALh22PP+AMDzgFyPBwBcO+x5/2CfBYwfbY/S8edWFXzZASX5xQIRX7ZmgWyyxIvGVSP+r1vFvWak8A6AhatPE1HxX0z92z+iXvNUoU3J8CdauHasUMcJho0jNNj7Nie5WasPPqV04/TN453+kIz+2qk009u9AyAZXRIa4OfnUCWji5RufSPcYfdlxd9quz8jJnDoAABwaG4IrQFACCk5nBEAODQ3hNYAIISUHM4IAByaG0Jr754G+mnakAwNZKPZTZnOE1WwAMytv0iWGoU22vQh6i0WvzDDNTL2b7rt8iOcJNhasAAkw59Fpg9rHRrVHhBpdxIZK/74/Z1aeHs7HgN4G81sBgMAs/HZ23sBAN5GM5vBAMBsfPb2XgCAt9HMZrBgnwWI7Rl1Kcl/F8unCf17+/m0KW/ttugBGP/bfHr16K25o+AsXAIUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IoAgHNHQQ0AKAiZWxEAcO4oqAEABSFzKwIAzh0FNQCgIGRuRQDAuaOgBgAUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IoAgHNHQQ0AKAiZWxEAcO4oqAEABSFzKwIAzh0FNQCgIGRuRQDAuaOgBgAUhMytCAA4dxTUAICCkLkVAQDnjoIaAFAQMrciAODcUVADAApC5lYEAJw7CmoAQEHI3IrjTwp9hRPcqJ08O/fcV983H7txzP1+6OCIXn5+nZOgVsKBWqNJFy5coS+/nROdlec2J6J3JOI0y7J3JUKi9goRiQC4srZFJ56J96dsyPyqUtWlr88N6P1P9kmb9rMse10ixiVA4lLEGgAQcbiS1QCAxKWINQAg4nAlqwEAiUsRawBAxOFKVgMAEpci1gCAiMOVrFbmZwZdIqIfJE17fdp/9vyeuyVaaGQOZJfTP4joR5margt1ZKTCMrpOp3PEWnumzDnQ8g5Ya4+vrq5+zKvKV3EJKO9ZVGcAgKjiLL8MACjvWVRnAICo4iy/DAAo71lUZwCAqOIsvwwAKO9ZVGcAgKjiLL/MP1IivdJqKho+AAAAAElFTkSuQmCC',
			songs: songs
		};
		let content = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
		return content;
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
		let numPoints = typeof options.numPoints === 'number' ? options.numPoints : 100;
		let maxStars = options.maxStars || 15;
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
		ctx.globalCompositeOperation = 'source-over';
		ctx.beginPath();
		for (let i = 0; i < numPoints; i++) {
			let p = i / (numPoints - 1);
			let score = getScoreEstimate(p * maxStars);
			let x = marginX + p * (c.width - marginX);
			let y = (c.height - marginY) * (1 - score / maxPercentage);
			ctx.lineTo(x, y);
		}
		ctx.stroke();
		ctx.fillStyle = options.playerSongsColor || 'rgb(150 50 30 / 90%)';
		// ctx.globalCompositeOperation = 'lighter';
		Object.values(playerSongs).forEach((song) => {
			let x = marginX + (song.stars / maxStars) * (c.width - marginX);
			let y = (c.height - marginY) * (1 - song.score / maxPercentage);
			ctx.fillRect(x - 1, y - 1, 2, 2);
		});
		ctx.globalCompositeOperation = 'source-over';
	}

	let lastUpdateElement = document.getElementById('last-update');
	function updateLastUpdate(rankedMapsData) {
		rankedMapsUpdate = rankedMapsData.timestamp;
		// lastUpdateElement.textContent = new Date(rankedMapsUpdate).toString();
		let updateDate = new Date(rankedMapsUpdate);
		lastUpdateElement.textContent = dateDistance(updateDate) + ' (' + standardDate(updateDate, true) + ')';
		lastUpdateElement.title = updateDate.toString();
		lastUpdateElement.classList.remove('unknown');
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
		$profile.avatar.style.backgroundImage = `url(${user.avatar})`;
		let countryCodePoints = [...user.country.toLowerCase()].map(c => (c.codePointAt(0) + 127365).toString(16));
		let countryFlag = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${countryCodePoints.join('-')}.svg`;
		$profile.flag.style.backgroundImage = `url(${countryFlag})`;
		$profile.name.textContent = user.name;
		$profile.name.href = `https://scoresaber.com/u/${user.id}`;
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

		onShow() {}
		onHide() {}

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
			rankForm.addEventListener('submit', (e) => {
				e.preventDefault();
				this.triggerUpdate();
			});
			this.rankInput = create('input', 'rank-input');
			this.rankInput.type = 'text';
			this.rankInput.placeholder = (user.rank || 1).toLocaleString() + ' (desired rank)';
			this.rankInput.tabIndex = -1;
			this.rankInput.addEventListener('change', () => this.triggerUpdate());
			rankForm.appendChild(this.rankInput);
			let submit = create('button', 'rank-submit');
			submit.type = 'submit';
			submit.tabIndex = -1;
			rankForm.appendChild(submit);
			return rankForm;
		}

		onShow() { this.rankInput.tabIndex = 0; }
		onHide() { this.rankInput.tabIndex = -1; }

		triggerUpdate() {
			if (this.list.method === this) {
				this.list.update();
			}
		}

		init(elements) {
			// elements.forEach(el => updateEstimate(el, getScoreEstimate(el.stars)));
			// elements.sort((a, b) => b.pp - a.pp);
			elements.sort((a, b) => b.stars - a.stars);
			elements.forEach(el => updateEstimate(el, 0, true));

			this.rankInput.placeholder = (user.rank || 1).toLocaleString() + ' (desired rank)';
			this.rank = ~~(+this.rankInput.value.replace(/,/g, ''));
			if (!this.rank || this.rank <= 0) {
				this.rank = user.rank || 9999999;
			}
			rankScoreCheckCount = 0;
		}

		async run(element, isCanceled) {
			let rank = this.rank;
			let key = 'scoreAtRank' + rank;
			let usePause = false;
			if (!Object.prototype.hasOwnProperty.call(element, key)) {
				let score = 0;
				let scores = element.scores;
				if (typeof scores === 'string') {
					scores = +scores.replace(/,/g, '') || Infinity;
				}
				if (rank <= (scores + 100) && rank < (+element.rank || Infinity)) {
					score = await getScoreAtRank(element, rank);
					rankScoreCheckCount++;
					usePause = true;
				}
				element[key] = score;
			}
			if (isCanceled()) {
				return;
			}
			updateEstimate(element, element[key] || 0);
			if (rankScoreCheckCount >= 500) {
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

	class SortBestScore extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Best score';
			this.id = 'bestscore';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}

		sort(elements) {
			return elements.sort((a, b) => {
				return (b.score || 0) - (a.score || 0) || b.pp - a.pp;
			});
		}
	}

	let compareCache = {};
	class SortCompare extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Compare';
			// this.async = true;
			this.id = 'compare';
		}

		createOptionsMarkup() {
			let compareForm = create('form', 'compare-form');
			compareForm.addEventListener('submit', e => e.preventDefault());
			this.compareInput = create('input', 'compare-input');
			this.compareInput.type = 'text';
			this.compareInput.placeholder = 'compared profile url';
			this.compareInput.tabIndex = -1;
			let onChange = () => {
				let idMatch = this.compareInput.value.match(/\d{5,}/);
				if (!idMatch) {
					triggerAnimation(compareForm, 'invalid');
					return;
				}
				this.compareInput.value = idMatch[0];
				if (this.list.method === this) {
					this.list.update();
				}
			};
			this.compareInput.addEventListener('change', onChange);
			this.compareInput.addEventListener('paste', () => setTimeout(onChange, 0));
			this.compareInput.addEventListener('focus', () => this.compareInput.select());
			compareForm.appendChild(this.compareInput);
			let auto = create('button', 'compare-auto', 'auto');
			auto.type = 'button';
			auto.tabIndex = -1;
			auto.addEventListener('click', async () => {
				auto.disabled = true;
				let goalRank = user.rank === 1 ? 2 : Math.floor(user.rank * .9);
				let playerId = await getPlayerAtRank(goalRank);
				this.compareInput.value = playerId || '';
				auto.disabled = false;
				onChange();
			});
			compareForm.appendChild(auto);
			this.autoButton = auto;
			let submit = create('button', 'compare-submit');
			submit.type = 'submit';
			submit.tabIndex = -1;
			compareForm.appendChild(submit);
			return compareForm;
		}

		onShow() { this.compareInput.tabIndex = this.autoButton.tabIndex = 0; }
		onHide() { this.compareInput.tabIndex = this.autoButton.tabIndex = -1; }

		async init(elements) {
			elements.sort((a, b) => b.pp - a.pp);
			elements.forEach(el => updateEstimate(el, 0, true));
			this.userId = this.compareInput.value;
			if (this.userId && !compareCache[this.userId]) {
				compareCache[this.userId] = getProfileAndScores(this.userId);
			}
			try {
				let result = await compareCache[this.userId];
				this.user = result.user;
				this.scores = result.scores;
			} catch (err) {
				console.log('Cannot get comparison data', err);
				this.user = {};
				this.scores = {};
			}
		}

		run(element) {
			let comparedElem = this.scores[element.uid] || {};
			updateEstimate(element, comparedElem.score || 0);
		}
	}

	class SortRaw extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Fixed score';
			this.id = 'raw';
			// Score needed to get 100% pp
			this.defaultScore = applyCurve(1, ppCurve.map(({ at, value }) => ({ at: value, value: at })));
			this.score = this.defaultScore;
		}

		createOptionsMarkup() {
			let fixedForm = create('form', 'fixed-form');
			fixedForm.addEventListener('submit', e => e.preventDefault());
			this.fixedInput = create('input', 'fixed-input');
			this.fixedInput.type = 'text';
			this.fixedInput.placeholder = `${+(this.defaultScore * 100).toFixed(2)}%`;
			this.fixedInput.maxLength = 10;
			this.fixedInput.tabIndex = -1;
			this.fixedInput.addEventListener('change', () => {
				if (this.list.method === this) {
					this.list.update();
				}
			});
			fixedForm.appendChild(this.fixedInput);
			let submit = create('button', 'fixed-submit');
			submit.type = 'submit';
			submit.tabIndex = -1;
			fixedForm.appendChild(submit);
			return fixedForm;
		}

		onShow() { this.fixedInput.tabIndex = 0; }
		onHide() { this.fixedInput.tabIndex = -1; }

		init() {
			this.score = (parseFloat(this.fixedInput.value.trim()) / 100) || this.defaultScore;
			if (this.score <= 0) {
				this.score = 0.01;
			}
		}

		run(element) {
			updateEstimate(element, this.score);
		}
	}

	class SortCustomCurve extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Custom curve';
			this.id = 'custom-curve';
		}

		createOptionsMarkup() {
			let container = div('custom-curve-sort-buttons');
			let editButton = create('button', 'custom-curve-edit', 'edit curve');
			editButton.tabIndex = -1;
			editButton.addEventListener('click', async () => {
				let newCurve = await editCustomCurveModal(customCurve);
				if (!newCurve) {
					return;
				}
				updateCustomCurve(newCurve);
			});
			container.append(editButton);
			this.editButton = editButton;
			return container;
		}

		onShow() { this.editButton.tabIndex = 0; }
		onHide() { this.editButton.tabIndex = -1; }

		run(element) {
			updateEstimate(element, applyCurve(element.stars, customCurve));
		}
	}

	class SortOldestScore extends SortMethod {
		constructor(list) {
			super(list);
			this.name = 'Oldest score';
			this.id = 'oldestscore';
		}

		run(element) {
			updateEstimate(element, getScoreEstimate(element.stars));
		}

		sort(elements) {
			return elements.sort((a, b) => {
				return (a.at || 0) - (b.at || 0) || a.pp - b.pp;
			});
		}
	}

	let baseMethods = [
		SortScoreEst,
		SortRank,
		SortRaw,
		SortCustomCurve,
		SortCompare,
	];
	let unplayedMethods = baseMethods;
	let playedMethods = baseMethods.concat(SortWorstRank, SortBestRank, SortWorstScore, SortBestScore, SortOldestScore);

	class List {
		constructor(elem, title, methods, elements = []) {
			this.elem = elem;
			this.title = title;
			this.selection = [];
			// Copy object to ensure new context
			this.methods = methods.map(Method => new Method(this));
			this.method = this.methods[0];
			this.elements = elements;
			this.displayedPageSize = 200;
			this.displayed = this.displayedPageSize;
			elem.innerHTML = '';
			let header = div('list-header');
			this.selectionTooltip = div('list-selection-tooltip');
			let selectionTooltipFirstLine = div('first-line');
			this.mapCount = span('selection-map-count', '0 maps');
			let selectionTooltipClear = create('button', 'selection-clear', 'clear');
			selectionTooltipClear.onclick = this.clearSelection.bind(this);
			selectionTooltipFirstLine.append('Selection: ', this.mapCount, ' (', selectionTooltipClear, ')');
			this.selectionTooltip.appendChild(selectionTooltipFirstLine);
			this.selectionTooltipPP = div('line', '+0.00pp');
			this.selectionTooltip.appendChild(this.selectionTooltipPP);
			this.selectionTooltipBplist = link('#', 'bplist', '.bplist');
			this.selectionTooltipOneClick = link('#', 'playlist-oneclick', 'OneClick');
			let selectionPlaylistLine = div('selection-playlist', [this.selectionTooltipBplist, ' - ', this.selectionTooltipOneClick]);
			this.selectionTooltip.appendChild(selectionPlaylistLine);
			header.appendChild(this.selectionTooltip);
			let titleEl = div('list-title', title);
			this.titleEl = titleEl;
			let playlist = create('button', 'playlist', 'playlist', 'Create a playlist');
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
			this.methods.forEach((method) => {
				let markup = method.createOptionsMarkup();
				if (markup) {
					methodWrapper.appendChild(markup);
				}
			});
			header.appendChild(methodWrapper);
			elem.appendChild(header);
			this.content = div('list-content');
			this.content.addEventListener('click', this.onContentClick.bind(this));
			this.content.addEventListener('contextmenu', this.onContextMenu.bind(this));
			this.content.addEventListener('scroll', this.onScroll.bind(this));
			elem.appendChild(this.content);
			this.updateSelectionTooltip();
			this.update();
			this.onScroll();
		}

		getPlaylistName() {
			let today = new Date();
			let date = today.getFullYear() + '-' + pad2(today.getMonth() + 1) + '-' + pad2(today.getDate());
			let nameSlug = this.title.replace(/[\W-]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
			return {
				title: this.title + ' (' + date + ')',
				filename: nameSlug + '-' + date + '.bplist'
			};
		}

		createPlaylist() {
			return playlistDownloadModal(this.getFilteredElements(), this.getPlaylistName());
		}

		changeMethod(method) {
			if (this.method === method) {
				return;
			}
			if (this.method) {
				this.elem.classList.remove('method-' + this.method.id);
				this.method.onHide();
			}
			this.content.scrollTop = 0;
			this.displayed = this.displayedPageSize;
			this.method = method;
			if (this.method) {
				this.elem.classList.add('method-' + this.method.id);
				this.method.onShow();
			}
			this.update();
			this.onScroll();
		}

		clearSelection() {
			this.selection = [];
			this.updateSelectionTooltip();
			[...this.content.querySelectorAll('.list-element-selected')].forEach(el => el.classList.remove('list-element-selected'));
		}

		updateSelectionTooltip() {
			let selectionElems = this.selection.map(sel => this.elements.find(el => sel === el.uid)).filter(e => e);
			this.selection = selectionElems.map(el => el.uid);
			let count = selectionElems.length;
			this.mapCount.textContent = count + ' map' + (count === 1 ? '' : 's');

			let estimate = getFullPPWithUpdate(selectionElems.map(e => e.uid), selectionElems.map(e => e.estimatePP));
			this.selectionTooltipPP.textContent = '+' + round(Math.max(estimate - fullPP, 0), 2) + 'pp';
			this.selectionTooltip.classList[count ? 'add' : 'remove']('show');

			let playlistData = this.getPlaylistName();
			this.selectionTooltipBplist.href = getPlaylistURL(selectionElems, playlistData.filename, playlistData.title);
			this.selectionTooltipOneClick.href = 'bsplaylist://playlist/' + this.selectionTooltipBplist.href;
		}

		getClosestElement(el) {
			while (el && !el.classList.contains('list-element') && this.content.contains(el)) {
				el = el.parentElement;
			}
			if (!el || !el.classList.contains('list-element')) {
				return null;
			}
			return el;
		}

		toggleSelection(uid, selected) {
			if (!uid) {
				return;
			}
			let currentlySelected = this.selection.includes(uid);
			if (typeof selected !== 'boolean') {
				selected = !currentlySelected;
			}
			if (selected === currentlySelected) {
				return;
			}
			if (selected) {
				this.selection.push(uid);
			} else {
				this.selection = this.selection.filter(e => e !== uid);
			}
			let el = this.content.querySelector('[data-uid="' + uid + '"]');
			if (el) {
				el.classList[selected ? 'add' : 'remove']('list-element-selected');
			}
			this.updateSelectionTooltip();
		}

		onContentClick(e) {
			let usingCtrl = e.ctrlKey || e.metaKey;
			if (usingCtrl && !e.target.matches('a, button')) {
				let el = this.getClosestElement(e.target);
				let uid = el && +el.getAttribute('data-uid');
				this.toggleSelection(uid);
			}
		}

		onContextMenu(e) {
			if (e.ctrlKey || e.metaKey || e.target.matches('a, button') || !window.ContextMenu) {
				return;
			}
			let el = this.getClosestElement(e.target);
			let uid = el && +el.getAttribute('data-uid');
			if (!uid) {
				return;
			}
			e.preventDefault();
			e.stopPropagation();
			let isSelected = this.selection.includes(uid);
			window.ContextMenu.show([
				{
					text: (isSelected ? 'Deselect' : 'Select') + ' map',
					shortcut: 'Ctrl+Click',
					action: () => this.toggleSelection(uid)
				},
				{ text: 'Screw this (hide map)', action: () => hideMap(uid) },
				{ separator: true },
				{ text: 'Show help', action: toggleHelp },
			], { x: e.clientX, y: e.clientY });
		}

		onScroll() {
			if (this.displayed < this.elements.length && this.content.scrollTop + this.content.clientHeight > this.content.scrollHeight - 50) {
				this.displayMore();
			}
		}

		displayMore() {
			if (this.displayed >= this.elements.length) {
				return;
			}
			this.displayed += this.displayedPageSize;
			this.refresh();
		}

		createMarkup(element) {
			let el = div('list-element');
			el.setAttribute('data-uid', element.uid);

			let left = div('list-element-content-left');
			let pic = div('list-element-pic');
			pic.style.backgroundImage = `url(https://cdn.scoresaber.com/covers/${element.id}.png)`;
			left.appendChild(pic);
			let nameGroup = div('list-element-name-group');
			let nameAndArtist = div('list-element-name-and-artist');
			nameAndArtist.title = element.name + ' - ' + element.artist;
			nameAndArtist.appendChild(span('list-element-name', (element.name || '') + ' '));
			nameAndArtist.appendChild(span('list-element-sep'));
			nameAndArtist.appendChild(span('list-element-artist', element.artist));
			element._nameAndArtist = nameAndArtist;
			nameGroup.appendChild(nameAndArtist);
			nameGroup.appendChild(div('list-element-mapper', element.mapper));
			let srcDiff = element.diff || 'Easy';
			let diff = difficulties[srcDiff] || {};
			let difficultyAndScore = div('list-element-difficulty-and-score');
			difficultyAndScore.appendChild(span('list-element-difficulty ' + (diff.className || srcDiff.toLowerCase()), (diff.display || srcDiff) + ' '));
			if (element.score || element.score === 0) {
				let scoreAndRank = span('list-element-score-and-rank');
				scoreAndRank.appendChild(span('list-element-score', [round(element.score * 100, 2), span('percent-sign', '% ')]));
				if (element.at) {
					let at = new Date(element.at);
					scoreAndRank.appendChild(span('list-element-at', dateDistance(at) + ' ', standardDate(at)));
				}
				scoreAndRank.appendChild(span('list-element-sep'));
				scoreAndRank.appendChild(span('list-element-rank', element.rank.toLocaleString()));
				difficultyAndScore.appendChild(scoreAndRank);
			}
			nameGroup.appendChild(difficultyAndScore);
			left.appendChild(nameGroup);
			el.appendChild(left);

			let middle = div('list-element-content-middle');
			middle.appendChild(div('pot-title', 'Potential'));
			element._potScore = div('pot-score');
			middle.appendChild(element._potScore);
			let potPP = div('pot-pp');
			element._potPP = span('raw');
			potPP.appendChild(element._potPP);
			element._potInc = span('increase', null, 'Total (weighted) pp change');
			potPP.appendChild(element._potInc);
			middle.appendChild(potPP);
			el.appendChild(middle);

			let right = div('list-element-content-right');
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
			if (element.duration || element.durationSeconds) {
				secondary.appendChild(div('duration', getDuration(element), 'Duration'));
			}
			if (element.bpm) {
				secondary.appendChild(div('bpm', round(element.bpm, 2), 'BPM'));
			}
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
				links.appendChild(link(element.download, 'download', null, 'Download map', '_blank'));
			}
			if (element.beatSaverKey) {
				links.appendChild(link('beatsaver://' + element.beatSaverKey, 'oneclick', null, 'OneClick™ install'));
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
			this.elem.classList.add('loading');
			await method.init(elements);
			this.refresh();
			let isCanceled = () => this.updating !== updating;
			let lastUpdate = Date.now();
			let dirty = false;
			for (let i = 0; i < elements.length; i++) {
				let result = await method.run(elements[i], isCanceled);
				if (method.async) {
					if (isCanceled()) {
						return;
					}
					let now = Date.now();
					if (now - lastUpdate > 1000) {
						lastUpdate = now;
						this.refresh();
						dirty = false;
					} else {
						dirty = true;
					}
				}
				if (result === PAUSE_UPDATE) {
					this.elem.classList.add('paused');
					break;
				}
			}
			this.elem.classList.remove('loading');
			if (!method.async || dirty) {
				this.refresh();
			}
			this.updating = false;
		}

		defaultSort(elements) {
			return elements.sort((a, b) => {
				return (b.estimateFull || 0) - (a.estimateFull || 0) || b.pp - a.pp;
			});
		}

		filter(el) {
			if (filters.hiddenMaps && filters.hiddenMaps.includes(el.uid)) {
				return false;
			}
			if (el.estimateScore < filters.scoreFrom || el.estimateScore > filters.scoreTo) {
				return false;
			}
			if (el.stars < filters.starsFrom || el.stars > filters.starsTo) {
				return false;
			}
			if (this.selectedTagsPerType) {
				if (!this.selectedTagsPerType.every(type => type.some(tag => el.tags?.includes(tag.slug)))) {
					return false;
				}
			}
			return true;
		}

		getFilteredElements() {
			if (filters.tags?.length) {
				// Here to avoid doing it for every element
				this.selectedTagsPerType = Object.values(
					filters.tags.reduce((o, e) => {
						o[e.type] = o[e.type] || [];
						o[e.type].push(e);
						return o;
					}, {})
				);
			} else {
				this.selectedTagsPerType = null;
			}
			return this.elements.filter(this.filter, this);
		}

		refresh() {
			this.content.innerHTML = '';
			let sort = this.method.sort || this.defaultSort;
			this.elements = sort(this.elements);
			const filtered = this.getFilteredElements();
			filtered.slice(0, this.displayed).forEach((el, i) => {
				if (!el.markup) {
					this.createMarkup(el);
				}
				if (el.estimateScore === undefined) {
					updateEstimate(el, 0);
				}
				el._potScore.textContent = el.waiting ? '...' : round(el.estimateScore * 100, 2);
				el._potPP.textContent = el.waiting ? '...' : round(el.estimatePP, 2);
				el._potInc.textContent = el.waiting ? '...' : round(Math.max(el.estimateFull - fullPP, 0), 2);
				el._nameAndArtist.setAttribute('data-position', i + 1);
				this.content.appendChild(el.markup);
			});
			if (this.displayed >= filtered.length && filtered.length !== this.elements.length) {
				const amount = this.elements.length - filtered.length;
				const editFiltersButton = create('button', '', 'Edit your filters');
				editFiltersButton.addEventListener('click', editFilters);
				const warning = div('warning', [
					`${amount} element${amount !== 1 ? 's have' : ' has'} been hidden from this list. `,
					editFiltersButton,
					' to show more.',
				]);
				this.content.appendChild(warning);
			}
		}
	}

	let unplayed = new List(document.querySelector('.list.unplayed'), 'Not played', unplayedMethods);
	let played = new List(document.querySelector('.list.played'), 'To improve', playedMethods);

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

			let results;
			let fnOptions = {
				useCache: location.search.includes('debug'),
				onProgress: ({ currentScores, amount, user }) => (userFetchInfo.textContent = 'Getting scores ' + Math.min(currentScores.length + amount, +user.rankedPlays || 0) + '/' + user.rankedPlays + ' ...'),
				onUserInfo: user => pushToHistory(user)
			};
			results = await getProfileAndScores(id, fnOptions);
			// let historyEntry = history.find(e => e && e.id === id);
			// if (historyEntry && historyEntry.rawScores && historyEntry.at >= rankedMapsData.timestamp) {
			// 	results = await getRecentScores(id, historyEntry.at, fnOptions);
			// 	historyEntry.rawScores.map(expandScoreData).filter(e => e).forEach(e => {
			// 		if (!results.scores[e.uid]) {
			// 			results.scores[e.uid] = e;
			// 		}
			// 	});
			// 	results.rawScores = results.rawScores.concat(historyEntry.rawScores);
			// } else {
			// 	results = await getProfileAndScores(id, fnOptions);
			// }
			if (!results) {
				triggerAnimation(userForm, 'invalid');
				return;
			}

			user = results.user;
			// user.rawScores = results.rawScores;
			// user.at = lastUpdate;
			playerSongs = results.scores;
			fullPP = getFullPPWithUpdate(0, 0);
			// pushToHistory(user);
			updatePlayerProfile();
			updateLists(rankedMapsData, playerSongs);
			// For potential debugging purposes
			window.playerSongs = playerSongs;
			document.body.classList.add('step-results', 'user-' + id);
		} catch (err) {
			console.error(err);
			triggerAnimation(userForm, 'invalid');
		}
		profileInput.disabled = false;
		userForm.classList.remove('loading');
	}
	userForm.addEventListener('submit', onSubmit);
	profileInput.addEventListener('paste', () => setTimeout(onSubmit, 0));
	profileInput.addEventListener('focus', () => profileInput.select());

	function toggleHelp() {
		document.getElementById('help').showPopover();
	}
	document.getElementById('back').addEventListener('click', () => {
		profileInput.value = '';
		document.body.classList.remove('step-results');
	});
	document.getElementById('refresh').addEventListener('click', refresh);
	async function editFilters() {
		let newFilters = await editFiltersModal(filters);
		if (newFilters) updateFilters(newFilters);
	}
	document.getElementById('show-filters').addEventListener('click', editFilters);
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
