const jwt = require('jsonwebtoken');
const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	Profile: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				util.Render(request, response, 'profile');
			},
			post: (request, response) => {
				db.getUser(request.user.username, request.user.email, (user) => {
						let data = request.body;
						if (!data.username || data.username === '' || !data.email || data.email === '') {
							util.SendBadRequest(response);
						} else {
							user.username = data.username;
							user.email = data.email;
							db.updateUser(user,
								() => {
									jwt.sign(user, settings.SecretKey, { expiresIn: '1h' }, (err, token) => {
										if (err) {
											console.log(err);
											util.SendBadRequest(response);
										} else {
											util.SendSuccessResponse(response, 201, {
												key: token,
												user: {
													username: user.username,
													is_superuser: user.is_superuser
												},
												redirect_url: '/profile'
											});
										}
									});
								},
								(err) => {
									console.log('[ERROR] profile.Profile, post, updateUser: ' + err.detail);
									util.SendInternalServerError(response);
								}
							);
						}
					},
					(err) => {
						console.log('[ERROR] profile.Profile, post, getUser: ' + err.detail);
						util.SendInternalServerError(response);
					}
				);
			}
		});
	},
	UserFractals: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				// TODO: get user tasks
				util.SendNotAcceptable(response);
			}
		});
	},
	UserTasks: function(request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				let page = request.query.page;
				let limit = request.query.limit;
				db.getUserTasks(request.user.id,
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
	UserTask: function(request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			sudo_request: true,
			get: (request, response) => {
				db.getUserTask(request.user.id, request.query.task_id,
					(task) => {
						util.SendSuccessResponse(response, 200, {
							task_progress: task.progress,
							task_status: task.status
						});
					},
					(err) => {
						util.SendInternalServerError(response, err.detail);
					}
				);
			},
			post: (request, response) => {
				// TODO: send remote server to start task, if success:
				db.getUserTask(request.user.id, request.body.task_id,
					(task) => {
						if (task['status'] === 'Not Started') {
							db.updateTask(task['id'], 0, 'In Queue',
								(updTask) => {
									util.SendSuccessResponse(response, 200, updTask);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] profile.UserTask, post, updateTask: ' + err.detail);
								}
							);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, post, getUserTask: ' + err.detail);
					}
				);
			},
			put: (request, response) => {
				// TODO: send remote server to stop task, if success:
				db.getUserTask(request.user.id, request.body.task_id,
					(task) => {
						if (task['status'] === 'In Queue' || task['status'] === 'Running') {
							db.updateTask(task['id'], 0, 'Not Started',
								(updTask) => {
									util.SendSuccessResponse(response, 200, updTask);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] profile.UserTask, put, updateTask: ' + err.detail);
								}
							);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, put, getUserTask: ' + err.detail);
					}
				);
			},
			delete_: (request, response) => {
				// TODO: send remote server to delete task, if success:
				db.getUserTask(request.user.id, request.body.task_id,
					(task) => {
						db.deleteTask(task['id'],
							(updTask) => {
								util.SendSuccessResponse(response, 200, updTask);
							},
							(err) => {
								util.SendInternalServerError(response);
								console.log('[ERROR] profile.UserTask, delete, deleteTask: ' + err.detail);
							}
						);
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, delete, getUserTask: ' + err.detail);
					}
				);
			}
		});
	}
};
