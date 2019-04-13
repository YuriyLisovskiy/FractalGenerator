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

          CREATE OR REPLACE FUNCTION GetTaskAdminFunction(task_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(512), username VARCHAR(100), progress INTEGER, status VARCHAR(11), fractal_link VARCHAR(1024), server_host VARCHAR(1024), server_port INTEGER) AS $$
          BEGIN
            RETURN QUERY (
              SELECT Tasks.id, Tasks.title, Users.username, Tasks.progress, Tasks.status, Fractals.url_path, ServerQueue.server_host, ServerQueue.server_port
              FROM Tasks
                     JOIN Users ON Tasks.owner = Users.id
                     JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                     LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
              WHERE Tasks.id = task_id
            );
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE VIEW GetAllTasksAdminView AS
          SELECT Tasks.id, Tasks.title, Users.username, Tasks.progress, Tasks.status, Fractals.url_path as fractal_link, ServerQueue.server_host, ServerQueue.server_port
          FROM Tasks
                 JOIN Users ON Tasks.owner = Users.id
                 JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                 LEFT JOIN Fractals ON Tasks.fractal = Fractals.id;

          CREATE OR REPLACE FUNCTION GetUserTasksFunction(user_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(512), progress INTEGER, status VARCHAR(11), fractal_link VARCHAR(1024)) AS
          $$
          BEGIN
            RETURN QUERY (
              SELECT Tasks.id, Tasks.title, Tasks.progress, Tasks.status, Fractals.url_path
              FROM Tasks
                     JOIN Users ON Tasks.owner = Users.id
                     JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                     LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
              WHERE Users.id = user_id
            );
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION GetUserTaskFunction(user_id INTEGER, task_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(512), progress INTEGER, status VARCHAR(11), fractal_link VARCHAR(1024)) AS
          $$
          BEGIN
            RETURN QUERY (
              SELECT Tasks.id, Tasks.title, Tasks.progress, Tasks.status, Fractals.url_path
              FROM Tasks
                     JOIN Users ON Tasks.owner = Users.id
                     JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                     LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
              WHERE Users.id = user_id AND Tasks.id = task_id
            );
          END;
          $$ LANGUAGE plpgsql;
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
		this.getItem(
			'SELECT * FROM GetTaskAdminFunction(($1));',
			[task_id],
			(task) => success(task),
			(err) => failed(err)
		);
	}

	getAllTasks(success, failed) {
		this.getList(
			'SELECT * FROM GetAllTasksAdminView;',
			[],
			(tasks) => success(tasks),
			(err) => failed(err)
		);
	}

	getUserTasks(user_id, success, failed) {
		this.getList(
			'SELECT * FROM GetUserTasksFunction(($1));',
			[user_id],
			(tasks) => success(tasks),
			(err) => failed(err)
		);
	}

	getUserTask(user_id, task_id, success, failed) {
		this.getItem(
			'SELECT * FROM GetUserTaskFunction(($1), ($2));',
			[user_id, task_id],
			(task) => success(task),
			(err) => failed(err)
		);
	}
}

module.exports = {
	Db: Db
};
