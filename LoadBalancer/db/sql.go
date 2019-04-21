package db

const (
	SqlGetAvailableServer = "SELECT * FROM GetAvailableServer();"
	SqlDeleteAllFromServerQueues = "DELETE FROM ServerQueue WHERE TRUE;"
	SqlCreateServerQueue = "SELECT CreateServerQueue($1, $2);"
	SqlDeleteServerQueue = "SELECT DeleteServerQueue($1, $2);"
	SqlCreateTask = "SELECT CreateTask(($1), ($2), ($3), ($4));"
	SqlUpdateTask = "SELECT UpdateTask(($1), ($2), ($3));"
	SqlGetLastServerPort = "SELECT GetLastServerPort();"
)
