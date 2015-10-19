/* global angular */

/**
 * @see https://gist.github.com/monkeymonk/ccf698e7b71ba22f098a
 */
function removeAccents(source) {
    var accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ],
    noaccent = ['A','a','E','e','I','i','O','o','U','u','N','n','C','c'];

    for (var i = 0; i < accent.length; i++){
        source = source.replace(accent[i], noaccent[i]);
    }

    return source;
}

angular.module('bichoApp.busca', ['ui.router', 'uiGmapgoogle-maps', 'ngTagsInput'])

	.config(function($stateProvider) {

		$stateProvider.state('busca', {

			url: '/busca',
			templateUrl: 'busca/busca.html',
			controller: 'buscaController'
		});
	})
	
	.directive('bpKeywords', function($filter) {
		return {
			restrict: 'A',
			require: 'ngModel',
			link: function(scope, elem, attrs, ctrl) {
				//ctrl.$parsers.push(removeAccents);
				ctrl.$parsers.push(function(value) {
					return value.split(/\W+/);
				});
			}
		};
	})
	
	.controller('buscaController', function($scope, $resource, serviceBaseUrl, uiGmapIsReady, $timeout) {
		
		$scope.dto = {};
		$scope.map = {};
		$scope.markers = [];
		$scope.search = {};
		$scope.models = {};
		$scope.models.keywords = [];
		$scope.dto.keywords = [];
		
		$scope.$watch('models.keywords.length', function() {
			$scope.dto.keywords = $scope.models.keywords.map(function(obj) {
				return obj.text;
			});
		});
		
		$scope.now = function() {
			return new Date();
		};
		$scope.dto.dataFinal = $scope.now();

    	$scope.map.zoom = 15;
        $scope.map.options = {
            disableDefaultUI: true,
            zoomControl: true,
            scrollwheel: false
        };
        $scope.map.window = {};
        $scope.map.window.close = function() {
        	$scope.map.window.show = false;
        };
        
        var onNewBounds = function(map) {
			$scope.dto.fronteiras = {
				nordeste: {
					latitude: map.getBounds().getNorthEast().lat(),
					longitude: map.getBounds().getNorthEast().lng()
				},
				sudoeste: {
					latitude: map.getBounds().getSouthWest().lat(),
					longitude: map.getBounds().getSouthWest().lng()
				}
			};
			updateMarkers();
        };
        
        var map;
        
        uiGmapIsReady.promise(1).then(function(instances) {
        	map = instances[0].map;
        	onNewBounds(map);
        });

        $scope.map.events = {
        	dragend: onNewBounds,
        	zoom_changed: onNewBounds
        };

        $scope.current = function() {
        	navigator.geolocation.getCurrentPosition(function(position) {
	        	$scope.map.current = {
	        		latitude: position.coords.latitude,
	        		longitude: position.coords.longitude
	        	};
	        	$scope.map.center = angular.copy($scope.map.current);
	        	$scope.$apply();
        	});
        };
        
        $scope.current();
        
        /*
        var script = document.createElement('script');
        script.src = 'mocks/mapSearch.js';
        document.body.appendChild(script);
        */
        
        var Search = $resource(serviceBaseUrl + '/public/poster/search', null, {
			query: {
				method: 'POST',
				isArray: false
			}
		});
        
		var updateMarkers = function() {
			Search.query(angular.extend({}, $scope.dto, {
				keywords: undefined,
				paginaTamanho: undefined,
				paginaNumero: undefined,
				ordemCampo: undefined,
				ordemSentido: undefined
			}), function(data) {
				$scope.markers = data.resultados.map(function(marker) {
					marker.icon = 'markers/' + marker.natureza + '_' + marker.especie + '_' + marker.genero + '.png';
					marker.show = false;
					marker.click = function() {
						marker.show = !marker.show;
					};
					marker.miniatura = serviceBaseUrl + marker.miniatura;
					return marker;
				});
			});
			/*
			$scope.markers = mockByBounds($scope.dto.fronteiras.nordeste, $scope.dto.fronteiras.sudoeste, 10).map(function(marker, index) {
				marker.icon = 'markers/' + marker.natureza + '_' + marker.especie + '_' + marker.genero + '.png';
				marker.miniatura = 'mocks/image.jpg';
				marker.nome = 'Onizuka';
				marker.id = index+1;
				marker.show = false;
				marker.click = function() {
					marker.show = true;
				};
				return marker;
			});
			*/
		};
		
		$scope.search.template = 'searchBox.html';
		$scope.search.events = {
			places_changed: function(searchBox) {
				var place = searchBox.getPlaces()[0];
				$scope.map.center = {
					latitude: place.geometry.location.lat(),
					longitude: place.geometry.location.lng()
				};
				$scope.map.current = angular.copy($scope.map.center);
				$timeout(function() {
					onNewBounds(map);
				}, 250);
			}
		};
		
		$scope.$watchGroup([
			'dto.natureza',
			'dto.dataInicial',
			'dto.dataFinal',
			'dto.especie',
			'dto.genero'
		], function() {
			if($scope.dto.fronteiras) {
				updateMarkers();
			}
			if($scope.results) {
				$scope.updateResults();
			}
		});
		
		$scope.updateResults = function() {
			Search.query(angular.extend({}, $scope.dto, {
				fronteiras: undefined
			}), function(data) {
				$scope._totalResults = data.tamanho;
				$scope.results = data.resultados.map(function(result) {
					result.miniatura = serviceBaseUrl + result.miniatura;
					return result;
				});
			});
		};
		
		$scope.dto.paginaNumero = 1;
		$scope.dto.paginaTamanho = 10;
		
		$scope.pageChanged = function() {
			$scope.updateResults();
		};
	})
;