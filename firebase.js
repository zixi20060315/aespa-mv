const firebaseConfig = {
  apiKey: "AIzaSyC8lT0mGa9dff3Kwqv9KvRjXnp5aX4q9XI",
  authDomain: "aespa-stage.firebaseapp.com",
  projectId: "aespa-stage",
  storageBucket: "aespa-stage.firebasestorage.app",
  messagingSenderId: "307460974300",
  appId: "1:307460974300:web:ba89b28f008c18c1cef619"
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
