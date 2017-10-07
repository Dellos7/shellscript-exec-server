import { Router, Request, Response, NextFunction } from 'express';
import * as url from 'url';
import * as shell from 'shelljs';

import { FirebaseAdminService } from './../services/FirebaseAdminService';

import { WebSocketServer } from './../services/WebSocketServer';

export class ShellExecAPIRouter {

    public router: Router;

    private acceptedCommands= [];

    constructor() {
        this.router = Router();
        this.acceptedCommands = [
            'ls',
            'll',
            'node --version',
            'sudo /Applications/MAMP/htdocs/backups-server/sugarBackup.sh'
        ];
    }

    /**
    * Take each handler, and attach to one of the Express.Router's
    * endpoints.
    */
    init() {
        this.router.get( '/', this.shellExec );
        //this.router.get( '/', FirebaseAdminService.isAuthenticated, this.shellExec );
    }

    public shellExec = ( req: Request, res: Response, next: NextFunction ) => {
        const location = url.parse(req.url, true);
        let uid = location.query.uid;
        
        let command = location.query.command;

        if( !command ) {
            res.status(500).json({
                'error': 'No command provided'
            });
        }

        if( this.acceptedCommands.indexOf(command) < 0 ) {
            res.status(500).json({
                'error': 'Command not accepted'
            });
        }

        res.setHeader('Access-Control-Allow-Origin', '*');

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

        let shellExecRes = shell.exec( command, {silent:true, async: true});
        shellExecRes.stdout.on( 'data', 
            (data) => {
                //Si el websocket de este usuario está disponible, le avisamos con un mensaje
                if( WebSocketServer.webSocketClients[uid] ) {
                    try {
                        WebSocketServer.webSocketClients[uid].send( data );
                    }
                    catch(e) {
                        console.log(e);
                    }
                }
                try {
                    res.json({
                        'res': data
                    });
                }
                catch(e) {
                    console.log(e);
                }
            }
        );

    }

}

const shellExecAPIRouter = new ShellExecAPIRouter();
shellExecAPIRouter.init();

export default shellExecAPIRouter;