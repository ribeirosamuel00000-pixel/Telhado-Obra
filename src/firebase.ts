import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Safely access env vars in client Vite runtime or fall back to bundled config
const env: Record<string, string | undefined> =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : {};

export const resolvedFirebaseConfig = {
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId || 'gen-lang-client-0486469536',
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId || '1:138390740913:web:5dd55766dd21ff05282790',
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey || 'AIzaSyBj8hp9-5dWo7rf4LBFHcMM5Hp3SNQ-1uQ',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain || 'gen-lang-client-0486469536.firebaseapp.com',
  firestoreDatabaseId: env.VITE_FIREBASE_DATABASE_ID || firebaseConfigJson.firestoreDatabaseId || 'ai-studio-sanyturnkeygesto-07b1d634-7f94-4597-a18a-2b9609af574f',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket || 'gen-lang-client-0486469536.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId || '138390740913',
};

// Initialize Firebase App without duplicate initialization error on HMR/Vercel
export const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

// CRITICAL: Must provide firestoreDatabaseId
export const db = getFirestore(app, resolvedFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Public field users do not need to create an account, but Firestore rules can
// still require an authenticated principal. Anonymous Auth provides that
// principal automatically and keeps the form usable across devices.
export const firebaseAuthReady = signInAnonymously(auth)
  .then(() => true)
  .catch((error) => {
    console.warn('Autenticação anônima do Firebase indisponível:', error);
    return false;
  });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await firebaseAuthReady;
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Verifique a conexão do Firebase.');
    }
    return false;
  }
}

// Kick off test connection
testFirestoreConnection();
