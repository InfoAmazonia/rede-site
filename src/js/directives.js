'use strict';

angular.module('rede')

.factory('CartoDBService', [
	function() {

		return {
			getTiles: function(config, cb) {
				cartodb.Tiles.getTiles({
					user_name: config.user,
					sublayers: [
						{
							sql: config.sql,
							cartocss: config.cartocss,
							interactivity: config.interactivity
						}
					],
				}, function(tiles, err) {
					cb(tiles, err);
				});
			},
			getBounds: function(config, cb) {
				var sql = new cartodb.SQL({ user: config.user });
				sql.getBounds(config.sql).done(function(bounds) {
					cb(bounds);
				});
			},
			getTilejson: function(tiles, template) {
				// TODO TILEJSON
				return {
					"scheme": "xyz",
					"tilejson": "2.0.0",
					"grids": [
						tiles.grids[0][0].replace('{s}', 'a'),
						tiles.grids[0][0].replace('{s}', 'b'),
						tiles.grids[0][0].replace('{s}', 'c')
					],
					"tiles": [
						tiles.tiles[0].replace('{s}', 'a'),
						tiles.tiles[0].replace('{s}', 'b'),
						tiles.tiles[0].replace('{s}', 'c')
					],
					"template": template
				};
			}
		}

	}
])

.directive('cartodb', [
	'$q',
	'CartoDBService',
	function($q, cdb) {
		return {
			restrict: 'E',
			template: '<div id="cartodb-map" class="interactive-map"></div>',
			scope: {

				mapId: '@',

				user: '=',
				sql: '=',
				interactivity: '=',
				cartocss: '=',
				baseLayer: '=',
				template: '=',

				layers: '=',
				boundsIndex: '='

			},
			link: function(scope, element, attrs) {

				var map = L.map('cartodb-map', {
					center: [0,0],
					zoom: 2,
					scrollWheelZoom: true
				});

				L.tileLayer(scope.baseLayer).addTo(map);

				var legendControl = L.mapbox.legendControl();

				map.addControl(legendControl);

				if(scope.layers) {

					_.each(scope.layers, function(layer) {

						if(layer.legend) {
							legendControl.addLegend(layer.legend);
						}

						cdb.getTiles(layer, function(tiles) {

							var tilejson = cdb.getTilejson(tiles, layer.template);

							var tileLayer = L.mapbox.tileLayer(tilejson);
							var gridLayer = L.mapbox.gridLayer(tilejson);

							map.addLayer(tileLayer);
							map.addLayer(gridLayer);

							map.addControl(L.mapbox.gridControl(gridLayer));

						});

					});

					if(scope.boundsIndex) {

						cdb.getBounds({
							user: scope.layers[scope.boundsIndex].user,
							sql: scope.layers[scope.boundsIndex].sql
						}, function(bounds) {
							map.fitBounds(bounds);
						});

					}

				} else {
					cdb.getTiles({
						user: scope.user,
						sql: scope.sql,
						cartocss: scope.cartocss,
						interactivity: scope.interactivity
					}, function(tiles) {

						var tilejson = cdb.getTilejson(tiles, scope.template);

						var tileLayer = L.mapbox.tileLayer(tilejson);
						var gridLayer = L.mapbox.gridLayer(tilejson);

						map.addLayer(tileLayer);
						map.addLayer(gridLayer);

						map.addControl(L.mapbox.gridControl(gridLayer));

					});

					cdb.getBounds({
						user: scope.user,
						sql: scope.sql
					}, function(bounds) {
						map.fitBounds(bounds);
					});
				}

			}
		}
	}
])

.directive('latestReadings', [
	'RedeService',
	'$interval',
	function(Rede, $interval) {
		return {
			restrict: 'E',
			scope: {
				'sensor': '=',
				'amount': '='
			},
			templateUrl: '/views/sensor/latest-readings.html',
			link: function(scope, element, attrs) {

				scope.fromNow = function(reading) {
					return moment(reading.timestamp).fromNow();
				};

				scope.amount = scope.amount || 3;

				var latestInterval = false;

				scope.$watch('sensor', function(sensor) {
					if(latestInterval) {
						$interval.cancel(latestInterval);
					}
					if(sensor) {
						// EXTRACTING SAMPLE
						scope.latest = _.sample(Rede.sample.readings, scope.amount);
						latestInterval = $interval(function() {
							scope.latest = _.sample(Rede.sample.readings, scope.amount);
						}, 3 * 1000);
						scope.$on('$destroy', function() {
							$interval.cancel(latestInterval);
						});
					} else {
						scope.latest = [];
					}
				});
			}
		}
	}
])

.directive('sensorChartSummary', [
	'RedeService',
	'$interval',
	function(Rede, $interval) {
		return {
			restrict: 'E',
			scope: {
				'sensor': '='
			},
			templateUrl: '/views/sensor/chart-summary.html',
			link: function(scope, element, attrs) {

				scope.chartFilters = [
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

				scope.currentFilter = scope.chartFilters[0];

				scope.chartMeasure = function(type, label) {
					scope.currentFilter = {
						type: type,
						label: label
					}
				};

				scope.$watch('sensor', function(sensor) {
					if(sensor) {
						// EXTRACTING SAMPLE
						scope.readings = _.sortBy(Rede.sample.readings, function(item) { return new Date(item.timestamp); });
					} else {
						scope.readings = [];
					}
				});

			}
		}
	}
])

.directive('sensorSummary', [
	function() {
		return {
			restrict: 'E',
			scope: {
				sensorId: '=sensor'
			},
			templateUrl: '/views/sensor/summary.html',
			link: function(scope, element, attrs) {

			}
		}
	}
])

.directive('readingChart', [
	function() {
		return {
			restrict: 'E',
			scope: {
				'dataset': '=',
				'type': '=',
				'label': '='
			},
			template: '<div google-chart chart="chart"></div>',
			link: function(scope, element, attrs) {

				function init() {

					var data = [['', scope.label, 'Média']];

					_.each(scope.dataset, function(d, i) {
						if(i <= 23)
							data.push([new Date(d.timestamp), d[scope.type]]);
					});

					// Extract average
					var total = 0;
					_.each(data, function(d, i) {
						if(i != 0)
							total = total + d[1];
					});

					var average = total / (data.length-1);

					_.each(data, function(d, i) {
						if(i != 0)
							d.push(average);
					});

					// See https://google-developers.appspot.com/chart/interactive/docs/gallery/linechart
					scope.chart = {
						type: 'google.charts.Line',
						data: data,
						curveType: 'function',
						options: {
							chartArea: {
								left: 0,
								top: 0,
								bottom: 0,
								right: 0
							},
							legend: {position: 'none'}
						}
					};

				}

				var destroy = function() {

					scope.chart = null;

				};

				scope.$watchGroup(['type', 'dataset'], function() {
					if(scope.type && scope.dataset) {
						init();
					} else {
						destroy();
					}
				});
			}
		}
	}
]);