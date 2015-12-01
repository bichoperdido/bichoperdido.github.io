/* global angular */
angular.module('bichoApp.anuncio.sugestoes', ['ui.bootstrap', 'ngResource'])

    .service('SugestoesWindow', function($uibModal) {
        this.open = function(anuncioId) {
            $uibModal.open({
                templateUrl: 'anuncio/sugestoes.html',
                controller: 'sugestoesCtrl',
                resolve: {
                    remoteSugestoes: function($resource, serviceBaseUrl) {
                        return $resource(serviceBaseUrl + '/public/poster/similar/fast/:id/:limit', {id: anuncioId, limit: 3}).query().$promise;
                    }
                }
            });
        };
    })
    
    .controller('sugestoesCtrl', function($scope, remoteSugestoes, serviceBaseUrl) {
        $scope.sugestoes = remoteSugestoes;
        $scope.serviceBaseUrl = serviceBaseUrl;
    })
;