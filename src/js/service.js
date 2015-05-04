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
			stories: $http.get('http://infoamazonia.org/?publisher=infoamazonia&geojson=1'),
			sample: sampleData
		}

	}
]);