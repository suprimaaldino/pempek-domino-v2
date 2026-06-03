import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';
import { signInWithEmailAndPassword } from 'firebase/auth';

const INITIAL_PRODUCTS = [
  { name: 'Pempek Lenjer Kecil', price: 5000, category: 'kecil', isActive: true, description: 'Pempek lenjer ukuran kecil yang lembut dan gurih.' },
  { name: 'Pempek Telur Kecil', price: 5000, category: 'kecil', isActive: true, description: 'Pempek telur ukuran kecil dengan isian telur yang pas.' },
  { name: 'Pempek Adaan', price: 5000, category: 'kecil', isActive: true, description: 'Pempek bulat dengan campuran daun bawang dan santan.' },
  { name: 'Pempek Kulit', price: 5000, category: 'kecil', isActive: true, description: 'Pempek kulit crispy di luar, kenyal di dalam.' },
  { name: 'Pempek Keriting', price: 6000, category: 'kecil', isActive: true, description: 'Pempek keriting yang unik dan kenyal.' },
  { name: 'Pempek Kapal Selam', price: 25000, category: 'besar', isActive: true, description: 'Pempek besar dengan isian 1 butir telur utuh.' },
  { name: 'Pempek Lenjer Besar', price: 25000, category: 'besar', isActive: true, description: 'Pempek lenjer ukuran besar, cocok untuk porsi kenyang.' },
  { name: 'Paket 50rb (Campur 10)', price: 50000, category: 'paket', isActive: true, description: 'Paket hemat 10 pcs pempek kecil campur.' },
  { name: 'Paket 100rb (Campur 20)', price: 100000, category: 'paket', isActive: true, description: 'Paket keluarga 20 pcs pempek kecil campur.' },
  { name: 'Paket Kapal Selam + 5 Kecil', price: 50000, category: 'paket', isActive: true, description: 'Kombinasi 1 Kapal Selam dan 5 Pempek Kecil.' },
  { name: 'Cuka Pempek 250ml', price: 15000, category: 'kecil', isActive: true, description: 'Cuka pempek kental, pedas, dan mantap.' },
  { name: 'Model / Tekwan', price: 15000, category: 'besar', isActive: true, description: 'Menu berkuah gurih khas Palembang.' },
];

export async function seedProducts() {
  console.log('🌱 Seeding products...');

  // Try to authenticate as admin first
  const adminEmail = 'suprimaaldino@gmail.com';
  const adminPassword = 'p3mp3Kd0m!n0';

  try {
    console.log(`🔐 Attempting to authenticate as ${adminEmail}...`);
    await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    console.log('🔓 Authenticated successfully.');
  } catch (authError: any) {
    console.warn(`⚠️ Authentication skipped/failed: ${authError.message}`);
    console.log('⚡ Attempting unauthenticated seeding...');
  }

  try {
    const productsRef = collection(db, 'products');
    const batch = writeBatch(db);

    for (const p of INITIAL_PRODUCTS) {
      const newDoc = doc(productsRef);
      batch.set(newDoc, { ...p, createdAt: new Date() });
    }

    await batch.commit();
    console.log('✅ Seeding complete!');
  } catch (error: any) {
    console.error('❌ Seeding failed!');
    console.error(error);
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Make sure you have created the admin user in Firebase Auth:');
    console.log(`   - Email: ${adminEmail}`);
    console.log(`   - Password: ${adminPassword}`);
    console.log('2. Alternatively, temporarily change your Firestore security rules to public:');
    console.log('   rules_version = \'2\';');
    console.log('   service cloud.firestore {');
    console.log('     match /databases/{database}/documents {');
    console.log('       match /{document=**} {');
    console.log('         allow read, write: if true;');
    console.log('       }');
    console.log('     }');
    console.log('   }');
    console.log('   Once seeded, revert back or deploy the rules in firestore.rules.\n');
    throw error;
  }
}

// Default execution check
if (require.main === module) {
  seedProducts().then(() => process.exit(0)).catch((e) => {
    process.exit(1);
  });
}
