const util = require('../util/util');

module.exports = {
	Index: function (request, response) {
		util.HandleRequest({
			request: request,
			response: response,
			get: (request, response) => {
				util.Render(request, response, 'index');
			}
		});
	}
};
