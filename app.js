/* global angular FastClick EventSource Notification ServiceWorkerRegistration */
angular.module('bichoApp', [
    'ngAnimate',
    'ngMessages',
    'ngResource',
    'ngSanitize',
    'ui.router',
    'ui.bootstrap',
    'ui.mask',
    'uiGmapgoogle-maps',
    'angular-loading-bar',
    'bootstrapLightbox',
    'angular.filter',
    'bichoApp.login',
    'bichoApp.loginModal',
    'bichoApp.cadastro',
    'bichoApp.anuncio.novo',
    'bichoApp.anuncio.meus',
    'bichoApp.anuncio.sugestoes',
    'bichoApp.anuncio.detalhes',
    'bichoApp.anuncio.cartaz',
    'bichoApp.busca',
    'bichoApp.protetor',
    'bichoApp.restClient',
    'bichoApp.notificacao'
])
    
    .run(function($window, TokenService) {
        
        if($window.location.protocol != 'https:') {
            $window.location.protocol = 'https:';
        }

        FastClick.attach(document.body);
        
        TokenService.validate();
        
    })

    .value('errorMessages', {
        0: 'Servidor não responde. Por favor, tente mais tarde.',
        1: 'E-mail e/ou senha inválidos.',
        2: 'Sessão inválida ou expirada. Por favor, faça login novamente.',
        // 98: Mensagem de erro enviada pelo servidor
        99: 'Erro desconhecido.'
    })
    
    .value('serviceBaseUrl', function() {
        return sessionStorage.getItem('baseUrl') || 'https://bichoperdido-gschmoeller.rhcloud.com';
    }())
    
    .config(function($urlRouterProvider, $stateProvider, uiGmapGoogleMapApiProvider, $httpProvider, LightboxProvider) {
        
        $urlRouterProvider.otherwise('/');
        
        $stateProvider.state('home', {
            url: '/',
            templateUrl: 'home.html'
        });
        
        uiGmapGoogleMapApiProvider.configure({
            key: 'AIzaSyCsFWQBw-X0fssvYc3zsJTo57IqcnqKI7w',
            v: '3.exp',
            libraries: 'places'
        });
        
        LightboxProvider.templateUrl = 'lightbox.html#' + Date.now();

        $httpProvider.interceptors.push(function($q, $injector, errorMessages, $rootScope, serviceBaseUrl) {
            return {
                request: function(config) {
                    if(config.url.indexOf(serviceBaseUrl) != 0) {
                        return config;
                    }
                    $rootScope._loading = true;
                    var token = sessionStorage.getItem('token');
                    if(token) {
                        config.headers['x-token'] = token;
                    }
                    config.timeout = 30000;
                    return config;
                },
                response: function(response) {
                    if(response.config.url.indexOf(serviceBaseUrl) != 0) {
                        return response;
                    }
                    $rootScope._loading = false;
                    var data = response.data;
                    if(data.bpError) {
                        var e = data.bpError;
                        switch(e) {
                            case 2:
                                sessionStorage.removeItem('token');
                                break;
                            default:
                                var errorMsg = e in errorMessages ? errorMessages[e] : response.data.details || errorMessages[99];
                                $rootScope.addAlert({
                                    type: 'danger',
                                    msg: errorMsg
                                });
                                return $q.reject(response);
                        }
                    }
                    return response;
                },
                responseError: function(rejection) {
                    if(rejection.config.url.indexOf(serviceBaseUrl) != 0) {
                        return $q.reject(rejection);
                    }
                    $rootScope._loading = false;
                    var s = rejection.status;
                    var errorMsg = s in errorMessages ? errorMessages[s] : rejection.statusText;
                    $rootScope.addAlert({
                        type: 'danger',
                        msg: errorMsg
                    });
                    return $q.reject(rejection);
                }
            };
        });
    })

    .controller('mainCtrl', function($scope, $rootScope, $filter, $state, LoginWindow, serviceBaseUrl, $http, TokenService, NotificationService) {
        
        /**
         * Botões com indicação de carregamento. _loading modificado nos interceptors.
         */
        $rootScope._loading = false;
        
        $rootScope.loadingLabel = function(label) {
            return $rootScope._loading
                ? '<i class="fa fa-spinner fa-spin"></i> Carregando...'
                : label;
        };
        
        /**
         * Collapse responsivo da navbar.
         */
        $scope.navbarCollapsed = true;

        $scope.toggleCollapse = function(val) {
            if(val==undefined) {
                $scope.navbarCollapsed = !$scope.navbarCollapsed;
            } else {
                $scope.navbarCollapsed = val;
            }
        };

        /**
         * Estado de ativo da rota atual.
         */
        $scope.isActive = function(path) {
            return $state.current.url == path;
        };

        /**
         * Critério de erro nos campos de formulário.
         */
        $rootScope.hasError = function(field) {
            return field.$invalid;
        };
        
        /**
         * Alertas
         */
        $rootScope.alerts = [];

        $rootScope.addAlert = function(alert) {
            alert.msg = '[' + $filter('date')(Date.now(), 'mediumTime') + '] ' + (alert.msg ? alert.msg : 'Erro desconhecido.');
            $rootScope.alerts.push(alert);
        };
        
        $rootScope.closeAlert = function(index) {
            $rootScope.alerts.splice(index, 1);
        };
        
        $rootScope.cleanAlerts = function() {
            $rootScope.alerts = [];
        };
        
        /**
         * Verifica se o navegador suporta input type color.
         */
        $rootScope.isInputColorSupported = function() {
            var i = document.createElement('input');
            i.setAttribute('type', 'color');
            return i.type === 'color';
        }();
        
        /**
         * Verifica se o sistema é iOS.
         */
        $rootScope.isIos = function() {
            return navigator && navigator.userAgent && /iP(ad|od|hone)/.test(navigator.userAgent);
        }();
        
        $rootScope.$on('$stateChangeStart', function(event, toState) {
            $scope.toggleCollapse(true);
            if(toState.data && toState.data.requireLogin) {
                delete toState.template;
                if(!$rootScope.isLoggedIn()) {
                    toState.template = '<div class="well">Acesso negado.</div>';
                    $scope.login();
                }
            }
        });
        
        $scope.login = function() {
            return LoginWindow.open().then(function() {
                TokenService.validate().then(function() {
                    $state.reload();
                });
            });
        };
        
        $rootScope.isLoggedIn = function() {
            return !!sessionStorage.getItem('token');
        };
        
        $scope.logout = function() {
            $http.get(serviceBaseUrl + '/private/logout');
            NotificationService.logout();
            sessionStorage.removeItem('token');
            delete $rootScope.currentUser;
            $state.reload();
        };
        
        $rootScope.changeBaseUrl = function() {
            var base = prompt('Insira a URL base do serviço. Cancele para retomar o padrão.', serviceBaseUrl);
            if(base) {
                sessionStorage.setItem('baseUrl', base);
            } else {
                sessionStorage.removeItem('baseUrl');
            }
            location.reload();
        };
    })
    
    .service('TokenService', function($http, serviceBaseUrl, $rootScope, $resource, NotificationService) {
        this.validate = function() {
            return $resource(serviceBaseUrl + '/private/login/who').get(null, function(data) {
                if(data.bpError != 2) {
                    $rootScope.currentUser = data.name.split(' ')[0];
                    NotificationService.login();
                }
            }).$promise;
        };
    })
    
    .filter('capitalize', function() {
        return function(string) {
            return string ? string.charAt(0).toUpperCase() + string.substr(1) : '';
        };
    })
    
    .filter('genero', function() {
        return function(genero) {
            switch(genero) {
                case 'macho': return 'macho';
                case 'femea': return 'fêmea';
                case 'naosei': return 'desconhecido';
                default: return '';
            }
        };
    })
;
