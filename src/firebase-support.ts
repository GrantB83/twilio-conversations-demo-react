declare global {
  interface Window {
    firebaseConfig: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
  }
}

import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Messaging,
  getMessaging,
  getToken,
  onMessage,
} from "firebase/messaging";
import { Client, PushNotification } from "@twilio/conversations";

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;
let initialized = false;

try {
  // Access the Firebase Config from the extended Window interface
  const firebaseConfig = window.firebaseConfig;

  if (!firebaseConfig) {
    throw new Error("Firebase config is not defined");
  }

  console.log("Loaded Firebase Config:", firebaseConfig);

  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
  initialized = true;

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
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
  } catch (error) {
    console.error("ServiceWorker registration failed:", error);
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
      console.log(
        "FcmNotifications: Notification permission denied:",
        permission
      );
      return;
    }

    if (!messaging) {
      throw new Error("Messaging instance is not available.");
    }

    const registration = await navigator.serviceWorker.ready;

    const fcmToken = await getToken(messaging, {
      vapidKey: "YOUR_VAPID_KEY",
      serviceWorkerRegistration: registration,
    });

    if (!fcmToken) {
      console.log("FcmNotifications: Unable to get FCM token");
      return;
    }

    console.log("FcmNotifications: FCM token received:", fcmToken);
    await convoClient.setPushRegistrationId("fcm", fcmToken);

    onMessage(messaging, (payload) => {
      console.log("FcmNotifications: Push notification received:", payload);
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

  const notificationTitle =
    pushNotification.data?.conversationTitle || "New Message";

  const notificationOptions = {
    body: pushNotification.body ?? "",
    icon: "favicon.ico",
  };

  const notification = new Notification(notificationTitle, notificationOptions);
  notification.onclick = (event) => {
    console.log("notification.onclick", event);
    event.preventDefault(); // Prevent the browser from focusing the Notification's tab
    notification.close();
  };
};
