const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	CreateOrder: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			post: (request, response) => {
				let checkField = (field) => {
					return field && field !== '';
				};
				let data = request.body;
				if (
					!checkField(data.first_name) ||
					!checkField(data.last_name) ||
					!checkField(data.phone) ||
					!checkField(data.address)
				) {
					util.SendBadRequest(response);
				} else {
					db.getGoodsByUserCart(request.user.id,
						(goods) => {
							if (goods && goods.length > 0) {
								let orderData = {};
								orderData.first_name = data.first_name;
								orderData.last_name = data.last_name;
								orderData.address = data.address;
								orderData.phone = data.phone;
								orderData.email = (data.email && data.email !== '') ? data.email : null;
								orderData.user_pk = request.user.id;
								orderData.goods = goods;
								db.createOrder(orderData,
									() => {
										db.getCart(request.user.id,
											(cart) => {
												db.deleteCartData(cart.id,
													() => {
														response.redirect('/profile');
													},
													(err) => {
														console.log('[ERROR] orders.CreateOrder, post, deleteCartData: ' + err.detail);
														util.SendInternalServerError(response);
													}
												);
											},
											(err) => {
												console.log('[ERROR] orders.CreateOrder, post, getCart: ' + err.detail);
												util.SendInternalServerError(response);
											}
										);
									},
									(err) => {
										console.log('[ERROR] orders.CreateOrder, post, createOrder: ' + err.detail);
										util.SendInternalServerError(response);
									}
								);
							} else {
								util.SendBadRequest(response);
							}
						},
						(err) => {
							console.log('[ERROR] orders.CreateOrder, get, getGoodsByUserCart: ' + err.detail);
							util.SendInternalServerError(response, err.detail);
						}
					);
				}
			}
		});
	},
	GetOrders: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				let page = request.query.page;
				let limit = request.query.limit;
				db.getOrders(request.user.id,
					(orders) => {
						util.SendSuccessResponse(response, 200, {
							orders: orders.slice(limit * (page - 1), limit * page),
							pages: Math.ceil(orders.length / limit),
						});
					},
					(err) => {
						console.log('[ERROR] orders.GetOrders, get, getOrders: ' + err.detail);
						util.SendInternalServerError(response);
					}
				);
			}
		});
	},
	GetOrderedGoods: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				db.getOrder(request.query.order_id,
					(order) => {
						if (order) {
							db.getOrderedGoods(request.query.order_id,
								(goods) => {
									util.SendSuccessResponse(response, 200, {goods: goods});
								},
								(err) => {
									console.log('[ERROR] orders.GetOrderedGoods, get, getOrderedGoods: ' + err.detail);
									util.SendInternalServerError(response);
								}
							);
						} else {
							util.SendNotFound(response, 'order not found');
						}
					},
					(err) => {
						console.log('[ERROR] orders.GetOrderedGoods, get, getOrder: ' + err.detail);
						util.SendInternalServerError(response);
					}
				);
			}
		});
	},
};
