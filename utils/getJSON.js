module.exports = async function (url) {
	const result = await fetch(url, {
		headers: {
			'User-Agent': 'Peepee/1.0.0',
			'Accept': 'application/json',
		}
	});
	if (!result.ok) {
		throw new Error('Request failed: ' + result.status + ' ' + result.statusText);
	}
	return await result.json();
};
