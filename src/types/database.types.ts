// This file contains custom TypeScript types that extend the auto-generated types from Supabase
// You can add custom types, enums, and utility types here

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          description: string | null;
          is_active: boolean;
          parent_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          is_active?: boolean;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          is_active?: boolean;
          parent_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          cost_per_item: number | null;
          sku: string | null;
          barcode: string | null;
          quantity: number;
          track_quantity: boolean;
          is_active: boolean;
          is_featured: boolean;
          weight: number | null;
          weight_unit: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          slug: string;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number;
          track_quantity?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          weight?: number | null;
          weight_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          price?: number;
          compare_at_price?: number | null;
          cost_per_item?: number | null;
          sku?: string | null;
          barcode?: string | null;
          quantity?: number;
          track_quantity?: boolean;
          is_active?: boolean;
          is_featured?: boolean;
          weight?: number | null;
          weight_unit?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      product_categories: {
        Row: {
          id: string;
          product_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          category_id?: string;
          created_at?: string;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt_text: string | null;
          position: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt_text?: string | null;
          position?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          alt_text?: string | null;
          position?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_user_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Re-export the generated types for convenience
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Type aliases for easier access
export type UserProfile = Tables<'user_profiles'>;
export type Category = Tables<'categories'>;
export type Product = Tables<'products'>;
export type ProductCategory = Tables<'product_categories'>;
export type ProductImage = Tables<'product_images'>;

// Types for insert operations
export type InsertUserProfile = Database['public']['Tables']['user_profiles']['Insert'];
export type InsertCategory = Database['public']['Tables']['categories']['Insert'];
export type InsertProduct = Database['public']['Tables']['products']['Insert'];
export type InsertProductCategory = Database['public']['Tables']['product_categories']['Insert'];
export type InsertProductImage = Database['public']['Tables']['product_images']['Insert'];

// Types for update operations
export type UpdateUserProfile = Database['public']['Tables']['user_profiles']['Update'];
export type UpdateCategory = Database['public']['Tables']['categories']['Update'];
export type UpdateProduct = Database['public']['Tables']['products']['Update'];
export type UpdateProductImage = Database['public']['Tables']['product_images']['Update'];

// Types for form data (optional, can be used for form validation)
export interface CategoryFormData {
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  parent_id?: string | null;
}

export interface ProductFormData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_at_price?: number | null;
  cost_per_item?: number | null;
  sku?: string;
  barcode?: string;
  quantity: number;
  track_quantity: boolean;
  is_active: boolean;
  is_featured: boolean;
  weight?: number | null;
  weight_unit: string;
  category_ids?: string[]; // For handling multiple categories
}

// Type for product with relations
export interface ProductWithRelations extends Product {
  categories?: Category[];
  images?: ProductImage[];
}

// Type for category with product count
export interface CategoryWithCount extends Category {
  product_count?: number;
  children?: CategoryWithCount[];
}

// Type for pagination
export interface Pagination<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// Type for API response
export interface ApiResponse<T> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

// Type for select options
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
