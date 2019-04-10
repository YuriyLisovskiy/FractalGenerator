const secret = '%h2-b))f$1f8&ur@1y05&@0%s=37s^&vl4rlof1g8yqohlry5k';
const dbPath = './shop.db';
const dbModule = require('./db');

let db = null;
if (!db) {
	db = new dbModule.Db(dbPath);
	db.createDb();
}

let host = 'https://store-art.herokuapp.com';

let transporterData = {
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: {
		user: 'mymessengerhelp@gmail.com',
		pass: 'MyMessengerHe357'
	}
};

module.exports = {
	SecretKey: secret,
	Db: db,
	transporterData: transporterData,
	host: host
};
