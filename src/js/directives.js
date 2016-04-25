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
	'gettextCatalog',
	function(Rede, $interval, $q, gettextCatalog) {
		return {
			restrict: 'E',
			scope: {
				'sensor': '=',
				'amount': '=',
				'params': '='
			},
			templateUrl: '/views/sensor/latest-readings.html',
			link: function(scope, element, attrs) {

				scope.paramLang = '';
				scope.$watch(function() {
					return gettextCatalog.getCurrentLanguage();
				}, function(lang) {
					if(lang == 'pt_BR')
						scope.paramLang = 'pt';
					else
						scope.paramLang = 'en';
				});

				Rede.getParameters().then(function(params) {
					scope.availableParams = params;
					scope.params = scope.params || Object.keys(params);
				});

				scope.hasParam = function(param) {
					return _.find(scope.params, function(p) { return p == param; });
				};

				scope.getParam = function(param) {
					if(scope.availableParams)
						return scope.availableParams[param];
				}

				scope.paramMeasurement = function(group, param) {
					return _.find(group.measurements, function(gM) {
						if(gM && gM.parameter) return gM.parameter == param;
						else return false;
					});
				};

				scope.fromNow = function(group) {
					return moment(group._id).fromNow();
				};

				scope.formattedDate = function(group) {
					return moment(group._id).format('LLLL');
				}

				scope.amount = scope.amount || 3;

				var latestInterval = false;


				scope.$watch('sensor', function(sensor) {
					if(latestInterval) {
						$interval.cancel(latestInterval);
					}
					if(sensor) {
						Rede.measurements.group({'sensor_id': scope.sensor}, function(data) {
							scope.latest = data.measurementGroups;
						});
					} else {
						scope.latest = [];
					}
				});

				scope.$on('$destroy', function() {
					$interval.cancel(latestInterval);
				});
			}
		}
	}
])

.directive('sensorChartSummary', [
	'RedeService',
	'$interval',
	'gettextCatalog',
	function(Rede, $interval, gettextCatalog) {
		return {
			restrict: 'E',
			scope: {
				'sensor': '='
			},
			templateUrl: '/views/sensor/chart-summary.html',
			link: function(scope, element, attrs) {

				scope.paramLang = '';
				scope.$watch(function() {
					return gettextCatalog.getCurrentLanguage();
				}, function(lang) {
					if(lang == 'pt_BR')
						scope.paramLang = 'pt';
					else
						scope.paramLang = 'en';
				});

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
	'googleChartApiPromise',
	'gettext',
	'gettextCatalog',
	function(googleChartApiPromise, gettext, gettextCatalog) {
		return {
			restrict: 'E',
			scope: {
				'dataset': '=',
				'label': '='
			},
			template: '<div google-chart chart="chart" style="width:100%;height:300px;"></div>',
			link: function(scope, element, attrs) {

				function getTooltip(data, date) {

					var dateString;
					if(data._id.hour) {
						dateString = moment(date).format('LLL');
					} else {
						dateString = moment(date).format('LL');
					}

					var tooltip = '<div class="google-chart-tooltip">';

					tooltip += '<h3>' + dateString + '</h3>';

					// console.log(data);

					var avgStr = gettext('Média');
					var minStr = gettext('Mínima');
					var maxStr = gettext('Máxima');

					if(data.avg == data.max) {
						tooltip += '<p class="single">' + data.avg.toFixed(2) + '</p>';
					} else {
						tooltip += '<table><tbody>';
						tooltip += '<tr><th>' + gettextCatalog.getString(avgStr) + '</th><td>' + data.avg.toFixed(2) + '</td></tr>';
						tooltip += '<tr><th>' + gettextCatalog.getString(minStr) + '</th><td>' + data.min.toFixed(2) + '</td></tr>';
						tooltip += '<tr><th>' + gettextCatalog.getString(maxStr) + '</th><td>' + data.max.toFixed(2) + '</td></tr>';
						tooltip += '</tbody></table>';
					}

					tooltip += '</div>';

					return tooltip;

				}

				function init() {

					var label = scope.label || '';

					// var data = [['', label + ' (média)', label + ' (máximo)', label + ' (mínimo)']];

					var data = [];

					_.each(scope.dataset, function(d, i) {
						var date = new Date(d._id.year, 0, 1);
						if(d._id.week) {
							var offset = date.getTimezoneOffset();
							date.setDate(date.getDate() + 4 - (date.getDay() || 7));
							date.setTime(date.getTime() + 7 * 24 * 60 * 60 * 1000 * (d._id.week + (d._id.year == date.getFullYear() ? -1 : 0 )));
							// daylight savings fix
							date.setTime(date.getTime() + (date.getTimezoneOffset() - offset) * 60 * 1000);
							// back to Monday (from Thursday)
							date.setDate(date.getDate() - 3);
						}
						if(d._id.month) {
							date.setMonth(d._id.month-1);
						}
						if(d._id.day) {
							date.setDate(d._id.day);
						}
						if(d._id.hour) {
							date.setHours(d._id.hour);
						}
						data.push([date, d.avg, getTooltip(d, date), d.max, d.min]);
					});

					data = _.sortBy(data, function(d) { return d[0]; });

					var dataTable = new google.visualization.DataTable();

					dataTable.addColumn('date', 'Data');
					dataTable.addColumn('number', 'Average');
					dataTable.addColumn({type: 'string', role: 'tooltip', p: {html: true}});
					dataTable.addColumn({id: "max", type:'number', role:'interval'});
					dataTable.addColumn({id: "min", type:'number', role:'interval'});

					dataTable.addRows(data);

					scope.chart = {
						type: 'LineChart',
						data: dataTable,
						options: {
							curveType: 'function',
							intervals: {
								color: '#666',
								style: 'bars',
								pointSize: 4,
								barWidth: 0,
								lineWidth: 1
							},
			        series: [{'color': '#1858ac'}],
							lineWidth: 3,
							// chartArea: {
							// 	left: 0,
							// 	top: 0,
							// 	bottom: 0,
							// 	right: 0
							// },
							legend: 'none',
							tooltip: {
								isHtml: true
							}
						}
					};

					// scope.chart = google.visualization.LineChart(dataTable, )

				}

				var destroy = function() {

					scope.chart = null;

				};

				googleChartApiPromise.then(function() {
					scope.$watch('dataset', function() {
						if(scope.dataset && scope.dataset.length) {
							init();
						} else {
							destroy();
						}
					});
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

					// $('.anchor-section').wrapAll('<div class="anchor-section-container" />');

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
									if(!section.parent().hasClass('anchor-section-container')) {
										section.wrapAll('<div class="anchor-section-container" />');
									}
									section.parent().css({
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
									if(!section.parent().hasClass('anchor-section-container')) {
										section.wrapAll('<div class="anchor-section-container" />');
									}
									section.parent().css({
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
	'gettext',
	function(Rede, Auth, Message, $timeout, gettext) {
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
						Message.add(gettext('Verifique se as senhas digitadas são iguais'));
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
