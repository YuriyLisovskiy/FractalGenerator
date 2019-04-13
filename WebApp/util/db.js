const pg = require('pg');
const crypto = require('crypto');
const fs = require('fs');

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
		this.db.query(`
          CREATE TABLE IF NOT EXISTS Users
          (
            id           SERIAL PRIMARY KEY,
            username     VARCHAR(100) UNIQUE NOT NULL,
            email        VARCHAR(255) UNIQUE NOT NULL,
            password     VARCHAR(100)        NOT NULL,
            is_superuser BOOLEAN DEFAULT FALSE,
            is_verified  BOOLEAN DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS Fractals
          (
            id       SERIAL PRIMARY KEY,
            url_path VARCHAR(1024) NOT NULL,
            owner    INTEGER       NOT NULL REFERENCES Users (id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS ServerQueue
          (
            id SERIAL PRIMARY KEY,
            server_host VARCHAR(1024),
            server_port	INTEGER
          );

          CREATE TABLE IF NOT EXISTS Tasks
          (
            id       SERIAL PRIMARY KEY,
            title    VARCHAR(512) NOT NULL,
            owner    INTEGER      NOT NULL REFERENCES Users (id) ON DELETE CASCADE,
            progress INTEGER      NOT NULL DEFAULT 0 CHECK ( progress >= 0 AND progress <= 100 ),
            status   VARCHAR(11)  NOT NULL DEFAULT 'Not Started' CHECK ( status = 'Running' OR status = 'Not Started' OR status = 'Finished' OR status = 'In Queue'),
            fractal  INTEGER      NULL REFERENCES Fractals (id) ON DELETE CASCADE,
            queue_id INTEGER      NOT NULL REFERENCES ServerQueue (id) ON DELETE CASCADE
          );
		`);
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
			}
			success(result.rows[0]);
		});
	}

	getUser(username, email, success, failed) {
		let query = 'SELECT * FROM Users WHERE username = ($1)';
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
		let query = `UPDATE Users SET username = ($1), email = ($2), password = ($3), is_superuser = ($4), is_verified = ($5) WHERE id = ($6);`;
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
		success({
			id: task_id,
			title: 'Mandelbrot Set',
			owner_name: 'YuriyLisovskiy',
			progress: 67,
			status: 'In Queue',
			fractal_link: null,
			server_host: 'localhost',
			server_port: 8000
		});
	}

	getAllTasks(success, failed) {
		success([
			{
				id: 1,
				title: 'Mandelbrot Set',
				owner_name: 'YuriyLisovskiy',
				progress: 35,
				status: 'Running',
				fractal_link: null,
				server_host: 'localhost',
				server_port: 8000
			},
			{
				id: 2,
				title: 'Mandelbrot Set',
				owner_name: 'admin',
				progress: 100,
				status: 'Finished',
				fractal_link: '/media/mandelbrot-set-54312451672.jpg',
				server_host: 'localhost',
				server_port: 8001
			},
			{
				id: 3,
				title: 'Julia Set',
				owner_name: 'admin',
				progress: 0,
				status: 'Not started',
				fractal_link: null,
				server_host: 'localhost',
				server_port: 8000
			}
		])
	}
}

module.exports = {
	Db: Db
};
