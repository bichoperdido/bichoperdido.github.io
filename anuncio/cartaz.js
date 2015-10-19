/* global angular ntc */
angular.module('bichoApp.anuncio.cartaz', ['ui.router'])

    .config(function($stateProvider) {
        $stateProvider.state('cartaz', {
            url: '/anuncio/{id:int}/cartaz',
            templateUrl: 'anuncio/cartaz.html',
            controller: 'cartazCtrl',
            resolve: {
                remoteAnuncio: function($resource, serviceBaseUrl, $stateParams) {
                    return $resource(serviceBaseUrl + '/public/poster/' + $stateParams.id).get().$promise;
                }
            }
        });
    })
    
    .controller('cartazCtrl', function($scope, remoteAnuncio, serviceBaseUrl, $location, $window, $stateParams) {
        $scope.$stateParams = $stateParams;
        $scope.$location = $location;
        $scope.imprimir = function() {
            $window.print();
        };
        $scope.anuncio = remoteAnuncio;
        $scope.capa = function() {
            if(!$scope.anuncio.imagens.length) {
                return 'bp.png';
            }
            return serviceBaseUrl + $scope.anuncio.imagens.filter(function(obj) {
                return obj.capa;
            })[0].imagem;
        };
    })
    
    .filter('natureza', function() {
        return function(natureza, genero) {
            if(genero == 'femea') {
                return natureza.slice(0, -1) + 'a';
            }
            return natureza;
        };
    })
    
    .filter('especie', function() {
        return function(especie, genero) {
            switch(especie) {
                case 'cachorro':
                    switch(genero) {
                        case 'femea': return 'cadela';
                        default: return 'cão';
                    }
                case 'gato':
                    switch(genero) {
                        case 'femea': return 'gata';
                        default: return 'gato';
                    }
            }
        };
    })
    
    .filter('porte', function() {
        return function(porte) {
            if(porte == 'medio') {
                return 'médio';
            }
            return porte;
        };
    })
    
    .filter('cores', function() {
        return function(cores) {
            var r = '';
            cores.forEach(function(hex, index) {
                r += '&ldquo;' + ntc.name(hex)[1] + '&rdquo;';
                if(index < cores.length - 1) {
                    r += (index == cores.length - 2) ? ' e ' : ', ';
                }
            });
            return r;
        };
    })
    
    .filter('peculiaridades', function() {
        return function(peculiaridades) {
            var r = '';
            peculiaridades.forEach(function(p, index) {
                r += p.oQue + ' no(a) ' + p.onde;
                if(index < peculiaridades.length - 1) {
                    r += (index == peculiaridades.length - 2) ? ' e ' : ', ';
                }
            });
            return r;
        };
    })
    
    .filter('tel', function() {
        return function(tel) {
            return tel ? '(' + tel.slice(0, 2) + ')' + ' ' + tel.slice(2) : '';
        };
    })
;