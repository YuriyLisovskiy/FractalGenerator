const util = require('../util/util');
const settings = require('../util/settings');

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
				// TODO: start task
				util.SendNotAcceptable(response);
			},
			put: (request, response) => {
				// TODO: stop task
				util.SendNotAcceptable(response);
			},
			delete_: (request, response) => {
				// TODO: delete task
				util.SendNotAcceptable(response);
			}
		});
	}
};
