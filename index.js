/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	var express = __webpack_require__(1);
	var app = express();
	console.log(__dirname);
	app.set('port', (process.env.PORT || 5000));
	app.use(express.static(__dirname + '/public'));
	app.get('/', function (request, response) {
	    var scriptTag = process.env.NODE_ENV == 'development' ?
	        "<script src=\"http://localhost:8080/bundle.js\"></script>" :
	        "<script src=\"./public/bundle.js\"></script>";
	    response.end("<!DOCTYPE html>\n      <html lang=\"en\">\n      <head>\n          <meta charset=\"UTF-8\">\n          <title>Fefu-cluster</title>\n      </head>\n      <body>\n          <div id=\"app-root\"></div>\n          " + scriptTag + "\n      </body>\n    </html>");
	});
	// views is directory for all template files
	//app.set('views', __dirname + '/views');
	//app.set('view engine', 'ejs');
	//app.get('/', function(request, response) {
	//  response.render('pages/index');
	//});
	app.listen(app.get('port'), function () {
	    console.log('Node app is running on port', app.get('port'));
	});


/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("express");

/***/ }
/******/ ]);
//# sourceMappingURL=index.js.map