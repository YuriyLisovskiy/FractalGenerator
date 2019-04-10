const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	GoodsAdd: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			post: (request, response) => {
				if (!request.body.hasOwnProperty('goods_code')) {
					util.SendBadRequest(response, 'goods_code is undefined');
				} else if (!request.body.hasOwnProperty('amount')) {
					util.SendBadRequest(response, 'amount is undefined');
				} else {
					db.getGoodsById(
						request.body.goods_code,
						(item) => {
							if (item) {
								db.getCart(
									request.user.id,
									(cart) => {
										let addGoods = (cart_id) => {
											db.addGoodsToCart(
												cart_id, item.code, request.body.amount,
												(id, amount) => {
													util.SendSuccessResponse(response, 201, {amount: amount});
												},
												(err) => {
													console.log('[ERROR] cart.GoodsAdd, addGoodsToCart: ' + err.detail);
													util.SendInternalServerError(response);
												}
											);
										};
										if (!cart) {
											db.createCart(
												request.user.id,
												(cart_id) => {
													addGoods(cart_id);
												}
											);
										} else {
											addGoods(cart.id);
										}
									},
									(err) => {
										console.log('[ERROR] cart.GoodsAdd, getCart: ' + err.detail);
										util.SendInternalServerError(response);
									}
								);
							} else {
								util.SendNotFound(response, 'goods not found');
							}
						},
						(err) => {
							console.log('[ERROR] cart.GoodsAdd, getGoodsById: ' + err.detail);
							util.SendInternalServerError(response);
						}
					);
				}
			}
		});
	},
	GoodsRemove: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			post: (request, response) => {
				if (!request.body.hasOwnProperty('goods_code')) {
					util.SendBadRequest(response, 'goods_code is undefined');
				} else if (!request.body.hasOwnProperty('amount')) {
					util.SendBadRequest(response, 'amount is undefined');
				} else {
					db.getGoodsById(
						request.body.goods_code,
						(item) => {
							if (item) {
								db.getCart(
									request.user.id,
									(cart) => {
										if (cart) {
											db.removeGoodsFromCart(
												cart.id, item.code, request.body.amount,
												(id, amount) => {
													util.SendSuccessResponse(response, 201, {amount: amount});
												},
												(err) => {
													console.log('[ERROR] cart.GoodsRemove, addGoodsToCart: ' + err.detail);
													util.SendInternalServerError(response);
												}
											);
										} else {
											util.SendNotFound(response, 'cart not found');
										}
									},
									(err) => {
										console.log('[ERROR] cart.GoodsRemove, getCart: ' + err.detail);
										util.SendInternalServerError(response);
									}
								);
							} else {
								util.SendNotFound(response, 'goods not found');
							}
						},
						(err) => {
							console.log('[ERROR] cart.GoodsRemove, getGoodsById: ' + err.detail);
							util.SendInternalServerError(response);
						}
					);
				}
			}
		});
	}
};
