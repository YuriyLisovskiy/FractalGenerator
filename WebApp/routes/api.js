let express = require('express');
let router = express.Router();

let AuthViews = require('../handlers/auth');
let AdministrationViews = require('../handlers/administration');

router.get('/administration/tasks', AdministrationViews.AdministrationTasks);
router.get('/administration/task', AdministrationViews.AdministrationTask);

router.post('/login', AuthViews.Login);
router.post('/token/verify', AuthViews.VerifyToken);

module.exports = router;
