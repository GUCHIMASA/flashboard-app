import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function deleteCollection() {
    const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (!serviceAccountPath) {
        console.error('Error: GOOGLE_APPLICATION_CREDENTIALS is not set in .env.local');
        process.exit(1);
    }

    if (!getApps().length) {
        initializeApp({
            credential: cert(require(serviceAccountPath))
        });
    }

    const db = getFirestore();
    const collectionRef = db.collection('articles');

    console.log('Fetching documents to delete...');
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log('No documents found in "articles" collection.');
        return;
    }

    console.log(`Deleting ${snapshot.size} documents...`);

    const batchSize = 500;
    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const chunk = snapshot.docs.slice(i, i + batchSize);
        chunk.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Progress: ${Math.min(i + batchSize, snapshot.docs.length)} / ${snapshot.docs.length}`);
    }

    console.log('Successfully deleted all documents in "articles" collection.');
}

deleteCollection().catch(console.error);
