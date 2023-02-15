let auth = {};
try {
	auth = require('../data/auth');
} catch (e) {}

module.exports = {
	check: (req, res, next) => {
		let key = req.query.key || req.cookies.key;
		if (!key) {
			return res.status(401).end('Unauthorized');
		}
		let user = auth?.keys?.[key];
		if (!user) {
			return res.status(401).end('Unauthorized');
		}
		res.locals.user = user;
		next();
	}
};
