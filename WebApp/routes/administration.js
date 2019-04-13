let express = require('express');
let router = express.Router();

let AdministrationViews = require('../handlers/administration');

router.get('/', AdministrationViews.Administration);

router.post('', AdministrationViews.Administration);

module.exports = router;
