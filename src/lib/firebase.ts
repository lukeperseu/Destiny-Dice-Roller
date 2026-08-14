import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
  orderBy,
  limit,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { RollLog, DiceType } from '../types';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Validate connection per Firebase skill best practices
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase connection test notice:", error.message);
    }
  }
}
testConnection();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'gm' | 'player';
  gmUid?: string | null;
  gmDisplayName?: string | null;
  createdAt?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export async function loginAsGMWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, 'users', user.uid);
  let profile: UserProfile;

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
      if (profile.role !== 'gm') {
        profile.role = 'gm';
        await setDoc(userRef, { role: 'gm' }, { merge: true });
      }
    } else {
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'gm',
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    throw err;
  }

  return profile;
}

export async function loginAsPlayerWithGoogle(): Promise<UserProfile> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, 'users', user.uid);
  let profile: UserProfile;

  try {
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      profile = userSnap.data() as UserProfile;
    } else {
      profile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: 'player',
        createdAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    throw err;
  }

  return profile;
}

export async function assignGMToPlayer(playerUid: string, gmUid: string, gmDisplayName: string): Promise<void> {
  const userRef = doc(db, 'users', playerUid);
  try {
    await setDoc(userRef, { gmUid, gmDisplayName }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${playerUid}`);
    throw err;
  }
}

export async function fetchAllGMs(): Promise<UserProfile[]> {
  try {
    const q = query(collection(db, 'users'), where('role', '==', 'gm'));
    const querySnap = await getDocs(q);
    const gms: UserProfile[] = [];
    querySnap.forEach((docSnap) => {
      gms.push(docSnap.data() as UserProfile);
    });
    return gms;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
    return [];
  }
}

export async function saveRollToFirestore(roll: RollLog, gmUid: string, user: UserProfile): Promise<void> {
  const rollRef = doc(db, 'rolls', roll.id);
  const rollData = {
    ...roll,
    gmUid,
    playerName: user.displayName || (user.role === 'gm' ? 'Mestre' : 'Jogador'),
    playerPhoto: user.photoURL || '',
    playerUid: user.uid
  };

  try {
    await setDoc(rollRef, rollData);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `rolls/${roll.id}`);
  }
}

export function subscribeToGMRolls(gmUid: string, onRollsUpdated: (rolls: RollLog[]) => void): () => void {
  const q = query(
    collection(db, 'rolls'),
    where('gmUid', '==', gmUid),
    orderBy('timestamp', 'asc'),
    limit(250)
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnap) => {
      const rolls: RollLog[] = [];
      querySnap.forEach((docSnap) => {
        rolls.push(docSnap.data() as RollLog);
      });
      onRollsUpdated(rolls);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, 'rolls');
    }
  );

  return unsubscribe;
}

export async function clearGMRollsFromFirestore(gmUid: string, diceType?: DiceType): Promise<void> {
  try {
    let q = query(collection(db, 'rolls'), where('gmUid', '==', gmUid));
    if (diceType) {
      q = query(collection(db, 'rolls'), where('gmUid', '==', gmUid), where('diceType', '==', diceType));
    }
    const querySnap = await getDocs(q);
    const deletePromises = querySnap.docs.map((d) => deleteDoc(doc(db, 'rolls', d.id)));
    await Promise.all(deletePromises);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, 'rolls');
  }
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export { onAuthStateChanged, type User };
