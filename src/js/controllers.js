'use strict';

angular.module('rede')

.controller('HomeCtrl', [
	'$scope',
	'RedeService',
	function($scope, Rede) {

		// Rede.user.query(function(data) {
		// 	console.log(data);
		// });

		$scope.map = {};

		$scope.map.baseLayer = 'https://{s}.tiles.mapbox.com/v3/infoamazonia.forest-height,infoamazonia.osm-brasil/{z}/{x}/{y}.png';

		$scope.map.layers = [
			{
				user: 'infoamazonia',
				sql: "SELECT * FROM merge_fiocruz WHERE municipio LIKE 'Santarém' OR municipio LIKE 'Belterra'",
				cartocss: '#layer{polygon-opacity:.7;line-color:#FFF;line-width:.5;line-opacity:1;polygon-fill:transparent}'
			}
		];

	}
]);