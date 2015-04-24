angular.module('rede')

.factory('RedeService', [
	'$resource',
	function($resource) {

		var apiUrl = '/api/v1';

		var sampleData = {
			readings: require('./sample-data/readings')
		};

		return {
			user: $resource(apiUrl + '/users/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			}),
			sample: sampleData
		}

	}
]);