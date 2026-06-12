const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => value && !String(value).includes("YOUR_")
);

let dbPromise = null;

async function getDb() {
  if (!hasFirebaseConfig) return null;

  if (!dbPromise) {
    dbPromise = Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js")
    ]).then(([appModule, firestoreModule]) => {
      const app = appModule.initializeApp(firebaseConfig);
      return firestoreModule.getFirestore(app);
    });
  }

  return dbPromise;
}

async function getFirestoreHelpers() {
  return import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
}

export { getDb, getFirestoreHelpers, hasFirebaseConfig };
