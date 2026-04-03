import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('[Seed] Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Skipping seed.');
  process.exit(0);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SEED_ACCOUNTS = [
  {
    email: 'mvpcertify@gmail.com',
    password: '!@#123Certifymvp',
    user_metadata: {
      name: 'Super Admin',
      role: 'super_admin',
      region: null,
    },
  },
  {
    email: 'regional@certify.cx',
    password: 'password123',
    user_metadata: {
      name: 'Regional Admin',
      role: 'regional_admin',
      region: 'asia',
    },
  },
  {
    email: 'auditor@certify.cx',
    password: 'password123',
    user_metadata: {
      name: 'Auditor User',
      role: 'auditor',
      region: 'asia',
    },
  },
  {
    email: 'body@certify.cx',
    password: 'password123',
    user_metadata: {
      name: 'Bureau Veritas',
      role: 'certification_body',
      region: 'europe',
    },
  },
  {
    email: 'client@certify.cx',
    password: 'password123',
    user_metadata: {
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

async function runSeed() {
  console.log('[Seed] Checking test accounts...');
  let created = 0;
  let skipped = 0;

  for (const account of SEED_ACCOUNTS) {
    try {
      // Admin API: list users by email
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      
      const exists = users.find(u => u.email === account.email);
      if (exists) {
        skipped++;
        continue;
      }

      // Create using Admin API to bypass email confirmation and allow custom metadata
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: account.user_metadata,
      });

      if (createError) {
        console.warn(`[Seed] Failed: ${account.email} - ${createError.message}`);
      } else {
        console.log(`[Seed] Created: ${account.email} (${account.user_metadata.role})`);
        
        // Also insert into profiles table directly, just in case trigger isn't live
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: newUser.user.id,
          email: account.email,
          name: account.user_metadata.name,
          role: account.user_metadata.role,
          region: account.user_metadata.region,
          company: account.user_metadata.company_name || null,
        });
        
        if (profileError) {
          // ignore table missing error
        }
        
        created++;
      }
    } catch (err) {
      console.warn(`[Seed] Error for ${account.email}:`, err.message);
    }
  }

  console.log(`[Seed] Done. Created: ${created}, Skipped: ${skipped}`);
}

runSeed();
