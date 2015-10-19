/* global angular */
function staticAnuncio($resource, serviceBaseUrl, $stateParams) {
    return $resource(serviceBaseUrl + '/public/poster/:id', {id: $stateParams.id}).get().$promise;
}

function urlParams(url) {
    var a = document.createElement('a');
    a.href = url;
    var o = {};
    a.search.replace('?', '').split('&').forEach(function(kv) {
        var kva = kv.split('=');
        o[kva[0]] = kva[1];
    });
    return o;
}

angular.module('bichoApp.anuncio.detalhes', ['ui.router', 'bootstrapLightbox', 'angularFileUpload', 'ui.bootstrap'])

    .service('loadingWindow', function($uibModal) {
        this.open = function() {
            return $uibModal.open({
                template: '<div class="modal-body"><i class="fa fa-spinner fa-spin"></i> Aguarde...</div>',
                backdrop: 'static'
            });
        };
    })

    .config(function($stateProvider) {
        $stateProvider.state('detalhesAnuncio', {
            url: '/anuncio/{id:int}',
            templateUrl: 'anuncio/detalhes.html',
            controller: 'detalhesAnuncioCtrl',
            resolve: {
                staticAnuncio: staticAnuncio,
                dynamicAnuncio: function() {
                    return null;
                },
                breeds: function() {
                    return null;
                },
                quirks: function() {
                    return null;
                },
                semelhantes: function(serviceBaseUrl, staticAnuncio, $resource, $stateParams) {
                    return $resource(serviceBaseUrl + '/public/poster/similar/:type/:id/:amount/:page', {
                        type: staticAnuncio.meu ? 'reverse' : 'same',
                        id: $stateParams.id,
                        amount: 5,
                        page: 1
                    }).get().$promise;
                }
            }
        });
    })

    .config(function($stateProvider) {
        $stateProvider.state('editarAnuncio', {
            url: '/anuncio/{id:int}/editar',
            templateUrl: 'anuncio/detalhes.html',
            controller: 'detalhesAnuncioCtrl',
            data: {
                requireLogin: true
            },
            resolve: {
                breeds: function($resource, serviceBaseUrl) {
                    return $resource(serviceBaseUrl + '/public/raca').query().$promise;
                },
                quirks: function($resource, serviceBaseUrl) {
                    return {
                        whats: $resource(serviceBaseUrl + '/public/peculiaridade/tipo').get(),
                        wheres: $resource(serviceBaseUrl + '/public/peculiaridade/local').get()
                    };
                },
                staticAnuncio: staticAnuncio,
                dynamicAnuncio: function($resource, serviceBaseUrl, $stateParams, staticAnuncio, $state) {
                    delete $state.current.template;
                    if(!staticAnuncio.meu) {
                        $state.current.template = '<div class="well">Acesso negado.</div>';
                    }
                    return $resource(serviceBaseUrl + '/private/poster/edit/:id', {id: $stateParams.id}).get().$promise;
                },
                semelhantes: function() {
                    return null;
                }
            }
        });
    })
    
    .controller('detalhesAnuncioCtrl', function($scope, uiGmapGoogleMapApi, staticAnuncio, serviceBaseUrl, $state, $stateParams, dynamicAnuncio, breeds, quirks, Lightbox, $http, FileUploader, loadingWindow, $uibModal, $location, semelhantes) {
        
        /**
         * Visualização
         */
        
        $scope.static = staticAnuncio;
        $scope.serviceBaseUrl = serviceBaseUrl;
        $scope.$stateParams = $stateParams;

        $scope.map = {
            center: {
                latitude: staticAnuncio.local.coordenadas.latitude,
                longitude: staticAnuncio.local.coordenadas.longitude
            },
            zoom: 15,
            options: {
                disableDefaultUI: true,
                zoomControl: true,
                scrollwheel: false
            }
        };

        $scope.nomeLabel = function() {
            switch($scope.static.especie) {
                case 'cachorro':
                    switch($scope.static.genero) {
                        case 'femea':
                            return 'da cadela';
                        default:
                            return 'do cachorro';
                    }
                case 'gato':
                    switch($scope.static.genero) {
                        case 'femea':
                            return 'da gata';
                        default:
                            return 'do gato';
                    }
                default:
                    return 'do animal';
            }
        };
        
        /**
         * Galeria
         */
        
        var loadingInstance;
         
        $scope.uploader = new FileUploader();
        $scope.uploader.url = serviceBaseUrl + '/private/gallery/image';
        $scope.uploader.alias = 'imagem';
        $scope.uploader.headers = {'x-token': sessionStorage.getItem('token')};
        $scope.uploader.autoUpload = true;
        $scope.uploader.formData.push({anuncio: $stateParams.id});
        $scope.uploader.onBeforeUploadItem = function() {
            loadingInstance = loadingWindow.open();
        };
        $scope.uploader.onCompleteAll = function() {
            loadingInstance.close();
            $state.reload();
        };
         
        $scope._gallery = $scope.static.imagens.map(function(o) {
            return {
                url: serviceBaseUrl + o.imagem,
                miniatura: serviceBaseUrl + o.miniatura,
                capa: o.capa,
                id: o.id
            };
        });
        
        Array.prototype.push.apply($scope._gallery, $scope.static.videos.map(function(o) {
            var miniatura;
            var url;
            switch(true) {
                case /youtu\.?be/.test(o.url):
                    var id = urlParams(o.url).v || o.url.split('/').pop();
                    miniatura = 'https://img.youtube.com/vi/' + id + '/0.jpg';
                    url = 'https://www.youtube.com/watch?v=' + id;
                    break;
                default:
                    miniatura = 'data:image/jpeg;base64,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';
            }
            return {
                type: 'video',
                id: o.id,
                url: url,
                miniatura: miniatura
            };
        }));
        
        $scope.capa = function() {
            if(!$scope._gallery.length) {
                return 'bp.png';
            }
            return $scope._gallery.filter(function(o) {
                return o.capa;
            })[0].url;
        };
        
        $scope.openLightbox = function(index) {
            Lightbox.openModal($scope._gallery, index);
        };
        
        $scope.setCapa = function(id) {
            $http.get(serviceBaseUrl + '/private/gallery/cover/' + id).then(function() {
                $state.reload();
            });
        };
        
        $scope.remove = function(obj) {
            if(confirm('A exclusão é definitiva. Tem certeza?')) {
                $http.get(serviceBaseUrl + '/private/gallery/' + (obj.type || 'image') + '/delete/' + obj.id).then(function() {
                    $state.reload();
                });
            }
        };
        
        $scope.video = function() {
            var modalInstance = $uibModal.open({
                templateUrl: 'send-video.html',
                backdrop: true
            });
            modalInstance.result.then(function(result) {
                $http.post(serviceBaseUrl + '/private/gallery/video', {anuncio: $stateParams.id, url: result}).then(function() {
                    $state.reload();
                });
            });
        };
        
        if(semelhantes) {
            $scope.semelhantes = semelhantes.resultados;
        }
        
        /**
         * Edição
         */
         
        $scope._raca = {};

        $scope.isEditing = function() {
            return $state.is('editarAnuncio');
        };
        $scope.isMine = staticAnuncio.meu;
        
        $scope.edit = function() {
            $state.go('editarAnuncio', $stateParams);
        };
        
        $scope.finish = function() {
            $scope.dto.$save(function() {
                $state.go('detalhesAnuncio', $stateParams);
            });
        };
        
        $scope.cancel = function() {
            $state.go('detalhesAnuncio', $stateParams);
        };
        
        if(breeds) {
            $scope.breeds = breeds;
        }
        
        if(quirks) {
        
            $scope._peculiaridades = {
                add: function() {
                    $scope.dto.peculiaridades.push({});
                },
                remove: function($index) {
                    $scope.dto.peculiaridades.splice($index, 1);
                },
                oQues: quirks.whats,
                ondes: quirks.wheres,
            };
        }

        if(dynamicAnuncio) {
            $scope.dto = dynamicAnuncio;
            $scope._raca.model = $scope.breeds.filter(function(breed) {
                return breed.id == $scope.dto.raca;
            })[0];
            $scope.dto.peculiaridades = $scope.dto.peculiaridades.map(function(quirk) {
                Object.keys(quirk).map(function(prop) {
                    quirk[prop] = quirk[prop].toString();
                });
                return quirk;
            });
            if(!$scope.dto.peculiaridades.length) {
                $scope.dto.peculiaridades.push({});
            }
        }
   })
;