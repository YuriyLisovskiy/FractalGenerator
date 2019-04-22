const util = require('../util/util'),
	settings = require('../util/settings'),
	jwt = require('jsonwebtoken');

let db = settings.Db;

module.exports = {
	UploadFractal: function (request, response) {
		util.HandleRequest({
			request: request,
			response: response,
			post: (request, response) => {
				jwt.verify(request.headers['auth_token'], settings.SecretKey, (err, data) => {
					if (err) {
						util.SendBadRequest(response, err);
					} else if (data) {
						let fields = data;
						util.UploadFile(request, 'fractal_image',
							(data, filePath) => {
								db.createUserFractal(fields.owner, fields.title, fields.width, fields.height, filePath,
									(data) => {
										db.setFractalIdToTask(fields.task_id, data.last_id,
											() => {
												util.SendSuccessResponse(response, 200);
											},
											(err) => {
												console.log('[ERROR] remote.UploadFractal, setFractalIdToTask, post: ' + err.detail);
												util.SendInternalServerError(response);
											}
										);
									},
									(err) => {
										console.log(err.detail);
										util.SendBadRequest(response, err);
									}
								);
							},
							(err) => {
								console.log('[ERROR] remote.UploadFractal, UploadFile, post: ' + err.detail);
								util.SendInternalServerError(response);
							}
						);
					} else {
						util.SendInternalServerError(response, 'err');
					}
				});
			}
		});
	},
};
