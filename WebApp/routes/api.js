let express = require('express');
let router = express.Router();

let AuthViews = require('../handlers/auth');
let AdministrationViews = require('../handlers/administration');
let ProfileViews = require('../handlers/profile');

router.get('/administration/tasks', AdministrationViews.AdministrationTasks);
router.get('/administration/task', AdministrationViews.AdministrationTask);
router.get('/user/tasks', ProfileViews.UserTasks);
router.get('/user/task', ProfileViews.UserTask);

router.post('/login', AuthViews.Login);
router.post('/token/verify', AuthViews.VerifyToken);
router.post('/administration/task', AdministrationViews.AdministrationTask);
router.post('/user/task', ProfileViews.UserTask);

router.put('/administration/task', AdministrationViews.AdministrationTask);
router.put('/user/task', ProfileViews.UserTask);

router.delete('/administration/task', AdministrationViews.AdministrationTask);
router.delete('/user/task', ProfileViews.UserTask);

module.exports = router;
