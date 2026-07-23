// Firebase Web SDK integration (PWA browser compatible modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  connectAuthEmulator
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot,
  query,
  connectFirestoreEmulator,
  deleteField,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// --- PLACEHOLDER CONFIGURATION ---
// You will replace this object with your actual configuration keys from the Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyDq4KnI-rgyREog9ahPYjg1pJbz7o-vXOg",
  authDomain: "pokemon-chart-3154f.firebaseapp.com",
  projectId: "pokemon-chart-3154f",
  storageBucket: "pokemon-chart-3154f.firebasestorage.app",
  messagingSenderId: "942560435967",
  appId: "1:942560435967:web:c846c17e717c90b6b536ca"
};

// Determine if we should connect to the local emulator
const useEmulator = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && !window.location.search.includes('useProd=true');

const finalConfig = { ...firebaseConfig };
if (useEmulator) {
  // Override projectId to match the emulators' demo project ID to prevent token validation 400 Bad Requests
  finalConfig.projectId = "demo-pokemon-chart";
}

// Initialize Firebase
const app = initializeApp(finalConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

if (useEmulator) {
  console.log("🔌 Connecting to local Firebase Emulators (demo-pokemon-chart)...");
  connectAuthEmulator(auth, "http://127.0.0.1:9099");
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

let currentFamilyUid = null;
let profileUnsubscribe = null;
let stateUnsubscribe = null;

// Authenticate Parent Shared Account
export function loginFamily(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

// Log out family session
export function logoutFamily() {
  if (profileUnsubscribe) profileUnsubscribe();
  if (stateUnsubscribe) stateUnsubscribe();
  currentFamilyUid = null;
  return signOut(auth);
}

// Subscribe to Auth State Changes
export function subscribeToAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      currentFamilyUid = user.uid;
      callback(user);
    } else {
      currentFamilyUid = null;
      callback(null);
    }
  });
}

// Get all child profiles (realtime listener)
export function subscribeToProfiles(callback, errorCallback) {
  if (!currentFamilyUid) return null;
  
  const userDocRef = doc(db, 'users', currentFamilyUid);
  
  if (profileUnsubscribe) profileUnsubscribe();
  
  profileUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
    const profiles = [];
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.profiles) {
        Object.keys(data.profiles).forEach((profileId) => {
          profiles.push({
            id: profileId,
            ...data.profiles[profileId]
          });
        });
      }
    }
    callback(profiles);
  }, (error) => {
    console.error("Error fetching profiles:", error);
    if (errorCallback) errorCallback(error);
  });
  
  return profileUnsubscribe;
}

// Create a new child profile with default state template
export async function createChildProfile(name, defaultStateTemplate, avatarId = '25') {
  if (!currentFamilyUid) throw new Error("Not authenticated");
  
  // Format profile ID from name
  const profileId = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
  
  const userDocRef = doc(db, 'users', currentFamilyUid);
  
  const initialProfileState = {
    ...defaultStateTemplate,
    activeDay: defaultStateTemplate.activeDay !== undefined ? defaultStateTemplate.activeDay : new Date().getDay(),
    starVault: defaultStateTemplate.starVault || { earnedDates: [], totalTraded: 0 },
    collectedBadges: defaultStateTemplate.collectedBadges || [],
    grid: defaultStateTemplate.grid || {}
  };
  
  const profileData = {
    name: name,
    avatarId: avatarId,
    partnerFamily: initialProfileState.partnerFamily || '25',
    state: initialProfileState,
    updatedAt: new Date().toISOString()
  };
  
  const updateData = {
    profiles: {
      [profileId]: profileData
    },
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(userDocRef, updateData, { merge: true });
  
  return profileId;
}

// Delete child profile
export async function deleteChildProfile(profileId) {
  if (!currentFamilyUid) throw new Error("Not authenticated");
  
  const userDocRef = doc(db, 'users', currentFamilyUid);
  
  const updateData = {
    profiles: {
      [profileId]: deleteField()
    },
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(userDocRef, updateData, { merge: true });
}

// Subscribe to Active Profile State Sync (Firestore -> Local memory)
export function subscribeToProfileState(profileId, callback, errorCallback) {
  if (!currentFamilyUid) return null;
  
  const userDocRef = doc(db, 'users', currentFamilyUid);
  
  if (stateUnsubscribe) stateUnsubscribe();
  
  let lastStateStr = null;
  
  stateUnsubscribe = onSnapshot(userDocRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const profile = data.profiles ? data.profiles[profileId] : null;
      if (profile && profile.state) {
        const stateStr = JSON.stringify(profile.state);
        if (stateStr !== lastStateStr) {
          lastStateStr = stateStr;
          callback(profile.state);
        }
      }
    }
  }, (error) => {
    console.error("Error syncing profile state:", error);
    if (errorCallback) errorCallback(error);
  });
  
  return stateUnsubscribe;
}

// Save Local Memory State -> Firestore
export async function saveProfileStateToCloud(profileId, localState) {
  if (!currentFamilyUid) return;
  
  const userDocRef = doc(db, 'users', currentFamilyUid);
  
  await updateDoc(userDocRef, {
    [`profiles.${profileId}.state`]: localState,
    [`profiles.${profileId}.name`]: localState.childName || profileId.split('_')[0],
    [`profiles.${profileId}.partnerFamily`]: localState.partnerFamily || '25',
    [`profiles.${profileId}.updatedAt`]: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

// Export the entire family JSON blob (all profiles)
export async function exportFamilyData() {
  if (!currentFamilyUid) throw new Error("Not authenticated");
  const userDocRef = doc(db, 'users', currentFamilyUid);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return docSnap.data();
  }
  return null;
}

// Overwrite/Restore the entire family JSON blob (all profiles)
export async function importFamilyData(data) {
  if (!currentFamilyUid) throw new Error("Not authenticated");
  const userDocRef = doc(db, 'users', currentFamilyUid);
  await setDoc(userDocRef, data);
}

// Save Custom Rewards to Firestore
export async function saveProfileRewardsToCloud(profileId, weeklyOptions, megaOptions) {
  if (!currentFamilyUid) return;
  const userDocRef = doc(db, 'users', currentFamilyUid);
  await updateDoc(userDocRef, {
    [`profiles.${profileId}.state.weeklyRewardOptions`]: weeklyOptions,
    [`profiles.${profileId}.state.megaRewardOptions`]: megaOptions,
    [`profiles.${profileId}.updatedAt`]: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}
