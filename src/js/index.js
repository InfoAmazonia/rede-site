window.angular = require('angular');
window._ = require('underscore');

require('angular-ui-router');
require('angular-resource');

var app = angular.module('rede', [
	'ui.router', 
	'ngResource'
]);

require('./service');

app.controller('TestCtrl', [
	'$scope',
	'RedeService',
	function($scope, Rede) {

		Rede.user.query(function(data) {
			console.log(data);
		});

	}
]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['rede']);
});