/* global angular */

angular.module('bichoApp.protetor', ['ui.router', 'uiGmapgoogle-maps'])

	.config(function($stateProvider) {

		$stateProvider.state('protetor', {

			url: '/protetor',
			templateUrl: 'protetor/protetor.html',
			controller: 'protetorController',
			data: {
				requireLogin: true
			},
			resolve: {
				validateToken: function(TokenService) {
					return TokenService.validate();
				},
				remoteProtetor: function(Protetor) {
					return Protetor.get().$promise;
				}
			}
		});
	})
	
	.factory('Protetor', function($resource, serviceBaseUrl) {
		return $resource(serviceBaseUrl + '/private/user/protector');
	})

	.controller('protetorController', function($scope, remoteProtetor, $state) {
		$scope.dto = remoteProtetor;
		$scope.map = {};
		$scope.search = {};
		$scope.circle = {};
		$scope.marker = {};
		$scope.isProtetor = function() {
			return remoteProtetor.centro && remoteProtetor.raio;
		}();

        var current = function() {
        	navigator.geolocation.getCurrentPosition(function(position) {
	        	$scope.dto.centro = {
	        		latitude: position.coords.latitude,
	        		longitude: position.coords.longitude
	        	};
	        	$scope.$apply();
        	});
        };

        if(!$scope.isProtetor) {
            current();
            $scope.dto.raio = 2;
        }
		$scope.$watch('dto.raio', function(newValue) {
			$scope.circle.radius = parseFloat(newValue) * 1000;
		});
		$scope.$watch('dto.centro', function(newValue) {
			if(newValue) {
				$scope.map.center = {
					latitude: newValue.latitude,
					longitude: newValue.longitude
				};
			}
		});

    	$scope.map.zoom = 13;
        $scope.map.options = {
            disableDefaultUI: true,
            zoomControl: true,
            scrollwheel: false
        };

		$scope.search.template = 'searchBox.html';
		$scope.search.events = {
			places_changed: function(searchBox) {
				var place = searchBox.getPlaces()[0];
				$scope.dto.centro = {
					latitude: place.geometry.location.lat(),
					longitude: place.geometry.location.lng()
				};
				$scope.map.center = angular.copy($scope.dto.centro);
			}
		};
		
		$scope.marker.options = {
			draggable: true
		};
		$scope.marker.events = {
			dragend: function() {
				$scope.map.center = angular.copy($scope.dto.centro);
			}
		};
		
		$scope.set = function() {
			$scope.dto.$save(null, function() {
				$state.reload();
			});
		};
		
		$scope.unset = function() {
			$scope.dto.$remove(null, function() {
				$state.reload();
			});
		};
	})
;