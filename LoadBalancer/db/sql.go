package db

const (
	SqlGetAvailableServer = "SELECT * FROM GetAvailableServer();"
	SqlDeleteAllFromServerQueues = "DELETE FROM ServerQueue WHERE TRUE;"
	SqlCreateServerQueue = "SELECT CreateServerQueue($1, $2);"
	SqlDeleteServerQueue = "SELECT DeleteServerQueue($1, $2);"
)
