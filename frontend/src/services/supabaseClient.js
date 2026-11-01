import { createClient } from '@supabase/supabase-js';

// Retrieve config from localStorage or Vite environment variables
export function getSupabaseConfig() {
  const localConfig = localStorage.getItem('speedo_supabase_config');
  if (localConfig) {
    try {
      const parsed = JSON.parse(localConfig);
      if (parsed.url && parsed.anonKey) return parsed;
    } catch (e) {
      // ignore
    }
  }

  const envUrl = (import.meta.env?.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env?.VITE_SUPABASE_ANON_KEY || '').trim();
  if (envUrl && envKey && !envUrl.includes('your-project-id') && !envUrl.includes('YOUR_')) {
    return { url: envUrl, anonKey: envKey };
  }

  return {
    url: '',
    anonKey: ''
  };
}

export function saveSupabaseConfig(url, anonKey) {
  if (!url || !anonKey) {
    localStorage.removeItem('speedo_supabase_config');
    initClient();
    return false;
  }
  const cleanUrl = url.trim().replace(/\/$/, '');
  const cleanKey = anonKey.trim();
  localStorage.setItem('speedo_supabase_config', JSON.stringify({ url: cleanUrl, anonKey: cleanKey }));
  initClient();
  return true;
}

// Client instance
let client = null;

function initClient() {
  const cfg = getSupabaseConfig();
  if (cfg && cfg.url && cfg.anonKey) {
    try {
      client = createClient(cfg.url, cfg.anonKey);
      console.log('⚡ Connected to Supabase Project:', cfg.url);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      client = null;
    }
  } else {
    console.warn('⚠️ Supabase credentials not found. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
    client = null;
  }
}

initClient();

export const supabase = client;

export function getClient() {
  if (!client) initClient();
  return client;
}

export function isSupabaseConfigured() {
  return !!getClient();
}

/**
 * Upload an image file directly to Supabase Storage bucket ('product-images')
 * Returns the public URL of the uploaded image
 */
export async function uploadImageToSupabase(file) {
  const sb = getClient();
  if (!sb) {
    // If Supabase not connected, return a local base64 DataURL for instant preview
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ success: true, url: e.target.result, local: true });
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = `garment-${Date.now()}-${Math.floor(Math.random() * 10000)}.${fileExt}`;
    const filePath = `uploads/${cleanFileName}`;

    const { data, error } = await sb.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.warn('Storage upload error, attempting public URL fallback:', error);
      // If bucket permission issue or doesn't exist, provide base64 data preview
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({ success: true, url: e.target.result, local: true, warning: error.message });
        reader.readAsDataURL(file);
      });
    }

    const { data: publicUrlData } = sb.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicUrlData.publicUrl,
      local: false
    };
  } catch (err) {
    console.error('Upload exception:', err);
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({ success: true, url: e.target.result, local: true, warning: err.message });
      reader.readAsDataURL(file);
    });
  }
}
