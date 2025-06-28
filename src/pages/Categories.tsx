import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
  level?: number;
}

type NewCategory = {
  name: string;
  parent_id: string;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState<NewCategory>({ name: '', parent_id: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (fetchError) throw fetchError;

      // Build category tree
      const categoryTree = buildCategoryTree(data || []);
      setCategories(categoryTree);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error fetching categories';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const buildCategoryTree = (categories: Category[]): Category[] => {
    const map = new Map<string, Category>();
    const result: Category[] = [];

    // First pass: create a map of all categories
    categories.forEach(category => {
      map.set(category.id, { ...category, children: [] });
    });

    // Second pass: build the tree structure
    map.forEach(category => {
      if (category.parent_id && map.has(category.parent_id)) {
        const parent = map.get(category.parent_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(category);
        }
      } else {
        result.push(category);
      }
    });

    return result;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) {
        throw new Error('User not authenticated');
      }

      const categoryData = {
        name: newCategory.name,
        parent_id: newCategory.parent_id || null,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('categories')
        .insert([categoryData]);

      if (error) throw error;

      // Reset form and refresh categories
      setNewCategory({ name: '', parent_id: '' });
      fetchCategories();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error adding category';
      setError(errorMessage);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) throw error;

        fetchCategories();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error deleting category';
        setError(errorMessage);
      }
    }
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <div key={category.id} className="ml-4">
        <div className="flex items-center py-2">
          {hasChildren && (
            <button
              onClick={() => toggleCategory(category.id)}
              className="text-gray-500 hover:text-gray-700 mr-2"
            >
              {isExpanded ? '−' : '+'}
            </button>
          )}
          <div className="flex-1">
            <span className="font-medium text-gray-700">{category.name}</span>
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/categories/${category.id}/edit`}
              className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDeleteCategory(category.id)}
              className="text-red-600 hover:text-red-900 text-sm font-medium"
            >
              Delete
            </button>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Categories
          </h2>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Add New Category
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  required
                />
              </div>
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700">
                  Parent Category (optional)
                </label>
                <select
                  id="parent_id"
                  value={newCategory.parent_id}
                  onChange={(e) => setNewCategory({ ...newCategory, parent_id: e.target.value })}
                  className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a parent category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Category
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Category List
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Manage your product categories in a hierarchical structure.
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          {categories.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No categories found. Add your first category above.</p>
          ) : (
            <div className="space-y-2">
              {categories.map(category => renderCategory(category))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
