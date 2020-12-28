self.addEventListener('notificationclick', function(e) {
    console.log('inside' + notification.data.roomName);
    var notification = e.notification;
    var primaryKey = notification.data.primaryKey;
    var action = e.action;
  
    if (action === 'close') {
      notification.close();
    } else {
      clients.openWindow('http://localhost:3000/room/' + notification.data.roomName);
      notification.close();
    }
  });