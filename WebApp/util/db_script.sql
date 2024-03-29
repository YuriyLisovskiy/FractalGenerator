CREATE TABLE IF NOT EXISTS Users
(
  user_id      SERIAL PRIMARY KEY,
  username     VARCHAR(100) UNIQUE NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(100)        NOT NULL,
  is_superuser BOOLEAN DEFAULT FALSE,
  is_verified  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS Fractals
(
  id         SERIAL PRIMARY KEY,
  title      VARCHAR(200)  NOT NULL,
  url_path   VARCHAR(1024) NOT NULL,
  width      INTEGER       NOT NULL,
  height     INTEGER       NOT NULL,
  owner      INTEGER       NOT NULL REFERENCES Users (user_id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT Now()
);

CREATE TABLE IF NOT EXISTS ServerQueue
(
  id          SERIAL PRIMARY KEY,
  server_host VARCHAR(1024) NOT NULL,
  server_port INTEGER       NOT NULL UNIQUE,
  tasks_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Tasks
(
  id             SERIAL PRIMARY KEY,
  title          VARCHAR(512) NOT NULL,
  owner_id       INTEGER      NOT NULL REFERENCES Users (user_id) ON DELETE CASCADE,
  progress       INTEGER      NOT NULL DEFAULT 0 CHECK ( progress >= 0 AND progress <= 101 ),
  status         VARCHAR(11)  NOT NULL DEFAULT 'In Queue' CHECK ( status = 'Running' OR status = 'Not Started' OR
                                                                  status = 'Finished' OR status = 'In Queue'),
  fractal        INTEGER      NULL REFERENCES Fractals (id) ON DELETE CASCADE,
  queue_id       INTEGER      NULL REFERENCES ServerQueue (id) ON DELETE CASCADE,
  task_type      INTEGER      NOT NULL,
  width          INTEGER      NOT NULL,
  height         INTEGER      NOT NULL,
  max_iterations INTEGER      NOT NULL,
  created_at     TIMESTAMP             DEFAULT Now()
);

CREATE OR REPLACE FUNCTION GetUserFractals(user_id INTEGER)
  RETURNS TABLE
          (
            id       INTEGER,
            title    VARCHAR(200),
            url_path VARCHAR(1024),
            width    INTEGER,
            height   INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Fractals.id, Fractals.title, Fractals.url_path, Fractals.width, Fractals.height
    FROM Fractals
    WHERE Fractals.owner = user_id
    ORDER BY Fractals.created_at DESC
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION GetTaskAdminFunction(task_id INTEGER)
  RETURNS TABLE
          (
            id             INTEGER,
            title          VARCHAR(512),
            username       VARCHAR(100),
            progress       INTEGER,
            status         VARCHAR(11),
            fractal_link   VARCHAR(1024),
            server_host    VARCHAR(1024),
            server_port    INTEGER,
            width          INTEGER,
            height         INTEGER,
            max_iterations INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Tasks.id,
           Tasks.title,
           Users.username,
           Tasks.progress,
           Tasks.status,
           Fractals.url_path,
           ServerQueue.server_host,
           ServerQueue.server_port,
           Tasks.width,
           Tasks.height,
           Tasks.max_iterations
    FROM Tasks
           JOIN Users ON Tasks.owner_id = Users.user_id
           LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
           LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
    WHERE Tasks.id = task_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE VIEW GetAllTasksAdminView AS
SELECT Tasks.id,
       Tasks.title,
       Users.username    as owner_name,
       Tasks.progress,
       Tasks.status,
       Fractals.url_path as fractal_link,
       ServerQueue.server_host,
       ServerQueue.server_port,
       Tasks.width,
       Tasks.height,
       Tasks.max_iterations
FROM Tasks
       JOIN Users ON Tasks.owner_id = Users.user_id
       LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
       LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
ORDER BY Tasks.created_at DESC;

CREATE OR REPLACE FUNCTION GetUserTasksFunction(u_id INTEGER)
  RETURNS TABLE
          (
            id             INTEGER,
            title          VARCHAR(512),
            progress       INTEGER,
            status         VARCHAR(11),
            fractal_link   VARCHAR(1024),
            width          INTEGER,
            height         INTEGER,
            max_iterations INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Tasks.id,
           Tasks.title,
           Tasks.progress,
           Tasks.status,
           Fractals.url_path,
           Tasks.width,
           Tasks.height,
           Tasks.max_iterations
    FROM Tasks
           JOIN Users ON Tasks.owner_id = Users.user_id
           LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
           LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
    WHERE Users.user_id = u_id
    ORDER BY Tasks.created_at DESC
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION GetUserTaskFunction(u_id INTEGER, task_id INTEGER)
  RETURNS TABLE
          (
            id             INTEGER,
            title          VARCHAR(512),
            progress       INTEGER,
            status         VARCHAR(11),
            fractal_link   VARCHAR(1024),
            queue_id       INTEGER,
            width          INTEGER,
            height         INTEGER,
            max_iterations INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Tasks.id,
           Tasks.title,
           Tasks.progress,
           Tasks.status,
           Fractals.url_path,
           ServerQueue.id,
           Tasks.width,
           Tasks.height,
           Tasks.max_iterations
    FROM Tasks
           JOIN Users ON Tasks.owner_id = Users.user_id
           LEFT JOIN ServerQueue ON Tasks.queue_id = ServerQueue.id
           LEFT JOIN Fractals ON Tasks.fractal = Fractals.id
    WHERE Users.user_id = u_id
      AND Tasks.id = task_id
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION CreateTask(t_queue_id INTEGER, t_title VARCHAR(512), t_type INTEGER, t_width INTEGER,
                                      t_height INTEGER, t_max_iterations INTEGER, t_owner INTEGER)
  RETURNS TABLE
          (
            last_id INTEGER
          ) AS
$$
BEGIN
  UPDATE ServerQueue SET tasks_count = tasks_count + 1 WHERE ServerQueue.id = t_queue_id;
  RETURN QUERY INSERT INTO Tasks (title, owner_id, queue_id, task_type, width, height, max_iterations)
    VALUES (t_title, t_owner, t_queue_id, t_type, t_width, t_height, t_max_iterations) RETURNING Tasks.id;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION UpdateTask(task_id INTEGER, task_progress INTEGER, task_status VARCHAR(11))
  RETURNS TABLE
          (
            last_id INTEGER
          ) AS
$$
DECLARE
  task  RECORD;
  queue RECORD;
BEGIN
  SELECT * FROM Tasks WHERE Tasks.id = task_id INTO task;
  IF (task_status = 'Not Started' OR task_status = 'Finished') AND task.status <> task_status THEN
    UPDATE ServerQueue
    SET tasks_count = tasks_count - 1
    WHERE ServerQueue.id = task.queue_id AND ServerQueue.tasks_count > 0;
    RETURN QUERY UPDATE Tasks SET queue_id = NULL, status = task_status, progress = task_progress
      WHERE id = task_id RETURNING Tasks.id;
  ELSEIF (task_status = 'In Queue' AND task.status = 'Not Started') THEN
    SELECT ServerQueue.id
    FROM ServerQueue
    ORDER BY ServerQueue.tasks_count, ServerQueue.id ASC
    LIMIT 1 INTO queue;
    UPDATE ServerQueue SET tasks_count = tasks_count + 1 WHERE id = queue.id;
    RETURN QUERY UPDATE Tasks SET queue_id = queue.id, status = task_status, progress = task_progress
      WHERE id = task_id RETURNING Tasks.id;
  ELSE
    RETURN QUERY UPDATE Tasks SET status = task_status, progress = task_progress
      WHERE id = task_id RETURNING Tasks.id;
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
    UPDATE ServerQueue
    SET tasks_count = tasks_count - 1
    WHERE ServerQueue.id = task.queue_id
      AND ServerQueue.tasks_count > 0;
  END IF;
  DELETE FROM Tasks WHERE Tasks.id = task_id;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION CountUserActiveTasks(user_id INTEGER)
  RETURNS INTEGER AS
$$
DECLARE
  temp RECORD;
BEGIN
  SELECT count(*) as amount
  FROM Tasks
  WHERE Tasks.owner_id = user_id
    AND Tasks.queue_id IS NOT NULL INTO temp;
  RETURN temp.amount;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION CreateServerQueue(host VARCHAR(1024), port INTEGER)
  RETURNS TABLE
          (
            last_id INTEGER
          ) AS
$$
DECLARE
  tmp RECORD;
BEGIN
  tmp := NULL;
  SELECT ServerQueue.server_host, ServerQueue.server_port
  FROM ServerQueue
  WHERE ServerQueue.server_host = host
    AND ServerQueue.server_port = port INTO tmp;
  IF tmp IS NULL THEN
    RETURN QUERY INSERT INTO ServerQueue (server_host, server_port) VALUES (host, port) RETURNING ServerQueue.id;
  ELSE
    RETURN QUERY SELECT -1;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION DeleteServerQueue(host VARCHAR(1024), port INTEGER)
  RETURNS TABLE
          (
            last_id INTEGER
          ) AS
$$
DECLARE
  tmp RECORD;
BEGIN
  tmp := NULL;
  SELECT ServerQueue.server_host, ServerQueue.server_port
  FROM ServerQueue
  WHERE ServerQueue.server_host = host
    AND ServerQueue.server_port = port INTO tmp;
  IF tmp IS NOT NULL THEN
    RETURN QUERY DELETE
      FROM ServerQueue
        WHERE ServerQueue.server_host = host
          AND ServerQueue.server_port = port
        RETURNING ServerQueue.id;
  ELSE
    RETURN QUERY SELECT -1;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION GetAvailableServer()
  RETURNS TABLE
          (
            id             INTEGER,
            server_host    VARCHAR(1024),
            server_port    INTEGER,
            tasks_count    INTEGER,
            servers_amount INTEGER
          ) AS
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

CREATE OR REPLACE FUNCTION GetLastServerPort()
  RETURNS TABLE
          (
            last_port INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Max(ServerQueue.server_port)
    FROM ServerQueue
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION GetTasksByQueueAndStatus(q_id INTEGER, q_status VARCHAR(11), q_limit INTEGER)
  RETURNS TABLE
          (
            id             INTEGER,
            title          VARCHAR(512),
            owner_id       INTEGER,
            progress       INTEGER,
            status         VARCHAR(11),
            fractal        INTEGER,
            queue_id       INTEGER,
            task_type      INTEGER,
            width          INTEGER,
            height         INTEGER,
            max_iterations INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY (
    SELECT Tasks.id,
           Tasks.title,
           Tasks.owner_id,
           Tasks.progress,
           Tasks.status,
           Tasks.fractal,
           Tasks.queue_id,
           Tasks.task_type,
           Tasks.width,
           Tasks.height,
           Tasks.max_iterations
    FROM Tasks
    WHERE Tasks.queue_id = q_id
      AND Tasks.status = q_status
    ORDER BY Tasks.created_at ASC
    LIMIT q_limit
  );
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION CreateUserFractal(f_title VARCHAR(200), f_url_path VARCHAR(1024), f_width INTEGER,
                                             f_height INTEGER, f_owner INTEGER)
  RETURNS TABLE
          (
            last_id INTEGER
          ) AS
$$
BEGIN
  RETURN QUERY INSERT INTO Fractals (title, url_path, width, height, owner)
    VALUES (f_title, f_url_path, f_width, f_height, f_owner) RETURNING Fractals.id;
END;
$$ LANGUAGE plpgsql;
