/**
 * Script para criar um evento de teste + invite link na Supabase.
 * 
 * Uso:
 *   node scripts/create-test-invite.mjs
 * 
 * Resultado: imprime o URL local para testar a página do evento.
 * 
 * NOTA: Usa a service_role key para bypass de RLS.
 *       Se não tiveres service_role, podes criar o token manualmente
 *       no Supabase Dashboard → SQL Editor (ver instruções abaixo).
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ──
const SUPABASE_URL = 'https://pgpryaelqhspwhplttzb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBncHJ5YWVscWhzcHdocGx0dHpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNjY0MzUsImV4cCI6MjA2ODk0MjQzNX0.hPcn2J8zSKTC_rY8OeCmhLdJLhZEMT-yV1EZjYGFD2A';

// Se tiveres a service_role key, descomenta e usa em vez da anon:
// const SUPABASE_SERVICE_KEY = 'eyJ...';
// const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Generate a random token ──
function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function main() {
  console.log('');
  console.log('════════════════════════════════════════');
  console.log('  LAZZO — Create Test Event + Invite');
  console.log('════════════════════════════════════════');
  console.log('');

  // ── Opção 1: Usar SQL direto no Supabase Dashboard ──
  // Se este script falhar por RLS, copia o SQL abaixo e cola no
  // Supabase Dashboard → SQL Editor → New Query → Run.

  const token = generateToken();
  const now = new Date();
  const start = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // +7 days
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);       // +3 hours
  const expires = new Date(now.getTime() + 48 * 60 * 60 * 1000);    // +48 hours

  const sql = `
-- ═══ COPIA ESTE SQL E COLA NO SUPABASE DASHBOARD → SQL EDITOR ═══

-- 1. Criar evento de teste
INSERT INTO public.events (id, name, emoji, status, start_datetime, end_datetime, description, created_by)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  'Beach Party 🏖️',
  '🏖️',
  'pending',
  '${start.toISOString()}',
  '${end.toISOString()}',
  'Come join us for an awesome beach party! Bring sunscreen and good vibes. 🌊',
  (SELECT id FROM public.users LIMIT 1) -- usa o primeiro user que existir
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  emoji = EXCLUDED.emoji,
  start_datetime = EXCLUDED.start_datetime,
  end_datetime = EXCLUDED.end_datetime,
  description = EXCLUDED.description;

-- 2. Adicionar o criador como participant (host)
INSERT INTO public.event_participants (pevent_id, user_id, rsvp)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  (SELECT id FROM public.users LIMIT 1),
  'yes'
)
ON CONFLICT (pevent_id, user_id) DO NOTHING;

-- 3. Criar invite link com token  
INSERT INTO public.event_invite_links (event_id, created_by, token, expires_at)
VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  (SELECT id FROM public.users LIMIT 1),
  '${token}',
  '${expires.toISOString()}'
);

-- 4. Confirmar que foi criado:
SELECT token, expires_at FROM public.event_invite_links 
WHERE token = '${token}';
`;

  console.log('📋 Copia o SQL abaixo e cola no Supabase Dashboard:');
  console.log('   https://supabase.com/dashboard → SQL Editor → New Query');
  console.log('');
  console.log('─────────────────────────────────────────');
  console.log(sql);
  console.log('─────────────────────────────────────────');
  console.log('');
  console.log('Depois de executar o SQL, abre este link:');
  console.log('');
  console.log(`  🔗 Local:  http://localhost:3000/i/${token}`);
  console.log(`  🔗 Prod:   https://getlazzo.com/i/${token}`);
  console.log('');
  console.log(`  📱 WhatsApp test: envia o link acima para qualquer chat`);
  console.log('');
  console.log('════════════════════════════════════════');
}

main().catch(console.error);
