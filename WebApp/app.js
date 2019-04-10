let express = require('express');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let fs = require('fs');

let router = require('./routes/index');

let port = process.env.PORT || 3000;

let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.set('view engine', 'jade');

app.use('/static', express.static('static'));
app.use('/media', express.static('media'));

app.use('/', router);

app.use(function(req, res){
	res.status(404);
	if (req.accepts('json')) {
		res.send({ error: 'Not found' });
		return;
	}
	res.type('txt').send('Not found');
});

fs.existsSync('./media') || fs.mkdirSync('./media');

app.listen(port);
