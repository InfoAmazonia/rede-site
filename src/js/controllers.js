'use strict';

angular.module('rede')

.controller('AccountCtrl', [
	'$scope',
	'RedeService',
	'RedeAuth',
	'MessageService',
	'$state',
	function($scope, Rede, Auth, Message, $state) {

		$scope.user = {};

		$scope.updateProfile = function() {
			var user = $scope.user;
			Rede.users.updateAccount({
				name: user.name,
				email: user.email,
				phoneNumber: user.phoneNumber
			}, function(data) {
				Auth.setToken(_.extend(Auth.getToken(), {
					name: data.name,
					phoneNumber: data.phoneNumber,
					email: data.email
				}));
				Message.add('Informações atualizadas!');
			});
		};

		$scope.pwd = {};

		$scope.updatePwd = function(pwd) {
			if(!pwd.password) {
				Message.add('Você deve inserir uma senha');
			} else if(pwd.password !== pwd.password_repeat) {
				Message.add('Verifique se as senhas digitadas são identicas');
			} else {
				Rede.users.updateAccount(pwd, function(user) {
					Message.add('Senha atualizada');
					$scope.pwd = {};
				});
			}
		};

		$scope.$watch(function() {
			return Auth.getToken();
		}, function() {
			if(!Auth.getToken()) {
				$state.go('home');
			} else {
				$scope.user = Auth.getToken();
				$scope.sensors = [];
				_.each($scope.user.subscribedToSensors, function(sensor) {
					Rede.sensors.get({id: sensor}, function(data) {
						$scope.sensors.push(data);
					});
				});
			}
		}, true);
	}
])

.controller('MapCtrl', [
	'$scope',
	'CartoDBService',
	'leafletData',
	'$state',
	function($scope, CartoDB, leafletData, $state) {

		/*
		 * Map
		 */

		$scope.map = {
			options: {
				maxZoom: 15,
				scrollWheelZoom: false,
				zoomControl: $state.current.name == 'home' ? true : false,
				attributionControl: $state.current.name == 'home' ? true : false,
			},
			center: {
				lat: 0,
				lng: 0,
				zoom: 2
			}
		};

		if($state.current.name !== 'home') {
			$scope.map.options.controls = {
				layers: {
					visible: false
				}
			};
		};

		$scope.map.layerData = [
			{
				name: 'Limite dos municípios',
				user: 'infoamazonia',
				sql: "SELECT * FROM merge_fiocruz WHERE municipio LIKE 'Santarém' OR municipio LIKE 'Belterra'",
				cartocss: '#layer{polygon-opacity:.7;line-color:#FFF;line-width:.5;line-opacity:1;polygon-fill:transparent}'
			}
		];

		$scope.map.layers = {
			baselayers: {
				satellite: {
					name: 'Satélite',
					url: 'https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IlhHVkZmaW8ifQ.hAMX5hSW-QnTeRCMAy9A8Q',
					type: 'xyz'
				},
				forestheight: {
					name: 'Altura da floresta',
					url: 'https://{s}.tiles.mapbox.com/v3/infoamazonia.forest-height,infoamazonia.osm-brasil/{z}/{x}/{y}.png',
					type: 'xyz'
				},
				osm: {
					name: "OpenStreetMap",
					url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					type: 'xyz'
				}
			},
			overlays: {}
		};

		$scope.map.layerData.forEach(function(layer) {
			CartoDB.getTiles(layer, function(tiles) {
				$scope.map.layers.overlays[layer.name] = {
					name: layer.name,
					url: tiles.tiles[0],
					type: 'xyz',
					visible: true
				}
			});
		});
	}
])

.controller('HomeCtrl', [
	'$scope',
	'RedeService',
	'CartoDBService',
	'leafletData',
	'$interval',
	'SensorsData',
	function($scope, Rede, CartoDB, leafletData, $interval, sensors) {

		/*
		 * About
		 */
		var texts = ['sensor','sim','water','forest'];
		var aboutI = 0;
		var setAbout = function(c) {
			$scope.aboutText = texts[c];
			aboutI = c;
		}
		setAbout(0);
		var aboutInterval = $interval(function() {
			setAbout(aboutI);
			aboutI++;
			if(aboutI == 4) aboutI = 0;
		}, 8000);
		$scope.resetAbout = function(t) {
			var c;
			_.find(texts, function(text, i) { if(text == t) { c = i; return true; } });
			$interval.cancel(aboutInterval);
			setAbout(c);
		};
		$scope.$on('$destroy', function() {
			$interval.cancel(aboutInterval);
		});

		var sCount = 1;

		$scope.sensors = sensors.sensors;

		Rede.stories
			.success(function(data) {
				$scope.stories = data;
				$scope.geojson = {
					data: {
						type: "FeatureCollection",
						features: Rede.sensorToGeoJSON($scope.sensors).features.concat($scope.stories.features)
					},
					pointToLayer: function(f, latlng) {
						if(!f.properties.postID) {
							return new L.Marker(latlng, {
								icon: L.icon({
									iconUrl: '/img/sensor-icon-white-small.png',
									iconSize: [20,20],
									shadowSize: [0,0],
									iconAnchor: [10,10],
									shadowAnchor: [0,0],
									popupAnchor: [0,-10]
								})
							});
						} else {
							return new L.Marker(latlng);
						}
					},
					onEachFeature: function(f, layer) {
						if(f.properties.postID) {
							layer.bindPopup('Artigo: ' + f.properties.title);
						} else {
							layer.bindPopup(f.properties.name);
						}
						layer.on('mouseover', function() {
							layer.openPopup();
							layer.setZIndexOffset(1000);
						});
						layer.on('mouseout', function() {
							layer.closePopup();
							layer.setZIndexOffset(0);
						});
						layer.on('click', function() {
							if(f.properties.postID) {
								window.open(f.properties.url, '_blank');
							} else {
								$scope.$apply(function() {
									$scope.sensor = f.properties._id;
								});
							}
						});
						sCount++;
					}
				};
			})
			.error(function(data, status, headers, config) {
				// console.log(data);
			});

		var latLngs = [];
		_.each($scope.sensors, function(feature) {
			latLngs.push(
				[
					feature.geometry.coordinates[1],
					feature.geometry.coordinates[0]
				]
			);
		});
		var bounds = L.latLngBounds(latLngs);
		leafletData.getMap('map').then(function(m) {
			m.fitBounds(bounds, {reset: true});
		});

		$scope.sensor = false;

		$scope.setSensor = function(sensor) {
			$scope.sensor = sensor;
		};

	}
])

.controller('SensorCtrl', [
	'$scope',
	'RedeService',
	'leafletData',
	'SensorData',
	'AddressData',
	'ParametersData',
	'$sce',
	function($scope, Rede, leafletData, Sensor, Address, Parameters, $sce) {

		$scope.sensor = Sensor;

		if(Address.data.address) {
			$scope.city = Address.data.address.city;
			if($scope.city == 'Santarém') {
				$scope.visaguasUrl = $sce.trustAsResourceUrl('http://visaguas.infoamazonia.org/uf/15/cidade/150680/?theme=rede&lock=true&hide_title=true');
			} else if($scope.city == 'Belterra') {
				$scope.visaguasUrl = $sce.trustAsResourceUrl('http://visaguas.infoamazonia.org/uf/15/cidade/150145/?theme=rede&lock=true&hide_title=true');
			}
		}

		var sCount = 1;

		$scope.geojson = {
			data: Rede.sensorToGeoJSON([$scope.sensor]),
			pointToLayer: function(f, latlng) {
				return new L.Marker(latlng, {
					icon: L.icon({
						iconUrl: '/img/sensor-icon-white-small.png',
						iconSize: [20,20],
						shadowSize: [0,0],
						iconAnchor: [10,10],
						shadowAnchor: [0,0],
						popupAnchor: [0,-10]
					})
				});
			},
			onEachFeature: function(f, layer) {
				sCount++;
			}
		};

		var latLngs = [];
		_.each([$scope.sensor], function(feature) {
			latLngs.push(
				[
					feature.geometry.coordinates[1],
					feature.geometry.coordinates[0]
				]
			);
		});
		var bounds = L.latLngBounds(latLngs);
		leafletData.getMap('map').then(function(m) {
			m.fitBounds(bounds, {reset: true});
		});

		$scope.chart = {
			params: {
				type: Parameters,
				date: [
					{
						label: 'Últimas 24 horas',
						value: '24hours'
					},
					{
						label: 'Últimos 30 dias',
						value: '30days'
					},
					{
						label: 'Customizado',
						value: 'custom'
					}
				]
			}
		};

		$scope.chart.current = {
			type: $scope.chart.params.type[Object.keys($scope.chart.params.type)[0]]._id,
			date: $scope.chart.params.date[0]
		};

		var updateChart = function() {
			if($scope.chart.current.type && $scope.sensor && $scope.chartDateFrom) {
				Rede.measurements.query({
					'sensor_id': $scope.sensor._id,
					'parameter_id': $scope.chart.current.type,
					'from': $scope.chartDateFrom,
					'to': $scope.chartDateTo
				}, function(measures) {
					$scope.measures = measures.measurements;
				});
			}
		}

		$scope.chartMeasure = function(id) {
			$scope.chart.current.type = id;
		};

		$scope.picker = {
			from: '',
			to: ''
		};

		$scope.togglePicker = function(picker) {
			if(picker == 'from') {
				if($scope.showFrom)
					$scope.showFrom = false;
				else
					$scope.showFrom = true;
				$scope.showTo = false;
			} else if(picker == 'to') {
				if($scope.showTo)
					$scope.showTo = false;
				else
					$scope.showTo = true;
				$scope.showFrom = false;
			}
		};

		$scope.$watch('picker', function(picker) {
			if(picker.from > picker.to) {
				picker.to = '';
			}
			$scope.showFrom = false;
			$scope.showTo = false;
			$scope.chartDateFrom = moment(picker.from).format();
			$scope.chartDateTo = moment(picker.to).format();
		}, true);

		$scope.$watch('chart.current.date.value', function(val) {
			switch(val) {
				case '24hours':
					$scope.chartDateFrom = moment().subtract(1, 'day').format();
					$scope.chartDateTo = moment().format();
					break;
				case '30days':
					$scope.chartDateFrom = moment().subtract(30, 'days').format();
					$scope.chartDateTo = moment().format();
					break;
				case 'custom':
					$scope.chartDateFrom = '';
					$scope.chartDateTo = '';
					break;
			}
			updateChart();
		}, true);

		$scope.$watch('chart.current.type', function() {
			updateChart();
		});

	}
])

.controller('SensorSubscription', [
	'$scope',
	'MessageService',
	'RedeAuth',
	'RedeService',
	'$state',
	function($scope, Message, Auth, Rede, $state) {

		$scope.token = Auth.getToken();

		$scope.subscribed = function() {
			if(Auth.getToken() && _.find(Auth.getToken().subscribedToSensors, function(sensor) { return sensor == $state.params.sensorId; })) {
				return true;
			}
			return false;
		}

		$scope.subscribe = function() {
			if(!$scope.subscribed()) {
				Rede.sensors.subscribe({id: $state.params.sensorId}, function(data) {
					Message.add('Você está assinando este sensor!');
					$state.go('sensor', {sensorId: $state.params.sensorId});
					Auth.setToken(_.extend(Auth.getToken(), data.user));
				}, function(data) {
					console.log(data);
				});
			} else if(Auth.getToken()) {
				Message.add('Você já assina este sensor!');
				$state.go('sensor', {sensorId: $state.params.sensorId});
			}
		}

		$scope.unsubscribe = function(sensorId) {
			sensorId = sensorId || $state.params.sensorId;
			if(Auth.getToken()) {
				Rede.sensors.unsubscribe({id: sensorId}, function(data) {
					Message.add('Você deixou de assinar este sensor!');
					Auth.setToken(_.extend(Auth.getToken(), data.user));
				}, function(data) {
					console.log(data);
				});
			}
		}

	}
])

.controller('SensorReport', [
	'RedeService',
	'$scope',
	'$stateParams',
	'$q',
	function(Rede, $scope, $stateParams, $q) {

		$scope.data = {};

		Rede.getParameters().then(function(params) {

			$scope.params = params;

			if($stateParams.from) {
				$scope.formattedFrom = moment($stateParams.from).format('L');
			}

			if($stateParams.to) {
				$scope.formattedTo = moment($stateParams.to).format('L');
			}

			var promises = [];
			_.each(params, function(param) {
				promises.push(Rede.measurements.query({
					sensor_id: $stateParams.sensorId,
					parameter_id: param._id,
					from: $stateParams.from,
					to: $stateParams.to
				}).$promise);
			});

			$q.all(promises).then(function(data) {
				data.map(function(measurements) {
					$scope.data[measurements.parameter._id] = measurements.measurements;
				});
				setTimeout(function() {
					window.print();
				}, 2000);
			});

		});

	}
])

.controller('AuthCtrl', [
	'$scope',
	'RedeService',
	'RedeAuth',
	function($scope, Rede, Auth) {

		$scope.$watch(function() {
			return Auth.getToken();
		}, function(token) {
			console.log(token);
			$scope.token = token;
		});

		$scope.logout = function() {
			Auth.logout();
		};

	}
])

.controller('AdminCtrl', [
	'RedeAuth',
	'RedeService',
	'$scope',
	'$state',
	function(Auth, Rede, $scope, $state) {
		$scope.$watch(function() {
			return Auth.getToken();
		}, function(user) {
			$scope.user = user;
			if(user && user.role == 'admin') {
				if($state.current.name == 'admin') {
					$state.go('admin.sensors');
				}
			} else {
				$state.go('home');
			}
		});

		$scope.broadcast = function(msg) {
			if(confirm('Você tem certeza que deseja enviar "' + msg + '" para todos os assinantes?')) {
				console.log('enviando', msg, $scope.sensor._id);
			}
		}
	}
])

.controller('AdminSensorCtrl', [
	'$scope',
	'RedeService',
	'SensorsData',
	function($scope, Rede, Sensors) {
		$scope.sensors = Sensors.sensors;

		var updatePaging = function(data) {
			$scope.page = data.page;
			$scope.count = data.count;
			$scope.perPage = data.perPage;
			$scope.showNext = $scope.count > $scope.page * $scope.perPage;
			$scope.showPrev = $scope.page > 1;
		};

		var query = {};

		$scope.$on('$stateChangeSuccess', function(event, toState, toParams) {
			$scope.page = toParams.page || 1;
			query = _.extend({'page': $scope.page}, query);
			Rede.sensors.query(query, function(data) {
				$scope.sensors = data.sensors;
				updatePaging(data);
			});
		});

		$scope.deleteSensor = function(sensor) {
			if(confirm('Você tem certeza?')) {
				console.log('delete');
			}
		}
	}
])

.controller('AdminEditSensorCtrl', [
	'$scope',
	'RedeService',
	'$stateParams',
	'$state',
	function($scope, Rede, $stateParams, $state) {

		if($state.params.sensorId) {
			Rede.sensors.get({id: $state.params.sensorId}, function(sensor) {
				$scope.sensor = sensor;
			})
		}

		$scope.broadcast = function(msg) {
			if($scope.sensor) {
				if(confirm('Você tem certeza que deseja enviar "' + msg + '" para os assinantes de ' + $scope.sensor.name + '?')) {
					console.log('enviando', msg, $scope.sensor._id);
				}
			}
		}
	}
])

.controller('AdminEditUserCtrl', [
	'$scope',
	'RedeService',
	'$stateParams',
	'$state',
	function($scope, Rede, $stateParams, $state) {

		if($state.params.userId) {
			Rede.sensors.get({id: $state.params.userId}, function(sensor) {
				$scope.user = user;
			})
		}

		$scope.broadcast = function(msg) {
			if($scope.user) {
				if(confirm('Você tem certeza que deseja enviar "' + msg + '" para para ' + $scope.user.name + '?')) {
					console.log('enviando', msg, $scope.user._id);
				}
			}
		}

	}
])

.controller('AdminEditMeasurementCtrl', [
	'$scope',
	'RedeService',
	'SensorData',
	'ParametersData',
	function($scope, Rede, Sensor, Parameters) {
		$scope.sensor = Sensor;
		$scope.parameters = Parameters;

		$scope.updateMeasurements = function(paramId) {
			$scope.param = $scope.parameters[paramId];
		};

		$scope.getDate = function(measurement) {
			return moment(measurement.collectedAt).format('LLLL');
		};

		$scope.deleteMeasurement = function(measurement) {
			if(confirm('Você tem certeza?')) {
				console.log('delete');
			}
		}

		var updatePaging = function(data) {
			$scope.page = data.page;
			$scope.count = data.count;
			$scope.perPage = data.perPage;
			$scope.showNext = $scope.count > $scope.page * $scope.perPage;
			$scope.showPrev = $scope.page > 1;
		};

		var query = {
			'sensor_id': $scope.sensor._id
		};

		$scope.$on('$stateChangeSuccess', function(event, toState, toParams) {

			$scope.page = toParams.measurement_page || 1;

			$scope.param = toParams.parameter_id || $scope.parameters[Object.keys($scope.parameters)[0]]._id;

			query = _.extend({'page': $scope.page, 'parameter_id': $scope.param}, query);
			Rede.measurements.query(query, function(data) {
				$scope.measurements = data;
				updatePaging(data);
			});
		});

	}
])

.controller('AdminUserCtrl', [
	'UsersData',
	'$scope',
	function(Users, $scope) {
		console.log(Users);
	}
]);
