angular.module('rede')

.factory('RedeService', [
	'$resource',
	'$http',
	'$q',
	function($resource, $http, $q, Msgs) {

		var apiUrl = '/api/v1';

		var measureParams;

		return {
			users: $resource(apiUrl + '/users/:id', { id: '@id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT',
					params: {
						id: '@_id'
					}
				},
				updateAccount: {
					url: apiUrl + '/account',
					method: 'PUT'
				}
			}),
			sensors: $resource(apiUrl + '/sensors/:id', { id: '@id' }, {
				query: {
					method: 'GET',
					isArray: false
				},
				update: {
					method: 'PUT',
					params: {
						id: '@_id'
					}
				},
				getScore: {
					url: apiUrl + '/sensors/:id/score',
					method: 'GET',
					isArray: false
				},
				subscribe: {
					url: apiUrl + '/sensors/:id/subscribe',
					method: 'POST',
					isArray: false
				},
				unsubscribe: {
					url: apiUrl + '/sensors/:id/unsubscribe',
					method: 'POST',
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
				},
				aggregate: {
					method: 'GET',
					url: apiUrl + '/measurements/aggregate'
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

.factory('RedeAuth', [
	'RedeService',
	'$q',
	'$window',
	'$cookies',
	'$http',
	function(Rede, $q, $window, $cookies, $http) {

		var apiUrl = '/api/v1';

		$window.auth = '';

		try {
			$window.auth = JSON.parse($cookies.get('auth'));
		} catch(err) {
			$window.auth = false;
		}

		return {
			setToken: function(data) {
				$window.auth = data;
				try {
					$cookies.put('auth', JSON.stringify(data));
				} catch(err) {
					$cookies.remove('auth');
				}
			},
			getToken: function() {
				return $window.auth;
			},
			register: function(data) {
				var self = this;
				var deferred = $q.defer();
				Rede.users.save(data, function(user) {
					self.login({
						email: data.email,
						password: data.password
					});
					deferred.resolve(user);
				});
				return deferred.promise;
			},
			login: function(credentials) {
				var self = this;
				var deferred = $q.defer();
				$http.post(apiUrl + '/login', credentials)
				.success(function(data) {
					self.setToken(data);
					deferred.resolve(data);
				});
				return deferred.promise;
			},
			logout: function() {
				var self = this;
				if($window.auth) {
					var deferred = $q.defer();
					$http.get(apiUrl + '/logout')
					.success(function(data) {
						self.setToken('');
						deferred.resolve(true);
					})
					.error(function() {
						self.setToken('');
						deferred.resolve(true);
					});
					return deferred.promise;
				} else {
					return false;
				}
			}
		}
	}
])

.factory('RedeMsgs', [
	function() {
		return {
			get: function(txt) {
				var msg = txt;
				switch(txt) {
					case 'mongoose.errors.areas.missing_address':
						msg = 'Você deve preencher o campo de endereço';
						break;
					case 'access_token.local.email_not_confirmed':
						msg = 'Verifique seu email para ativar sua conta.';
						break;
					case 'email_confirmed':
						msg = 'Seu email foi confirmado.';
						break;
					case 'token_expired':
						msg = 'A chave de acesso expirou.';
						break;
					case 'internal_error':
						msg = 'Ocorreu um erro interno. Pora favor, tente novamente.';
						break;
					case 'token_not_found':
						msg = 'Chave de acesso não encontrada.';
						break;
					case 'users.missing_password':
						msg = 'Preencha o campo de senha';
						break;
					case 'users.missing_email':
						msg = 'Preencha o campo de email';
						break;
					case 'users.email_already_registered':
						msg = 'Email já cadastrado';
						break;
					case 'users.short_password':
						msg = 'Senha muito curta';
						break;
					case 'users.invalid_email':
						msg = 'Email inválido';
						break;
					case 'Unknown user':
						msg = 'Usuário não encontrado';
						break;
					case 'account.old_password_wrong':
						msg = 'Senha atual incorreta';
						break;
				}
				return msg;
			}
		}
	}
]);
