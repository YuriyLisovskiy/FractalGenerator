const util = require('../util/util');
const settings = require('../util/settings');

let db = settings.Db;

module.exports = {
	Administration: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					db.getPromotions(
						(promotions) => {
							util.Render(request, response, 'administration', {promotions: promotions});
						},
						(err) => {
							console.log(err);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			post: (request, response) => {
				if (request.user.is_superuser) {
					util.UploadFile(request, 'picture',
						(data, filePath) => {
							let promotionId = null;
							if (data.promotion !== 'none') {
								promotionId = data.promotion;
							}
							db.createGoods(data.title, parseFloat(data.price), data.description, filePath, promotionId,
								() => {
									response.redirect('/administration');
								},
								(err) => {
									console.log(err.detail);
									util.SendBadRequest(response, err);
								}
							);
						},
						(err) => {
							console.log('[ERROR] administration.Administration, UploadFile, post: ' + err.detail);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			}
		});
	},
	EditGoods: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					db.getGoodsById(
						request.params[0],
						(item) => {
							if (item) {
								db.getPromotions(
									(promotions) => {
										util.Render(
											request, response,
											'edit_goods', {item: item, promotions: promotions}
										);
									},
									(err) => {
										console.log(err);
										util.SendInternalServerError(response);
									}
								);
							} else {
								util.SendNotFound(response);
							}
						},
						(err) => {
							console.log(err);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			post: (request, response) => {
				if (request.user.is_superuser) {
					util.UploadFile(request, 'picture',
						(data, filePath) => {
							db.getGoodsById(
								request.params[0],
								(item) => {
									if (item) {
										if (filePath !== null) {
											item.image = filePath;
										}
										if (data.title) {
											item.title = data.title;
										}
										if (data.price) {
											item.price = data.price;
										}
										if (data.description) {
											item.description = data.description;
										}
										if (data.promotion !== 'none') {
											item.promotion = data.promotion;
										}
										db.updateGoods(
											item,
											() => {response.redirect('/administration');},
											(err) => {
												console.log(err);
												util.SendInternalServerError(response);
											}
										);
									} else {
										util.SendNotFound(response);
									}
								},
								(err) => {
									console.log(err);
									util.SendInternalServerError(response);
								}
							);
						},
						(err) => {
							console.log('[ERROR] administration.Administration, UploadFile, post: ' + err.detail);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			}
		});
	},
	Promotions: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					let page = request.query.page;
					let limit = request.query.limit;
					db.getPromotions(
						(promotions) => {
							util.SendSuccessResponse(response, 200, {
								promotions: promotions.slice(limit * (page - 1), limit * page),
								pages: Math.ceil(promotions.length / limit),
							});
						},
						() => {
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			post: (request, response) => {
				if (request.user.is_superuser) {
					db.createPromotion(request.body.percentage, request.body.comment,
						(promotionId) => {
							if (request.body.goods) {
								for (let i = 0; i < request.body.goods.length; i++) {
									db.getGoodsById(request.body.goods[i],
										(item) => {
											item.promotion = promotionId;
											db.updateGoods(item, () => {}, (err) => {
												console.log(err);
											});
										},
										(err) => {
											console.log(err);
										}
									);
								}
							}
							response.redirect('/administration');
						},
						(err) => {
							console.log(err);
							util.SendInternalServerError(response, 'unable to create promotion');
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			delete_: (request, response) => {
				if (request.user.is_superuser) {
					db.deletePromotion(
						request.body.promotion,
						() => {
							util.SendSuccessResponse(response, 201, 'Promotion is deleted');
							db.filterGoodsByPromotion(
								request.body.promotion,
								(goods) => {
									for (let i = 0; i < goods.length; i++) {
										goods[i].promotion = null;
										db.updateGoods(goods[i], () => {}, (err) => {console.log(err);});
									}
								},
								(err) => {
									console.log(err);
								}
							);
						},
						(err) => {
							console.log(err);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			}
		});
	},
	EditPromotion: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					db.getPromotionById(
						request.params[0],
						(item) => {
							if (item) {
								util.Render(request, response, 'edit_promotion', {item: item});
							} else {
								util.SendNotFound(response);
							}
						},
						(err) => {
							console.log(err);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			post: (request, response) => {
				if (request.user.is_superuser) {
					let data = request.body;
					db.getPromotionById(
						request.params[0],
						(item) => {
							if (item) {
								if (data.percentage) {
									item.percentage = data.percentage;
								}
								if (data.comment) {
									item.comment = data.comment;
								}
								db.updatePromotion(
									item,
									() => {response.redirect('/administration');},
									(err) => {
										console.log(err);
										util.SendInternalServerError(response);
									}
								);
							} else {
								util.SendNotFound(response);
							}
						},
						(err) => {
							console.log(err);
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			}
		});
	},
	PromotionGoods: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					let page = request.query.page;
					let limit = request.query.limit;
					db.joinGoodsAndPromotion(
						request.query.promotion,
						(goods) => {
							let updGoods = goods.slice(limit * (page - 1), limit * page);
							for (let i = 0; i < updGoods.length; i++) {
								let discount = updGoods[i]['discount_price'];
								let price = updGoods[i].price;
								updGoods[i]['discount_price'] = Number(price - price * discount / 100).toFixed(2);
							}
							util.SendSuccessResponse(response, 200, {
								goods: updGoods,
								pages: Math.ceil(goods.length / limit),
							});
						},
						() => {
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			put: (request, response) => {
				if (request.user.is_superuser) {
					let id = request.body.goods_code;
					if (id) {
						db.getGoodsById(id,
							(item) => {
								item.promotion = null;
								db.updateGoods(item,
									() => {
										util.SendSuccessResponse(response, 201, item)
									},
									() => {
										util.SendInternalServerError(response, 'Unable to update goods');
									}
								);
							},
							() => {
								util.SendNotFound(response, 'Goods not found')
							}
						);
					}
				} else {
					util.SendForbidden(response);
				}
			}
		});
	},
	Orders: function (request, response) {
		util.HandleAuthRequest({
			request: request,
			response: response,
			get: (request, response) => {
				if (request.user.is_superuser) {
					let page = request.query.page;
					let limit = request.query.limit;
					db.getAllOrders(
						(orders) => {
							util.SendSuccessResponse(response, 200, {
								orders: orders.slice(limit * (page - 1), limit * page),
								pages: Math.ceil(orders.length / limit)
							});
						},
						() => {
							util.SendInternalServerError(response);
						}
					);
				} else {
					util.SendForbidden(response);
				}
			},
			put: (request, response) => {
				if (request.user.is_superuser) {
					let id = request.body.order_id;
					if (id) {
						if (request.body.status < 0 || request.body.status > 4) {
							util.SendBadRequest(response, 'Invalid status');
						} else {
							db.setOrderStatus(id,
								request.body.status,
								() => {
									util.SendSuccessResponse(response, 201, 'a new status has been set');
								},
								() => {
									util.SendNotFound(response, 'Goods not found')
								}
							);
						}
					}
				} else {
					util.SendForbidden(response);
				}
			}
		});
	}
};
