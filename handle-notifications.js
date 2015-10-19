var notificationOptions = {
	icon: 'apple-icon.png'
};
function notify(event) {
	self.clients.matchAll().then(function(clients) {
		clients[0].postMessage('playBark');
	});
	self.registration.showNotification(event.data, notificationOptions);
}
var evt = new EventSource('https://bichoperdido-gschmoeller.rhcloud.com/public/user/notify');
evt.addEventListener('message', notify);
self.addEventListener('message', notify);