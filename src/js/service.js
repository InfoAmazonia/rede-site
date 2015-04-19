angular.module('rede')

.factory('RedeService', [
	'$resource',
	function($resource) {

		var apiUrl = '/api/v1';

		return {
			user: $resource(apiUrl + '/users/:id', { id: '@id' }, {
				update: {
					method: 'PUT'
				}
			})
		}

	}
]);