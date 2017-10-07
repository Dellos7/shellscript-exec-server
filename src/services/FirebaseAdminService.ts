import * as url from 'url';
import * as firebase from 'firebase-admin';
import { Router, Request, Response, NextFunction } from 'express';

export class FirebaseAdminService {

    public static DATABASE_URL: string = "https://shellserver-f7a92.firebaseio.com";
    private static SHELL_SERVER_FB_AUTH_JSON: string = "../../ShellServer-a8e07efe4776.json";

    static initializeFirebase() {
        let serviceAccount = require( this.SHELL_SERVER_FB_AUTH_JSON );
        firebase.initializeApp({
            credential: firebase.credential.cert(serviceAccount),
            databaseURL: this.DATABASE_URL
        });
    }

    static isAuthenticated( req: Request, res: Response, next: NextFunction ) {

        const location = url.parse(req.url, true);
        //El token de firebase
        var token = location.query.token;
        //El id de usuario de firebase
        var uid = location.query.uid;

        //Comprobamos que el token sea correcto y que el uid que da como resultado
        //coincide con el uid que enviamos también por parámetro
        FirebaseAdminService.verifyFbToken( token, function( good, data ) {
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
    }

    static verifyFbToken (token, callback) {
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


}