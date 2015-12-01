/* global angular Notification */
function AudioElement(audioUrl) {
	var element = document.createElement('audio');
	element.src = audioUrl;
	element.preload = 'auto';
	this.play = function() {
		element.play();
	};
}

angular.module('bichoApp.notificacao', ['ui.router'])

	.config(function($stateProvider) {
		$stateProvider.state('notify', {
			url: '/notify',
			templateUrl: 'notificacao/mockTemplate.html',
			controller: 'mockNotifyCtrl',
			data: {
				requireLogin: true
			}
		});
	})
	
	.controller('mockNotifyCtrl', function($scope, $http, serviceBaseUrl, NotificationService) {
		$scope.dto = {
			tipo: 'protetor',
			id: 1,
			natureza: 'perdido',
			especie: 'cachorro',
			genero: 'macho',
			semelhanca: 50,
			miniatura: '/public/media/image/thumb/3ac2d22b-799b-40b2-b275-4c99fc530140.jpg'
		};
		$scope.submit = function() {
			var semelhanca = $scope.dto.semelhanca;
			$scope.dto.semelhanca = semelhanca / 100;
			if($scope.local) {
				NotificationService.postMessage(JSON.stringify($scope.dto));
			} else {
				$http.get(serviceBaseUrl + '/public/user/notify/all/' + JSON.stringify($scope.dto));
			}
			$scope.dto.semelhanca = semelhanca;
		};
	})

	.service('AudioService', function() {
		var audios = {
			'cachorro': new AudioElement('notificacao/bark.mp3'),
			'gato': new AudioElement('notificacao/meow.mp3')
		};
		this.play = function(audioId) {
			audios[audioId].play();
		};
	})

	.service('NotificationService', function(AudioService, serviceBaseUrl) {

		if('Notification' in window) {
			Notification.requestPermission();
		}

		if('serviceWorker' in navigator) {
			var nsw = navigator.serviceWorker;
		}
		
		if(nsw) {
			nsw.register('notificacao-worker.js').then(nsw.ready).then(function() {
				nsw.onmessage = function(e) {
					var data = JSON.parse(e.data);
					switch(data.action) {
						case 'playAudio':
							AudioService.play(data.audioId);
							break;
						case 'log':
							document.getElementById('log').innerHTML += JSON.stringify(data.data) + '\n';
							break;
					}
				};
			});
		}
		
		var postMessage = function(message) {
			if(nsw) {
				if(nsw.controller) {
					nsw.controller.postMessage(message);
				} else {
					window.location.reload();
				}
			}
		};
		
		this.postMessage = postMessage;
		
		this.login = function() {
			postMessage(JSON.stringify({
				action: 'login',
				serviceBaseUrl: serviceBaseUrl,
				token: sessionStorage.getItem('token')
			}));
		};
		
		this.logout = function() {
			postMessage(JSON.stringify({
				action: 'logout'
			}));
		};
	})
;