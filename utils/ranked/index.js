const path = require('path');
const { promisify } = require('util');

const Datastore = require('nedb');
const rankedDB = new Datastore({ filename: path.resolve(__dirname, '../../data/ranked.db'), autoload: true });

module.exports = {
	db: rankedDB,
	find: promisify(rankedDB.find.bind(rankedDB)),
	insert: promisify(rankedDB.insert.bind(rankedDB)),
	remove: promisify(rankedDB.remove.bind(rankedDB)),
};
