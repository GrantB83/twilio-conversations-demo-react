// Import Firebase scripts for app and messaging
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js"
);
importScripts("firebase-config.js"); // Ensure firebase-config.js is available in the same directory

if (typeof firebaseConfig !== "undefined") {
  firebase.initializeApp(firebaseConfig);
  console.log(
    `${new Date().toJSON()}  [firebase-messaging-sw] Firebase messaging initialized successfully`
  );

  // Set up background message handler
  firebase.messaging().setBackgroundMessageHandler((payload) => {
    console.log(
      `${new Date().toJSON()}  [firebase-messaging-sw] Received background message: `,
      payload
    );

    if (payload.type !== "twilio.conversations.new_message") {
      console.warn(
        `${new Date().toJSON()}  [firebase-messaging-sw] Unsupported message type: `,
        payload.type
      );
      return;
    }

    // Prepare notification data
    const notificationTitle = payload.data.conversation_title || "New Message";
    const notificationOptions = {
      body: payload.data.twi_body || "You have a new message",
      icon: "favicon.ico", // Replace with a valid icon path
    };

    // Show the notification
    return self.registration.showNotification(
      notificationTitle,
      notificationOptions
    );
  });
} else {
  console.error(
    `${new Date().toJSON()}  [firebase-messaging-sw] No firebase configuration found!`
  );
}
