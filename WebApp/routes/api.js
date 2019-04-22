let express = require('express');
let router = express.Router();

let AuthViews = require('../handlers/auth');
let ProfileViews = require('../handlers/profile');
let AdministrationViews = require('../handlers/administration');
let RemoteServer = require('../handlers/remote');

router.get('/user/task', ProfileViews.UserTask);
router.get('/user/tasks', ProfileViews.UserTasks);
router.get('/administration/task', AdministrationViews.AdministrationTask);
router.get('/administration/tasks', AdministrationViews.AdministrationTasks);

router.post('/login', AuthViews.Login);
router.post('/user/task', ProfileViews.UserTask);
router.post('/profile/edit', ProfileViews.Profile);
router.post('/token/verify', AuthViews.VerifyToken);
router.post('/administration/task', AdministrationViews.AdministrationTask);
router.post('/remote/server/load/picture', RemoteServer.UploadFractal);

router.put('/user/task', ProfileViews.UserTask);
router.put('/user/fractals', ProfileViews.UserFractals);
router.put('/administration/task', AdministrationViews.AdministrationTask);

router.delete('/user/task', ProfileViews.UserTask);
router.delete('/administration/task', AdministrationViews.AdministrationTask);

module.exports = router;
