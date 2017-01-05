import * as express from 'express';
var app = express();
console.log(__dirname);

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.get('/', function (request, response) {
  const scriptTag = process.env.NODE_ENV == 'development' ? 
    `<script src="http://localhost:8080/bundle.js"></script>` :
    `<script src="./bundle.js"></script>`;
  response.end(
    `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <title>Fefu-cluster</title>
      </head>
      <body>
          <div id="app-root"></div>
          ${scriptTag}
      </body>
    </html>`
  );
});

// views is directory for all template files
//app.set('views', __dirname + '/views');
//app.set('view engine', 'ejs');

//app.get('/', function(request, response) {
//  response.render('pages/index');
//});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


