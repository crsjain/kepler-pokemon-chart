// Firebase Web SDK integration (PWA browser compatible modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  connectAuthEmulator,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
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
  updateDoc,
  runTransaction
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// --- PLACEHOLDER CONFIGURATION ---
// You will replace this object with your actual configuration keys from the Firebase Console.
const firebaseConfigProd = {
  apiKey: "AIzaSyA7qf6YhCUvUMjX9MgtZoTwpYCo-xKuFME",
  authDomain: "pokemon-chart-3154f.firebaseapp.com",
  projectId: "pokemon-chart-3154f",
  storageBucket: "pokemon-chart-3154f.firebasestorage.app",
  messagingSenderId: "942560435967",
  appId: "1:942560435967:web:c846c17e717c90b6b536ca"
};

// TODO: Create a separate personal Firebase project for staging, 
// register a web app, and paste its config keys here.
const firebaseConfigStaging = {
  apiKey: "AIzaSyDPEaSo8nZuVMcQ6dSGqbP8eqA6ZSo7fH4",
  authDomain: "kepler-pokemon-chart-staging.firebaseapp.com",
  projectId: "kepler-pokemon-chart-staging",
  storageBucket: "kepler-pokemon-chart-staging.firebasestorage.app",
  messagingSenderId: "737806184726",
  appId: "1:737806184726:web:6509a0284af6323e8e2037"
};

const params = new URLSearchParams(window.location.search);
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' || 
                window.location.hostname === '0.0.0.0' || 
                window.location.hostname.endsWith('.googlers.com') || 
                window.location.hostname.endsWith('.corp.google.com') ||
                window.location.port === '8085';

export const useStaging = params.get('useStaging') === 'true' || window.location.hostname.includes('staging');
export const useProd = params.get('useProd') === 'true' || (!isLocal && !useStaging);
export const useEmulator = isLocal && !useProd && !useStaging;

let finalConfig;
if (useProd) {
  finalConfig = { ...firebaseConfigProd };
} else if (useStaging) {
  finalConfig = { ...firebaseConfigStaging };
} else {
  // Emulator Mode
  finalConfig = { ...firebaseConfigStaging }; // Use staging template for emulator
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

// Email a Firebase password-reset link for the family account. Uses Firebase's
// hosted action page, so no custom domain setup is needed. In emulator mode the
// link is printed to the emulator log / UI instead of being emailed.
export function sendFamilyPasswordReset(email) {
  return sendPasswordResetEmail(auth, email);
}

// The signed-in family account's email, or null.
export function getFamilyEmail() {
  return auth.currentUser ? auth.currentUser.email : null;
}

// Change the family password in place: re-authenticate with the current
// password, then update. Firebase revokes the refresh tokens of every other
// device, so tablets will ask for the new password.
export async function changeFamilyPassword(currentPassword, newPassword) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    const err = new Error('Not signed in');
    err.code = 'auth/no-current-user';
    throw err;
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// Re-authenticate with the family sign-in password without changing it. Used by
// "Forgot PIN?" (prd_parent_pin_and_family_signin.md §7): proving the family
// password lets a parent set a new Parent PIN.
export async function reauthenticateFamily(password) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    const err = new Error('Not signed in');
    err.code = 'auth/no-current-user';
    throw err;
  }
  const credential = EmailAuthProvider.credential(user.email, password);
  await reauthenticateWithCredential(user, credential);
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
    // Family-wide fields that live on the doc itself, not in any child's state.
    // adminPassword is the Parent PIN's source of truth
    // (docs/prd_parent_pin_and_family_signin.md).
    const familyMeta = { adminPassword: null };
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (typeof data.adminPassword === 'string' && data.adminPassword) {
        familyMeta.adminPassword = data.adminPassword;
      }
      if (data.profiles) {
        Object.keys(data.profiles).forEach((profileId) => {
          profiles.push({
            id: profileId,
            ...data.profiles[profileId]
          });
        });
      }
    }
    callback(profiles, familyMeta);
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
  
  const writePromise = setDoc(userDocRef, updateData, { merge: true });
  writePromise.catch((err) => {
    console.error("Cloud profile creation sync error:", err);
  });
  
  // Wait up to 1500ms for server ACK; if network or emulator is slow/offline,
  // resolve optimistically since local cache already has the profile
  await Promise.race([
    writePromise,
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);
  
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
  
  const writePromise = setDoc(userDocRef, updateData, { merge: true });
  writePromise.catch((err) => {
    console.error("Cloud profile deletion sync error:", err);
  });
  
  await Promise.race([
    writePromise,
    new Promise((resolve) => setTimeout(resolve, 1500))
  ]);
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

// The Parent PIN update: the doc-level field only. Per-child copies
// (profiles.*.state.adminPassword) are no longer written
// (prd_parent_pin_and_family_signin.md §7, Phase 2). Pure, so tests can pin it.
export function buildFamilyPasscodeUpdate(newPassword) {
  return {
    adminPassword: newPassword,
    updatedAt: new Date().toISOString()
  };
}

// Save the family Parent PIN (doc-level users/{uid}.adminPassword).
export async function saveAdminPasswordToCloud(newPassword) {
  if (!currentFamilyUid) return;
  const userDocRef = doc(db, 'users', currentFamilyUid);
  await updateDoc(userDocRef, buildFamilyPasscodeUpdate(newPassword));
}

// Backfill the doc-level Parent PIN once (prd_parent_pin_and_family_signin.md
// §7, Phase 1). Write-if-absent inside a transaction, so a PIN changed at the
// same moment on another device is never overwritten. Resolves true only if
// this call wrote the field.
export async function ensureFamilyPasscodeInCloud(value) {
  if (!currentFamilyUid || typeof value !== 'string' || !value) return false;
  const userDocRef = doc(db, 'users', currentFamilyUid);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(userDocRef);
    if (!snap.exists()) return false;
    const current = snap.data().adminPassword;
    if (typeof current === 'string' && current) return false;
    tx.update(userDocRef, { adminPassword: value, updatedAt: new Date().toISOString() });
    return true;
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
