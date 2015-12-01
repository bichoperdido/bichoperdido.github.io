/* global angular */
angular.module('bichoApp.deploy', [])

    .value('serviceBaseUrl', function() {
        return sessionStorage.getItem('baseUrl') || 'https://bichoperdido-francisfontoura.rhcloud.com';
    }())
;