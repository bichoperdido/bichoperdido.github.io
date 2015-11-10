/* global EventSource */

var NOTIFICATION_TITLE = 'Bicho Perdido';
var NOTIFICATION_DEFAULTICON = 'apple-icon.png';
var ANUNCIO_BASEURL = '/#/anuncio/';

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

function naturezaFlexionada(natureza, genero) {
	return natureza.slice(0, -1) + (genero=='femea'?'a':'o');
}

var messages = {
	protetor: function(natureza, especie, genero) {
		return '' +
			'Um' + (genero=='femea'?'a':'') +		// Um/Uma
			' ' +
			especieFlexionada(especie, genero) +	// cachorro/cadela/gato/gata
			' foi ' +
			naturezaFlexionada(natureza, genero) +	// perdido/perdida/encontrado/encontrada
			' na sua área de proteção.';
	},
	semelhante: function(natureza, especie, genero, semelhanca) {
		return 'Foi ' +
			naturezaFlexionada(natureza, genero) +
			' um' + (genero=='femea'?'a':'') + ' ' +
			especieFlexionada(especie, genero) + ' ' +
			Math.floor(semelhanca * 100) +
			'% semelhante ' +
			(genero=='femea'?'à sua':'ao seu') + '.';
	}
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

var serviceBaseUrl;

var activeToken;

function onMessage(event) {
	var data = JSON.parse(event.data);
	postMessage({action: 'log', data: data});
	var message;
	switch(data.tipo) {
		case 'protetor':
			message = messages.protetor(data.natureza, data.especie, data.genero);
			break;
		case 'semelhante':
			message = messages.semelhante(data.natureza, data.especie, data.genero, data.semelhanca);
			break;
	}
	notifyWithAudio(message, data.id, data.especie, (data.miniatura ? serviceBaseUrl + data.miniatura : null));
}

function connect(serviceBaseUrl, token) {
	if(activeToken !== token) {
		serviceBaseUrl = serviceBaseUrl;
		disconnect();
		eventSource = new EventSource(serviceBaseUrl + '/public/user/notify/' + token);
		activeToken = token;
		eventSource.onmessage = onMessage;
	}
}

function disconnect() {
	if(eventSource) {
		eventSource.close();
	}
}

self.onnotificationclick = function(e) {
	self.clients.openWindow(ANUNCIO_BASEURL + e.notification.tag);
};

self.onmessage = function(e) {
	var data = JSON.parse(e.data);
	switch(data.action) {
		case 'login':
			connect(data.serviceBaseUrl, data.token);
			break;
		case 'logout':
			disconnect();
			break;
		default:
			onMessage(e);
	}
};
