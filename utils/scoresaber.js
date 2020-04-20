// e.g. https://scoresaber.com/api.php?function=get-leaderboards&cat=3&page=1&limit=50&ranked=1
// cat=1 : ordered by rank date
// cat=3 : order by star diff

const request = require('request-promise-native');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function _scoreSaberRequest(path, retries = 2) {
	try {
		return request({
			url: path,
			baseUrl: 'http://scoresaber.com/',
			json: true
		});
	} catch(e) {
		if (retries && retries > 0) {
			await wait(3000);
			return _scoreSaberRequest(path, retries - 1);
		}
		throw e;
	}
}
const scoreSaberRequest = async (path) => _scoreSaberRequest(path);

module.exports = {
	request: scoreSaberRequest,
	ranked: (page, cacheBreaker) => scoreSaberRequest('/api.php?function=get-leaderboards&cat=3&ranked=1&limit=1000&page=' + (+page || 1) + (cacheBreaker ? '&h=' + cacheBreaker : '')),
	recentRanks: (page, cacheBreaker) => scoreSaberRequest('/api.php?function=get-leaderboards&cat=1&ranked=1&limit=20&page=' + (+page || 1) + (cacheBreaker ? '&h=' + cacheBreaker : '')),
};
