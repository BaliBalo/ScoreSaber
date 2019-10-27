const request = require('request-promise-native');

const wait = ms => new Promise(r => setTimeout(r, ms));

async function _scoreSaberRequest(path, retries = 0) {
	try {
		return request({
			url: path,
			baseUrl: 'http://scoresaber.com/',
			json: true
		});
	} catch(e) {
		if (3 > retries) {
			await wait(1000);
			return _scoreSaberRequest(path, retries + 1);
		} else {
			throw e;
		}
	}
}
async function scoreSaberRequest(path) { return _scoreSaberRequest(path, 0); }

module.exports = {
	request: scoreSaberRequest,
	ranked: page => scoreSaberRequest('/api.php?function=get-leaderboards&cat=3&ranked=1&limit=100&page=' + (+page || 1)),
	recentRanks: page => scoreSaberRequest('/api.php?function=get-leaderboards&cat=1&ranked=1&limit=15&page=' + (+page || 1)),
};
