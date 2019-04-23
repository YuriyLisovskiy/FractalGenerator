const util = require('../util/util'),
	settings = require('../util/settings'),
	rpc = require('../util/rpc');

let db = settings.Db;

module.exports = {
	Administration: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			sudo_request: true,
			get: (request, response) => {
				util.Render(request, response, 'administration');
			}
		});
	},
	AdministrationTasks: function(request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			sudo_request: true,
			get: (request, response) => {
				let page = request.query.page;
				let limit = request.query.limit;
				db.getAllTasks(
					(tasks) => {
						util.SendSuccessResponse(response, 200, {
							tasks: tasks.slice(limit * (page - 1), limit * page),
							pages: Math.ceil(tasks.length / limit),
						});
					},
					(err) => {
						util.SendInternalServerError(response, err.detail);
					}
				);
			}
		});
	},
	AdministrationTask: function(request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			sudo_request: true,
			get: (request, response) => {
				db.getTask(request.query.task_id,
					(task) => {
						let tServer = '-';
						if (task.server_host !== null && task.server_port !== null) {
							tServer = task.server_host + ':' + task.server_port;
						}
						util.SendSuccessResponse(response, 200, {
							task_progress: task.progress,
							task_status: task.status,
							fractal_link: task.fractal_link,
							task_server: tServer
						});
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] administration.AdministrationTask, get, getTask: ' + err.detail);
					}
				);
			},
			post: (request, response) => {
				db.getTask(request.body.task_id,
					(task) => {
						if (task['status'] === 'Not Started') {
							rpc.getAvailableServerRemote(
								(serverInfo) => {

									console.log('Resume: ', serverInfo);

									db.updateTask(task['id'], 0, 'In Queue',
										(updTask) => {
											util.SendSuccessResponse(response, 200, updTask);
										},
										(err) => {
											util.SendInternalServerError(response);
											console.log('[ERROR] administration.AdministrationTask, post, updateTask: ' + err.detail);
										}
									);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] administration.AdministrationTask, post, getAvailableServerRemote: ' + err.detail);
								}
							);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] administration.AdministrationTask, post, getTask: ' + err.detail);
					}
				);
			},
			put: (request, response) => {
				db.getTask(request.body.task_id,
					(task) => {
						if (task['status'] === 'In Queue' || task['status'] === 'Running') {
							rpc.popTaskFromServerRemote(
								{remote_host: task['server_host'], remote_port: task['server_port']},
								task['id'],
								(d) => {
									console.log(d);
									db.updateTask(task['id'], 0, 'Not Started',
										() => {
											util.SendSuccessResponse(response, 200, task);
										},
										(err) => {
											util.SendInternalServerError(response);
											console.log('[ERROR] administration.AdministrationTask, put, updateTask: ' + err.detail);
										}
									);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] administration.AdministrationTask, put, popTaskFromServerRemote: ' + err.detail);
								}
							);
						} else {
							util.SendSuccessResponse(response, 200, task);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] administration.AdministrationTask, put, getTask: ' + err.detail);
					}
				);
			},
			delete_: (request, response) => {
				db.getTask(request.body.task_id,
					(task) => {
						let deleteTask = (res, ts) => {
							db.deleteTask(ts['id'],
								() => {
									util.SendSuccessResponse(response, 200, ts);
								},
								(err) => {
									util.SendInternalServerError(res);
									console.log('[ERROR] administration.AdministrationTask, delete, deleteTask: ' + err.detail);
								}
							);
						};
						if (task['status'] !== 'Finished') {
							rpc.popTaskFromServerRemote(
								{remote_host: task['server_host'], remote_port: task['server_port']},
								task['id'],
								() => {
									deleteTask(response, task);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] administration.AdministrationTask, delete, popTaskFromServerRemote: ' + err.detail);
								}
							);
						} else {
							deleteTask(response, task);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] administration.AdministrationTask, delete, getTask: ' + err.detail);
					}
				);
			}
		});
	}
};
