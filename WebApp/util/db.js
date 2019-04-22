const pg = require('pg'),
	crypto = require('crypto'),
	fs = require('fs'),
	path = require('path');

class Db {
	constructor(path) {
		this._connected = false;
		this.db = new pg.Client(path);
		this.db.connect();
		this._connected = true;
		console.log('Connected to the SQLite database.');
	}

	isConnected() {
		return this._connected;
	}

	createDb() {
		fs.readFile(path.join(__dirname, 'db_script.sql'), {encoding: 'utf-8'}, (err, data) => {
			if (!err) {
				this.db.query(data, (err) => {
					if (err) {
						console.log(err);
					}
				});
			} else {
				console.log(err);
			}
		});
	}

	getList(query, params, success, failed) {
		this.db.query(query, params, (err, result) => {
			if (err) {
				failed({detail: err});
			} else {
				success(result.rows);
			}
		});
	}

	getItem(query, params, success, failed) {
		this.getList(query, params, (items) => {
			if (items.length > 0) {
				success(items[0]);
			} else {
				failed({detail: 'item does not exist'});
			}
		}, (err) => {
			failed(err);
		});
	}

	runQuery(query, params, success, failed) {
		this.db.query(query, params, (err, result) => {
			if (err) {
				failed({detail: err});
			} else {
				success(result.rows[0]);
			}
		});
	}

	getUser(username, email, success, failed) {
		let query = 'SELECT user_id as id, username, email, password, is_superuser, is_verified FROM Users WHERE username = ($1)';
		let params = [username];
		if (email) {
			query += ' AND email = ($2);';
			params.push(email);
		} else {
			query += ';';
		}
		this.getItem(query, params,
			(item) => {
				success(item);
			},
			(err) => {
				failed(err);
			}
		);
	};

	createUser(username, email, rawPassword, success, failed) {
		let query = 'INSERT INTO Users (email, username, password) VALUES (($1), ($2), ($3));';
		let passwordHash = crypto.createHash('sha256').update(rawPassword).digest('base64');
		this.runQuery(
			query,
			[email, username, passwordHash],
			(itemId) => success(itemId),
			(err) => failed(err)
		);
	}

	updateUser(item, success, failed) {
		let query = `UPDATE Users SET username = ($1), email = ($2), password = ($3), is_superuser = ($4), is_verified = ($5) WHERE user_id = ($6);`;
		this.runQuery(query,
			[item.username, item.email, item.password, item.is_superuser, item.is_verified, item.id],
			(itemId) => {
				success(itemId);
			},
			(err) => {
				failed(err);
		});
	}

	getTask(task_id, success, failed) {
		this.getItem('SELECT * FROM GetTaskAdminFunction(($1));', [task_id], success, failed);
	}

	getAllTasks(success, failed) {
		this.getList('SELECT * FROM GetAllTasksAdminView;', [], success, failed);
	}

	getUserTasks(user_id, success, failed) {
		this.getList('SELECT * FROM GetUserTasksFunction(($1));', [user_id], success, failed);
	}

	getUserTask(user_id, task_id, success, failed) {
		this.getItem('SELECT * FROM GetUserTaskFunction(($1), ($2));', [user_id, task_id], success, failed);
	}

	updateTask(task_id, progress, status, success, failed) {
		this.runQuery('SELECT UpdateTask(($1), ($2), ($3));', [task_id, progress, status], success, failed);
	}

	deleteTask(task_id, success, failed) {
		this.runQuery('SELECT DeleteTask(($1));', [task_id], success, failed);
	}

	getUserFractals(user_id, success, failed) {
		this.getList('SELECT * FROM GetUserFractals(($1));', [user_id], success, failed);
	}

	createUserFractal(owner_id, title, width, height, url_path, success, failed) {
		this.runQuery(
			'SELECT * FROM CreateUserFractal(($1), ($2), ($3), ($4), ($5))',
			[title, url_path, width, height, owner_id],
			success,
			failed
		);
	}

	countUserActiveTasks(user_id, success, failed) {
		this.getItem(
			'SELECT * FROM CountUserActiveTasks(($1));',
			[user_id],
			success,
			failed
		);
	}

	setFractalIdToTask(task_id, fractal_id, success, failed) {
		this.runQuery('UPDATE Tasks SET fractal = ($1) WHERE Tasks.id = ($2);', [fractal_id, task_id], success, failed);
	}
}

module.exports = {
	Db: Db
};
