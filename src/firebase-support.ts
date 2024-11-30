import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Messaging,
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import { Client, PushNotification } from "@twilio/conversations";

// Import the Firebase configuration
import firebaseConfig from "/firebase-config.js";

let app: FirebaseApp;
let messaging: Messaging;
let initialized = false;

try {
  // Debug: Log the Firebase configuration
  console.log("Loaded Firebase Config:", firebaseConfig);

  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  initialized = true;

  console.log("Firebase initialized successfully");
} catch (error) {
  console.warn("Couldn't initialize firebase app:", error);
}

export const initFcmServiceWorker = async (): Promise<void> => {
  if (!initialized) {
    console.warn("Firebase is not initialized. Skipping service worker setup.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "firebase-messaging-sw.js"
    );
    console.log("ServiceWorker registered with scope:", registration.scope);
  } catch (e) {
    console.error("ServiceWorker registration failed:", e);
  }
};

export const subscribeFcmNotifications = async (
  convoClient: Client
): Promise<void> => {
  if (!initialized) {
    console.warn("Firebase is not initialized. Skipping FCM notifications.");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("FcmNotifications: can't request permission:", permission);
      return;
    }

    const fcmToken = await getToken(messaging);
    if (!fcmToken) {
      console.log("FcmNotifications: can't get FCM token");
      return;
    }

    console.log("FcmNotifications: got FCM token", fcmToken);
    await convoClient.setPushRegistrationId("fcm", fcmToken);
    onMessage(messaging, (payload) => {
      console.log("FcmNotifications: push received", payload);
      if (convoClient) {
        convoClient.handlePushNotification(payload);
      }
    });
  } catch (error) {
    console.error(
      "FcmNotifications: Error subscribing to notifications:",
      error
    );
  }
};

export const showNotification = (pushNotification: PushNotification): void => {
  if (!initialized) {
    console.warn("Firebase is not initialized. Skipping notification display.");
    return;
  }

  // TODO: remove when new version of sdk will be released
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const notificationTitle = pushNotification.data.conversationTitle || "";

  const notificationOptions = {
    body: pushNotification.body ?? "",
    icon: "favicon.ico",
  };

  const notification = new Notification(notificationTitle, notificationOptions);
  notification.onclick = (event) => {
    console.log("notification.onclick", event);
    event.preventDefault(); // prevent the browser from focusing the Notification's tab
    // TODO: navigate to the corresponding conversation
    notification.close();
  };
};
