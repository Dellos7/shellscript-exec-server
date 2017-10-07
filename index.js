var express = require('express');
var app = express();
var shell = require('shelljs');
var firebase = require('firebase-admin');

const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const server = http.createServer(app);

//Inicializar y autenticarse en la app de firebase
var serviceAccount = require("./ShellServer-a8e07efe4776.json");
firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://shellserver-f7a92.firebaseio.com"
});

//Obtener una referencia a la base de datos de firebase
const db = firebase.database();
var ref = db.ref();

//Creamos un websocket ecuchando en la misma dirección que el servidor web
// (ws://localhost:3000)
const wss = new WebSocket.Server({ server });

//En este objeto almacenamos todos los clientes que se van conectando al socket para poder enviarles
//en un futuro mensajes
var webSockets = {};

//Función middleware para comprobar que el token enviado es correcto y que el uid
//coincide con el uid que devuelve la comprobación del token de firebase
//TODO: poner los parametros recogidos por URL como cabeceras
var isAuthenticated = function(req, res, next) {

    const location = url.parse(req.url, true);
    //El token de firebase
    var token = location.query.token;
    //El id de usuario de firebase
    var uid = location.query.uid;

    //Comprobamos que el token sea correcto y que el uid que da como resultado
    //coincide con el uid que enviamos también por parámetro
    verifyFbToken( token, function( good, data ) {
        if( good ) {
            if( !uid ) {
                res.status(403).send('Param uid: missing');
            }
            else if( data.uid && data.uid === uid ) { //Llamamox a next() para que se ejecute el end point que toque
                return next();
            }
            else {
                res.status(403).send('Something went wrong');
            }
        }
        else {
            res.status(403).send('Bad token');
        }
    });
};

app.get('/', function (req, res) {
    res.send( 'Hello World!' );
});

//End point sencillo que comprueba la versión de node ejecutando un comando de shell
app.get('/node-version', isAuthenticated, function (req, res) {

    const location = url.parse(req.url, true);
    var uid = location.query.uid;

    var version = shell.exec('node --version', {silent:true, async: true});
    version.stdout.on( 'data', 
        (data) => {
            //Si el websocket de este usuario está disponible, le avisamos con un mensaje
            if( webSockets[uid] ) {
                webSockets[uid].send( data );
            }
            res.json({
                'node-version': data
            });
        }
    );
});

//TODO: refactorizar para que quede parecida a la de node-version
app.get('/backup', function (req, res) {
    const location = url.parse(req.url, true);
    var token = location.query.token;
    var uid = location.query.uid;

    verifyFbToken( token, function( good, data ) {
        if( good && data.uid === uid ) {

            var sugarBackup = shell.exec( 'sudo /Applications/MAMP/htdocs/backups-server/sugarBackup.sh', { silent: true, async: true } );
            sugarBackup.stdout.on( 'data', 
                (data) => {
                    console.log(data);
                    //res.send( data );
                    //res.write( data );
                    if( webSockets[uid] ) {
                        webSockets[uid].send( data );
                    }
                });
        }
        else {
            
        }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    res.json({
        'token': token
    });
});

//Guardar datos de ejemplo en la bbdd de firebase
app.get( '/save-sample-data', function(req, res) {
    var testRef = ref.child('tests');
    var data = {
        test1: {
            name: 'test1'
        },
        test2: {
            name: 'test2'
        }
    };
    testRef.set( data );
    res.send( data );
});

//TEst para comprobar que el token de fb es correcto
app.get( '/identify-token', function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    const location = url.parse(req.url, true);
    var idToken = location.query.token;
    verifyFbToken( idToken, function( good, data ){ 
        if( good ) {
            res.json(data);
        }
        else {
            res.status(403).send('Bad token');
        }
    });
});

//FUnción que comprueba en firebase que el token recibido sea correcto
var verifyFbToken = function(token, callback) {
    if( token ) { 
        firebase.auth().verifyIdToken(token)
            .then(function(decodedToken) {
                var uid = decodedToken.uid;
                var data = {
                    'uid': uid
                };
                callback(true, data);
            }).catch(function(error) {
                callback(false, error);
        });
    }
    else {
        callback(false);
    }
};

//Listener que escucha cuando se conecta un cliente al websocket
wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  //console.log(req);
  console.log(location);
  var uid = location.path.substr(1);
  webSockets[uid] = ws; //Guardamos en un objeto el websocket y el cliente para poder enviarle mensajes más adelante
  console.log('connected: ' + uid + ' in ' + Object.getOwnPropertyNames(webSockets));

  // You might use location.query.access_token to authenticate or share sessions
  // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send('I have successfully received: ' + message);
  });

  ws.send('you are connected to the ws');
});

server.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});