importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);
importScripts("firebase-config.js");

// Ensure firebaseConfig is loaded properly
if (self.firebaseConfig) {
  firebase.initializeApp(self.firebaseConfig);
  console.log(
    `${new Date().toJSON()}  [firebase-messaging-sw] Initialized messaging`
  );

  firebase.messaging().setBackgroundMessageHandler((payload) => {
    if (payload.type !== "twilio.conversations.new_message") {
      return;
    }

    const notificationTitle = payload.data.conversation_title;
    const notificationOptions = {
      body: payload.data.twi_body,
      icon: "favicon.ico",
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.error(
    `${new Date().toJSON()}  [firebase-messaging-sw] No firebase configuration found!`
  );
}
