/* global angular */
angular.module('bichoApp.login', ['ui.router'])

    .config(function($stateProvider) {
        $stateProvider.state('login', {
            url: '/login',
            templateUrl: 'login/login.html'
        });
    })
    
    .service('LoginService', function ($resource, serviceBaseUrl) {

        var resource = $resource(serviceBaseUrl + '/public/login');

        this.login = function(dto) {
            return resource.save(null, dto, function(response) {
                if(response.token) {
                    sessionStorage.setItem('token', response.token);
                }
            }).$promise;
        };
    })
    
    .controller('loginCtrl', function($rootScope, $scope, LoginService, $http, serviceBaseUrl, $state) {
        
        $scope.dto = {
            email: 'gabriel@bp',
            senha: 'boobs'
        };
        
        $scope.hasError = function(field) {
            return field.$dirty && field.$invalid;
        };
        
        $scope.login = function() {
            LoginService.login($scope.dto).then($scope.$close);
        };
        
        $scope.$on('modal.closing', function() {
            $scope.cleanAlerts();
        });
    })
;