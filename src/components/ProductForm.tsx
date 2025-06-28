import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Category {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: Category[];
  parent?: {
    id: string;
    name: string;
  } | null;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  isEditing?: boolean;
}

interface UploadedFile {
  url: string;
  path: string;
  name?: string;
  type?: string;
}

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  category_id?: string | null;

  // GPSR Information
  gpsr_identification_details?: string;
  gpsr_pictograms?: string[];
  gpsr_declarations_of_conformity?: string | null;
  gpsr_certificates?: string[];
  gpsr_moderation_status?: 'pending' | 'approved' | 'rejected';
  gpsr_moderation_comment?: string;
  gpsr_last_submission_date?: string;
  gpsr_last_moderation_date?: string | null;
  gpsr_submitted_by_supplier_user?: string | null;

  // Legacy GPSR fields (keep for backward compatibility)
  gpsrWarningPhrases?: string;
  gpsrWarningText?: string;
  gpsrAdditionalSafetyInfo?: string;
  gpsrStatementOfCompliance: boolean;
  gpsrOnlineInstructionsUrl?: string;

  // Helper fields for form handling
  existing_gpsr_pictograms?: string[];
  existing_gpsr_declarations_of_conformity?: string | null;
  existing_gpsr_certificates?: string[];
  photos?: string[];
  files?: Array<{ url: string; name?: string; type?: string }>;
}

export default function ProductForm({ initialData, isEditing = false }: ProductFormProps) {
  console.log('initialData:', initialData);
  
  const defaultValues = {
    name: '',
    description: '',
    price: 0,
    gpsrStatementOfCompliance: false,
    ...initialData,
    existing_gpsr_pictograms: initialData?.gpsr_pictograms || [],
    existing_gpsr_declarations_of_conformity: initialData?.gpsr_declarations_of_conformity || null,
    existing_gpsr_certificates: initialData?.gpsr_certificates || []
  };
  
  console.log('defaultValues:', defaultValues);
  
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm<ProductFormData>();
  const categoryId = watch('category_id');
  
  useEffect(() => {
    console.log('Current category_id from form:', categoryId);
  }, [categoryId]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [gpsrPictograms, setGpsrPictograms] = useState<UploadedFile[]>([]);
  const [gpsrCertificates, setGpsrCertificates] = useState<UploadedFile[]>([]);
  const [gpsrDeclaration, setGpsrDeclaration] = useState<UploadedFile | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileDocInputRef = useRef<HTMLInputElement>(null);
  const gpsrPictogramInputRef = useRef<HTMLInputElement>(null);
  const gpsrCertificateInputRef = useRef<HTMLInputElement>(null);
  const gpsrDeclarationInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialData) {
      console.log('Setting form values from initialData:', initialData);
      
      // Tworzymy obiekt z wartościami domyślnymi
      const formValues: Partial<ProductFormData> = {
        name: '',
        description: '',
        price: 0,
        gpsrStatementOfCompliance: false,
        ...initialData,
        existing_gpsr_pictograms: initialData.gpsr_pictograms || [],
        existing_gpsr_declarations_of_conformity: initialData.gpsr_declarations_of_conformity || null,
        existing_gpsr_certificates: initialData.gpsr_certificates || []
      };
      
      console.log('Form values to reset:', formValues);
      
      // Resetujemy formularz z nowymi wartościami
      reset(formValues);

      // Handle photos
      if (initialData.photos) {
        setPhotos(initialData.photos);
      }

      // Handle existing GPSR files
      if (initialData.gpsr_pictograms) {
        setGpsrPictograms(initialData.gpsr_pictograms.map((url: string) => ({ url, path: url })));
      }

      if (initialData.gpsr_declarations_of_conformity) {
        setGpsrDeclaration({
          url: initialData.gpsr_declarations_of_conformity,
          path: initialData.gpsr_declarations_of_conformity,
          name: 'declaration.pdf',
          type: 'application/pdf'
        });
      }

      if (initialData.gpsr_certificates) {
        setGpsrCertificates(initialData.gpsr_certificates.map((url: string) => ({
          url,
          path: url,
          name: url.split('/').pop() || 'certificate.pdf',
          type: 'application/pdf'
        })));
      }
    }

    fetchCategories();
  }, [initialData, reset]);
  
  useEffect(() => {
    if (categories.length > 0 && initialData?.category_id) {
      console.log('Updating category_id after categories loaded:', initialData.category_id);
      setValue('category_id', initialData.category_id);
    }
  }, [categories, initialData, setValue]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch all categories with parent-child relationships
      const { data, error } = await supabase
        .from('categories')
        .select(`
          *,
          parent:parent_id (id, name)
        `)
        .order('name', { ascending: true });

      if (error) throw error;

      // Transform the flat data into a hierarchical structure
      const categoriesMap = new Map<string, Category>();
      const rootCategories: Category[] = [];

      // First pass: create a map of all categories
      data?.forEach(category => {
        categoriesMap.set(category.id, { ...category, children: [] });
      });

      // Second pass: build the hierarchy
      data?.forEach(category => {
        const node = categoriesMap.get(category.id);
        if (!node) return;

        if (category.parent_id) {
          const parent = categoriesMap.get(category.parent_id);
          if (parent) {
            if (!parent.children) {
              parent.children = [];
            }
            parent.children.push(node);
            return;
          }
        }
        rootCategories.push(node);
      });

      setCategories(rootCategories);
    } catch (err: any) {
      setError(err.message || 'Error fetching categories');
    }
  };

  // Helper function to render categories with indentation based on level
  const renderCategoryOptions = (categories: Category[], level = 0): ReactNode[] => {
    return categories.flatMap(category => [
      <option key={category.id} value={category.id}>
        {' '.repeat(level * 4)}{category.name}
      </option>,
      ...(category.children?.length ? renderCategoryOptions(category.children, level + 1) : [])
    ]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-photos/${fileName}`;

      // First, create a file reader to track upload progress
      const reader = new FileReader();

      // Set up the progress tracking
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progressPercentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progressPercentage);
        }
      };

      // Read the file as ArrayBuffer
      const fileBuffer = await new Promise<ArrayBuffer>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
        reader.readAsArrayBuffer(file);
      });

      // Upload the file with progress tracking
      const { data, error: uploadError } = await supabase.storage
        .from('product-files')
        .upload(filePath, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-files')
        .getPublicUrl(data.path);

      setPhotos(prev => [...prev, {
        url: publicUrl,
        path: data.path,
        name: file.name,
        type: file.type
      }]);
      setSuccess('Photo uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Helper function to upload a file with progress tracking
  const uploadFileWithProgress = async (file: File, path: string): Promise<{ path: string, publicUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const fileBuffer = e.target?.result as ArrayBuffer;

          const { data, error } = await supabase.storage
            .from('product-files')
            .upload(path, fileBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from('product-files')
            .getPublicUrl(data.path);

          resolve({ path: data.path, publicUrl });
        } catch (err) {
          reject(err);
        }
      };

      // Track progress
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          const progressPercentage = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progressPercentage);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop() || '';
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `product-documents/${fileName}`;

      const { path, publicUrl } = await uploadFileWithProgress(file, filePath);

      setFiles(prev => [...prev, {
        url: publicUrl,
        path: path,
        name: file.name,
        type: file.type
      }]);
      setSuccess('Document uploaded successfully');
    } catch (err: any) {
      setError(err.message || 'Error uploading file');
    } finally {
      setUploading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 1000);
      if (fileDocInputRef.current) {
        fileDocInputRef.current.value = '';
      }
    }
  };

  const removePhoto = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('product-files')
        .remove([path]);

      if (error) throw error;

      setPhotos(prev => prev.filter(photo => photo.path !== path));
      setSuccess('Photo removed successfully');
    } catch (err: any) {
      setError(err.message || 'Error removing photo');
    }
  };

  const removeFile = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from('product-files')
        .remove([path]);

      if (error) throw error;

      setFiles(prev => prev.filter(file => file.path !== path));
      setSuccess('File removed successfully');
    } catch (err: any) {
      setError(err.message || 'Error removing file');
    }
  };

  const uploadGpsrFiles = async () => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload new GPSR pictograms
      const uploadedPictograms = await Promise.all(
        gpsrPictograms
          .filter((p): p is UploadedFile & { url: string } => p.url.startsWith('blob:'))
          .map(async (pictogram) => {
            try {
              setUploadProgress(0);
              const response = await fetch(pictogram.url);
              const blob = await response.blob();
              const file = new File([blob], `pictogram-${Date.now()}.png`, { type: 'image/png' });
              const filePath = `gpsr/pictograms/${Date.now()}-${file.name}`;

              const { publicUrl } = await uploadFileWithProgress(file, filePath);
              return publicUrl;
            } catch (err) {
              console.error('Error uploading pictogram:', err);
              throw err;
            }
          })
      );

      // Upload new declaration of conformity if it's a new file
      let declarationUrl = gpsrDeclaration?.url;
      if (gpsrDeclaration?.url.startsWith('blob:')) {
        setUploadProgress(0);
        const response = await fetch(gpsrDeclaration.url);
        const blob = await response.blob();
        const fileExtension = gpsrDeclaration.path.split('.').pop() || 'pdf';
        const file = new File(
          [blob],
          `declaration-${Date.now()}.${fileExtension}`,
          { type: gpsrDeclaration.type || 'application/pdf' }
        );
        const filePath = `gpsr/declarations/${Date.now()}-${file.name}`;

        const { publicUrl } = await uploadFileWithProgress(file, filePath);
        declarationUrl = publicUrl;
      }

      // Upload new certificates
      const uploadedCertificates = await Promise.all(
        gpsrCertificates
          .filter((c): c is UploadedFile & { url: string } => c.url.startsWith('blob:'))
          .map(async (certificate) => {
            try {
              setUploadProgress(0);
              const response = await fetch(certificate.url);
              const blob = await response.blob();
              const fileExtension = certificate.path.split('.').pop() || 'pdf';
              const file = new File(
                [blob],
                `certificate-${Date.now()}-${certificate.name || 'certificate'}.${fileExtension}`,
                { type: certificate.type || 'application/pdf' }
              );
              const filePath = `gpsr/certificates/${Date.now()}-${file.name}`;

              const { publicUrl } = await uploadFileWithProgress(file, filePath);
              return publicUrl;
            } catch (err) {
              console.error('Error uploading certificate:', err);
              throw err;
            }
          })
      );

      return {
        pictograms: [...gpsrPictograms.filter(p => !p.url.startsWith('blob:')).map(p => p.url), ...uploadedPictograms],
        declaration: declarationUrl || null,
        certificates: [...gpsrCertificates.filter(c => !c.url.startsWith('blob:')).map(c => c.url), ...uploadedCertificates]
      };
    } catch (error) {
      console.error('Error in uploadGpsrFiles:', error);
      throw error;
    } finally {
      setUploading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Funkcja do generowania sluga z nazwy
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // usuwa znaki specjalne
      .replace(/\s+/g, '-') // zamienia spacje na myślniki
      .replace(/--+/g, '-') // zastępuje podwójne myślniki pojedynczymi
      .trim();
  };

  const onSubmit = async (formData: ProductFormData) => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Generuj slug na podstawie nazwy produktu
      const slug = generateSlug(formData.name);

      // Upload GPSR files and get their URLs
      const gpsrFiles = await uploadGpsrFiles();

      // Prepare product data with proper typing
      const productData: Record<string, any> = {
        ...formData,
        slug, // Dodaj wygenerowany slug
        user_id: user.id,
        price: Number(formData.price) || 0, // Upewnij się, że cena jest liczbą
        photos: photos.map(p => p.url),
        files: files.map(f => ({
          url: f.url,
          name: f.name || '',
          type: f.type || 'application/octet-stream'
        })),
        gpsr_identification_details: formData.gpsr_identification_details || null,
        gpsr_pictograms: gpsrFiles.pictograms,
        gpsr_declarations_of_conformity: gpsrFiles.declaration || null,
        gpsr_certificates: gpsrFiles.certificates,
        gpsr_moderation_status: 'pending' as const,
        gpsr_last_submission_date: new Date().toISOString(),
        gpsr_submitted_by_supplier_user: user.email,
        // Map camelCase fields to snake_case
        gpsr_warning_phrases: formData.gpsrWarningPhrases || null,
        gpsr_warning_text: formData.gpsrWarningText || null,
        gpsr_additional_safety_info: formData.gpsrAdditionalSafetyInfo || null,
        gpsr_statement_of_compliance: Boolean(formData.gpsrStatementOfCompliance),
        gpsr_online_instructions_url: formData.gpsrOnlineInstructionsUrl || null
      };
      
      // Remove camelCase fields to avoid duplicates
      const fieldsToRemove = [
        'gpsrWarningPhrases',
        'gpsrWarningText',
        'gpsrAdditionalSafetyInfo',
        'gpsrStatementOfCompliance',
        'gpsrOnlineInstructionsUrl'
      ];
      
      fieldsToRemove.forEach(field => {
        if (field in productData) {
          delete productData[field];
        }
      });

      if (isEditing && initialData?.id) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', initialData.id);

        if (error) throw error;
        setSuccess('Product updated successfully');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert([productData])
          .select();

        if (error) throw error;
        setSuccess('Product created successfully');
        navigate('/products');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? 'Update your product details below.'
            : 'Fill in the details below to add a new product.'}
        </p>
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

      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Basic Information</h3>
              <p className="mt-1 text-sm text-gray-500">Basic details about your product.</p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0 space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="name"
                    {...register('name', { required: 'Product name is required' })}
                    className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm ${errors.name ? 'border-red-300' : ''
                      }`}
                  />
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Cena (PLN)
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                    {...register('price', { 
                      required: 'Cena jest wymagana',
                      min: { value: 0, message: 'Cena nie może być ujemna' },
                      valueAsNumber: true
                    })}
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Opis produktu
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                    {...register('description', { required: 'Opis produktu jest wymagany' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1">
                  <select
                    id="category_id"
                    {...register('category_id')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                    onChange={(e) => console.log('Selected category_id:', e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {console.log('Available categories:', categories)}
                    {renderCategoryOptions(categories)}
                  </select>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Product Photos</h3>
              <p className="mt-1 text-sm text-gray-500">Upload images of your product.</p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        accept="image/*"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>

              {uploading && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">Uploading... {uploadProgress}%</p>
                </div>
              )}

              {photos.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Photos</h4>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={photo.url}
                          alt={`Product ${index + 1}`}
                          className="h-32 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(photo.path)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">GPSR Information</h3>
              <p className="mt-1 text-sm text-gray-500">Product safety and compliance information according to GPSR.</p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0 space-y-6">
              <div>
                <label htmlFor="gpsr_identification_details" className="block text-sm font-medium text-gray-700">
                  Identification Details
                </label>
                <div className="mt-1">
                  <textarea
                    id="gpsr_identification_details"
                    rows={3}
                    {...register('gpsr_identification_details')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                    placeholder="Product identification details as per GPSR requirements"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  GPSR Pictograms
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="gpsr-pictogram-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload pictogram</span>
                        <input
                          id="gpsr-pictogram-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const newPictograms = Array.from(e.target.files).map(file => ({
                                url: URL.createObjectURL(file),
                                path: `pictogram-${Date.now()}-${file.name}`
                              }));
                              setGpsrPictograms(prev => [...prev, ...newPictograms]);
                            }
                          }}
                          ref={gpsrPictogramInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
                  </div>
                </div>

                {gpsrPictograms.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Pictograms</h4>
                    <div className="grid grid-cols-4 gap-4">
                      {gpsrPictograms.map((pictogram, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={pictogram.url}
                            alt={`Pictogram ${index + 1}`}
                            className="h-24 w-full object-contain bg-gray-100 rounded-lg p-2"
                          />
                          <button
                            type="button"
                            onClick={() => setGpsrPictograms(prev => prev.filter((_, i) => i !== index))}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Declaration of Conformity
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="gpsr-declaration-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload Declaration</span>
                        <input
                          id="gpsr-declaration-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              const file = e.target.files[0];
                              setGpsrDeclaration({
                                url: URL.createObjectURL(file),
                                path: `declaration-${Date.now()}-${file.name}`,
                                name: file.name,
                                type: file.type
                              });
                            }
                          }}
                          ref={gpsrDeclarationInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                  </div>
                </div>

                {gpsrDeclaration && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="ml-2 text-sm font-medium text-gray-700 truncate max-w-xs">
                          {gpsrDeclaration.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setGpsrDeclaration(null)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Certificates
                </label>
                <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                  <div className="space-y-1 text-center">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                      aria-hidden="true"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="gpsr-certificate-upload"
                        className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload Certificate</span>
                        <input
                          id="gpsr-certificate-upload"
                          type="file"
                          className="sr-only"
                          accept=".pdf,.doc,.docx"
                          multiple
                          onChange={(e) => {
                            if (e.target.files) {
                              const newCertificates = Array.from(e.target.files).map(file => ({
                                url: URL.createObjectURL(file),
                                path: `certificate-${Date.now()}-${file.name}`,
                                name: file.name,
                                type: file.type
                              }));
                              setGpsrCertificates(prev => [...prev, ...newCertificates]);
                            }
                          }}
                          ref={gpsrCertificateInputRef}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB each</p>
                  </div>
                </div>

                {gpsrCertificates.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Certificates</h4>
                    <div className="space-y-2">
                      {gpsrCertificates.map((certificate, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                          <div className="flex items-center">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="ml-2 text-sm font-medium text-gray-700 truncate max-w-xs">
                              {certificate.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGpsrCertificates(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Legacy GPSR fields (kept for backward compatibility) */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-4">Legacy GPSR Information</h4>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="gpsrWarningPhrases" className="block text-sm font-medium text-gray-700">
                      Warning Phrases
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="gpsrWarningPhrases"
                        {...register('gpsrWarningPhrases')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gpsrWarningText" className="block text-sm font-medium text-gray-700">
                      Warning Text
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="gpsrWarningText"
                        rows={3}
                        {...register('gpsrWarningText')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gpsrAdditionalSafetyInfo" className="block text-sm font-medium text-gray-700">
                      Additional Safety Information
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="gpsrAdditionalSafetyInfo"
                        rows={3}
                        {...register('gpsrAdditionalSafetyInfo')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex h-5 items-center">
                      <input
                        id="gpsrStatementOfCompliance"
                        type="checkbox"
                        {...register('gpsrStatementOfCompliance')}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="gpsrStatementOfCompliance" className="font-medium text-gray-700">
                        Statement of Compliance
                      </label>
                      <p className="text-gray-500">Check this box to confirm compliance with GPSR.</p>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="gpsrOnlineInstructionsUrl" className="block text-sm font-medium text-gray-700">
                      Online Instructions URL
                    </label>
                    <div className="mt-1">
                      <input
                        type="url"
                        id="gpsrOnlineInstructionsUrl"
                        {...register('gpsrOnlineInstructionsUrl')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-[#222] sm:text-sm"
                        placeholder="https://example.com/instructions"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
          <div className="md:grid md:grid-cols-3 md:gap-6">
            <div className="md:col-span-1">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Documents</h3>
              <p className="mt-1 text-sm text-gray-500">Upload product documentation.</p>
            </div>
            <div className="mt-5 md:col-span-2 md:mt-0">
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 pt-5 pb-6">
                <div className="space-y-1 text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="document-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="document-upload"
                        name="document-upload"
                        type="file"
                        className="sr-only"
                        onChange={handleDocumentUpload}
                        ref={fileDocInputRef}
                        accept=".pdf,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents</h4>
                  <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                        <div className="w-0 flex-1 flex items-center">
                          <svg className="flex-shrink-0 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                          </svg>
                          <span className="ml-2 flex-1 w-0 truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => removeFile(file.path)}
                            className="ml-4 font-medium text-red-600 hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={() => navigate('/products')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
