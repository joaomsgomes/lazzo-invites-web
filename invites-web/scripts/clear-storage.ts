/**
 * One-time script to delete ALL files from the memory_groups storage bucket.
 * Run with: npx tsx scripts/clear-storage.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Service role bypasses RLS and storage policies
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// All buckets used by the app
const BUCKETS = ['memory_groups', 'users-profile-pic', 'avatars'];

async function listAllFiles(bucket: string, prefix: string = ''): Promise<string[]> {
  const allPaths: string[] = [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
  });

  if (error) {
    // Bucket may not exist — skip silently
    if (error.message?.includes('not found')) return allPaths;
    console.error(`  Error listing ${bucket}/${prefix}:`, error.message);
    return allPaths;
  }

  for (const item of data ?? []) {
    const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

    if (item.id) {
      // It's a file
      allPaths.push(fullPath);
    } else {
      // It's a folder — recurse
      const nested = await listAllFiles(bucket, fullPath);
      allPaths.push(...nested);
    }
  }

  return allPaths;
}

async function clearBucket(bucket: string): Promise<number> {
  console.log(`\n📦 Bucket: "${bucket}"`);

  const files = await listAllFiles(bucket);

  if (files.length === 0) {
    console.log('   Already empty ✅');
    return 0;
  }

  console.log(`   Found ${files.length} file(s). Deleting...`);

  const BATCH_SIZE = 500;
  let deleted = 0;

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(batch);

    if (error) {
      console.error(`   Error deleting batch ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      deleted += batch.length;
      console.log(`   Deleted ${deleted}/${files.length}`);
    }
  }

  return deleted;
}

async function main() {
  console.log('🗑️  Clearing ALL storage buckets...');

  let totalDeleted = 0;

  for (const bucket of BUCKETS) {
    totalDeleted += await clearBucket(bucket);
  }

  console.log(`\n✅ Done! Deleted ${totalDeleted} file(s) across ${BUCKETS.length} buckets.`);
}

main().catch(console.error);
