/* global angular EXIF */
function ExifLatLng(exifData) {
    var latFactor = exifData.GPSLatitudeRef == 'N' ? 1 : -1; // 'S'
    var lngFactor = exifData.GPSLongitudeRef == 'E' ? 1 : -1; // 'W'
    var fracToDouble = function(numeratorDenominatorObject) {
        return numeratorDenominatorObject.numerator / numeratorDenominatorObject.denominator;
    };
    var minToDeg = function(minutes) {
        return minutes / 60;
    };
    var secToDeg = function(seconds) {
        return seconds / 3600;
    };
    this.latitude = latFactor * (
        fracToDouble(exifData.GPSLatitude[0])
        + minToDeg(fracToDouble(exifData.GPSLatitude[1]))
        + secToDeg(fracToDouble(exifData.GPSLatitude[2]))
    );
    this.longitude = lngFactor * (
        fracToDouble(exifData.GPSLongitude[0])
        + minToDeg(fracToDouble(exifData.GPSLongitude[1]))
        + secToDeg(fracToDouble(exifData.GPSLongitude[2]))
    );
}

angular.module('bichoApp.anuncio.novo', ['ui.router', 'angularFileUpload'])
    
    .config(function($stateProvider) {
        $stateProvider.state('novoAnuncio', {
            url: '/anuncio/novo',
            templateUrl: 'anuncio/novo.html',
            controller: 'novoAnuncioCtrl',
            data: {
                requireLogin: true
            },
            resolve: {
                serverLists: function($resource, serviceBaseUrl) {
                    return {
                        breeds: $resource(serviceBaseUrl + '/public/raca').query(),
                        quirks: {
                            whats: $resource(serviceBaseUrl + '/public/peculiaridade/tipo').get(),
                            wheres: $resource(serviceBaseUrl + '/public/peculiaridade/local').get()
                        }
                    };
                }
            }
        });
    })
    
    .factory('gPlacesQuery', function(uiGmapGoogleMapApi, $q) {
        return function(input) {
            return uiGmapGoogleMapApi.then(function(maps) {
                var d = $q.defer();
                var service = new maps.places.AutocompleteService();
                service.getQueryPredictions({'input': input}, function(predictions) {
                    d.resolve(predictions);
                });
                return d.promise;
            });
        };
    })
    
    .factory('geocodeById', function(uiGmapGoogleMapApi, $q) {
        return function(placeId) {
            return uiGmapGoogleMapApi.then(function(maps) {
                var d = $q.defer();
                var geocoder = new maps.Geocoder();
                geocoder.geocode({'placeId': placeId}, function(results) {
                    if(results.length) {
                        d.resolve(results[0].geometry.location);
                    } else {
                        d.resolve(null);
                    }
                });
                return d.promise;
            });
        };
    })
    
    .factory('reverseGeocode', function(uiGmapGoogleMapApi, $q) {
        return function(lat, lng) {
            return uiGmapGoogleMapApi.then(function(maps) {
                var d = $q.defer();
                var geocoder = new maps.Geocoder();
                var latlng = new maps.LatLng(lat, lng);
                geocoder.geocode({'location': latlng}, function(results) {
                    d.resolve(results[0].formatted_address);
                });
                return d.promise;
            });
        };
    })
    
    .factory('ExifLatLng', function() {
        return function(exifData) {
            return new ExifLatLng(exifData);
        };
    })
    
    .service('PosterService', function ($resource, serviceBaseUrl) {
        
        var resource = $resource(serviceBaseUrl + '/private/poster/create');
        
        this.create = function(dto) {
            return resource.save(null, dto).$promise;
        };
    })

    .controller('novoAnuncioCtrl', function($scope, gPlacesQuery, geocodeById, reverseGeocode, getCurrentPosition, ExifLatLng, PosterService, SugestoesWindow, serverLists, $state, FileUploader, serviceBaseUrl, loadingWindow) {
        
        /**
         * Foto de capa
         */
        $scope.coverInit = function() {
            var coverFile = document.querySelector('#coverFile');
            var reader = new FileReader();
            
            reader.onloadend = function() {
                document.querySelector('#coverPreview').src = reader.result;
                /*
                $scope.dto.capa = reader.result; //$scope.isIos ? reader.result : resize(reader.result);
                $scope.$apply();
                */
            };
            
            coverFile.onchange = function() {
                var file = coverFile.files[0];
                if(file.type=='image/jpeg') {
                    if($scope.dto.natureza == 'encontrado') {
                        EXIF.getData(file, function() {
                            if(EXIF.getTag(this, 'GPSLatitude') && window.confirm("O local da foto é o mesmo da ocorrência?")) {
                                var latLng = ExifLatLng(EXIF.getAllTags(this));
                                updatePlace(latLng.latitude, latLng.longitude);
                            }
                        });
                    }
                    reader.readAsDataURL(file);
                }
            };
            
            /*
            function fixOrientation(dataURL) {
                var img = document.createElement('img');
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                img.src = dataURL;
                EXIF.getData(img, function() {
                    switch(EXIF.getTag(this, 'Orientation')) {
                        case 3:
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx.translate(canvas.width, canvas.height);
                            ctx.rotate(Math.PI);
                            break;
                        case 6:
                            canvas.width = img.height;
                            canvas.height = img.width;
                            ctx.translate(canvas.width, 0);
                            ctx.rotate(Math.PI / 2);
                            break;
                        case 8:
                            canvas.width = img.height;
                            canvas.height = img.width;
                            ctx.translate(0, canvas.height);
                            ctx.rotate(3 * Math.PI / 2);
                            break;
                        default:
                            canvas.width = img.width;
                            canvas.height = img.height;
                    }
                });
                ctx.drawImage(img, 0, 0);
                return canvas.toDataURL();
            }
            
            function resize(dataURL) {
                var img = document.createElement('img');
                img.src = dataURL;

                var MAXW = 1280;
                var MAXH = 960;
                
                var aspect = img.width / img.height;
                
                var cw = img.width > MAXW || img.height > MAXH ? MAXW : (aspect < 4/3 ? img.height * 4 / 3 : img.width);
                var ch = img.height > MAXH || img.width > MAXW ? MAXH : (aspect > 4/3 ? img.width * 3 / 4 : img.height);
                
                var canvas = document.createElement('canvas');
                var ctx = canvas.getContext('2d');
                canvas.width = cw;
                canvas.height = ch;
                
                var dw = aspect < 4/3 ? img.width * ch / img.height : cw; 
                var dh = aspect > 4/3 ? img.height * cw / img.width : ch; 
                var dx = aspect < 4/3 ? (cw - dw) / 2 : 0;
                var dy = aspect > 4/3 ? (ch - dh) / 2 : 0;
                ctx.drawImage(img, dx, dy, dw, dh);

                return canvas.toDataURL('image/jpeg', 0.75);
            }
            */
        };
        
        $scope.uploader = new FileUploader();
        $scope.uploader.url = serviceBaseUrl + '/private/gallery/image';
        $scope.uploader.alias = 'imagem';
        $scope.uploader.headers = {'x-token': sessionStorage.getItem('token')};
        
        $scope.capaHasError = function() {
            return !$scope.uploader.queue.length;
        };
        
        /**
         * Data e hora
         */

        $scope.now = function() {
            var now = new Date();
            return new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                now.getHours(),
                now.getMinutes()
            );
        };

        /**
         * Local e mapa
         */

        $scope.marker = {
            options: {
                draggable: true
            },
            events: {
                dragend: function() {
                    updatePlace($scope.marker.coords.latitude, $scope.marker.coords.longitude);
                }
            }
        };
        
        $scope.localReset = function() {
            delete $scope.dto.local;
            $scope.anuncioForm.local.$setValidity('nolocation', true);
        };
        
        $scope.localSelect = function($item, $model, $label) {
            geocodeById($item.place_id).then(function(location) {
                $scope.anuncioForm.local.$setValidity('nolocation', !!location);
                if(location) {
                    updatePlace(location.lat(), location.lng(), $item.description);
                }
            });
        };

        $scope.placesQuery = gPlacesQuery;

        $scope.map = {
            zoom: 15,
            options: {
                disableDefaultUI: true,
                zoomControl: true,
                scrollwheel: false
            }
        };
        
        function updatePlace(latitude, longitude, address) {
            if(!$scope.dto.local) $scope.dto.local = {};
            $scope.dto.local.coordenadas = {
                latitude: latitude,
                longitude: longitude
            };
            $scope.map.center = angular.copy($scope.dto.local.coordenadas);
            $scope.marker.coords = angular.copy($scope.dto.local.coordenadas);
            if(address) {
                $scope.dto.local.endereco = address;
            } else reverseGeocode(latitude, longitude).then(function(address) {
                $scope.dto.local.endereco = address;
            });
        }
        
        $scope.localCurrent = function() {
            getCurrentPosition($scope._noGps).then(function(pos) {
                updatePlace(pos.latitude, pos.longitude);
            });
        };
        
        /**
         * Gênero
         */
        
        $scope.generoHasError = function() {
            return $scope.dto.natureza=='perdido' && !$scope.dto.genero;
        };
        
        $scope.$watch('dto.natureza', function(newValue) {
            if(newValue == 'encontrado' && !$scope.dto.genero) {
                $scope.dto.genero = 'naosei';
            }
            if(newValue == 'perdido' && (!$scope.dto.genero || $scope.dto.genero == 'naosei')) {
                delete $scope.dto.genero;
            }
        });
        
        /**
         * Nome
         */
        $scope.nomeLabel = function() {
            switch($scope.dto.especie) {
                case 'cachorro':
                    switch($scope.dto.genero) {
                        case 'femea':
                            return 'da cadela';
                        default:
                            return 'do cachorro';
                    }
                case 'gato':
                    switch($scope.dto.genero) {
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
         * Cores
         */
        
        var maxColors = 3;
        
        $scope.colorComponents = [
            {property: 'r', label: 'Vermelho'},
            {property: 'g', label: 'Verde'},
            {property: 'b', label: 'Azul'}
        ];
        
        $scope._cores = {
            active: 0,
            add: function() {
                this.active = $scope.dto.cores.length;
                $scope.dto.cores.push("#000000");
            },
            remove: function($index) {
                $scope.dto.cores.splice($index, 1);
                if(!$scope.isInputColorSupported) {
                    this.sliders.splice($index, 1);
                    if(this.active > $index) {
                        this.active--;
                    }
                }
            },
            isNotFull: function() {
                return $scope.dto.cores.length < maxColors;
            },
            updateModel: function($index) {
                var rgb = this.sliders[$index];
                $scope.dto.cores[$index] = "#"
                    + ('00' + Number(rgb.r).toString(16)).slice(-2)
                    + ('00' + Number(rgb.g).toString(16)).slice(-2)
                    + ('00' + Number(rgb.b).toString(16)).slice(-2)
                ;
            },
            updateSliders: function($index) {
                var model = $scope.dto.cores[$index];
                if(!this.sliders) this.sliders = [];
                this.sliders[$index] = {
                    r: parseInt(model.substr(1, 2), 16) || 0,
                    g: parseInt(model.substr(3, 2), 16) || 0,
                    b: parseInt(model.substr(5, 2), 16) || 0
                };
            },
            isActive: function($index) {
                return this.active == $index;
            },
            toggleActive: function($index) {
                this.active = (this.active == $index) ? null : $index;
            },
            gradient: function(component, $index) {
                var that = this;
                return 'linear-gradient(to right, rgb('
                    + ['r', 'g', 'b'].map(function(c) {
                        return (component == c) ? 0 : that.sliders[$index][c];
                    }).join(', ')
                    + '), rgb('
                    + ['r', 'g', 'b'].map(function(c) {
                        return (component == c) ? 255 : that.sliders[$index][c];
                    }).join(', ')
                    + '))'
                ;
            }
        };
        
        /**
         * Raça
         */
        $scope.breeds = serverLists.breeds;

        /**
         * Peculiaridades
         */
        $scope._peculiaridades = {
            add: function() {
                $scope.dto.peculiaridades.push({});
            },
            remove: function($index) {
                $scope.dto.peculiaridades.splice($index, 1);
            },
            oQues: serverLists.quirks.whats,
            ondes: serverLists.quirks.wheres,
        };

        /**
         * Anunciar
         */
        
        var loadingInstances = [];

        $scope.post = function() {
            PosterService.create($scope.dto).then(function(response) {
                $scope.uploader.queue[0].formData.push({anuncio: response.id});
                $scope.uploader.onBeforeUploadItem = function() {
                    loadingInstances.push(loadingWindow.open());
                };
                $scope.uploader.onCompleteAll = function() {
                    loadingInstances.forEach(function(instance) {
                        instance.close();
                    });
                    SugestoesWindow.open(response.id);
                    $state.go('meusAnuncios');
                };
                $scope.uploader.uploadAll();
            });
        };
    })
    
    .factory('getIpPosition', function($http, $q) {
        return function() {
            var d = $q.defer();
            $http.get('http://ip-api.com/json').then(function(response) {
                d.resolve({
                    latitude: response.data.lat,
                    longitude: response.data.lon
                });
            });
            return d.promise;
        };
    })
    
    .factory('getCurrentPosition', function(getIpPosition, $q) {
        return function(noGps) {
            var d = $q.defer();
            if(navigator.geolocation && !noGps) {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    d.resolve({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    });
                }, function() {
                    d.resolve(getIpPosition());
                });
            } else {
                d.resolve(getIpPosition());
            }
            return d.promise;
        };
    })
;