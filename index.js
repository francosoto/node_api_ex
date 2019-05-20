const express = require('express');
const mongo = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

var app = express();
var url = 'mongodb://localhost:27017/test';
app.use(bodyParser.raw());
app.use(bodyParser.json());

const myFormat = printf(({ level, message, timestamp }) => {
	console.log(level, message, timestamp)
	return timestamp  + ' [' + level + '] | ' + message;
});

const logger = createLogger({
	format: combine(
		timestamp(),
		myFormat
	),
	transports: [
		new transports.Console(),
		new transports.File({ filename: 'example.log' })
	]
});

app.use((req, res, next) => {
	logger.log({
		level: 'info',
		message: 'Request: ' + req.method + ' ' + req.url
	});
	next()
});

// Creo un único indice... para evitar repetidos
mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
	client
		.db('test')
		.collection('users')
		.createIndex( { "username": 1 }, { unique: true }, (err, result) => {
			if (err) {
				logger.log({
					level: 'error',
					message: 'No se pudo crear el índice único...'
				});
			}
		})
})

app.route('/users')
	.get((req, res, next) => {
		if ( !req.query.username ) {
			next({ message: 'Parámetros incorrectos', statusCode: 403})
			return;
		} 

		mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
			if (err) {
				next({ message: 'Error al conectar a la BD' });
				return;
			}

			client
				.db('test')
				.collection('users')
				.findOne({ username: req.query.username, enabled: 1}, (err, result) => {
					if (err) {
						next({ message: 'Error al obtener datos' });
						return;
					}

					client.close();

					res.json({ 
						username: result.username,
						password: result.password,
						email: result.email
					});

					return;
				})
		});
	})
	.post((req, res, next) => {
		if (req.body.username && req.body.password && req.body.email) {
			mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
				if (err) {
					next({ message: 'Error al conectar a la BD' });
					return;
				}

				client
					.db('test')
					.collection('users')
					.insertOne({
						username: req.body.username,
						password: req.body.password,
						email: req.body.email,
						enabled: 1
					}, (err, item) => {
						client.close();
						if (err) {
							next({message: 'Error al insertar un nuevo usuario'});
							return;
						}

						res.status(201).json({ message: 'Éxito!'});
						return;
					});
			});
		} else {
			next({ message: 'Parámetros incorrectos', statusCode: 403})
			return;
		}
	})
	.put((req, res, next) => {
		if ( !req.query.username ) {
			next({ message: 'Parámetros incorrectos', statusCode: 403})
			return;
		}

		mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
			if (err) {
				next('Error al conectar a la BD');
				return;
			}
			client
				.db('test')
				.collection('users')
				.updateOne({username: req.query.username}, { $set: {enabled: 1 } }, (err, result) => {
					client.close();
					if (err) {
						next({message: "Error al actualizar"});
						return;
					}

					if (result) {
						res.json({ message: 'Usuario habilitado!'})
						return;
					}
				});
		});
	})
	.delete((req, res, next) => {
		if ( !req.query.username ) {
			next({ message: 'Parámetros incorrectos', statusCode: 403})
			return;
		}

		mongo.connect(url, { useNewUrlParser: true }, (err, client) => {
			if (err) {
				next('Error al conectar a la BD');
				return;
			}
			client
				.db('test')
				.collection('users')
				.updateOne({username: req.query.username}, { $set: {enabled: 0 } }, (err, result) => {
					client.close();
					if (err) {
						next({message: "Error al actualizar"});
						return;
					}

					if (result) {
						res.json({ message: 'Usuario deshabilitado!'})
						return;
					}
				});
		});
	})

app.use((err, req, res, next) => {
	if (!err.statusCode) err.statusCode = 500;
	logger.log({
		level: 'error',
		message: req.method + ' ' + req.url + ' : ' + err.message
	});
	let message = {}
	message.message = err.message
	res.status(err.statusCode)
	res.json({ message });
  	return;
});


app.listen(3001, () => {
  console.log('Listening on port 3001!');
});