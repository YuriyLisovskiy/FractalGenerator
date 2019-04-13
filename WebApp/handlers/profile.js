const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	Profile: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				// TODO: get user tasks
				util.SendNotAcceptable(response, 'method is not implemented');
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
									response.redirect('/profile');
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
};
