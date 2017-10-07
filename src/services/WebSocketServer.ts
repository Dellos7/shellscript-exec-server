import * as WebSocket from 'ws';
import * as url from 'url';

export class WebSocketServer {

    static webSocketClients = {};
    static wss;
    wss;

    static initializeWsServer( server ) {
        if( !WebSocketServer.wss ) {
            WebSocketServer.wss = new WebSocket.Server({ server });
        }
    }

    static initializeWsListeners() {
        //Listener que escucha cuando se conecta un cliente al websocket
        WebSocketServer.wss.on('connection', function connection(ws, req) {
            const location = url.parse(req.url, true);

            //let uid = location.path.substr(1);
            let uid = location.query.uid;
            if( uid ) {
                WebSocketServer.webSocketClients[uid] = ws; //Guardamos en un objeto el websocket y el cliente para poder enviarle mensajes más adelante
                console.log('connected: ' + uid + ' in ' + Object.getOwnPropertyNames(WebSocketServer.webSocketClients));

                // You might use location.query.access_token to authenticate or share sessions
                // or req.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
                
                ws.on('message', function incoming(message) {
                    console.log('received: %s', message);
                    ws.send('I have successfully received: ' + message);
                });

                ws.send('you are connected to the ws');
            }
            else {
                ws.send('you are NOT connected to the ws server: an uid needs to be provided');
                console.log( 'client NOT connected to the ws server: an uid needs to be provided' )
            }
        });        
    }

}