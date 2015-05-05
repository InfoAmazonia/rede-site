'use strict';

angular.module('rede')

.controller('MapCtrl', [
	'$scope',
	'CartoDBService',
	'leafletData',
	function($scope, CartoDB, leafletData) {

		/* 
		 * Map
		 */

		$scope.map = {
			center: {
				lat: 0,
				lng: 0,
				zoom: 2
			}
		};

		$scope.map.baseLayer = 'https://{s}.tiles.mapbox.com/v3/infoamazonia.forest-height,infoamazonia.osm-brasil/{z}/{x}/{y}.png';

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
	function($scope, Rede, CartoDB, leafletData, $interval) {

		// Rede.user.query(function(data) {
		// 	console.log(data);
		// });

		Rede.stories
			.success(function(data) {
				console.log(data);
			})
			.error(function(data, status, headers, config) {
				console.log(data);
			});

		Rede.data.states.success(function(data) {
			console.log(data);
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

		$scope.geojson = {
			data: Rede.sample.sensors,
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
				layer.bindPopup("Sensor #" + sCount);
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
						$scope.sensor = 1;
					});
				});
				sCount++;
			}
		};

		var latLngs = [];
		_.each(Rede.sample.sensors.features, function(feature) {
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

		$scope.sensors = Rede.sample.sensors.features;

		console.log($scope.sensors);

	}
])

.controller('SensorCtrl', [
	'$scope',
	'RedeService',
	'leafletData',
	function($scope, Rede, leafletData) {
		$scope.sensor = 1;

		var sCount = 1;

		$scope.geojson = {
			data: Rede.sample.sensors,
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
		_.each(Rede.sample.sensors.features, function(feature) {
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

		$scope.chartFilters = [
			{
				type: 'ph',
				label: 'pH'
			},
			{
				type: 'water_temp',
				label: 'Temperatura'
			},
			{
				type: 'luminosity',
				label: 'Luminosidade'
			},
			{
				type: 'water_conductivity',
				label: 'Condutividade'
			},
			{
				type: 'turbidity',
				label: 'Turbidez'
			},
			{
				type: 'orp',
				label: 'ORP'
			},
			{
				type: 'acceleration',
				label: 'Aceleração'
			}
		];

		$scope.currentFilter = $scope.chartFilters[0];

		$scope.chartMeasure = function(type, label) {
			$scope.currentFilter = {
				type: type,
				label: label
			}
		};

		$scope.$watch('sensor', function(sensor) {
			if(sensor) {
				// EXTRACTING SAMPLE
				$scope.readings = _.sortBy(Rede.sample.readings, function(item) { return new Date(item.timestamp); });
			} else {
				$scope.readings = [];
			}
		});
	}
]);