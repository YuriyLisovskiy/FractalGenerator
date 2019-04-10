let express = require('express');
let router = express.Router();

let IndexView = require('../handlers');
let GoodsView = require('../handlers/goods');
let AuthViews = require('../handlers/auth');
let AdministrationViews = require('../handlers/administration');
let ProfileViews = require('../handlers/profile');
let CartViews = require('../handlers/cart');
let OrderViews = require('../handlers/orders');

router.get('/', IndexView.Index);
router.get('/logout', AuthViews.Logout);
router.get('/profile', ProfileViews.Profile);
router.get('/administration', AdministrationViews.Administration);
router.get('/administration/goods/((\\d+))/edit', AdministrationViews.EditGoods);
router.get('/administration/promotions/((\\d+))/edit', AdministrationViews.EditPromotion);
router.get('/user/verify/(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+))', AuthViews.VerifyUser);

router.post('/register', AuthViews.Register);
router.post('/administration', AdministrationViews.Administration);
router.post('/administration/goods/((\\d+))/edit', AdministrationViews.EditGoods);
router.post('/administration/promotions/((\\d+))/edit', AdministrationViews.EditPromotion);


router.get('/api/promotions', AdministrationViews.Promotions);
router.get('/api/goods', GoodsView.Goods);
router.get('/api/promotion/goods', AdministrationViews.PromotionGoods);
router.get('/api/user/orders', OrderViews.GetOrders);
router.get('/api/orders/goods', OrderViews.GetOrderedGoods);
router.get('/api/orders/all', AdministrationViews.Orders);

router.post('/api/login', AuthViews.Login);
router.post('/profile', ProfileViews.Profile);
router.post('/orders/create', OrderViews.CreateOrder);
router.post('/api/token/verify', AuthViews.VerifyToken);
router.post('/api/promotions', AdministrationViews.Promotions);
router.post('/api/cart/goods/add', CartViews.GoodsAdd);
router.post('/api/cart/goods/remove', CartViews.GoodsRemove);

router.put('/api/promotion/goods', AdministrationViews.PromotionGoods);
router.put('/api/orders/all', AdministrationViews.Orders);

router.delete('/api/goods', GoodsView.Goods);
router.delete('/api/promotions', AdministrationViews.Promotions);

module.exports = router;
