'use strict';

angular.module('rede')

.factory('CartoDBService', [
	function() {

		var count = 0;

		return {
			count: function(add) {
				if(add == true) {
					count++;
				}
				return count;
			},
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

				cdb.count(true);

				var map = L.map('cartodb-map', {center: [0,0], zoom: 2, scrollWheelZoom: false});

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
]);