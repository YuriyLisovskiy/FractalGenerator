const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	Profile: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				db.getGoodsByUserCart(request.user.id,
					(goods) => {
						response.render('profile', {user: request.user, goods: goods});
					},
					(err) => {
						console.log('[ERROR] profile.Profile, get, getGoodsByUserCart: ' + err.detail);
						util.SendInternalServerError(response, err.detail);
					}
				);
			},
			post: (request, response) => {
				db.getUser(request.user.username, request.user.email, (user) => {
						let getField = (field) => {
							return (field && field !== '') ? field : null;
						};
						let data = request.body;
						if (!data.username || data.username === '' || !data.email || data.email === '') {
							util.SendBadRequest(response);
						} else {
							user.first_name = getField(data.first_name);
							user.last_name = getField(data.last_name);
							user.username = data.username;
							user.address = getField(data.address);
							user.phone = getField(data.phone);
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
};
