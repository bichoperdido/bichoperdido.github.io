/* global angular */
angular.module('bichoApp.restClient', ['ui.router'])
    
    .config(function($stateProvider) {
        $stateProvider.state('rest', {
            url: '/rest',
            templateUrl: 'restClient/restClient.html',
            controller: 'restCtrl'
        });
    })

    .controller('restCtrl', function($scope, $http) {

        var exampleConfig = {
            url: 'http://bichoperdido-gschmoeller.rhcloud.com/public/login',
            method: 'POST',
            headers: {
                'Content-type': 'application/json'
            },
            data: {
                email: 'gabriel@gmail.com',
                senha: 'senha'
            }
        };
        var exampleData = angular.toJson(exampleConfig.data);

        $scope.example = function() {
            $scope.config = exampleConfig;
            $scope._data = exampleData;
        };

        $scope.methods = ['GET', 'POST'];
        $scope.types = ['application/x-www-form-urlencoded', 'application/json'];

        $scope.paramAdd = function() {
            var o = new Object();
            o[$scope._param.key] = $scope._param.value;
            if(angular.isUndefined($scope.config.params)) {
                $scope.config.params = {};
            }
            angular.extend($scope.config.params, o);
            delete $scope._param;
        };

        $scope.$watch('_data', function(v) {
            if(angular.isDefined($scope.config)) {
                try {
                    $scope.config.data = angular.fromJson(v);
                } catch(e) {
                    delete $scope.config.data;
                }
            }
        });

        $scope.sendRequest = function() {
            $http($scope.config);
        };
        
        $scope.resetForm = function() {
            delete $scope.config;
        };
    })
;