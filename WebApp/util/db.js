const sqlite3 = require('sqlite3');
const crypto = require('crypto');
const fs = require('fs');

class Db {
	constructor(path) {
		this.db = new sqlite3.Database(path, (err) => {
			if (err) {
				return console.error(err.message);
			}
			console.log('Connected to the SQLite database.');
		});
	}

	createDb() {
		let query = `
          CREATE TABLE IF NOT EXISTS Users (
            id            INTEGER       PRIMARY KEY,
            username      VARCHAR(100)  UNIQUE NOT NULL,
            email         VARCHAR(255)  UNIQUE NOT NULL,
            password      VARCHAR(100)  NOT NULL,
            first_name    VARCHAR(100)  NULL,
            last_name     VARCHAR(100)  NULL,
            address       VARCHAR(500)  NULL,
            phone         VARCHAR(50)   NULL,
            is_superuser  BOOLEAN       DEFAULT FALSE,
            is_verified   BOOLEAN       DEFAULT FALSE
          );

          CREATE TABLE IF NOT EXISTS Promotions (
            id            INTEGER       PRIMARY KEY,
            percentage    INTEGER       DEFAULT 0,
            comment       VARCHAR(255)  NULL
          );

          CREATE TABLE IF NOT EXISTS Goods (
            code          INTEGER       PRIMARY KEY,
            title         VARCHAR(255)  NOT NULL,
            price         DECIMAL       NOT NULL,
            image         VARCHAR(500)  NULL,
            description   TEXT DEFAULT  NULL,
            promotion     INTEGER       NULL,

            FOREIGN KEY(promotion) REFERENCES Promotions(id)
          );

          CREATE TABLE IF NOT EXISTS Carts (
            id                INTEGER       PRIMARY KEY,
            user_id           INTEGER(100)  UNIQUE,

            FOREIGN KEY(user_id) REFERENCES Users(id)
          );

          CREATE TABLE IF NOT EXISTS GoodsCarts (
            goods_code  INTEGER NOT NULL,
            cart_id     INTEGER NOT NULL,
            amount      INTEGER DEFAULT 1,

            FOREIGN KEY(goods_code) REFERENCES Goods(code),
            FOREIGN KEY(cart_id) REFERENCES Carts(id),

            PRIMARY KEY (goods_code, cart_id)
          );

          CREATE TABLE IF NOT EXISTS Orders (
            id                  INTEGER       PRIMARY KEY,
            status              INTEGER       DEFAULT 0,
            destination_address VARCHAR(500)  NOT NULL,
            u_first_name        VARCHAR(100)  NOT NULL,
            u_last_name         VARCHAR(100)  NOT NULL,
            u_phone             VARCHAR(50)   NOT NULL,
            u_email             VARCHAR(255)  NULL,
            user_id             INTEGER       NOT NULL,

            FOREIGN KEY(user_id) REFERENCES Users(id)
          );

          CREATE TABLE IF NOT EXISTS OrdersGoods (
            order_pk  INTEGER   NOT NULL,
            goods_pk  INTEGER   NOT NULL,
            amount    INTEGER   DEFAULT 1,
            total_sum INTEGER   NOT NULL,

            FOREIGN KEY(order_pk) REFERENCES Orders(id),
            FOREIGN KEY(goods_pk) REFERENCES Goods(code),

            PRIMARY KEY (order_pk, goods_pk)
          );
`;
//		this.db.run(query, (err) => {
//			if (err) {
//				console.log(err);
//			}
//		});
	}

	getData(query, params, success, failed) {
		this.db.all(
			query,
			params,
			(err, data) => {
				if (err) {
					console.log(err);
					failed({detail: err});
				} else if (data) {
					success(data);
				} else {
					failed();
				}
			}
		);
	}

	getUser(username, email, success, failed) {
		let query = `SELECT * FROM Users WHERE username = ?`;
		let params = [username];
		if (email) {
			query += ' AND email = ?';
			params.push(email);
		}
		this.db.get(
			query,
			params,
			(err, user) => {
				if (err) {
					console.log(err);
					failed({detail: err});
				} else {
					success(user);
				}
			}
		);
	};

	createUser(username, email, rawPassword, success, failed) {
		let query = this.db.prepare(`INSERT INTO Users (email, username, password) VALUES (?, ?, ?);`);
		let passwordHash = crypto.createHash('sha256').update(rawPassword).digest('base64');
		query.run([email, username, passwordHash], (err) => {
				if (err) {
					failed({detail: err});
				} else {
					success();
				}
			}
		);
	}

	updateUser(item, success, failed) {
		let query = this.db.prepare(`
			UPDATE Users
			  SET username = ?,
			  	  email = ?,
			  	  password = ?,
			      first_name = ?,
			      last_name = ?,
			      address = ?,
			      phone = ?,
			      is_superuser = ?,
			      is_verified = ?
			  WHERE id = ?
		`);
		query.run([
			item.username,
			item.email,
			item.password,
			item.first_name,
			item.last_name,
			item.address,
			item.phone,
			item.is_superuser,
			item.id,
			item.is_verified
		], function(err) {
			if (err) {
				failed({detail: err});
			} else {
				success(this.lastID);
			}
		});
	}

	getAllGoods(cart_pk, sort_by, success, failed) {
		let query = `
			SELECT Goods.code, Goods.title, Goods.price, Goods.description, Goods.image,
			       Promotions.percentage as discount_percentage,
			       GoodsCarts.goods_code IS NOT NULL as is_in_cart
			FROM Goods
			LEFT JOIN Promotions ON Promotions.id = Goods.promotion
			LEFT JOIN GoodsCarts ON GoodsCarts.goods_code = Goods.code AND GoodsCarts.cart_id = ?
		`;
		switch (sort_by) {
			case "price_asc":
				query += `ORDER BY Goods.price;`;
				break;
			case "price_desc":
				query += `ORDER BY Goods.price DESC;`;
				break;
			case "title_asc":
				query += `ORDER BY Goods.title;`;
				break;
			case "title_desc":
				query += `ORDER BY Goods.title DESC;`;
				break;
			default:
				break;
		}
		this.getData(query, [cart_pk], success, failed);
	}

	getGoodsByUserCart(user_pk, success, failed) {
		this.getData(`
            SELECT Goods.code, Goods.title, Goods.price, Goods.description, Goods.image,
                 Promotions.percentage as discount_percentage, GoodsCarts.amount
			FROM Goods
            LEFT JOIN Promotions ON Promotions.id = Goods.promotion
            JOIN GoodsCarts ON GoodsCarts.goods_code = Goods.code
            JOIN Carts ON Carts.id = GoodsCarts.cart_id AND Carts.user_id = ?
		`, [user_pk], success, failed);
	}

	getGoodsWithoutPromotions(success, failed) {
		this.getData(
			`	SELECT * FROM Goods WHERE promotion IS NULL;`,
			[], success, failed
		);
	}

	getGoodsById(id, success, failed) {
		this.db.get(`SELECT * FROM Goods WHERE code = ?`, [id], (err, data) => {
			if (err) {
				failed({detail: err});
			} else {
				success(data);
			}
		});
	}

	joinGoodsAndPromotion(promotion, success, failed) {
		this.getData(
			`
					SELECT Goods.code, Goods.title, Goods.price, Goods.image, Promotions.percentage as discount_price
				  	FROM Goods
					JOIN Promotions ON Promotions.id = Goods.promotion
					WHERE Goods.promotion = ?;
				  `,
			[promotion],
			success,
			failed
		);
	}

	filterGoodsByPromotion(promotion, success, failed) {
		this.getData(
			`
					SELECT *
				  	FROM Goods
					WHERE promotion = ?;
				  `,
			[promotion],
			success,
			failed
		);
	}

	createGoods(title, price, description, image, promotion, success, failed) {
		let query = this.db.prepare(`INSERT INTO Goods (title, price, description, image, promotion) VALUES (?, ?, ?, ?, ?);`);
		query.run([title, price, description, image, promotion], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	updateGoods(goodsItem, success, failed) {
		let query = this.db.prepare(
			`UPDATE Goods SET title = ?, price = ?, description = ?, image = ?, promotion = ? WHERE code = ?;`
		);
		query.run([
				goodsItem.title,
				goodsItem.price,
				goodsItem.description,
				goodsItem.image,
				goodsItem.promotion,
				goodsItem.code
			], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	deleteGoods(code, success, failed) {
		this.db.get(`SELECT code, image FROM Goods WHERE code = ?;`, [code], (err, item) => {
			if (err) {
				failed({detail: err});
			} else {
				fs.unlinkSync(__dirname + '/../' + item.image);
				let query = this.db.prepare(`DELETE FROM Goods WHERE Goods.code = ?`);
				query.run([code], function(err) {
						if (err) {
							failed({detail: err});
						} else {
							success(this.lastID);
						}
					}
				);
			}
		});
	}

	getPromotions(success, failed) {
		this.getData(`SELECT id, percentage, comment FROM Promotions;`, [], success, failed);
	}

	createPromotion(percentage, comment, success, failed) {
		let query = this.db.prepare(`INSERT INTO Promotions (percentage, comment) VALUES (?, ?);`);
		query.run([percentage, comment], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	getPromotionById(id, success, failed) {
		this.db.get(`SELECT * FROM Promotions WHERE id = ?`, [id], (err, data) => {
			if (err) {
				failed({detail: err});
			} else {
				success(data);
			}
		});
	}

	updatePromotion(item, success, failed) {
		let query = this.db.prepare(
			`UPDATE Promotions SET percentage = ?, comment = ? WHERE id = ?;`
		);
		query.run([
				item.percentage,
				item.comment,
				item.id
			], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	deletePromotion(id, success, failed) {
		let query = this.db.prepare(`DELETE FROM Promotions WHERE id = ?`);
		query.run([id], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	getCart(user_pk, success, failed) {
		this.db.get(`SELECT * FROM Carts WHERE user_id = ?`, [user_pk], (err, data) => {
			if (err) {
				failed({detail: err});
			} else {
				success(data);
			}
		});
	}

	createCart(user_pk, success, failed) {
		let query = this.db.prepare(`INSERT INTO Carts (user_id) VALUES (?);`);
		query.run([user_pk], function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success(this.lastID);
				}
			}
		);
	}

	addGoodsToCart(cart_pk, goods_pk, amount, success, failed) {
		this.db.get(
			`SELECT * FROM GoodsCarts WHERE cart_id = ? AND goods_code = ?;`, [cart_pk, goods_pk],
			(err, data) => {
				if (err) {
					failed({detail: err});
				} else if (data) {
					let query = this.db.prepare(
						`UPDATE GoodsCarts SET amount = ? WHERE cart_id = ? AND goods_code = ?;`
					);
					query.run(
						[data.amount + amount, cart_pk, goods_pk],
						function(err) {
							if (err) {
								failed(err);
							} else {
								success(this.lastID, data.amount + amount);
							}
						}
					);
				} else {
					let query = this.db.prepare(`INSERT INTO GoodsCarts (goods_code, cart_id, amount) VALUES (?, ?, ?);`);
					query.run([goods_pk, cart_pk, amount], function(err) {
							if (err) {
								failed(err);
							} else {
								success(this.lastID, amount);
							}
						}
					);
				}
			}
		);
	}

	removeGoodsFromCart(cart_pk, goods_pk, amount, success, failed) {
		this.db.get(
			`SELECT * FROM GoodsCarts WHERE cart_id = ? AND goods_code = ?;`, [cart_pk, goods_pk],
			(err, data) => {
				if (err) {
					failed({detail: err});
				} else if (data) {
					if (data.amount - amount < 1) {
						let query = this.db.prepare(`DELETE FROM GoodsCarts WHERE cart_id = ? AND goods_code = ?;`);
						query.run([cart_pk, goods_pk], function(err) {
							if (err) {
								failed(err);
							} else {
								success(this.lastID, 0);
							}
						});
					} else {
						let query = this.db.prepare(
							`UPDATE GoodsCarts SET amount = ? WHERE cart_id = ? AND goods_code = ?;`
						);
						query.run(
							[data.amount - amount, cart_pk, goods_pk],
							function(err) {
								if (err) {
									failed(err);
								} else {
									success(this.lastID, data.amount - amount);
								}
							}
						);
					}
				} else {
					success({detail: 'goods not found in cart'});
				}
			}
		);
	}

	deleteGoodsFromCart(goods_pk, success, failed) {
		let query = this.db.prepare(`
				DELETE FROM GoodsCarts WHERE GoodsCarts.goods_code = ?;
		`);
		query.run([goods_pk], (err) => {
			if (err) {
				failed({detail: err});
			} else {
				success();
			}
		});
	}

	deleteCartData(cart_pk, success, failed) {
		let query = this.db.prepare(`
			  DELETE FROM GoodsCarts
			    WHERE GoodsCarts.cart_id = ${cart_pk};
			  DELETE FROM Carts
			    WHERE Carts.id = ${cart_pk};
		`);
		query.run([], (err) => {
			if (err) {
				failed({detail: err});
			} else {
				success();
			}
		});
	}

	setOrderStatus(order_pk, newStatus, success, failed) {
		this.db.prepare(`
			UPDATE Orders
			  SET status = ${newStatus}
			WHERE Orders.id = ${order_pk};
		`).run((err) => {
			if (err) {
				failed({detail: err});
			} else {
				success();
			}
		});
	}

	countGoodsAmountInUserCart(user_pk, success, failed) {
		this.db.get(`
			SELECT Count(GoodsCarts.amount) as goods_amount
			FROM Carts
			JOIN GoodsCarts ON GoodsCarts.cart_id = Carts.id
				AND Carts.user_id = ?;
		`, [user_pk], (err, data) => {
			if (err) {
				failed({detail: err});
			} else {
				let res = 0;
				if (data.goods_amount) {
					res = data.goods_amount;
				}
				success(res);
			}
		});
	}

	getOrders(user_pk, success, failed) {
		this.getData(`
			SELECT * FROM Orders
			WHERE user_id = ?;
		`, [user_pk], success, failed);
	}

	getAllOrders(success, failed) {
		this.getData(`
			SELECT * FROM Orders;
		`, [], success, failed);
	}

	getOrder(order_id, success, failed) {
		this.db.get(`
			SELECT * FROM Orders WHERE id = ?;
		`, [order_id], (err, data) => {
			if (err) {
				failed({detail: err});
			} else {
				success(data);
			}
		});
	}

	getOrderedGoods(order_pk, success, failed) {
		this.getData(`
			SELECT OrdersGoods.goods_pk as id, OrdersGoods.amount, OrdersGoods.total_sum, Goods.title
			FROM OrdersGoods
			JOIN Goods ON Goods.code = OrdersGoods.goods_pk
			WHERE order_pk = ?;
		`, [order_pk], success, failed);
	}

	createOrder(data, success, failed) {
		let insertGoods = (query, params) => {
			this.db.prepare(query).run(params, function(err) {
				if (err) {
					failed({detail: err});
				} else {
					success();
				}
			});
		};
		this.db.prepare(`
			INSERT INTO Orders (destination_address, u_first_name, u_last_name, u_phone, u_email, user_id)
			  VALUES (?, ?, ?, ?, ?, ?);
		`).run(
			[data.address, data.first_name, data.last_name, data.phone, data.email, data.user_pk],
			function (err) {
				if (err) {
					failed({detail: err});
				} else {
					let query = `INSERT INTO OrdersGoods(order_pk, goods_pk, amount, total_sum)\nVALUES\n`;
					let params = [];
					for (let i = 0; i < data.goods.length; i++) {
						query += `\n  (?, ?, ?, ?)`;
						if (data.goods.length - 1 !== i) {
							query += ','
						}
						let item = data.goods[i];
						params = params.concat([this.lastID, item.code, item.amount]);
						if (item.discount_percentage) {
							params.push((item.price - item.price * item.discount_percentage / 100) * item.amount);
						} else {
							params.push(item.price * item.amount);
						}
					}
					query += ';';
					insertGoods(query, params);
				}
			}
		);
	}
}

module.exports = {
	Db: Db
};
