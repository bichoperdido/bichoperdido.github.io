/* global angular */
angular.module('bichoApp.deploy', [])

    .value('serviceBaseUrl', function() {
        return localStorage.getItem('baseUrl') || 'https://bichoperdido-francisfontoura.rhcloud.com';
    }())
;