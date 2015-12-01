/* global angular */
angular.module('bichoApp.cadastro', ['ui.router'])
    
    .config(function($stateProvider) {
        $stateProvider.state('cadastro', {
            url: '/cadastro',
            templateUrl: 'cadastro/cadastro.html',
            controller: 'cadastroCtrl'
        });
    })

    .service('UserService', function ($resource, serviceBaseUrl) {
        
        var resource = $resource(serviceBaseUrl + '/public/user/create');
        
        this.create = function(dto) {
            return resource.save(null, dto).$promise;
        };
    })

    .controller('cadastroCtrl', function($scope, UserService, LoginService, $state, TokenService) {
        $scope.register = function() {
            UserService.create($scope.dto).then(function(response) {
                if(response.id) {
                    $scope.addAlert({
                        type: 'success',
                        msg: 'Usuário criado com sucesso!'
                    });
                    LoginService.login({email: $scope.dto.email, senha: $scope.dto.senha}).then(function() {
                        TokenService.validate().then(function() {
                            $state.go('novoAnuncio');
                        });
                    });
                }
            });
        };
    })
;