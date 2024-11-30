const firebaseConfig = {
  apiKey: "AIzaSyBGH2pkh1FcwX61mN-teD3uCM6toyv48_Q",
  authDomain: "twilio-conversations-5c808.firebaseapp.com",
  projectId: "twilio-conversations-5c808",
  storageBucket: "twilio-conversations-5c808.firebasestorage.app",
  messagingSenderId: "726570560782",
  appId: "1:726570560782:web:4e935f063e7e7120467b5f",
};

if (typeof self !== "undefined" && self instanceof ServiceWorkerGlobalScope) {
  self.firebaseConfig = firebaseConfig;
} else if (typeof window !== "undefined") {
  window.firebaseConfig = firebaseConfig;
}

export default firebaseConfig;
