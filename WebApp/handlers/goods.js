const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	Goods: function (request, response) {
		util.HandleRequest({
			request: request,
			response: response,
			get: (request, response) => {
				let page = request.query.page;
				let limit = request.query.limit;
				if (request.query.withoutPromotions) {
					db.getGoodsWithoutPromotions(
						(goods) => {
							util.SendSuccessResponse(response, 200, {
								goods: goods.slice(limit * (page - 1), limit * page),
								pages: Math.ceil(goods.length / limit),
							});
						},
						() => {
							util.SendInternalServerError(response);
						}
					);
				} else {
					db.getCart(request.user.id,
						(cart) => {
							let cartId = null;
							if (cart) {
								cartId = cart.id;
							}
							db.getAllGoods(
								cartId,
								request.query.sort_by,
								(goods) => {
									let updGoods = goods.slice(limit * (page - 1), limit * page);
									for (let i = 0; i < updGoods.length; i++) {
										let discount = updGoods[i].discount_percentage;
										if (discount) {
											let price = updGoods[i].price;
											updGoods[i]['discount_price'] = Number(price - price * discount / 100).toFixed(2);
										}
									}
									util.SendSuccessResponse(response, 200, {
										goods: updGoods,
										pages: Math.ceil(goods.length / limit),
										sort_by: request.query.sort_by !== 'null' ? request.query.sort_by : 'title_asc'
									});
								},
								() => {
									util.SendInternalServerError(response);
								}
							);
						},
						(err) => {
							console.log('[ERROR] goods.Goods, get, getCart: ' + err.detail);
							util.SendInternalServerError(response, err.detail);
						}
					);
				}
			},
			delete_: (request, response) => {
				if (request.user && request.user.is_superuser) {
					db.deleteGoods(request.body.goods_code,
						() => {
							db.deleteGoodsFromCart(
								request.body.goods_code,
								() => {
									util.SendSuccessResponse(response, 201, {detail: 'goods item is deleted'})
								},
								(err) => {
									console.log('[ERROR] goods.Goods, deleteGoods: ' + err.detail);
									util.SendInternalServerError(response);
								}
							);
						},
						(err) => {
							console.log('[ERROR] goods.Goods, deleteGoodsFromCart: ' + err.detail);
							util.SendInternalServerError(response, err);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			}
		});
	}
};
