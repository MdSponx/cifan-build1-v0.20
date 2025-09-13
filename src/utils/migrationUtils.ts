import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export async function migrateSubmissionsAddUserId() {
  try {
    console.log('Starting migration: Adding userId to existing submissions...');

    // Get all submissions without userId
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('userId', '==', null));
    const snapshot = await getDocs(q);

    const migrationPromises: Promise<void>[] = [];

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();

      // Try to match user by email
      if (data.submitterEmail) {
        // You'll need to implement email-to-uid mapping
        // This could be done by querying the profiles collection
        migrationPromises.push(
          updateSubmissionWithUserId(docSnapshot.id, data.submitterEmail)
        );
      }
    });

    await Promise.all(migrationPromises);
    console.log(`Migration completed: ${migrationPromises.length} documents updated`);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

async function updateSubmissionWithUserId(submissionId: string, email: string) {
  // Query profiles collection to find userId by email
  const profilesRef = collection(db, 'profiles');
  const q = query(profilesRef, where('email', '==', email));
  const snapshot = await getDocs(q);

  if (!snapshot.empty) {
    const userProfile = snapshot.docs[0];
    const userId = userProfile.id;

    // Update submission with userId
    const submissionRef = doc(db, 'submissions', submissionId);
    await updateDoc(submissionRef, { userId });

    console.log(`Updated submission ${submissionId} with userId ${userId}`);
  }
}
