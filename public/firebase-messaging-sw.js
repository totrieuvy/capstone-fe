// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBEgp6wElu9GGzt8VSqrD4Z5JjdaHbAS0U",
  authDomain: "course-ac11b.firebaseapp.com",
  projectId: "course-ac11b",
  storageBucket: "course-ac11b.appspot.com",
  messagingSenderId: "504173119960",
  appId: "1:504173119960:web:0fd66571b4fe6c260c0aad",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🌙 Received background message: ", payload);
  // Bạn có thể hiển thị notification ở đây nếu muốn
});
