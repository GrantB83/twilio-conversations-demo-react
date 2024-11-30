console.log("Loaded Firebase Config:", (window as any).firebaseConfig);
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  firebaseConfig
  Messaging,
  getMessaging,
  getToken,
  onMessage,
} from "../public/firebase-config.js";
import { Client, PushNotification } from "@twilio/conversations";

let app: FirebaseApp;
let messaging: Messaging;
let initialized = false;

try {
  // Ensure Firebase is initialized with the correct configuration
  const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
  };

  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  initialized = true;
  console.log("Firebase initialized successfully");
} catch (error) {
  console.warn("Couldn't initialize Firebase app:", error);
}

export const initFcmServiceWorker = async (): Promise<void> => {
  if (!initialized) {
    console.warn("FcmServiceWorker: Firebase not initialized");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      "firebase-messaging-sw.js"
    );
    console.log("ServiceWorker registered with scope:", registration.scope);
  } catch (error) {
    console.error("ServiceWorker registration failed:", error);
  }
};

export const subscribeFcmNotifications = async (
  convoClient: Client
): Promise<void> => {
  if (!initialized) {
    console.warn("FcmNotifications: Firebase not initialized");
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("FcmNotifications: Permission denied:", permission);
      return;
    }

    const fcmToken = await getToken(messaging);
    if (!fcmToken) {
      console.warn("FcmNotifications: Unable to retrieve FCM token");
      return;
    }

    console.log("FcmNotifications: Retrieved FCM token:", fcmToken);
    await convoClient.setPushRegistrationId("fcm", fcmToken);

    onMessage(messaging, (payload) => {
      console.log("FcmNotifications: Push received:", payload);
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
    console.warn("showNotification: Firebase not initialized");
    return;
  }

  // Notification display logic
  const notificationTitle =
    pushNotification.data?.conversationTitle || "New Message";
  const notificationOptions = {
    body: pushNotification.body ?? "You have a new notification",
    icon: "favicon.ico",
  };

  const notification = new Notification(notificationTitle, notificationOptions);
  notification.onclick = (event) => {
    console.log("Notification clicked:", event);
    event.preventDefault(); // Prevent the browser from focusing the Notification's tab
    notification.close();
    // TODO: Navigate to the corresponding conversation
  };
};
