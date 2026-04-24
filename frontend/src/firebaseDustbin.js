// Firebase config — Dustbin DB (separate ESP device)
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";


const firebaseDustbinConfig = {
  apiKey: "AIzaSyBH8J58k1Dz2gYBwPrOiIY2GiJ--sKG8xo",
  authDomain: "smart-campus-dustbin-5f615.firebaseapp.com",
  databaseURL: "https://smart-campus-dustbin-5f615-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-campus-dustbin-5f615",
  storageBucket: "smart-campus-dustbin-5f615.firebasestorage.app",
  messagingSenderId: "983607415177",
  appId: "1:983607415177:web:8e1a08bdfcbdb328379158"
};


const appDustbin = initializeApp(firebaseDustbinConfig, "dustbin");

export const dbDustbin = getDatabase(appDustbin);
