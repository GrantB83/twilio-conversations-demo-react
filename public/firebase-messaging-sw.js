importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);
importScripts("firebase-config.js");

// Check if firebaseConfig is defined
if (self.firebaseConfig) {
  firebase.initializeApp(self.firebaseConfig);

  console.log(
    `${new Date().toJSON()} [firebase-messaging-sw] Initialized messaging`
  );

  const messaging = firebase.messaging();

  messaging.setBackgroundMessageHandler((payload) => {
    if (payload.type !== "twilio.conversations.new_message") {
      return;
    }

    const notificationTitle = payload.data.conversation_title;
    const notificationOptions = {
      body: payload.data.twi_body,
      icon: "favicon.ico",
    };

    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
} else {
  console.error(
    `${new Date().toJSON()} [firebase-messaging-sw] Firebase configuration not found!`
  );
}
