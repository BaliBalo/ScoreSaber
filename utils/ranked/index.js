const path = require('path');

const Datastore = require('@seald-io/nedb');
const rankedDB = new Datastore({ filename: path.resolve(__dirname, '../../data/ranked.db'), autoload: true });
rankedDB.setAutocompactionInterval(1000 * 60 * 60 * 24);

// Approximation (shoud rather take a bunch of scores for each song and deduce it from that)
const PP_PER_STAR = 42.114296;

module.exports = {
	PP_PER_STAR,
	db: rankedDB,
	find: rankedDB.findAsync.bind(rankedDB),
	insert: rankedDB.insertAsync.bind(rankedDB),
	remove: rankedDB.removeAsync.bind(rankedDB),
	update: rankedDB.updateAsync.bind(rankedDB),
};
