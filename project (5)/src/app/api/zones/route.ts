import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { seedDatabase } from '@/lib/db-seed';

export async function GET() {
  await seedDatabase();
  const { firestore: db } = initializeFirebase();
  const querySnapshot = await getDocs(collection(db, 'zones'));
  const zones = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json(zones);
}
