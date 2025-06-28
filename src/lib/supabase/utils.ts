import { useCallback, useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import type { 
  Database, 
  Tables, 
  InsertCategory, 
  UpdateCategory, 
  InsertProduct, 
  UpdateProduct,
  ProductWithRelations,
  CategoryWithCount,
  Pagination
} from '@/types/database.types';

type TableName = keyof Database['public']['Tables'];
type TableRow<T extends TableName> = Tables<T>;

// Base hook for common CRUD operations
const useTable = <T extends TableName>(tableName: T) => {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all rows for the current user
  const fetchAll = useCallback(async (): Promise<TableRow<T>[] | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      return data as TableRow<T>[];
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching ${tableName}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, tableName, user]);

  // Fetch a single row by ID
  const fetchById = useCallback(async (id: string): Promise<TableRow<T> | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
        
      if (fetchError) throw fetchError;
      return data as TableRow<T>;
    } catch (err) {
      setError(err as Error);
      console.error(`Error fetching ${tableName} with id ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, tableName, user]);

  // Insert a new row
  const insert = useCallback(async (values: any): Promise<TableRow<T> | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from(tableName)
        .insert({ ...values, user_id: user.id })
        .select()
        .single();
        
      if (insertError) throw insertError;
      return data as TableRow<T>;
    } catch (err) {
      setError(err as Error);
      console.error(`Error inserting into ${tableName}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, tableName, user]);

  // Update an existing row
  const update = useCallback(async (id: string, values: Partial<TableRow<T>>): Promise<TableRow<T> | null> => {
    if (!user) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: updateError } = await supabase
        .from(tableName)
        .update(values)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();
        
      if (updateError) throw updateError;
      return data as TableRow<T>;
    } catch (err) {
      setError(err as Error);
      console.error(`Error updating ${tableName} with id ${id}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [supabase, tableName, user]);

  // Delete a row
  const remove = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (deleteError) throw deleteError;
      return true;
    } catch (err) {
      setError(err as Error);
      console.error(`Error deleting from ${tableName} with id ${id}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [supabase, tableName, user]);

  return {
    loading,
    error,
    fetchAll,
    fetchById,
    insert,
    update,
    remove,
  };
};

// Custom hook for categories
export const useCategories = () => {
  const { 
    fetchAll, 
    fetchById, 
    insert, 
    update, 
    remove, 
    loading, 
    error 
  } = useTable('categories');

  const fetchWithProductCount = useCallback(async (): Promise<CategoryWithCount[] | null> => {
    const supabase = useSupabaseClient<Database>();
    const user = useUser();
    
    if (!user) return null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select(`
          *,
          products:product_categories(count)
        `)
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      
      return (data || []).map(category => ({
        ...category,
        product_count: category.products?.[0]?.count || 0
      }));
    } catch (err) {
      console.error('Error fetching categories with product count:', err);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    fetchCategories: fetchAll,
    fetchCategory: fetchById,
    fetchCategoriesWithCount: fetchWithProductCount,
    createCategory: insert,
    updateCategory: update,
    deleteCategory: remove,
  };
};

// Custom hook for products
export const useProducts = () => {
  const { 
    fetchAll, 
    fetchById, 
    insert, 
    update, 
    remove, 
    loading, 
    error 
  } = useTable('products');
  const supabase = useSupabaseClient<Database>();
  const user = useUser();

  // Fetch products with relations (categories and images)
  const fetchWithRelations = useCallback(async (): Promise<ProductWithRelations[] | null> => {
    if (!user) return null;
    
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(`
          *,
          categories:product_categories(category:categories(*)),
          images:product_images(*)
        `)
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      
      return (data || []).map(product => ({
        ...product,
        categories: product.categories?.map(pc => pc.category) || [],
        images: product.images || []
      }));
    } catch (err) {
      console.error('Error fetching products with relations:', err);
      return null;
    }
  }, [supabase, user]);

  // Paginated fetch
  const fetchPaginated = useCallback(async (
    page: number = 1, 
    pageSize: number = 10
  ): Promise<Pagination<ProductWithRelations> | null> => {
    if (!user) return null;
    
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, count, error: fetchError } = await supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);
        
      if (fetchError) throw fetchError;
      
      return {
        data: data as ProductWithRelations[],
        total: count || 0,
        page,
        pageSize,
        pageCount: Math.ceil((count || 0) / pageSize)
      };
    } catch (err) {
      console.error('Error fetching paginated products:', err);
      return null;
    }
  }, [supabase, user]);

  // Add or update product with categories
  const saveProduct = useCallback(async (
    productData: InsertProduct | UpdateProduct,
    categoryIds: string[] = []
  ): Promise<ProductWithRelations | null> => {
    if (!user) return null;
    
    try {
      let product: ProductWithRelations | null = null;
      
      // Start a transaction
      const { data, error } = await supabase.rpc('with_transaction', {
        p_product: productData,
        p_category_ids: categoryIds
      });
      
      if (error) throw error;
      product = data;
      
      return product;
    } catch (err) {
      console.error('Error saving product:', err);
      return null;
    }
  }, [supabase, user]);

  return {
    loading,
    error,
    fetchProducts: fetchAll,
    fetchProduct: fetchById,
    fetchProductsWithRelations: fetchWithRelations,
    fetchProductsPaginated: fetchPaginated,
    createProduct: insert,
    updateProduct: update,
    saveProduct,
    deleteProduct: remove,
  };
};

// Custom hook for product images
export const useProductImages = (productId?: string) => {
  const supabase = useSupabaseClient<Database>();
  const [images, setImages] = useState<Tables<'product_images'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchImages = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', id)
        .order('position', { ascending: true });
        
      if (fetchError) throw fetchError;
      
      setImages(data || []);
      return data || [];
    } catch (err) {
      setError(err as Error);
      console.error('Error fetching product images:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Auto-fetch images when productId changes
  useEffect(() => {
    if (productId) {
      fetchImages(productId);
    } else {
      setImages([]);
    }
  }, [productId, fetchImages]);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    if (!productId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${productId}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);
        
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (err) {
      setError(err as Error);
      console.error('Error uploading image:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [productId, supabase.storage]);

  const addImage = useCallback(async (url: string, altText?: string): Promise<Tables<'product_images'> | null> => {
    if (!productId) return null;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: insertError } = await supabase
        .from('product_images')
        .insert({
          product_id: productId,
          url,
          alt_text: altText || '',
          position: images.length,
          is_primary: images.length === 0 // Set as primary if it's the first image
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      setImages(prev => [...prev, data]);
      return data;
    } catch (err) {
      setError(err as Error);
      console.error('Error adding product image:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [productId, images.length, supabase]);

  const updateImage = useCallback(async (
    imageId: string, 
    updates: Partial<Tables<'product_images'>>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('product_images')
        .update(updates)
        .eq('id', imageId);
        
      if (updateError) throw updateError;
      
      setImages(prev => 
        prev.map(img => 
          img.id === imageId ? { ...img, ...updates } : img
        )
      );
      
      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Error updating product image:', err);
      return false;
    }
  }, [supabase]);

  const removeImage = useCallback(async (imageId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);
        
      if (deleteError) throw deleteError;
      
      setImages(prev => prev.filter(img => img.id !== imageId));
      return true;
    } catch (err) {
      setError(err as Error);
      console.error('Error removing product image:', err);
      return false;
    }
  }, [supabase]);

  return {
    images,
    loading,
    error,
    fetchImages,
    uploadImage,
    addImage,
    updateImage,
    removeImage,
  };
};

// Utility function to generate a slug from a string
export const generateSlug = (str: string): string => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// Utility function to format price
export const formatPrice = (price: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

// Utility function to handle file uploads
export const uploadFile = async (
  file: File, 
  bucket: string, 
  path: string = ''
): Promise<{ path: string; url: string } | null> => {
  const supabase = useSupabaseClient<Database>();
  
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);
      
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
      
    return { path: filePath, url: publicUrl };
  } catch (err) {
    console.error('Error uploading file:', err);
    return null;
  }
};
