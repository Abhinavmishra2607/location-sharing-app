// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBekM9OgK8E0h06bTHT9FboLAYwbmfvbFE",
  authDomain: "location-finder-aabb4.firebaseapp.com",
  projectId: "location-finder-aabb4",
  storageBucket: "location-finder-aabb4.appspot.com",
  messagingSenderId: "329337618595",
  appId: "1:329337618595:web:3fec4092053ccad9c77f16",
  measurementId: "G-QWHXHPT5NR",
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
export default app;
