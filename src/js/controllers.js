'use strict';

angular.module('rede')

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

		// Rede.stories
		// 	.success(function(data) {
		// 		console.log(data);
		// 	})
		// 	.error(function(data, status, headers, config) {
		// 		console.log(data);
		// 	});

		// Rede.data.states.success(function(data) {
		// 	console.log(data);
		// });

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

		$scope.geojson = {
			data: Rede.sensorToGeoJSON($scope.sensors),
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
				layer.bindPopup(f.properties.name);
				layer.on('mouseover', function() {
					layer.openPopup();
					layer.setZIndexOffset(1000);
				});
				layer.on('mouseout', function() {
					layer.closePopup();
					layer.setZIndexOffset(0);
				});
				layer.on('click', function() {
					$scope.$apply(function() {
						$scope.sensor = f.properties._id;
					});
				});
				sCount++;
			}
		};

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

		// $scope.sensors = Rede.sample.sensors.features;

		// console.log($scope.sensors);

	}
])

.controller('SensorCtrl', [
	'$scope',
	'RedeService',
	'leafletData',
	'SensorData',
	'AddressData',
	'$sce',
	function($scope, Rede, leafletData, Sensor, Address, $sce) {

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

		$scope.chartDateParams = [
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
		];

		$scope.chartDateParam = $scope.chartDateParams[0];

		Rede.getParameters().then(function(params) {

			$scope.chartParams = params;

			$scope.curParam = $scope.chartParams[Object.keys($scope.chartParams)[0]]._id;

			$scope.chartMeasure = function(id) {
				$scope.curParam = id;
			};

			$scope.$watch('curParam', function() {
				updateChart();
			});

			var updateChart = function() {
				if($scope.curParam && $scope.sensor) {
					Rede.measurements.query({'sensor_id': $scope.sensor._id, 'parameter_id': $scope.curParam}, function(measures) {
						$scope.measures = measures.measurements;
					});
				}
			}

		});

	}
])

.controller('SensorSubscription', [
	'$scope',
	function($scope) {

	}
])

.controller('LabCtrl', [
	'$scope',
	'$state',
	'RedeLab',
	function($scope, $state, Lab) {

		$scope.$watch(function() {
			return Lab.getToken();
		}, function(token) {
			$scope.token = token;
			if(token && $state.current.name == 'lab') {
				$state.go('lab.form');
			} else if(!token && $state.current.name == 'lab.form') {
				$state.go('lab');
			}
		});

		$scope.logout = function() {
			Lab.setToken('');
		};

		$scope.login = function(token) {
			Lab.setToken(token);
		};

	}
]);
