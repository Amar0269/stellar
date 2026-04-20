// Import Firebase core + services
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBjrddd9sBBeGZ0e3htpE_qVPKch5FMfxw",
  authDomain: "smart-campus-e4b8f.firebaseapp.com",
  databaseURL: "https://smart-campus-e4b8f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-campus-e4b8f",
  storageBucket: "smart-campus-e4b8f.firebasestorage.app",
  messagingSenderId: "739151687684",
  appId: "1:739151687684:web:05ff05977aa056b8fd8551",
  measurementId: "G-4SECECNCCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const db = getDatabase(app);
const analytics = getAnalytics(app);

// Export database (for IoT use) and analytics if needed
export { db, analytics };
