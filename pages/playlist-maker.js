(async () => {
	document.body.addEventListener('mousedown', () => {
		document.body.classList.add('mouse');
	});
	document.body.addEventListener('keydown', () => {
		document.body.classList.remove('mouse');
	});

	const images = {
		transparent: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
		scoresaber: '/client/scoresaber.png',
		peepoUK: '/client/icon.png',
	};

	let data = await fetch('/ranked').then(r => r.json());
	let ranked = data.list;
	let difficulties = [
		{ name: 'Easy' },
		{ name: 'Normal' },
		{ name: 'Hard' },
		{ name: 'Expert' },
		{ name: 'ExpertPlus', label: 'Expert+' },
	];
	let diffShort = {
		Easy: 'Ez',
		Normal: 'N',
		Hard: 'H',
		Expert: 'Ex',
		ExpertPlus: 'Ex+',
	};
	let $ = document.querySelector.bind(document);
	let fields = {
		difficulty: {},
		stars: {
			from: $('.stars .from input'),
			to: $('.stars .to input'),
		},
		rating: {
			from: $('.rating .from input'),
			to: $('.rating .to input'),
		},
		duration: {
			from: $('.duration .from input'),
			to: $('.duration .to input'),
		},
		name: $('.name'),
		author: $('.author'),
		count: $('.count'),
		sort: $('.sort'),
	};
	let preview = {
		count: $('.result-count'),
		list: $('.preview .list'),
	};
	let diffContainer = $('.difficulties');
	difficulties.forEach(difficulty => {
		let label = document.createElement('label');
		let input = document.createElement('input');
		let span = document.createElement('span');
		input.type = 'checkbox';
		input.checked = 'true';
		input.addEventListener('change', updateSongs);
		label.appendChild(input);
		span.appendChild(document.createTextNode(difficulty.label || difficulty.name));
		label.appendChild(span);
		fields.difficulty[difficulty.name] = input;
		diffContainer.appendChild(label);
	});

	let imagesContainer = $('.image-options');
	Object.keys(images).forEach(async (image, i) => {
		let value = images[image];
		let label = document.createElement('label');
		let input = document.createElement('input');
		let preview = document.createElement('img');
		label.className = image;
		input.type = 'radio';
		input.name = 'image';
		input.checked = !i;

		preview.crossOrigin = 'anonymous';
		await new Promise((res, rej) => {
			preview.onload = res;
			preview.onerror = rej;
			preview.src = value;
		});

		let canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d');
		canvas.height = preview.naturalHeight;
		canvas.width = preview.naturalWidth;
		ctx.drawImage(preview, 0, 0);
		input.value = canvas.toDataURL('image/png');

		input.addEventListener('change', updateLink);
		label.appendChild(input);
		label.appendChild(preview);
		imagesContainer.appendChild(label);
	});

	let activeSongs = [];
	function between(n, m, M) {
		// n undefined returns true (assume valid when unknown)
		return !(n < m || n > M);
	}
	function parseDuration(val, def) {
		if (!val) {
			return def;
		}
		if (+val) {
			return +val;
		}
		let match = val.match(/^\s*(\d+)\s*:\s*(\d+)\s*$/);
		if (match) {
			return +match[2] + match[1] * 60;
		}
		return def;
	}
	function updateSongs() {
		let stars = [
			+fields.stars.from.value || 0,
			+fields.stars.to.value || Infinity
		].sort((a, b) => a - b);
		let rating = [
			+fields.rating.from.value || 0,
			+fields.rating.to.value || 100
		].sort((a, b) => a - b);
		let duration = [
			parseDuration(fields.duration.from.value, 0),
			parseDuration(fields.duration.to.value, Infinity)
		].sort((a, b) => a - b);
		let leaderboards = ranked.filter(ldb => {
			if (!fields.difficulty[ldb.diff].checked) {
				return false;
			}
			let dur = 60 * ldb.duration / ldb.bpm;
			return (
				between(ldb.stars, stars[0], stars[1])
				&& between(ldb.rating, rating[0], rating[1])
				&& between(dur, duration[0], duration[1])
			);
		});
		let [sortProp, sortDir] = fields.sort.value.split('-');
		sortDir = sortDir === 'desc' ? -1 : 1;
		leaderboards.sort((a, b) => a[sortProp] < b[sortProp] ? -sortDir : a[sortProp] > b[sortProp] ? sortDir : 0);
		while (preview.list.firstChild) preview.list.removeChild(preview.list.firstChild);
		activeSongs = leaderboards.map((data, i) => {
			let previewElem = document.createElement('div');
			previewElem.className = 'item';
			previewElem.title = [
				'downloads: ' + data.downloads,
				'upvotes: ' + data.upvotes,
				'downvotes: ' + data.downvotes,
			].join('\n');
			let content = (i + 1) + '. ' + data.artist + ' - ' + data.name + ' | ' + data.mapper;
			let details = [
				data.rating && ('👍 ' + data.rating.toFixed(2) + '%'),
				data.diff
			].filter(e => e).join(' - ');
			if (details) {
				content += ' (' + details + ')';
			}
			previewElem.appendChild(document.createTextNode(content));
			preview.list.appendChild(previewElem);
			return { hash: data.id, songName: data.name, difficulties: [{ characteristic: 'Standard', name: data.diff }] };
		});
		let ldbCount = leaderboards.length;
		let songsCount = activeSongs.length;
		preview.count.textContent = ldbCount + ' leaderboard' + (ldbCount === 1 ? '' : 's') + ' from ' + songsCount + ' map' + (songsCount === 1 ? '' : 's');
		updateLink();
	}
	function updateLink() {
		let image = images.transparent;
		let selectedImage = $('.image-options input:checked');
		if (selectedImage) {
			image = selectedImage.value;
		}
		let bplist = {
			playlistTitle: fields.name.value || fields.name.placeholder,
			playlistAuthor: fields.author.value || fields.author.placeholder,
			image,
			songs: activeSongs.slice(0, +fields.count.value || Infinity)
		};
		$('.download').href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(bplist));
	}

	[
		fields.stars.from,
		fields.stars.to,
		fields.rating.from,
		fields.rating.to,
		fields.duration.from,
		fields.duration.to,
		fields.sort,
	].forEach(input => input.addEventListener('input', updateSongs));
	[
		fields.name,
		fields.author,
		fields.count,
	].forEach(input => input.addEventListener('input', updateLink));

	updateSongs();
	document.body.classList.add('loaded');
})();
