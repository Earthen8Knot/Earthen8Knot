/**
 * Firebase Configuration for EarthenKnot
 * 
 * INSTRUCTIONS: Replace the placeholder values below with your actual
 * Firebase project configuration from https://console.firebase.google.com
 * 
 * Steps:
 * 1. Go to Firebase Console → Create a new project (or use existing)
 * 2. Add a Web App to your project
 * 3. Copy the firebaseConfig object and paste it below
 * 4. Enable Email/Password authentication in Authentication → Sign-in method
 * 5. Create a Firestore Database in test mode
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// ⚠️ REPLACE these with your real Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAsbAerlKnI7UKYsJuoKXw4p_ODtUU8OcU",
  authDomain: "earthen8knot-9f3bc.firebaseapp.com",
  projectId: "earthen8knot-9f3bc",
  storageBucket: "earthen8knot-9f3bc.firebasestorage.app",
  messagingSenderId: "57882724273",
  appId: "1:57882724273:web:afec9eafd889866e275f90",
  measurementId: "G-2LP41VQJC5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };

// === Navbar Auth State Listener ===
// Runs on every page to update the user icon in the navbar
onAuthStateChanged(auth, (user) => {
  const userBtn = document.getElementById('user-auth-btn');
  const userDropdown = document.getElementById('user-dropdown');
  
  if (!userBtn) return;

  if (user) {
    // User is signed in
    const displayName = user.displayName || user.email.split('@')[0];
    userBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width:22px;height:22px;fill:var(--primary);stroke:var(--primary);stroke-width:1;">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>`;
    userBtn.onclick = (e) => {
      e.stopPropagation();
      if (userDropdown) userDropdown.classList.toggle('show');
    };

    const drawerAuthText = document.getElementById('mobile-drawer-auth-text');
    if (drawerAuthText) drawerAuthText.textContent = displayName;
    const drawerAuthItem = document.getElementById('mobile-drawer-auth-item');
    if (drawerAuthItem) drawerAuthItem.setAttribute('href', 'my-orders.html');
    
    if (userDropdown) {
      userDropdown.innerHTML = `
        <div class="user-dropdown-header">
          <span class="user-dropdown-name">${displayName}</span>
          <span class="user-dropdown-email">${user.email}</span>
        </div>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-item" onclick="window.location.href='my-orders.html'">My Orders</button>
        <div class="user-dropdown-divider"></div>
        <button class="user-dropdown-logout" id="logout-btn">Sign Out</button>`;
      
      const logoutBtn = userDropdown.querySelector('#logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await signOut(auth);
          window.location.reload();
        });
      }
    }
  } else {
    // User is signed out
    userBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;vertical-align:middle;">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="user-btn-label">Sign In</span>`;
    userBtn.onclick = () => { window.location.href = 'auth.html'; };

    const drawerAuthText = document.getElementById('mobile-drawer-auth-text');
    if (drawerAuthText) drawerAuthText.textContent = 'Sign In / Account';
    const drawerAuthItem = document.getElementById('mobile-drawer-auth-item');
    if (drawerAuthItem) drawerAuthItem.setAttribute('href', 'auth.html');

    if (userDropdown) {
      userDropdown.classList.remove('show');
      userDropdown.innerHTML = '';
    }
  }

  // Dynamic Welcome Greeting Banner Logic
  const welcomeText = document.getElementById('welcome-greeting');
  const welcomeBanner = document.getElementById('homepage-welcome-banner');
  if (welcomeBanner && welcomeText) {
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 17) greeting = "Good afternoon";
    else if (hour >= 17 && hour < 21) greeting = "Good evening";
    else if (hour >= 21 || hour < 5) greeting = "Good night";

    welcomeText.textContent = `${greeting}!`;
    welcomeBanner.style.display = 'flex';
  }

  // Dispatch custom event to notify other scripts of auth changes
  const authEvent = new CustomEvent('auth-state-changed', { detail: { user } });
  window.dispatchEvent(authEvent);
});

// Close user dropdown when clicking outside
document.addEventListener('click', (e) => {
  const userDropdown = document.getElementById('user-dropdown');
  if (userDropdown && !e.target.closest('.user-auth-container')) {
    userDropdown.classList.remove('show');
  }
});

// Export instances globally for non-module script access
window.firebaseAuth = auth;
window.firebaseDb = db;
