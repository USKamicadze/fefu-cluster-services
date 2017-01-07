import { ClusterConnection } from './server/ClusterConnection';
import * as express from 'express';
import {Server as WebSocketServer} from 'ws';
import clusterServices from './common/services';
import fallback from 'express-history-spa-fallback';
var app = express();
console.log(__dirname);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));
app.use(fallback(function (request:any, response:any) {
  const scriptTag = process.env.NODE_ENV == 'development' ? 
    `<script src="http://localhost:8080/bundle.js"></script>` :
    `<script src="./bundle.js"></script>`;
  const enableDevTools = process.env.NODE_ENV == 'development' ? 
    `<script>var $DevelopmentMode = true;</script>` : undefined;
  response.end(
    `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Fefu-cluster</title>
      </head>
      <body>
          <div id="app-root"></div>
          ${enableDevTools}
          ${scriptTag}
      </body>
    </html>`
  );
}));


// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

//app.get('/', function(request, response) {
//  response.render('pages/index');
//});

const httpServer = app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
const services :{[idx: string]: any} = {};
clusterServices.map((service) => {
  services[service.name] = new service.Caller(service.name);
});
const wss = new WebSocketServer({server : httpServer});
const connections : ClusterConnection[] = [];
wss.on('connection', function connection(ws) {
  connections.push(new ClusterConnection(ws, services));
  //var location = url.parse(ws.upgradeReq.url, true);
  // you might use location.query.access_token to authenticate or share sessions
  // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)

 // ws.on('message', function incoming(message) {
 //   console.log('received: %s', message);
 // });

 // ws.send('something');
});



