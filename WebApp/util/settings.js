const secret = 'secret_key';
const dbModule = require('./db');

const dbConnectionData = {
	user: 'fractal_gen_user',
	password: '2e7e55bac5442f79c047d13c546f9a29ec60457409873accffa1223cb7aa34d6',
	database: 'fractal_generator',
	port: 5432,
	host: 'localhost',
	ssl: true
};

let db = null;
if (!db) {
	db = new dbModule.Db(dbConnectionData);
	if (db.isConnected()) {
		db.createDb();
	} else {
		console.log('Database is not connected');
	}
}

let host = 'http://localhost:3000';

let transporterData = {
	host: 'smtp.gmail.com',
	port: 587,
	secure: false,
	auth: {
		user: 'mymessengerhelp@gmail.com',
		pass: 'MyMessengerHe357'
	}
};

let UserTasksLimit = 5;

module.exports = {
	SecretKey: secret,
	Db: db,
	transporterData: transporterData,
	host: host,
	UserTasksLimit: UserTasksLimit
};
