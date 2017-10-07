"use strict";

import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import * as firebase from 'firebase-admin';

import * as ShellExecAPIRouter from './routes/ShellExecAPIRouter';

import { FirebaseAdminService } from './services/FirebaseAdminService';

/**
 * Clase que permite definir todos los endpoints
 */
class App {

    //referencia a instancia de Express
    public express: express.Application;

    constructor() {
        this.express = express();
        //this.configureAuthMiddleware(); //Set up authentication for the whole app
        this.middleware();
        this.initFirebase();
        this.routes();
    }

    private middleware(): void { //Configuración general de express
        this.express.use( logger('dev') );
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: true }));
    }

    private initFirebase() {
        FirebaseAdminService.initializeFirebase();
    }

    private configureAuthMiddleware(){
        this.express.use( this.authMiddleware );
    }

    private authMiddleware = ( req: express.Request, res: express.Response, next: express.NextFunction) => {
        FirebaseAdminService.isAuthenticated( req, res, next );
    }

    // Configure API endpoints.
    private routes(): void {
        /* This is just to get up and running, and to make sure what we've got is
        * working so far. This function will change when we start to add more
        * API endpoints */
        let router = express.Router();

        //Uncomment this.authMiddleware in order to set up authentication
        router.get('/', /*this.authMiddleware,*/ (req, res, next) => {
            res.json({
                message: 'Hello World!'
            });
        });

        this.express.use( '/', router);
        this.express.use( '/hello', router);
        this.express.use( '/api/v1/shell-exec', ShellExecAPIRouter.default.router );
    }

}

export default new App().express;