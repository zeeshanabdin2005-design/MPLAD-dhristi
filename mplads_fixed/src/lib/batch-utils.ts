import { WriteBatch } from 'firebase/firestore';

/**
 * Commits a Firestore batch with exponential backoff retries.
 * This prevents the "unavailable" error when the connection is saturated.
 */
export async function commitBatchWithRetry(batch: WriteBatch, maxRetries = 3): Promise<void> {
  let retries = 0;
  while (true) {
    try {
      await batch.commit();
      // Add a small delay after a successful commit to let the connection breathe
      await new Promise(resolve => setTimeout(resolve, 300));
      return;
    } catch (error: any) {
      if (retries >= maxRetries) {
        throw error;
      }
      retries++;
      console.warn(`Batch commit failed (attempt ${retries}/${maxRetries}). Retrying...`, error);
      const delay = Math.pow(2, retries) * 1000 + Math.random() * 500;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
