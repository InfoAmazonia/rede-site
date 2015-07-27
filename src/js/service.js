angular.module('rede')

.factory('RedeService', [
	'$resource',
	'$http',
	'$q',
	function($resource, $http, $q) {

		var apiUrl = '/api/v1';

		var measureParams;

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
				},
				getScore: {
					url: apiUrl + '/sensors/:id/score',
					method: 'GET',
					isArray: false
				}
			}),
			measurements: $resource(apiUrl + '/measurements', {}, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT'
				}
			}),
			getParameters: function() {
				var deferred = $q.defer();
				if(measureParams) {
					deferred.resolve(measureParams);
				} else {
					$http.get(apiUrl + '/parameters').success(function(data) {
						measureParams = data;
						deferred.resolve(measureParams);
					});
				}
				return deferred.promise;
			},
			geocode: function(lat, lon) {
				return $http({
					'method': 'GET',
					'url': 'http://nominatim.openstreetmap.org/reverse',
					'params': {
						'lon': lon,
						'lat': lat,
						'format': 'json',
						'address_details': 1
					}
				});
			},
			stories: $http.get('http://infoamazonia.org/?publisher=infoamazonia&posts_per_page=20&lang=pt&geojson=1'),
			data: {
				states: $http.get('http://visaguas.infoamazonia.org/api?query=estados')
			},
			sensorToGeoJSON: function(sensors) {

				var geojson = {
					type: 'FeatureCollection',
					features: []
				};
				_.each(sensors, function(sensor) {
					var feature = {type: 'Feature'};
					for(key in sensor) {
						if(key == 'geometry') {
							feature.geometry = sensor[key];
						} else {
							if(!feature.properties)
								feature.properties = {};
							feature.properties[key] = sensor[key];
						}
					}
					geojson.features.push(feature);
				});
				return geojson;
			}
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
