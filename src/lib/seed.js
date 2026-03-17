// ============================================
// Certify.cx — Seed Test Accounts
// ============================================
// This module seeds test accounts into Supabase Auth on dev start.
// Accounts are only created if they don't already exist.
// Called from App.jsx on mount in development mode.

import { supabase } from './supabase';

const SEED_ACCOUNTS = [
  {
    email: 'mvpcertify@gmail.com',
    password: '!@#123Certifymvp',
    metadata: {
      name: 'Super Admin',
      role: 'super_admin',
      region: null,
    },
  },
  {
    email: 'regional@certify.cx',
    password: 'password123',
    metadata: {
      name: 'Regional Admin',
      role: 'regional_admin',
      region: 'middle_east',
    },
  },
  {
    email: 'auditor@certify.cx',
    password: 'password123',
    metadata: {
      name: 'Auditor User',
      role: 'auditor',
      region: 'india',
    },
  },
  {
    email: 'body@certify.cx',
    password: 'password123',
    metadata: {
      name: 'Bureau Veritas',
      role: 'certification_body',
      region: 'europe',
    },
  },
  {
    email: 'client@certify.cx',
    password: 'password123',
    metadata: {
      name: 'TechVista Solutions',
      role: 'client',
      region: 'asia',
      company_name: 'TechVista Solutions',
      activity: 'IT Services',
      city: 'Singapore',
      country: 'Singapore',
    },
  },
];

/**
 * Seed test accounts. For each account:
 * 1. Try to sign in — if it succeeds, the account exists, skip it.
 * 2. If sign-in fails, create the account via signUp.
 * 3. Sign out immediately after so we don't accidentally stay logged in.
 */
export async function seedTestAccounts() {
  // Only seed in development
  if (import.meta.env.PROD) return;

  console.log('[Seed] Checking test accounts...');
  let created = 0;
  let skipped = 0;

  for (const account of SEED_ACCOUNTS) {
    try {
      // Try signing in to check if account exists
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: account.email,
        password: account.password,
      });

      if (!signInError) {
        // Account exists — sign out and skip
        await supabase.auth.signOut();
        skipped++;
        continue;
      }

      // Account doesn't exist — create it
      const { error: signUpError } = await supabase.auth.signUp({
        email: account.email,
        password: account.password,
        options: {
          data: account.metadata,
        },
      });

      if (signUpError) {
        console.warn(`[Seed] Failed to create ${account.email}: ${signUpError.message}`);
      } else {
        console.log(`[Seed] Created: ${account.email} (${account.metadata.role})`);
        // Sign out after creating
        await supabase.auth.signOut();
        created++;
      }
    } catch (err) {
      console.warn(`[Seed] Error for ${account.email}:`, err.message);
    }
  }

  console.log(`[Seed] Done. Created: ${created}, Skipped (already exist): ${skipped}`);
}
