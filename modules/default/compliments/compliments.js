/* global Log, Module, moment */

/* Magic Mirror
 * Module: Compliments
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 */

Module.register("compliments",{

	// Module config defaults.
	defaults: {
		compliments: {
			morning: [
				"Good morning, handsome!",
				"Enjoy your day!",
				"How was your sleep?"
			],
			afternoon: [
				"Hello, beauty!",
				"You look sexy!",
				"Looking good today!"
			],
			evening: [
				"Wow, you look hot!",
				"You look nice!",
				"Hi, sexy!"
			]
		},
		updateInterval: 30000,
		remoteFile: null,
		fadeSpeed: 4000
	},

	// Set currentweather from module
	currentWeatherType: "",

	// Define required scripts.
	getScripts: function() {
		return ["moment.js"];
	},

	// Define start sequence.
	start: function() {
		debugger;
		Log.info("Starting module: " + this.name);

		this.lastComplimentIndex = -1;

		if (this.config.remoteFile != null) {
			this.complimentFile((response) => {
				this.config.compliments = JSON.parse(response);
			});
		}

		// Schedule update timer.
		var self = this;
		setInterval(function() {
			self.updateDom(self.config.fadeSpeed);
		}, this.config.updateInterval);

		// console.log("require azure completed");
		// var azure = require('azure');
		// console.log(azure);
		
		// console.log("creating service bus");
		// var serviceBusService = azure.createServiceBusService();
		// console.log("created service bus");
		// serviceBusService.createSubscription('t.sophie.messages.greetingevent', 'AllMessages', function (error) {
		//     console.log("created subscription");
		// 	if (!error) {
		//         serviceBusService.receiveSubscriptionMessage('t.sophie.messages.greetingevent', 'AllMessages', function (error, receivedMessage) {
		//             if (!error) {
		//                 // Message received and deleted
		//                 console.log(receivedMessage);
		//             }
		//         });
		//     }
		// });
	},

	/* randomIndex(compliments)
	 * Generate a random index for a list of compliments.
	 *
	 * argument compliments Array<String> - Array with compliments.
	 *
	 * return Number - Random index.
	 */
	randomIndex: function(compliments) {
		if (compliments.length === 1) {
			return 0;
		}

		var generate = function() {
			return Math.floor(Math.random() * compliments.length);
		};

		var complimentIndex = generate();

		while (complimentIndex === this.lastComplimentIndex) {
			complimentIndex = generate();
		}

		this.lastComplimentIndex = complimentIndex;

		return complimentIndex;
	},

	/* complimentArray()
	 * Retrieve an array of compliments for the time of the day.
	 *
	 * return compliments Array<String> - Array with compliments for the time of the day.
	 */
	complimentArray: function() {
		var hour = moment().hour();
		var compliments  = null;

		if (hour >= 3 && hour < 12) {
			compliments = this.config.compliments.morning;
		} else if (hour >= 12 && hour < 17) {
			compliments = this.config.compliments.afternoon;
		} else {
			compliments = this.config.compliments.evening;
		}

		if ( this.currentWeatherType in this.config.compliments) {
			compliments.push.apply(compliments, this.config.compliments[this.currentWeatherType]);
		}
		return compliments;

	},

	/* complimentFile(callback)
	 * Retrieve a file from the local filesystem
	 */
	complimentFile: function(callback) {
		var xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open("GET", this.file(this.config.remoteFile), true);
		xobj.onreadystatechange = function () {
			if (xobj.readyState == 4 && xobj.status == "200") {
				callback(xobj.responseText);
			}
		};
		xobj.send(null);
	},

	/* complimentArray()
	 * Retrieve a random compliment.
	 *
	 * return compliment string - A compliment.
	 */
	randomCompliment: function() {
		var compliments = this.complimentArray();
		var index = this.randomIndex(compliments);

		return compliments[index];
	},

	// Override dom generator.
	getDom: function() {
		var complimentText = this.randomCompliment();

		var compliment = document.createTextNode(complimentText);
		var wrapper = document.createElement("div");
		wrapper.className = this.config.classes ? this.config.classes : "thin xlarge bright";
		wrapper.appendChild(compliment);

		return wrapper;
	},


	// From data currentweather set weather type
	setCurrentWeatherType: function(data) {
		var weatherIconTable = {
			"01d": "day_sunny",
			"02d": "day_cloudy",
			"03d": "cloudy",
			"04d": "cloudy_windy",
			"09d": "showers",
			"10d": "rain",
			"11d": "thunderstorm",
			"13d": "snow",
			"50d": "fog",
			"01n": "night_clear",
			"02n": "night_cloudy",
			"03n": "night_cloudy",
			"04n": "night_cloudy",
			"09n": "night_showers",
			"10n": "night_rain",
			"11n": "night_thunderstorm",
			"13n": "night_snow",
			"50n": "night_alt_cloudy_windy"
		};
		this.currentWeatherType = weatherIconTable[data.weather[0].icon];
	},


	// Override notification handler.
	notificationReceived: function(notification, payload, sender) {
		if (notification == "CURRENTWEATHER_DATA") {
			this.setCurrentWeatherType(payload.data);
		}
	},

});
