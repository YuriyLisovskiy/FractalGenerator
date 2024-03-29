let express = require('express');
let router = express.Router();

let IndexView = require('../handlers');
let AuthViews = require('../handlers/auth');
let ProfileViews = require('../handlers/profile');

router.get('/', IndexView.Index);
router.get('/logout', AuthViews.Logout);
router.get('/profile', ProfileViews.Profile);
router.get('/user/verify/(([A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+))', AuthViews.VerifyUser);
router.get('/user/fractals', ProfileViews.UserFractals);
router.get('/user/create/fractal', ProfileViews.CreateTask);

router.post('/register', AuthViews.Register);
router.post('/user/create/fractal', ProfileViews.CreateTask);

module.exports = router;
