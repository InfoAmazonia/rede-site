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
	'$q',
	function(Rede, $interval, $q) {
		return {
			restrict: 'E',
			scope: {
				'sensor': '=',
				'amount': '=',
				'params': '='
			},
			templateUrl: '/views/sensor/latest-readings.html',
			link: function(scope, element, attrs) {

				Rede.getParameters().then(function(params) {
					scope.availableParams = params;
					scope.params = scope.params || Object.keys(params);
				});

				scope.hasParam = function(param) {
					return _.find(scope.params, function(p) { return p == param; });
				};

				scope.getParam = function(param) {
					return scope.availableParams[param];
				}

				scope.scoreParam = function(param, score) {
					return _.find(score.parameters, function(sP) { return sP.parameter == param; });
				};

				scope.fromNow = function(reading) {
					return moment().fromNow();
				};

				scope.amount = scope.amount || 3;

				scope.dateRanges = [];

				for(var i = 0; i < scope.amount; i++) {
					scope.dateRanges.push(moment().subtract(i, 'hours'));
				};

				var latestInterval = false;

				var parseScore = function(score) {
					if(score.score < 3.33) {
						score.quality = 1;
					} else if(score.score < 7.77) {
						score.quality = 2;
					} else {
						score.quality = 3;
					}
					return score;
				};

				scope.labelQuality = function(quality) {
					var label;
					switch(quality) {
						case 1:
							label = 'Ruim';
							break;
						case 2:
							label = 'Média';
							break;
						case 3:
							label = 'Boa';
							break;
					}
					return label;
				}

				scope.$watch('sensor', function(sensor) {
					if(latestInterval) {
						$interval.cancel(latestInterval);
					}
					if(sensor) {
						var promises = [];
						_.each(scope.dateRanges, function(date) {
							promises.push(Rede.sensors.getScore({'id': scope.sensor, 'date': date.format()}).$promise);
						});
						$q.all(promises).then(function(data) {
							scope.latest = data.map(function(score) { return parseScore(score); });
						});
						latestInterval = $interval(function() {
							Rede.sensors.getScore({'id': scope.sensor}, function(score) {
								scope.latest.unshift(parseScore(score));
							});
						}, 20 * 1000);
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

				Rede.getParameters().then(function(params) {

					scope.chartParams = params;

					scope.curParam = scope.chartParams[Object.keys(scope.chartParams)[0]]._id;

					scope.chartMeasure = function(id) {
						scope.curParam = id;
					};

					scope.$watchGroup(['sensor', 'curParam'], function() {
						updateData();
					});

					var updateData = function() {
						if(scope.curParam && scope.sensor) {
							Rede.measurements.query({'sensor_id': scope.sensor, 'parameter_id': scope.curParam}, function(measures) {
								scope.measures = measures.measurements;
							});
						}
					}

				});

			}
		}
	}
])

.directive('sensorSummary', [
	'RedeService',
	function(Rede) {
		return {
			restrict: 'E',
			scope: {
				sensorId: '=sensor'
			},
			templateUrl: '/views/sensor/summary.html',
			link: function(scope, element, attrs) {
				scope.$watch('sensorId', function(sensorId) {
					if(typeof sensorId == 'object')
						scope.sensor = sensorId;
					else if(typeof sensorId == 'string') {
						Rede.sensors.get({id: sensorId}, function(sensor) {
							scope.sensor = sensor;
						});
					}
				});
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
				'label': '='
			},
			template: '<div google-chart chart="chart"></div>',
			link: function(scope, element, attrs) {

				function init() {

					var data = [['', scope.label || '', 'Média']];

					_.each(scope.dataset, function(d, i) {
						data.push([new Date(d.collectedAt), d.value]);
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

				scope.$watch('dataset', function() {
					if(scope.dataset) {
						init();
					} else {
						destroy();
					}
				});
			}
		}
	}
])

.directive('scrollFixed', [
	function() {

		return {
			restrict: 'A',
			link: function(scope, element, attrs) {

				$(document).ready(function() {

					var $element = $(element);
					var offset = $element.offset().top;

					var clone = false;

					var anchorOffset = 0;

					var resize = function() {
						offset = $element.offset().top;
						if(clone) {
							clone.css({
								left: $element.offset().left
							});
							if(parseInt(attrs.useWidth)) {
								close.css({
									width: $element.width()
								});
							}
						}
					};

					var scroll = function() {
						var scrollTop = $(window).scrollTop();
						if(scrollTop >= offset) {
							if(!clone && !clone.length) {
								clone = $element.clone();
								clone.css({
									left: $element.offset().left
								});
								if(parseInt(attrs.useWidth)) {
									clone.css({
										width: $element.width()
									});
								}
								clone.addClass('scroll-fixed').insertAfter($element);
								anchorOffset = clone.height() + 42;
								$('.anchor-section').each(function() {
									var section = $(this);
									section.css({
										'padding-top': '+=' + anchorOffset + 'px',
										'margin-top': '-=' + anchorOffset + 'px'
									});
								});
							}
						} else {
							if(clone && clone.length) {
								clone.remove();
								clone = false;
								$('.anchor-section').each(function() {
									var section = $(this);
									section.css({
										'padding-top': '-=' + anchorOffset + 'px',
										'margin-top': '+=' + anchorOffset + 'px'
									});
								});
							}
						}
					}

					$(window).bind('resize', resize);
					$(window).bind('scroll', scroll);

				});

				scope.$on('$destroy', function() {
					$(window).unbind('resize');
					$(window).unbind('scroll');
				});

			}
		}

	}
])

.directive('authForm', [
	'RedeService',
	'RedeAuth',
	'MessageService',
	'$timeout',
	function(Rede, Auth, Message, $timeout) {
		return  {
			restrict: 'E',
			scope: {
				cb: '=callback',
				submitLabel: '='
			},
			templateUrl: '/views/auth.html',
			link: function(scope, element, attrs) {

				scope.form = 'register';

				scope.switch = function(form) {
					scope.form = form;
				};

				scope.register = function(user, cb) {
					if(user.password !== user.password_repeat) {
						Message.add('Verifique se as senhas digitadas são iguais');
					} else {
						Auth.register(user).then(function(data) {
							if(typeof scope.cb == 'function') {
								$timeout(function() {
									scope.cb(data);
								}, 50);
							}
						});
					}
				}

				scope.login = function(credentials) {
					Auth.login(credentials).then(function(data) {
						if(typeof scope.cb == 'function') {
							$timeout(function() {
								scope.cb(data);
							}, 50);
						}
					});
				}

				scope.auth = function(user) {
					if(scope[scope.form])
						scope[scope.form](user);
				}

			}
		}
	}
]);
