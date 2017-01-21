/* Magic Mirror
 * Server
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

var express = require("express");
var app = require("express")();
var server = require("http").Server(app);
var io = require("socket.io")(server);
var path = require("path");
var ipfilter = require("express-ipfilter").IpFilter;
var fs = require("fs");
var helmet = require("helmet");
var azure = require('azure');

var Server = function(config, callback) {
	console.log("Starting server op port " + config.port + " ... ");

	server.listen(config.port, config.address ? config.address : null);

	app.use(function(req, res, next) {
		var result = ipfilter(config.ipWhitelist, {mode: "allow", log: false})(req, res, function(err) {
			if (err === undefined) {
				return next();
			}
			console.log(err.message);
			res.status(403).send("This device is not allowed to access your mirror. <br> Please check your config.js or config.js.sample to change this.");
		});
	});
	app.use(helmet());

	app.use("/js", express.static(__dirname));
	app.use("/config", express.static(path.resolve(global.root_path + "/config")));
	app.use("/css", express.static(path.resolve(global.root_path + "/css")));
	app.use("/fonts", express.static(path.resolve(global.root_path + "/fonts")));
	app.use("/modules", express.static(path.resolve(global.root_path + "/modules")));
	app.use("/vendor", express.static(path.resolve(global.root_path + "/vendor")));
	app.use("/translations", express.static(path.resolve(global.root_path + "/translations")));

	app.get("/version", function(req,res) {
		res.send(global.version);
	});

	app.get("/", function(req, res) {
		var html = fs.readFileSync(path.resolve(global.root_path + "/index.html"), {encoding: "utf8"});
		html = html.replace("#VERSION#", global.version);

		res.send(html);
	});

	if (typeof callback === "function") {
		callback(app, io);
	}
	
	debugger;
	console.log("creating service bus");
	//process.env.AZURE_SERVICEBUS_NAMESPACE = config.sbNamespace;
	//process.env.AZURE_SERVICEBUS_ACCESS_KEY = config.sbKey;

	var serviceBusService = azure.createServiceBusService(config.sbConnectionString);
	console.log("created service bus");
	serviceBusService.createSubscription('t.sophie.messages.greetingevent', 'AllMessages', function (error) {
		console.log("created subscription");
		if (error) {
			console.log(error);
		}
		setInterval(function() {
				serviceBusService.receiveSubscriptionMessage('t.sophie.messages.greetingevent', 'AllMessages', function (error, receivedMessage) {
					if (!error) {
						// Message received and deleted
						console.log(receivedMessage);
					} else {
						console.log(error);
					}
				});
			}, 3000);
	});
};

module.exports = Server;
