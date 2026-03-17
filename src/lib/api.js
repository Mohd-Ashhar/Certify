// ============================================
// Certify.cx — Supabase API Helpers
// ============================================
// Generic CRUD helpers that wrap Supabase's PostgREST API.
// These ensure all data access goes through Supabase and
// will automatically respect Row-Level Security policies.
//
// Usage:
//   import { fetchAll, fetchById, insertRow, updateRow, deleteRow } from '../lib/api';
//
//   const { data, error } = await fetchAll('companies', {
//     filters: { region: 'middle_east' },
//     orderBy: { column: 'created_at', ascending: false },
//     limit: 20,
//   });

import { supabase } from './supabase';

/**
 * Fetch all rows from a table with optional filters, ordering, and pagination.
 */
export async function fetchAll(table, options = {}) {
  let query = supabase.from(table).select(options.select || '*');

  // Apply filters
  if (options.filters) {
    for (const [column, value] of Object.entries(options.filters)) {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query = query.eq(column, value);
      }
    }
  }

  // Apply search (ilike on a specific column)
  if (options.search && options.searchColumn) {
    query = query.ilike(options.searchColumn, `%${options.search}%`);
  }

  // Apply ordering
  if (options.orderBy) {
    query = query.order(options.orderBy.column, {
      ascending: options.orderBy.ascending ?? false,
    });
  }

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;
  return { data, error, count };
}

/**
 * Fetch a single row by ID.
 */
export async function fetchById(table, id) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Insert a new row.
 */
export async function insertRow(table, row) {
  const { data, error } = await supabase
    .from(table)
    .insert(row)
    .select()
    .single();

  return { data, error };
}

/**
 * Update an existing row by ID.
 */
export async function updateRow(table, id, updates) {
  const { data, error } = await supabase
    .from(table)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a row by ID.
 */
export async function deleteRow(table, id) {
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Subscribe to real-time changes on a table.
 * Returns the channel (call channel.unsubscribe() to clean up).
 */
export function subscribeToTable(table, callback, filter = undefined) {
  let channel = supabase
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table, filter },
      (payload) => callback(payload)
    )
    .subscribe();

  return channel;
}

/**
 * Upload a file to Supabase Storage.
 */
export async function uploadFile(bucket, path, file) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  return { data, error };
}

/**
 * Get a public URL for a file in Supabase Storage.
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
