'use strict';

angular.module('rede')

.controller('LanguageCtrl', [
	'$scope',
	'gettextCatalog',
	function($scope, gettextCatalog) {
		$scope.$watch(function() {
			return gettextCatalog.getCurrentLanguage();
		}, function(lang) {
			$scope.lang = lang;
		});
		$scope.setLanguage = function(lang) {
			gettextCatalog.setCurrentLanguage(lang);
		};
	}
])

.controller('SensorNavCtrl', [
	'$scope',
	'RedeService',
	function($scope, Rede) {
		Rede.sensors.query({}, function(data) {
			$scope.sensors = data.sensors;

			// temp solution
			$scope.sensors = _.filter($scope.sensors, function(sensor) {
				return sensor.name.indexOf('#') !== 0;
			});

		});
	}
])

.controller('AccountCtrl', [
	'$scope',
	'RedeService',
	'RedeAuth',
	'MessageService',
	'$state',
	'gettext',
	function($scope, Rede, Auth, Message, $state, gettext) {

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
				Message.add(gettext('Informações atualizadas!'));
			});
		};

		$scope.pwd = {};

		$scope.updatePwd = function(pwd) {
			if(!pwd.password) {
				Message.add(gettext('Você deve inserir uma senha'));
			} else if(pwd.password !== pwd.password_repeat) {
				Message.add(gettext('Verifique se as senhas digitadas são identicas'));
			} else {
				Rede.users.updateAccount(pwd, function(user) {
					Message.add(gettext('Senha atualizada'));
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
			// {
			// 	name: 'Limite dos municípios',
			// 	user: 'infoamazonia',
			// 	sql: "SELECT * FROM merge_fiocruz WHERE municipio LIKE 'Santarém' OR municipio LIKE 'Belterra'",
			// 	cartocss: '#layer{polygon-opacity:.7;line-color:#FFF;line-width:.5;line-opacity:1;polygon-fill:transparent}'
			// }
		];

		$scope.map.layers = {
			baselayers: {
				satellite: {
					name: 'Satélite',
					url: 'https://{s}.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaW5mb2FtYXpvbmlhIiwiYSI6InItajRmMGsifQ.JnRnLDiUXSEpgn7bPDzp7g',
					type: 'xyz'
				},
				forestheight: {
					name: 'Altura da floresta',
					url: 'https://{s}.tiles.mapbox.com/v3/infoamazonia.forest-height,infoamazonia.osm-brasil/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiaW5mb2FtYXpvbmlhIiwiYSI6InItajRmMGsifQ.JnRnLDiUXSEpgn7bPDzp7g',
					type: 'xyz'
				},
				osm: {
					name: "OpenStreetMap",
					url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					type: 'xyz'
				}
			},
			overlays: {
				sensors: {
					name: 'Sensores',
					type: 'markercluster',
					visible: true
				}
			}
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
	'ngDialog',
	'$state',
	function($scope, Rede, CartoDB, leafletData, $interval, sensors, ngDialog, $state) {

		$scope.$on('$stateChangeSuccess', function(ev, toState, toParams, fromState) {
			if(!fromState.name)
				$scope.introDialog = ngDialog.open({
					template: 'intro-dialog'
				});
		});

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

		// temp solution
		$scope.sensors = _.filter($scope.sensors, function(sensor) {
			return sensor.name.indexOf('#') !== 0;
		});

		$scope.markers = [];

		_.each($scope.sensors, function(sensor) {
			if(sensor.geometry.coordinates.length && sensor.geometry.coordinates[0]) {
				$scope.markers.push({
					_id: sensor._id,
					lat: parseFloat(sensor.geometry.coordinates[1]),
					lng: parseFloat(sensor.geometry.coordinates[0]),
					layer: 'sensors',
					message: sensor.name,
					icon: {
						iconUrl: '/img/sensor-icon-white-small_.png',
						iconSize: [24,24],
						shadowSize: [0,0],
						iconAnchor: [12,12],
						shadowAnchor: [0,0],
						popupAnchor: [0,-12]
					}
				});
			}
		});

		$scope.$on('leafletDirectiveMarker.mouseover', function(ev, args) {
			args.leafletObject.openPopup();
			args.leafletObject.setZIndexOffset(1000);
		});

		$scope.$on('leafletDirectiveMarker.mouseout', function(ev, args) {
			args.leafletObject.closePopup();
			args.leafletObject.setZIndexOffset(0);
		});

		$scope.$on('leafletDirectiveMarker.click', function(ev, args) {
			$scope.sensor = args.model._id;
		});

		var latLngs = [];
		_.each($scope.sensors, function(feature) {
			if(feature.geometry.coordinates.length  && feature.geometry.coordinates[0]) {
				latLngs.push(
					[
						parseFloat(feature.geometry.coordinates[1]),
						parseFloat(feature.geometry.coordinates[0])
					]
				);
			}
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
	'$q',
	'$scope',
	'RedeService',
	'leafletData',
	'SensorData',
	'AddressData',
	'ParametersData',
	'$sce',
	'gettextCatalog',
	'gettext',
	function($q, $scope, Rede, leafletData, Sensor, Address, Parameters, $sce, gettextCatalog, gettext) {

		$scope.sensor = Sensor;

		$scope.paramLang = '';
		$scope.$watch(function() {
			return gettextCatalog.getCurrentLanguage();
		}, function(lang) {
			if(lang == 'pt_BR')
				$scope.paramLang = 'pt';
			else
				$scope.paramLang = 'en';
		});

		if(Address.data.address) {
			$scope.city = Address.data.address.city;
			if($scope.city == 'Santarém') {
				$scope.visaguasUrl = $sce.trustAsResourceUrl('http://visaguas.infoamazonia.org/uf/15/cidade/150680/?theme=rede&lock=true&hide_title=true');
			} else if($scope.city == 'Belterra') {
				$scope.visaguasUrl = $sce.trustAsResourceUrl('http://visaguas.infoamazonia.org/uf/15/cidade/150145/?theme=rede&lock=true&hide_title=true');
			}
		}

		var sCount = 1;

		if($scope.sensor.geometry.coordinates.length && $scope.sensor.geometry.coordinates[0]) {
			$scope.markers = [
				{
					_id: $scope.sensor._id,
					lat: parseFloat($scope.sensor.geometry.coordinates[1]),
					lng: parseFloat($scope.sensor.geometry.coordinates[0]),
					layer: 'sensors',
					message: $scope.sensor.name,
					icon: {
						iconUrl: '/img/sensor-icon-white-small_.png',
						iconSize: [24,24],
						shadowSize: [0,0],
						iconAnchor: [12,12],
						shadowAnchor: [0,0],
						popupAnchor: [0,-12]
					}
				}
			];
		}

		var latLngs = [];
		_.each([$scope.sensor], function(feature) {
			if(feature.geometry.coordinates.length && feature.geometry.coordinates[0]) {
				latLngs.push(
					[
						parseFloat(feature.geometry.coordinates[1]),
						parseFloat(feature.geometry.coordinates[0])
					]
				);
			}
		});
		var bounds = L.latLngBounds(latLngs);
		leafletData.getMap('map').then(function(m) {
			m.fitBounds(bounds, {reset: true});
		});

		/*
		 * Average
		 */
		$scope.params = Parameters;
		$scope.averages = {};

		var promises = [];
		_.each($scope.params, function(param) {
			promises.push(Rede.measurements.aggregate({
				sensor_id: $scope.sensor._id,
				parameter_id: param._id,
				fromDate: moment().subtract(1, 'month').format(),
				toDate: moment().format(),
				resolution: 'month'
			}).$promise);
		});
		$q.all(promises).then(function(data) {
			data.map(function(aggregates) {
				$scope.averages[aggregates.parameter_id] = aggregates.aggregates;
			});
		});

		/*
		 * Chart
		 */
		$scope.chart = {
			params: {
				type: Parameters,
				date: [
					{
						label: gettext('Últimas 24 horas'),
						value: '24hours'
					},
					{
						label: gettext('Últimos 30 dias'),
						value: '30days'
					},
					{
						label: gettext('Customizado'),
						value: 'custom'
					}
				]
			}
		};

		$scope.chart.current = {
			type: $scope.chart.params.type[Object.keys($scope.chart.params.type)[0]],
			date: $scope.chart.params.date[0]
		};

		var updateChart = function() {
			var from = $scope.chartDateFrom;
			var to = $scope.chartDateTo;
			if($scope.chart.current.type && moment.isMoment(from) && moment.isMoment(to)) {
				var resolution = 'hour';
				if(from.isBefore(moment(to).subtract(5, 'days'))) {
					resolution = 'day';
				}
				Rede.measurements.aggregate({
					'sensor_id': $scope.sensor._id,
					'parameter_id': $scope.chart.current.type._id,
					'fromDate': from.utc().format(),
					'toDate': to.utc().format(),
					'resolution': resolution
				}, function(aggregates) {
					$scope.aggregates = aggregates.aggregates;
				});
			}
		}

		$scope.chartMeasure = function(param) {
			$scope.chart.current.type = param;
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
			if(picker.from)
				$scope.chartDateFrom = moment(picker.from);
			if(picker.to)
				$scope.chartDateTo = moment(picker.to);
			updateChart();
		}, true);

		$scope.$watch('chart.current.date.value', function(val) {
			switch(val) {
				case '24hours':
					$scope.chartDateFrom = moment().subtract(1, 'day');
					$scope.chartDateTo = moment();
					break;
				case '30days':
					$scope.chartDateFrom = moment().subtract(30, 'days');
					$scope.chartDateTo = moment();
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
	'gettext',
	function($scope, Message, Auth, Rede, $state, gettext) {

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
					Message.add(gettext('Você está assinando este sensor!'));
					$state.go('sensor', {sensorId: $state.params.sensorId});
					Auth.setToken(_.extend(Auth.getToken(), data.user));
				});
			} else if(Auth.getToken()) {
				Message.add(gettext('Você já assina este sensor!'));
				$state.go('sensor', {sensorId: $state.params.sensorId});
			}
		}

		$scope.unsubscribe = function(sensorId) {
			sensorId = sensorId || $state.params.sensorId;
			if(Auth.getToken()) {
				Rede.sensors.unsubscribe({id: sensorId}, function(data) {
					Message.add(gettext('Você deixou de assinar este sensor!'));
					Auth.setToken(_.extend(Auth.getToken(), data.user));
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
	'gettextCatalog',
	function(Rede, $scope, $stateParams, $q, gettextCatalog) {

		$scope.data = {};

		$scope.paramLang = '';
		$scope.$watch(function() {
			return gettextCatalog.getCurrentLanguage();
		}, function(lang) {
			if(lang == 'pt_BR')
				$scope.paramLang = 'pt';
			else
				$scope.paramLang = 'en';
		});

		Rede.getParameters().then(function(params) {

			$scope.params = params;

			var from = moment(new Date($stateParams.from));
			var to = moment(new Date($stateParams.to));

			if($stateParams.from) {
				$scope.formattedFrom = from.format('L');
			}

			if($stateParams.to) {
				$scope.formattedTo = to.format('L');
			}

			var resolution = 'hour';
			if(from.isBefore(moment(to).subtract(5, 'days'))) {
				resolution = 'day';
			}

			var promises = [];
			_.each(params, function(param) {
				promises.push(Rede.measurements.aggregate({
					sensor_id: $stateParams.sensorId,
					parameter_id: param._id,
					fromDate: from.utc().format(),
					toDate: to.utc().format(),
					resolution: resolution
				}).$promise);
			});

			$q.all(promises).then(function(data) {
				data.map(function(aggregates) {
					$scope.data[aggregates.parameter_id] = aggregates.aggregates;
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
	'gettext',
	function(Auth, Rede, $scope, $state, gettext) {
		$scope.$watch(function() {
			return Auth.getToken();
		}, function(user) {
			$scope.token = user;
			if(user && user.role == 'admin') {
				if($state.current.name == 'admin') {
					$state.go('admin.sensors');
				}
			} else {
				$state.go('home');
			}
		});

		$scope.broadcast = function(msg) {
			if(confirm(gettext('Você tem certeza que deseja enviar "' + msg + '" para todos os assinantes?'))) {
				console.log('enviando', msg, $scope.sensor._id);
			}
		}
	}
])

.controller('AdminSensorCtrl', [
	'$scope',
	'RedeService',
	'SensorsData',
	'MessageService',
	'gettext',
	function($scope, Rede, Sensors, Message, gettext) {
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
			if(confirm(gettext('Você tem certeza?'))) {
				Rede.sensors.delete({id: sensor._id}, function() {
					Message.add(gettext('Sensor removido.'));
					$scope.sensors = _.filter($scope.sensors, function(s) { return s._id !== sensor._id; });
				});
			}
		}
	}
])

.controller('AdminEditSensorCtrl', [
	'$scope',
	'RedeService',
	'$stateParams',
	'$state',
	'MessageService',
	'gettext',
	function($scope, Rede, $stateParams, $state, Message, gettext) {

		if($state.params.sensorId) {
			Rede.sensors.get({id: $state.params.sensorId}, function(sensor) {
				$scope.sensor = sensor;
			})
		}

		$scope.sensor = {};

		$scope.submit = function(sensor) {
			if(sensor._id) {
				Rede.sensors.update(sensor, function(s) {
					$scope.sensor = s;
					Message.add(gettext('Sensor atualizado.'));
				});
			} else {
				Rede.sensors.save(sensor, function(s) {
					$scope.sensor = s;
					Message.add(gettext('Sensor criado.'));
				});
			}
		};

		$scope.broadcast = function(msg) {
			if($scope.sensor) {
				if(confirm(gettext('Você tem certeza que deseja enviar "' + msg + '" para os assinantes de ' + $scope.sensor.name + '?'))) {
					console.log('enviando', msg, $scope.sensor._id);
				}
			}
		}
	}
])

.controller('AdminUserCtrl', [
	'RedeService',
	'MessageService',
	'UsersData',
	'$scope',
	'gettext',
	function(Rede, Message, Users, $scope, gettext) {
		$scope.users = Users.users;

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
			Rede.users.query(query, function(data) {
				$scope.users = data.users;
				updatePaging(data);
			});
		});

		$scope.deleteUser = function(user) {
			if(confirm(gettext('Você tem certeza?'))) {
				Rede.users.delete({id: user._id}, function() {
					Message.add(gettext('Usuário removido.'));
					$scope.users = _.filter($scope.users, function(s) { return s._id !== user._id; });
				});
			}
		}
	}
])

.controller('AdminEditUserCtrl', [
	'$scope',
	'RedeService',
	'$stateParams',
	'$state',
	'MessageService',
	'gettext',
	function($scope, Rede, $stateParams, $state, Message, gettext) {

		$scope.user = {};

		if($state.params.userId) {
			Rede.users.get({id: $state.params.userId}, function(user) {
				$scope.user = user;
			})
		}

		$scope.submit = function(user) {
			if(user.password !== user.password_repeat) {
				Message.add(gettext('Senhas não coincidem'));
			} else {
				if(user._id) {
					Rede.users.update(user, function(u) {
						$scope.user = u;
						Message.add(gettext('Usuário atualizado.'));
					});
				} else {
					Rede.users.save(user, function(u) {
						$scope.user = u;
						Message.add(gettext('Usuário criado.'));
					});
				}
			}
		};

		$scope.broadcast = function(msg) {
			if($scope.user) {
				if(confirm(gettext('Você tem certeza que deseja enviar "' + msg + '" para para ' + $scope.user.name + '?'))) {
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
	'MessageService',
	'gettext',
	function($scope, Rede, Sensor, Parameters, Message, gettext) {
		$scope.sensor = Sensor;
		$scope.parameters = Parameters;

		$scope.updateMeasurements = function(paramId) {
			$scope.param = $scope.parameters[paramId];
		};

		$scope.getDate = function(measurement) {
			return moment(measurement.collectedAt).utc().format('LLLL');
		};

		$scope.deleteMeasurement = function(measurement) {
			if(confirm(gettext('Você tem certeza?'))) {
				Rede.measurements.delete({id: measurement._id}, function() {
					Message.add(gettext('Medição removida.'));
					$scope.measurements.measurements = _.filter($scope.measurements.measurements, function(m) { return m._id !== measurement._id; });
				});
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
]);
