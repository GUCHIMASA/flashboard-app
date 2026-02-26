import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

/**
 * Firebaseを初期化します。
 * クライアントサイドとサーバーサイドの両方で安全に呼び出すことができます。
 */
export function initializeFirebase() {
  let firebaseApp: FirebaseApp;

  if (!getApps().length) {
    try {
      // 本番環境（App Hosting等）では引数なしで環境変数を参照
      firebaseApp = initializeApp();
    } catch (e) {
      // フォールバックとして設定オブジェクトを使用
      firebaseApp = initializeApp(firebaseConfig);
    }
  } else {
    firebaseApp = getApp();
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
