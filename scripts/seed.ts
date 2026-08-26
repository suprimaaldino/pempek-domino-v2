/**
 * Seed script — populates products, payment config, and business settings
 * if the database is empty. Reuses the canonical seeder in lib/firestore.ts.
 *
 * Usage (Node 20+, credentials from env — never hardcoded):
 *   npx tsx --env-file=.env.local scripts/seed.ts
 *
 * Requires in .env.local:
 *   ADMIN_EMAIL      — admin user created in Firebase Auth
 *   ADMIN_PASSWORD   — its password (only needed locally for this script)
 *   NEXT_PUBLIC_FIREBASE_* — Firebase project config
 */
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { seedProductsIfEmpty } from '../lib/firestore';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error(
      '❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set.\n' +
        '   Run with: npx tsx --env-file=.env.local scripts/seed.ts'
    );
    process.exit(1);
  }

  console.log(`🔐 Authenticating as ${adminEmail}...`);
  await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
  console.log('🔓 Authenticated.');

  await seedProductsIfEmpty();
  console.log('✅ Seeding complete!');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      console.error('❌ Seeding failed:', err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
