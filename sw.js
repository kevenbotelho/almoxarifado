// Service Worker para notificações push
self.addEventListener('install', event => {
    console.log('Service Worker instalado');
});

self.addEventListener('activate', event => {
    console.log('Service Worker ativado');
});

// Para notificações push, mas aqui é básico
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'notify') {
        self.registration.showNotification(event.data.title, {
            body: event.data.body,
            icon: '/favicon.ico' // ou algum ícone
        });
    }
});
