/* global angular */
angular.module('bichoApp.deploy', [])

    .value('serviceBaseUrl', function() {
        return localStorage.getItem('baseUrl') || 'https://bichoperdido-gschmoeller.rhcloud.com';
    }())
;
