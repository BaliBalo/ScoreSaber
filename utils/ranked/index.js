const path = require('path');
const { promisify } = require('util');

const Datastore = require('nedb');
const rankedDB = new Datastore({ filename: path.resolve(__dirname, '../../data/ranked.db'), autoload: true });
rankedDB.persistence.setAutocompactionInterval(1000 * 60 * 60 * 24);

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

module.exports = {
	PP_PER_STAR,
	db: rankedDB,
	find: promisify(rankedDB.find.bind(rankedDB)),
	insert: promisify(rankedDB.insert.bind(rankedDB)),
	remove: promisify(rankedDB.remove.bind(rankedDB)),
	update: promisify(rankedDB.update.bind(rankedDB)),
};
