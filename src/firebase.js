import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA6KBvf1CXNNt_DXVtcH9MjYU6tDbLfvuU",
  authDomain: "lab-gantt.firebaseapp.com",
  databaseURL: "https://lab-gantt-default-rtdb.firebaseio.com",
  projectId: "lab-gantt",
  storageBucket: "lab-gantt.firebasestorage.app",
  messagingSenderId: "693503699627",
  appId: "1:693503699627:web:04c101ff9c8900f48ce5ee",
};

const ALLOWED_EMAILS = [
  "kshithij.nandishwara@aimatx.ai",
  "young-jae.ryu@aimatx.ai",
  "phil.rodoni@aimatx.ai",
];

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function loginWithGoogle() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function onUserChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export function isAllowedEmail(email) {
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

function toArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") return Object.values(data);
  return [];
}

export function saveTasks(tasks) {
  set(ref(db, "tasks"), tasks);
}

export function saveCategories(categories) {
  set(ref(db, "categories"), categories);
}

export function onTasksChange(callback) {
  return onValue(ref(db, "tasks"), (snapshot) => {
    const data = snapshot.val();
    if (data) callback(toArray(data));
  });
}

export function onCategoriesChange(callback) {
  return onValue(ref(db, "categories"), (snapshot) => {
    const data = snapshot.val();
    if (data) callback(toArray(data));
  });
}
