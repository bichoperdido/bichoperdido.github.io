/* global angular */
angular.module('bichoApp.anuncio.meus', ['ui.router', 'ngResource'])

	.config(function($stateProvider) {
		$stateProvider.state('meusAnuncios', {
			url: '/anuncio/meus',
			templateUrl: 'anuncio/meus.html',
			controller: 'meusAnunciosCtrl',
            data: {
                requireLogin: true
            },
            resolve: {
                remoteAnuncios: function ($http, serviceBaseUrl) {
				    return $http.get(serviceBaseUrl + '/private/poster/my').then(function(response) {
				        if(response.data.bpError) {
				            return [];
				        }
				        return response.data;
				    });
				}
            }
		});
	})
	
	.controller('meusAnunciosCtrl', function($scope, remoteAnuncios, serviceBaseUrl, $http, $state) {
	    $scope.serviceBaseUrl = serviceBaseUrl;
		$scope.emAberto = [];
		$scope.resolvidos = [];
		remoteAnuncios.forEach(function(anuncio) {
		    switch(anuncio.status.toLowerCase()) {
		        case 'aberto': $scope.emAberto.push(anuncio); break;
		        case 'resolvido': $scope.resolvidos.push(anuncio); break;
		    }
		});
		$scope.remove = function(id) {
			if(confirm('Confirma exclusão do anúncio?')) {
				$http.get(serviceBaseUrl + '/private/poster/delete/' + id).then(function() {
					$state.reload();
				});
			}
		};
		$scope.solve = function(id) {
			if(confirm('Ocorrências resolvidas não aparecem nas buscas. Confirma?')) {
				$http.get(serviceBaseUrl + '/private/poster/resolved/' + id).then(function() {
					$state.reload();
				});
			}
		};
	})
;