const jwt = require('jsonwebtoken');
const util = require('../util/util');
const settings = require('../util/settings');
const rpc = require('../util/rpc');

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
				db.getUserFractals(request.user.id,
					(data) => {
						util.Render(request, response, 'fractal_gallery', {
							has_fractals: data.length > 0
						});
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserFractals, get, getUserFractals: ' + err.detail);
					}
				);
			},
			put: (request, response) => {
				db.getUserFractals(request.user.id,
					(data) => {
						let limit = request.body.limit;
						let page = request.body.page;
						util.SendSuccessResponse(response, 200, {
							fractals: data.slice(limit * (page - 1), limit * page),
							pages: Math.ceil(data.length / limit),
						});
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserFractals, put, getUserFractals: ' + err.detail);
					}
				);
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
			get: (request, response) => {
				db.getUserTask(request.user.id, request.query.task_id,
					(task) => {
						util.SendSuccessResponse(response, 200, {
							task_progress: task.progress,
							task_status: task.status,
							fractal_link: task.fractal_link
						});
					},
					() => {
						util.SendSuccessResponse(response, 200, {deleted: true});
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
											console.log('[ERROR] profile.UserTask, post, updateTask: ' + err.detail);
										}
									);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] profile.UserTask, post, getAvailableServerRemote: ' + err.detail);
								}
							);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, post, getTask: ' + err.detail);
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
											console.log('[ERROR] profile.UserTask, put, updateTask: ' + err.detail);
										}
									);
								},
								(err) => {
									util.SendInternalServerError(response);
									console.log('[ERROR] profile.UserTask, put, popTaskFromServerRemote: ' + err.detail);
								}
							);
						} else {
							util.SendSuccessResponse(response, 200, task);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, put, getTask: ' + err.detail);
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
									console.log('[ERROR] profile.UserTask, delete, deleteTask: ' + err.detail);
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
									console.log('[ERROR] profile.UserTask, delete, popTaskFromServerRemote: ' + err.detail);
								}
							);
						} else {
							deleteTask(response, task);
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.UserTask, delete, getTask: ' + err.detail);
					}
				);
			}
		});
	},
	CreateTask: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				db.countUserActiveTasks(request.user.id,
					(data) => {
						util.Render(request, response, 'create_task', {
							block_task_creation: data['countuseractivetasks'] >= settings.UserTasksLimit
						});
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.CreateTask, get, countUserActiveTasks: ' + err.detail);
					}
				);
			},
			post: (request, response) => {
				db.countUserActiveTasks(request.user.id,
					(data) => {
						if (data['countuseractivetasks'] >= settings.UserTasksLimit) {
							response.redirect('/user/create/fractal');
						} else {
							let formData = request.body;
							let renderPage = (request, response, ctx) => {
								db.countUserActiveTasks(request.user.id,
									(data) => {
									ctx['block_task_creation'] = data['countuseractivetasks'] >= settings.UserTasksLimit
										util.Render(request, response, 'create_task', ctx);
									},
									(err) => {
										util.SendInternalServerError(response);
										console.log('[ERROR] profile.CreateTask, post, countUserActiveTasks: ' + err.detail);
									}
								);
							};
							let errors = [];
							if (formData.width > settings.ImageWidthLimit) {
								errors.push('Image width is too large, maximum is ' + settings.ImageWidthLimit);
							}
							if (formData.height > settings.ImageHeightLimit) {
								errors.push('Image height is too large, maximum is ' + settings.ImageHeightLimit);
							}
							if (formData.max_iterations > settings.IterationsLimit) {
								errors.push('Too mush iterations, maximum is ' + settings.IterationsLimit);
							}
							if (errors.length > 0) {
								renderPage(request, response, {errors: errors});
							} else {
								rpc.getAvailableServerRemote(
									(serverInfo) => {
										rpc.pushTaskToServerRemote(
											serverInfo,
											{
												task_type: parseInt(formData.task_type),
												width: parseInt(formData.width),
												height: parseInt(formData.height),
												max_iterations: parseInt(formData.max_iterations),
												owner_id: request.user.id
											},
											() => {
												renderPage(request, response, {});
											},
											(err) => {
												util.SendInternalServerError(response, err);
												console.log('[ERROR] profile.CreateTask, post, pushTaskToServerRemote: ' + err.detail);
											}
										);
									},
									(err) => {
										util.SendInternalServerError(response, err);
										console.log('[ERROR] profile.CreateTask, post, getAvailableServerRemote: ' + err.detail);
									}
								);
							}
						}
					},
					(err) => {
						util.SendInternalServerError(response);
						console.log('[ERROR] profile.CreateTask, get, countUserActiveTasks: ' + err.detail);
					}
				);
			}
		});
	}
};
