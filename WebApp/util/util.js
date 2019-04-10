const jwt = require('jsonwebtoken');
const settings = require('./settings');
const formidable = require('formidable');
const path = require('path');
const mv = require('mv');

let db = settings.Db;

let VerifyToken = (token, secret, success, failed) => {
	if (token) {
		jwt.verify(token, secret, (err, data) => {
			if (err) {
				failed(err);
			} else if (data) {
				db.getUser(data.username, data.email, (user) => {success(user);}, (err) => {failed(err.default);});
			} else {
				failed('error');
			}
		});
	} else {
		failed({detail: 'token is undefined'});
	}
};

let HandleRequest = ({request, response, get, post, put, delete_}) => {
	let finished = () => {
		delete request.user.password;

		if (!response.hasOwnProperty('send_json')) {
			response['send_json'] = request.headers['accept'] === 'application/json';
		}
		if (request.method === 'GET') {
			if (get) {
				get(request, response);
			} else {
				SendNotAcceptable(response);
			}
		} else if (request.method === 'POST') {
			if (post) {
				post(request, response);
			} else {
				SendNotAcceptable(response);
			}
		} else if (request.method === 'PUT') {
			if (put) {
				put(request, response);
			} else {
				SendNotAcceptable(response);
			}
		} else if (delete_) {
			delete_(request, response);
		} else {
			SendNotAcceptable(response);
		}
	};
	if (!request.user) {
		VerifyToken(request.cookies['auth_token'], settings.SecretKey,
			function (data) {
				if (data) {
					db.getUser(data.username, null, (user) => {
						if (user) {
							request.user = user;
							request.user.is_authenticated = true;
							db.countGoodsAmountInUserCart(user.id,
								(goods_amount) => {
									if (!goods_amount) {
										goods_amount = 0;
									}
									request.user.goods_in_cart_num = goods_amount;
									finished();
								},
								(err) => {
									console.log('[ERROR] util.HandleRequest: countGoodsAmountInUserCart: ' + err.detail);
									SendInternalServerError(response, 'unable to count cart\'s goods amount');
								}
							);
						} else {
							SendNotFound(response, 'User is not found');
						}
					}, (err) => {
						console.log('[ERROR] util.HandleRequest: getUser: ' + err.detail);
						SendInternalServerError(response, 'unable to retrieve user');
					});
				} else {
					SendBadRequest(response, 'Try to clear your browser\'s cookies');
				}
			},
			() => {
				request.user = {
					is_authenticated: false,
					goods_in_cart_num: 0
				};
				finished();
			}
		);
	} else {
		finished();
	}
};

let HandleAuthRequest = ({request, response, get, post, put, delete_}) => {
	response['send_json'] = request.headers['accept'] === 'application/json';
	VerifyToken(request.cookies['auth_token'], settings.SecretKey,
		(data) => {
			db.getUser(data.username, null, (user) => {
				if (user) {
					request['user'] = user;
					request.user['is_authenticated'] = true;
					delete request.user.password;
					db.countGoodsAmountInUserCart(user.id,
						(goods_amount) => {
							request.user['goods_in_cart_num'] = goods_amount;
							HandleRequest(
								{request: request, response: response, get: get, post: post, put: put, delete_: delete_}
							);
						},
						() => {
							SendInternalServerError(response, 'unable to count cart\'s goods amount');
						}
					);
				} else {
					SendNotFound(response, 'User is not found');
				}
			}, (err) => {
				console.log('[ERROR] util.HandleAuthRequest: getUser: ' + err.detail);
				SendInternalServerError(response, 'unable to retrieve user');
			});
		},
		() => {
			SendForbidden(response);
		}
	);
};

let UploadFile = (request, keyword, success, failed) => {
	let form = new formidable.IncomingForm();
	form.parse(request, function (err, fields, files) {
		if (files[keyword].name.length > 0) {
			let oldPath = files[keyword].path;
			let now = new Date();
			let dotPos = files[keyword].name.lastIndexOf('.');
			let name = files[keyword].name.substring(0, dotPos) + now + files[keyword].name.substring(dotPos);
			let newPath = path.resolve('./media/') + '/' + name;
			mv(oldPath, newPath, function (err) {
				if (err) {
					failed({detail: err});
				} else {
					success(fields, '/media/' + name);
				}
			});
		} else {
			success(fields, null);
		}
	});
};

let sendError = (response, err, code, detail) => {
	let responseData = null;
	if (response['send_json']) {
		response.setHeader('Content-Type', 'application/json');
		let message = {error: err};
		if (detail) {
			message['detail'] = detail
		}
		responseData = JSON.stringify(message);
	} else {
		responseData = '<h3 style="text-align: center">' + code + ' ' + err + '</h3>';
		if (detail) {
			responseData += '<h5 style="text-align: center">' + detail + '</h5>';
		}
	}
	response.status(code);
	response.send(responseData);
};

let SendNotAcceptable = (response, detail) => {
	sendError(response, 'Not Acceptable', 406, detail);
};

let SendNotFound = (response, detail) => {
	sendError(response, 'Not Found', 404, detail);
};

let SendBadRequest = (response, detail) => {
	sendError(response, 'Bad Request', 400, detail);
};

let SendForbidden = (response, detail) => {
	sendError(response, 'Forbidden', 403, detail);
};

let SendInternalServerError = (response, detail) => {
	sendError(response, 'Internal Server Error', 500, detail);
};

let SendSuccessResponse = (response, code, content) => {
	let responseData = content;
	if (response['send_json']) {
		response.setHeader('Content-Type', 'application/json');
		responseData = JSON.stringify(content);
	}
	response.status(code);
	response.send(responseData);
};

let Render = (request, response, template, context = null) => {
	if (!context) {
		context = {};
	}
	context['user'] = request.user;
	response.render(template, context);
};

module.exports = {
	SendNotAcceptable: SendNotAcceptable,
	SendNotFound: SendNotFound,
	SendBadRequest: SendBadRequest,
	SendForbidden: SendForbidden,
	SendInternalServerError: SendInternalServerError,
	HandleRequest: HandleRequest,
	HandleAuthRequest: HandleAuthRequest,
	SendSuccessResponse: SendSuccessResponse,
	Render: Render,
	UploadFile: UploadFile,
	VerifyToken: VerifyToken
};
