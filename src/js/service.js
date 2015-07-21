angular.module('rede')

.factory('RedeService', [
	'$resource',
	'$http',
	function($resource, $http) {

		var apiUrl = '/api/v1';

		var sampleData = {
			readings: require('./sample-data/readings'),
			sensors: require('./sample-data/sensors')
		};

		return {
			user: $resource(apiUrl + '/users/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			}),
			sensors: $resource(apiUrl + '/sensors/:id', { id: '@id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				}
			}),
			stories: $http.get('http://infoamazonia.org/?publisher=infoamazonia&geojson=1'),
			data: {
				states: $http.get('http://visaguas.infoamazonia.org/api?query=estados')
			},
			sample: sampleData
		}

	}
])

.factory('RedeLab', [
	'$window',
	'$cookies',
	function($window, $cookies) {

		$window.labToken = $cookies.labToken;

		// try {
		// 	$window.labToken = JSON.parse($cookies.labToken);
		// } catch(err) {
		// 	$window.labToken = false;
		// }

		return {
			setToken: function(data) {
				$window.labToken = $cookies.labToken = data;
				// try {
				// 	$cookies.labToken = JSON.stringify(data);
				// } catch(err) {
				// 	$cookies.labToken = '';
				// }
			},
			getToken: function() {
				return $window.labToken;
			}
		}
	}]);
