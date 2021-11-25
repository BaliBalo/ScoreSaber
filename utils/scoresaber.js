// e.g. https://scoresaber.com/api.php?function=get-leaderboards&cat=3&page=1&limit=50&ranked=1
// cat=1 : ordered by rank date
// cat=3 : order by star diff

const request = require('request-promise-native');
const wait = ms => new Promise(r => setTimeout(r, ms));

const SORT_METHOD_STARS = 3;
const SORT_METHOD_RANK_DATE = 1;
const SORT_ORDER_DESCENDING = 0;
// const SORT_ORDER_ASCENDING = 1;

async function _scoreSaberRequest(path, query, retries = 2) {
	try {
		return request({
			baseUrl: 'https://scoresaber.com/api/',
			url: path,
			qs: query,
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
const scoreSaberRequest = async (path, query) => _scoreSaberRequest(path, query);

const rankedLeaderboards = (sortMethod = SORT_METHOD_STARS, sortOrder = SORT_ORDER_DESCENDING, page, cacheBreaker) => (
	scoreSaberRequest('/leaderboards', {
		ranked: true,
		category: sortMethod,
		sort: sortOrder,
		page: +page || 1,
	})
);

module.exports = {
	request: scoreSaberRequest,
	ranked: (...args) => rankedLeaderboards(SORT_METHOD_STARS, SORT_ORDER_DESCENDING, ...args),
	recentRanks: (...args) => rankedLeaderboards(SORT_METHOD_RANK_DATE, SORT_ORDER_DESCENDING, ...args),
};
