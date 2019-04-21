const request = require('request'),
	jwt = require('jsonwebtoken'),
	settings = require('../util/settings');

const paths = {
	getServer: '/get/server',
	pushTask: '/task/push',
	stopTask: '/task/pop'
};

let makeUrl = (serverInfo, requestPath) => {
	return 'http://' + serverInfo.remote_host + ':' + serverInfo.remote_port + requestPath
};

let requestMiddleware = (url, content, method, success, error) => {
	jwt.sign(content, settings.SecretKey, { expiresIn: 120000 }, (err, token) => {
		if (err) {
			error({detail: err});
		} else {
			method(url, { json: {key: token} }, (err, res, body) => {
				if (res >= 400) {
					error({detail: err == null ? body.detail : err});
				} else {
					success(body);
				}
			});
		}
	});
};

let getAvailableServerRemote = (success, error) => {
	requestMiddleware(makeUrl(settings.RemoteServerRoot, paths.getServer), {}, request.get, success, error);
};

let pushTaskToServerRemote = (serverInfo, taskData, success, error) => {
	requestMiddleware(makeUrl(serverInfo, paths.pushTask), taskData, request.post, success, error);
};

let popTaskFromServerRemote = (serverInfo, taskId, success, error) => {
	requestMiddleware(makeUrl(serverInfo, paths.stopTask), {task_id: taskId}, request.post, success, error);
};

module.exports = {
	getAvailableServerRemote: getAvailableServerRemote,
	pushTaskToServerRemote: pushTaskToServerRemote,
	popTaskFromServerRemote: popTaskFromServerRemote
};
