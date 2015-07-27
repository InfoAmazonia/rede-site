window.$ = window.jQuery = require('jquery');
require('mapbox.js');
L.mapbox.accessToken = 'pk.eyJ1IjoibWlndWVscGVpeGUiLCJhIjoiVlc0WWlrQSJ9.pIPkSx25w7ossO6rZH9Tcw';
window.angular = require('angular');
window._ = require('underscore');
window.moment = require('moment');
require('moment/locale/pt-br');
moment.locale('pt-br');
require('intl-tel-input/build/js/intlTelInput');

require('angular-animate');
require('angular-leaflet-directive');
require('angular-google-chart');
require('angular-ui-router');
require('angular-resource');
require('angular-cookies');
require('ng-dialog');
require('angular-pickadate/src/angular-pickadate');
require('international-phone-number/releases/international-phone-number');

var app = angular.module('rede', [
	'ui.router',
	'ngCookies',
	'ngAnimate',
	'ngResource',
	'ngDialog',
	'googlechart',
	'leaflet-directive',
	'pickadate',
	'internationalPhoneNumber'
]);

app
.value('googleChartApiConfig', {
	version: '1.1',
	optionalSettings: {
		packages: ['line', 'bar'],
		language: 'en'
	}
})
.config([
	'$stateProvider',
	'$urlRouterProvider',
	'$locationProvider',
	'$httpProvider',
	function($stateProvider, $urlRouterProvider, $locationProvider, $httpProvider) {

		$locationProvider.html5Mode({
			enabled: true,
			requireBase: false
		});
		$locationProvider.hashPrefix('!');

		$stateProvider
			.state('home', {
				url: '/',
				controller: 'HomeCtrl',
				templateUrl: '/views/home.html',
				resolve: {
					SensorsData: [
						'RedeService',
						function(Rede) {
							return Rede.sensors.query().$promise;
						}
					]
				}
			})
			.state('sensor', {
				url: '/sensors/:sensorId/',
				controller: 'SensorCtrl',
				templateUrl: '/views/sensor.html',
				resolve: {
					SensorData: [
						'RedeService',
						'$stateParams',
						function(Rede, $stateParams) {
							return Rede.sensors.get({id: $stateParams.sensorId}).$promise;
						}
					],
					ParametersData: [
						'RedeService',
						function(Rede) {
							return Rede.getParameters();
						}
					],
					AddressData: [
						'RedeService',
						'SensorData',
						function(Rede, Sensor) {
							var coords = Sensor.geometry.coordinates
							return Rede.geocode(coords[1], coords[0]);
						}
					]
				}
			})
			.state('sensor.subscribe', {
				url: 'subscribe/',
				controller: 'SensorSubscription',
				templateUrl: '/views/sensor/subscribe.html'
			})
			.state('sensor.report', {
				url: 'report/?from&to',
				controller: 'SensorReport',
				templateUrl: '/views/sensor/report.html'
			})
			.state('lab', {
				url: '/lab/',
				controller: 'LabCtrl',
				templateUrl: '/views/lab.html'
			})
			.state('lab.form', {
				url: 'form/',
				templateUrl: '/views/lab-form.html'
			})
			.state('admin', {
				url: '/admin/',
				controller: 'AdminCtrl',
				templateUrl: '/views/admin/index.html'
			})
			.state('admin.sensors', {
				url: 'sensors/',
				templateUrl: '/views/admin/sensors.html',
				controller: 'AdminSensorCtrl',
				resolve: {
					SensorData: [
						'RedeService',
						'$stateParams',
						function(Rede, $stateParams) {
							return Rede.sensors.get({id: $stateParams.sensorId}).$promise;
						}
					]
				}
			})
			.state('admin.sensors.edit', {
				url: 'edit/?id',
				controller: 'AdminEditSensorCtrl',
				templateUrl: '/views/admin/sensors-edit.html'
			});

		/*
		 * Trailing slash rule
		 */
		$urlRouterProvider.rule(function($injector, $location) {
			var path = $location.path(),
				search = $location.search(),
				params;

			// check to see if the path already ends in '/'
			if (path[path.length - 1] === '/') {
				return;
			}

			// If there was no search string / query params, return with a `/`
			if (Object.keys(search).length === 0) {
				return path + '/';
			}

			// Otherwise build the search string and return a `/?` prefix
			params = [];
			angular.forEach(search, function(v, k){
				params.push(k + '=' + v);
			});

			return path + '/?' + params.join('&');
		});
	}
])
.run([
	'$rootScope',
	'$location',
	'$window',
	function($rootScope, $location, $window) {
		/*
		 * Analytics
		 */
		$rootScope.$on('$stateChangeSuccess', function(ev, toState, toParams, fromState, fromParams) {
			if($window._gaq && fromState.name) {
				$window._gaq.push(['_trackPageview', $location.path()]);
			}
			if(fromState.name) {
				document.body.scrollTop = document.documentElement.scrollTop = 0;
			}
		});
	}
]);

require('./service');
require('./directives');
require('./controllers');

angular.element(document).ready(function() {
	angular.bootstrap(document, ['rede']);
});
