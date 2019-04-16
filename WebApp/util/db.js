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
            title    VARCHAR(200)  NOT NULL,
            url_path VARCHAR(1024) NOT NULL,
            owner    INTEGER       NOT NULL REFERENCES Users (id) ON DELETE CASCADE
          );

          CREATE TABLE IF NOT EXISTS ServerQueue
          (
            id SERIAL PRIMARY KEY,
            server_host VARCHAR(1024) NOT NULL,
            server_port	INTEGER NOT NULL,
            tasks_count INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS Tasks
          (
            id       	SERIAL PRIMARY KEY,
            title    	VARCHAR(512) NOT NULL,
            owner    	INTEGER      NOT NULL REFERENCES Users (id) ON DELETE CASCADE,
            progress 	INTEGER      NOT NULL DEFAULT 0 CHECK ( progress >= 0 AND progress <= 100 ),
            status   	VARCHAR(11)  NOT NULL DEFAULT 'In Queue' CHECK ( status = 'Running' OR status = 'Not Started' OR status = 'Finished' OR status = 'In Queue'),
            fractal  	INTEGER      NULL REFERENCES Fractals (id) ON DELETE CASCADE,
            queue_id 	INTEGER      NULL REFERENCES ServerQueue (id) ON DELETE CASCADE,
            task_type   INTEGER      NOT NULL
          );

          CREATE OR REPLACE FUNCTION GetTaskAdminFunction(task_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(512), username VARCHAR(100), progress INTEGER, status VARCHAR(11), fractal_link VARCHAR(1024), server_host VARCHAR(1024), server_port INTEGER) AS $$
          BEGIN
            RETURN QUERY (
              SELECT Tasks.id, Tasks.title, Users.username, Tasks.progress, Tasks.status, Fractals.url_path, ServerQueue.server_host, ServerQueue.server_port
              FROM Tasks
                     JOIN Users ON Tasks.owner = Users.id
                     LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                     LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
              WHERE Tasks.id = task_id
            );
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE VIEW GetAllTasksAdminView AS
          SELECT Tasks.id, Tasks.title, Users.username, Tasks.progress, Tasks.status, Fractals.url_path as fractal_link, ServerQueue.server_host, ServerQueue.server_port
          FROM Tasks
                 JOIN Users ON Tasks.owner = Users.id
                 LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                 LEFT JOIN Fractals ON Tasks.fractal = Fractals.id;

          CREATE OR REPLACE FUNCTION GetUserTasksFunction(user_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(512), progress INTEGER, status VARCHAR(11), fractal_link VARCHAR(1024)) AS
          $$
          BEGIN
            RETURN QUERY (
              SELECT Tasks.id, Tasks.title, Tasks.progress, Tasks.status, Fractals.url_path
              FROM Tasks
                     JOIN Users ON Tasks.owner = Users.id
                     LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
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
                     LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
                     LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
              WHERE Users.id = user_id AND Tasks.id = task_id
            );
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION CreateTask(queue_id INTEGER, t_title VARCHAR(512), t_type INTEGER, t_owner INTEGER)
            RETURNS VOID AS
          $$
          BEGIN
            INSERT INTO Tasks(title, owner, queue_id, task_type)
            VALUES (t_title, t_owner, queue_id, t_type);
            UPDATE ServerQueue SET tasks_count = tasks_count + 1 WHERE id = queue_id;
          END
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION UpdateTask(task_id INTEGER, task_progress INTEGER, task_status VARCHAR(11))
            RETURNS VOID AS
          $$
          DECLARE
            task RECORD;
            queue RECORD;
          BEGIN
            SELECT * FROM Tasks WHERE Tasks.id = task_id INTO task;
            IF (task_status = 'Not Started' OR task_status = 'Finished') AND task.status <> task_status THEN
              UPDATE ServerQueue SET tasks_count = tasks_count - 1 WHERE id = task.queue_id;
              UPDATE Tasks SET queue_id = NULL, status = task_status, progress = task_progress WHERE id = task_id;
            ELSEIF (task_status = 'In Queue' AND task.status = 'Not Started') THEN
              SELECT ServerQueue.id
              FROM ServerQueue
              ORDER BY ServerQueue.tasks_count, ServerQueue.id ASC
              LIMIT 1 INTO queue;
              UPDATE Tasks SET queue_id = queue.id, status = task_status, progress = task_progress WHERE id = task_id;
              UPDATE ServerQueue SET tasks_count = tasks_count + 1 WHERE id = queue.id;
            END IF;
          END
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION DeleteTask(task_id INTEGER)
            RETURNS VOID AS
          $$
          DECLARE
            task RECORD;
          BEGIN
            SELECT * FROM Tasks WHERE Tasks.id = task_id INTO task;
            IF task.queue_id IS NOT NULL THEN
              UPDATE ServerQueue SET tasks_count = tasks_count - 1 WHERE id = task.queue_id;
            END IF;
            DELETE FROM Tasks WHERE Tasks.id = task_id;
          END
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION GetUserFractals(user_id INTEGER)
            RETURNS TABLE (id INTEGER, title VARCHAR(200), url_path VARCHAR(1024)) AS
          $$
          BEGIN
            RETURN QUERY (
              SELECT Fractals.id, Fractals.title, Fractals.url_path
              FROM Fractals
              WHERE Fractals.owner = user_id
            );
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION CountUserActiveTasks(user_id INTEGER)
            RETURNS INTEGER AS
          $$
          DECLARE
            temp RECORD;
          BEGIN
            SELECT count(*) as amount
            FROM Tasks
            WHERE Tasks.owner = user_id AND Tasks.queue_id IS NOT NULL
              INTO temp;
            RETURN temp.amount;
          END
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION CreateServerQueue(host VARCHAR(1024), port INTEGER)
            RETURNS VOID AS
          $$
          DECLARE tmp RECORD;
          BEGIN
            tmp := NULL;
            SELECT ServerQueue.server_host, ServerQueue.server_port
            FROM ServerQueue
            WHERE ServerQueue.server_host = host AND ServerQueue.server_port = port INTO tmp;
            IF tmp IS NULL THEN
              INSERT INTO ServerQueue(server_host, server_port) VALUES (host, port);
            END IF;
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION DeleteServerQueue(host VARCHAR(1024), port INTEGER)
            RETURNS VOID AS
          $$
          DECLARE tmp RECORD;
          BEGIN
            tmp := NULL;
            SELECT ServerQueue.server_host, ServerQueue.server_port
            FROM ServerQueue
            WHERE ServerQueue.server_host = host AND ServerQueue.server_port = port INTO tmp;
            IF tmp IS NOT NULL THEN
              DELETE FROM ServerQueue
              WHERE ServerQueue.server_host = host AND ServerQueue.server_port = port;
            END IF;
          END;
          $$ LANGUAGE plpgsql;

          CREATE OR REPLACE FUNCTION GetAvailableServer()
            RETURNS TABLE (id INTEGER, server_host VARCHAR(1024), server_port INTEGER, tasks_count INTEGER, servers_amount INTEGER) AS
          $$
          DECLARE
            servers_count INTEGER;
          BEGIN
            servers_count := (SELECT count(*) FROM ServerQueue);
            RETURN QUERY (
              SELECT ServerQueue.id, ServerQueue.server_host, ServerQueue.server_port, ServerQueue.tasks_count, servers_count
              FROM ServerQueue
              ORDER BY ServerQueue.tasks_count, ServerQueue.id ASC
              LIMIT 1
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

	createTask(queue_id, title, type, owner_id, success, failed) {
		this.runQuery('SELECT CreateTask(($1), ($2), ($3));', [title, type, owner_id], success, failed);
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

	countUserActiveTasks(user_id, success, failed) {
		this.getItem(
			'SELECT * FROM CountUserActiveTasks(($1));',
			[user_id],
			success,
			failed
		);
	}
}

module.exports = {
	Db: Db
};
