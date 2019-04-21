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
								() => {
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
							db.updateTask(task['id'], 0, 'Not Started',
								(updTask) => {
									rpc.popTaskFromServerRemote(
										{remote_host: task['server_host'], remote_port: task['server_port']},
										updTask['id'],
										() => {
											util.SendSuccessResponse(response, 200, updTask);
										},
										(err) => {
											util.SendInternalServerError(response);
											console.log('[ERROR] administration.AdministrationTask, put, popTaskFromServerRemote: ' + err.detail);
										}
									);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] administration.AdministrationTask, put, updateTask: ' + err.detail);
								}
							);
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
						db.updateTask(task['id'], 0, 'Not Started',
							() => {
								rpc.popTaskFromServerRemote(
									{remote_host: task['server_host'], remote_port: task['server_port']},
									task['id'],
									() => {
										db.deleteTask(task['id'],
											(updTask) => {
												util.SendSuccessResponse(response, 200, updTask);
											},
											(err) => {
												util.SendInternalServerError(response);
												console.log('[ERROR] administration.AdministrationTask, delete, deleteTask: ' + err.detail);
											}
										);
									},
									(err) => {
										util.SendInternalServerError(response);
										console.log('[ERROR] administration.AdministrationTask, delete, popTaskFromServerRemote: ' + err.detail);
									}
								);
							},
							(err) => {
								util.SendInternalServerError(response);
								console.log('[ERROR] administration.AdministrationTask, delete, updateTask: ' + err.detail);
							}
						);
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
