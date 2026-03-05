import { initializeApp, getApps, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function initAdminApp() {
  if (getApps().length) return;

  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GCLOUD_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  const serviceAccountJson =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
    process.env.FIREBASE_SERVICE_ACCOUNT ||
    '';

  if (serviceAccountJson.trim()) {
    initializeApp({
      credential: cert(JSON.parse(serviceAccountJson)),
      projectId,
    });
    return;
  }

  // Cloud Run / Firebase App Hosting などでは ADC が利用可能
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export function initializeFirebaseAdmin() {
  initAdminApp();
  return { firestore: getFirestore() };
}

