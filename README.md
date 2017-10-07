## Servidor backend para ejecutar comandos shellscript ##

 1. Servidor backend Node.js con Express.js
 2. Programamos el código en TypeScript (archivos .ts) situados en la carpeta **src**.
 3. El código TypeScript compila en código JavaScript, el cuál se sitúa en la carpeta **dist**
 4. Utilizamos Gulp para compilar automáticamente los cambios en ficheros TypeScript y Nodemon para que el servidor se reinicie cada vez que se realizan cambios.

**Al descargar el proyecto:**

    npm install --save

**Ejecutar server escuchando cambios de archivos .ts**

    gulp nodemon
    
**Ejecutar server en background:**

    forever start dist/index.js
**Parar ejecución de server en background**

    forever stop dist/index.js

   **NOTA**: instalar forever de forma global si no lo tenemos instalado:
  
    npm install forever -g