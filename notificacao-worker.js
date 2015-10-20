/* global EventSource */

var NOTIFICATION_TITLE = 'Bicho Perdido';
var NOTIFICATION_DEFAULTICON = 'apple-icon.png';
var ANUNCIO_BASEURL = location.origin + '/#/anuncio/';

function especieFlexionada(especie, genero) {
	switch(especie) {
		case 'cachorro':
			switch(genero) {
				case 'femea':
					return 'cadela';
				default:
					return 'cachorro';
			}
		case 'gato':
			return 'gat' + (genero=='femea'?'a':'o');
		default:
			return 'animal';
	}
}

var messages = {
	protetor: function(natureza, especie, genero) {
		return '' +
			'Um' + (genero=='femea'?'a':'') +					// Um/Uma
			' ' +
			especieFlexionada(especie, genero) +				// cachorro/cadela/gato/gata
			' foi ' +
			natureza.slice(0, -1) + (genero=='femea'?'a':'o') +	// perdido/perdida/encontrado/encontrada
			' na sua área de proteção.';
	},
	semelhante: null
};

function postMessage(object) {
	self.clients.matchAll().then(function(clients) {
		clients.forEach(function(client) {
			client.postMessage(JSON.stringify(object));
		});
	});
}

function showNotification(title, body, icon, tag) {
	self.registration.showNotification(title, {
		body: body,
		icon: icon,
		tag: tag
	});
}

function notifyWithAudio(message, anuncioId, audioId, imageUrl) {
	postMessage({action: 'playAudio', audioId: audioId});
	showNotification(NOTIFICATION_TITLE, message, imageUrl || NOTIFICATION_DEFAULTICON, anuncioId);
}

var eventSource;

function connect(serviceBaseUrl, token) {
	eventSource = new EventSource(serviceBaseUrl + '/public/user/notify/' + token);
	eventSource.onmessage = function(e) {
		var data = JSON.parse(e.data);
		postMessage({action: 'log', data: data});
		var message;
		switch(data.tipo) {
			case 'protetor':
				message = messages.protetor(data.natureza, data.especie, data.genero);
				break;
			case 'semelhante':
		}
		notifyWithAudio(message, data.id, data.especie, data.miniatura);
	};
}

function disconnect() {
	if(eventSource) {
		eventSource.close();
	}
}

self.onnotificationclick = function(e) {
	e.waitUntil(self.clients.matchAll().then(function(clients) {
		clients[0].focus();
		return clients.openWindow(ANUNCIO_BASEURL + e.notification.tag);
	}));
};

self.onmessage = function(e) {
	var data = JSON.parse(e.data);
	switch(data.action) {
		case 'login':
			connect(data.serviceBaseUrl, data.token);
			break;
		case 'logout':
			disconnect();
		default:
			eventSource.onmessage(e);
	}
};