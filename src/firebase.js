import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA6KBvf1CXNNt_DXVtcH9MjYU6tDbLfvuU",
  authDomain: "lab-gantt.firebaseapp.com",
  databaseURL: "https://lab-gantt-default-rtdb.firebaseio.com",
  projectId: "lab-gantt",
  storageBucket: "lab-gantt.firebasestorage.app",
  messagingSenderId: "693503699627",
  appId: "1:693503699627:web:04c101ff9c8900f48ce5ee",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
