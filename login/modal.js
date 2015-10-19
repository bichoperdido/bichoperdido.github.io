/* global angular */
angular.module('bichoApp.loginModal', [])

    .service('LoginWindow', function($uibModal) {
        this.open = function() {
            var modalInstance = $uibModal.open({
                templateUrl: 'login/modal.html',
                controller: 'loginCtrl',
                backdrop: 'static'
            });
            return modalInstance.result;
        };
    })
;