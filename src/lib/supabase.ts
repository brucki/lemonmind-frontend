import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Categories
export const getCategories = async (userId: string) => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId);
  
  return { data, error };
};

export const createCategory = async (category: { name: string; parent_id?: string; user_id: string }) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([category])
    .select();
  
  return { data, error };
};

// Products
export const getProducts = async (userId: string) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('user_id', userId);
  
  return { data, error };
};

export const createProduct = async (product: any) => {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select();
  
  return { data, error };
};

export const updateProduct = async (id: string, updates: any) => {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select();
  
  return { data, error };
};

// File uploads
export const uploadFile = async (file: File, path: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random()}.${fileExt}`;
  const filePath = `${path}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('product-files')
    .upload(filePath, file);
  
  if (error) throw error;
  
  // Get the public URL
  const { data: { publicUrl } } = supabase.storage
    .from('product-files')
    .getPublicUrl(data.path);
  
  return { publicUrl, filePath: data.path };
};

export const deleteFile = async (filePath: string) => {
  const { error } = await supabase.storage
    .from('product-files')
    .remove([filePath]);
  
  return { error };
};
