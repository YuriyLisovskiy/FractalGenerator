const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const util = require('../util/util');
const settings = require('../util/settings');
const nodemailer = require('nodemailer');

let db = settings.Db;

let sendEmail = (to, subject, text, success, failed) => {
	let transporter = nodemailer.createTransport(settings.transporterData);
	let mailOptions = {
		from: settings.transporterData.auth.user,
		to: to,
		subject: subject,
		text: text
	};
	transporter.sendMail(mailOptions, (err, info) => {
		if (err) {
			failed({detail: err});
			console.log('[ERROR] auth.sendEmail, sendMail: ' + err.detail);
		} else {
			success('Check out your email box for account verification.');
		}
	});
};

let Login = (request, response) => {
	util.HandleRequest({
		request: request,
		response: response,
		post: (request, response) => {
			let credentials = request.body;
			db.getUser(credentials.username, null,
				(user) => {
					if (user) {
						if (user.is_verified) {
							let pwd_hash = crypto.createHash('sha256').update(credentials.password).digest('base64');
							if (pwd_hash === user.password) {
								jwt.sign(user, settings.SecretKey, { expiresIn: '1h' }, (err, token) => {
									if (err) {
										console.log(err);
										util.SendBadRequest(response);
									} else {
										util.SendSuccessResponse(response, 200, {
											key: token,
											user: {
												username: user.username,
												is_superuser: user.is_superuser
											}
										});
									}
								});
							} else {
								util.SendBadRequest(response, 'invalid credentials');
							}
						} else {
							util.SendForbidden(response, 'Verify Your account first');
						}
					}
					 else {
						util.SendNotFound(response, 'User is not found');
					}
				},
				(err) => {
					console.log(err);
					util.SendNotFound(response, 'User does not exist');
				}
			);
		}
	});
};

let Register = (request, response) => {
	util.HandleRequest({
		request: request,
		response: response,
		post: (request, response) => {
			let credentials = request.body;
			db.getUser(credentials.username, credentials.email,
				(user) => {
					if (user) {
						util.Render(request, response, 'index', {errors: 'User already exists.'});
					} else {
						db.createUser(
							credentials.username,
							credentials.email,
							credentials.password,
							() => {
								db.getUser(credentials.username, credentials.email,
									(user) => {
										jwt.sign(user, settings.SecretKey, { expiresIn: '1h' }, (err, token) => {
											if (err) {
												console.log(err);
												util.SendBadRequest(response);
											} else {
												sendEmail(
													credentials.email,
													'Registration on Art Store',
													`Use this link to verify Your account:\n${settings.host}/user/verify/${token}\n\nThank You for registering on our website.`,
													(detail) => {
														util.Render(request, response, 'index', {is_registered: detail});
													},
													(err) => {
														console.log('[ERROR] auth.Register, post, sendEmail: ' + err.detail);
														util.SendInternalServerError(response, err.detail);
													}
												);
											}
										});
									},
									(err) => {
										console.log('[ERROR] auth.Register, post, getUser: ' + err.detail);
										util.SendInternalServerError(response, err.detail);
									}
								);
							},
							(err) => {
								console.log('[ERROR] auth.Register, post, createUser: ' + err.detail);
								util.SendInternalServerError(response, err.detail);
							}
						);
					}
				},
				(err) => {
					console.log('[ERROR] auth.Register, getUser: ' + err.detail);
					util.SendInternalServerError(response, 'unable to retrieve user');
				}
			);
		}
	});
};

let Logout = (request, response) => {
	if (request.method === 'GET' || request.method === 'POST') {
		response.redirect('/');
	} else {
		util.SendNotAcceptable(response);
	}
};

let VerifyUser = (request, response) => {
	util.HandleRequest({
		request: request,
		response: response,
		get: (request, response) => {
			util.VerifyToken(request.params[0], settings.SecretKey,
				(user) => {
					if (user.is_verified) {
						util.SendBadRequest(response);
					} else {
						user.is_verified = true;
						db.updateUser(user,
							() => {
								util.Render(request, response, 'index', {
									open_login: true
								});
							},
							(err) => {
								console.log('[ERROR] auth.VerifyUser, get, updateUser: ' + err.detail);
								util.SendInternalServerError(response, err.detail);
							}
						);
					}
				},
				() => {
					util.SendForbidden(response);
				}
			);
		}
	});
};

let VerifyToken = (request, response) => {
	util.HandleAuthRequest({
		request: request,
		response: response,
		post: (request, response) => {
			util.SendSuccessResponse(response, 200, {
				detail: 'token is verified',
				user: {
					username: request.user.username,
					is_superuser: request.user.is_superuser
				}
			});
		}
	});
};

module.exports = {
	Login: Login,
	Register: Register,
	Logout: Logout,
	VerifyToken: VerifyToken,
	VerifyUser: VerifyUser
};
