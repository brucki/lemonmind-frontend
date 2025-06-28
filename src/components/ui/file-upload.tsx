import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { Upload, X, FileText, Image, File, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type FileWithPreview = File & {
  preview?: string;
  path?: string;
  size?: string;
  progress?: number;
  status?: 'uploading' | 'done' | 'error';
  error?: string;
};

interface FileUploadProps {
  /**
   * The accepted file types
   * @example { 'image/*': ['.jpeg', '.png'] }
   */
  accept?: DropzoneOptions['accept'];
  /**
   * Max file size in bytes
   * @default 5 * 1024 * 1024 (5MB)
   */
  maxSize?: number;
  /**
   * Min file size in bytes
   * @default 0
   */
  minSize?: number;
  /**
   * Max number of files
   * @default 1
   */
  maxFiles?: number;
  /**
   * Disable click to upload
   * @default false
   */
  noClick?: boolean;
  /**
   * Disable drag 'n' drop
   * @default false
   */
  noDrag?: boolean;
  /**
   * Disable space/enter key to open file dialog
   * @default false
   */
  noKeyboard?: boolean;
  /**
   * Disable preview
   * @default false
   */
  noPreview?: boolean;
  /**
   * Disable file type validation
   * @default false
   */
  noValidate?: boolean;
  /**
   * Show file upload progress
   * @default false
   */
  showProgress?: boolean;
  /**
   * Show file list
   * @default true
   */
  showFileList?: boolean;
  /**
   * Show file size
   * @default true
   */
  showFileSize?: boolean;
  /**
   * Show file type icon
   * @default true
   */
  showFileTypeIcon?: boolean;
  /**
   * Show remove button
   * @default true
   */
  showRemoveButton?: boolean;
  /**
   * Show upload button
   * @default true
   */
  showUploadButton?: boolean;
  /**
   * Upload button text
   * @default 'Upload'
   */
  uploadButtonText?: string;
  /**
   * Upload button variant
   * @default 'default'
   */
  uploadButtonVariant?: 'default' | 'outline' | 'ghost' | 'link' | 'destructive';
  /**
   * Upload button size
   * @default 'default'
   */
  uploadButtonSize?: 'default' | 'sm' | 'lg' | 'icon';
  /**
   * Dropzone class name
   */
  dropzoneClassName?: string;
  /**
   * Dropzone active class name
   */
  dropzoneActiveClassName?: string;
  /**
   * Dropzone accept class name
   */
  dropzoneAcceptClassName?: string;
  /**
   * Dropzone reject class name
   */
  dropzoneRejectClassName?: string;
  /**
   * File list class name
   */
  fileListClassName?: string;
  /**
   * File item class name
   */
  fileItemClassName?: string;
  /**
   * File preview class name
   */
  filePreviewClassName?: string;
  /**
   * File info class name
   */
  fileInfoClassName?: string;
  /**
   * File name class name
   */
  fileNameClassName?: string;
  /**
   * File size class name
   */
  fileSizeClassName?: string;
  /**
   * File progress class name
   */
  fileProgressClassName?: string;
  /**
   * File remove button class name
   */
  fileRemoveButtonClassName?: string;
  /**
   * File upload button class name
   */
  fileUploadButtonClassName?: string;
  /**
   * On file drop callback
   */
  onDrop?: (acceptedFiles: FileWithPreview[], rejectedFiles: FileRejection[]) => void;
  /**
   * On file remove callback
   */
  onRemove?: (file: FileWithPreview) => void;
  /**
   * On file upload callback
   */
  onUpload?: (files: FileWithPreview[]) => Promise<void> | void;
  /**
   * Custom render function for dropzone
   */
  renderDropzone?: (props: {
    getRootProps: () => any;
    getInputProps: () => any;
    isDragActive: boolean;
    isDragAccept: boolean;
    isDragReject: boolean;
    isFocused: boolean;
    isFileDialogActive: boolean;
    acceptedFiles: FileWithPreview[];
    fileRejections: FileRejection[];
  }) => React.ReactNode;
  /**
   * Custom render function for file preview
   */
  renderFilePreview?: (file: FileWithPreview) => React.ReactNode;
  /**
   * Custom render function for file info
   */
  renderFileInfo?: (file: FileWithPreview) => React.ReactNode;
  /**
   * Custom render function for file upload button
   */
  renderUploadButton?: (props: {
    onClick: () => void;
    disabled: boolean;
    isUploading: boolean;
  }) => React.ReactNode;
  /**
   * Custom render function for file remove button
   */
  renderRemoveButton?: (props: {
    onClick: (e: React.MouseEvent) => void;
    file: FileWithPreview;
  }) => React.ReactNode;
  /**
   * Custom class name
   */
  className?: string;
  /**
   * Children
   */
  children?: React.ReactNode;
}

interface FileRejection {
  file: File;
  errors: {
    code: string;
    message: string;
  }[];
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (file: File) => {
  const fileType = file.type.split('/')[0];
  
  switch (fileType) {
    case 'image':
      return <Image className="h-5 w-5 text-muted-foreground" />;
    case 'application':
      if (file.type.includes('pdf')) {
        return <FileText className="h-5 w-5 text-red-500" />;
      }
      if (file.type.includes('msword') || file.type.includes('wordprocessingml')) {
        return <FileText className="h-5 w-5 text-blue-600" />;
      }
      if (file.type.includes('spreadsheet')) {
        return <FileText className="h-5 w-5 text-green-600" />;
      }
      if (file.type.includes('presentation')) {
        return <FileText className="h-5 w-5 text-orange-500" />;
      }
      if (file.type.includes('zip') || file.type.includes('compressed')) {
        return <FileText className="h-5 w-5 text-yellow-500" />;
      }
      return <FileText className="h-5 w-5 text-muted-foreground" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      accept = {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.svg'],
        'application/pdf': ['.pdf'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'application/vnd.ms-powerpoint': ['.ppt'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'application/zip': ['.zip'],
        'application/x-7z-compressed': ['.7z'],
        'application/x-rar-compressed': ['.rar'],
      },
      maxSize = 5 * 1024 * 1024, // 5MB
      minSize = 0,
      maxFiles = 1,
      noClick = false,
      noDrag = false,
      noKeyboard = false,
      noPreview = false,
      noValidate = false,
      showProgress = false,
      showFileList = true,
      showFileSize = true,
      showFileTypeIcon = true,
      showRemoveButton = true,
      showUploadButton = true,
      uploadButtonText = 'Upload',
      uploadButtonVariant = 'default',
      uploadButtonSize = 'default',
      dropzoneClassName,
      dropzoneActiveClassName,
      dropzoneAcceptClassName,
      dropzoneRejectClassName,
      fileListClassName,
      fileItemClassName,
      filePreviewClassName,
      fileInfoClassName,
      fileNameClassName,
      fileSizeClassName,
      fileProgressClassName,
      fileRemoveButtonClassName,
      fileUploadButtonClassName,
      onDrop: onDropProp,
      onRemove: onRemoveProp,
      onUpload: onUploadProp,
      renderDropzone: renderDropzoneProp,
      renderFilePreview: renderFilePreviewProp,
      renderFileInfo: renderFileInfoProp,
      renderUploadButton: renderUploadButtonProp,
      renderRemoveButton: renderRemoveButtonProp,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<FileWithPreview[]>([]);
    const [isUploading, setIsUploading] = React.useState(false);
    const [fileRejections, setFileRejections] = React.useState<FileRejection[]>([]);

    const onDrop = React.useCallback(
      (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
        const acceptedFilesWithPreview = acceptedFiles.map((file) =>
          Object.assign(file, {
            preview: file.type.startsWith('image/')
              ? URL.createObjectURL(file)
              : undefined,
            size: formatFileSize(file.size),
            progress: 0,
            status: 'done' as const,
          })
        );

        setFiles((prevFiles) => {
          const newFiles = [...prevFiles, ...acceptedFilesWithPreview];
          // If maxFiles is 1, replace the existing file
          return maxFiles === 1 ? newFiles.slice(-1) : newFiles.slice(0, maxFiles);
        });

        setFileRejections(rejectedFiles);

        if (onDropProp) {
          onDropProp(acceptedFilesWithPreview, rejectedFiles);
        }
      },
      [maxFiles, onDropProp]
    );

    const {
      getRootProps,
      getInputProps,
      isDragActive,
      isDragAccept,
      isDragReject,
      isFocused,
      isFileDialogActive,
      open: openFileDialog,
    } = useDropzone({
      accept,
      maxSize,
      minSize,
      maxFiles,
      noClick,
      noDrag,
      noKeyboard,
      onDrop,
      disabled: isUploading,
      validator: noValidate ? undefined : (file) => {
        if (file.size > maxSize) {
          return {
            code: 'file-too-large',
            message: `File is larger than ${formatFileSize(maxSize)}`,
          };
        }
        if (file.size < minSize) {
          return {
            code: 'file-too-small',
            message: `File is smaller than ${formatFileSize(minSize)}`,
          };
        }
        return null;
      },
    });

    const removeFile = React.useCallback(
      (file: FileWithPreview) => {
        setFiles((prevFiles) => prevFiles.filter((f) => f !== file));
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
        if (onRemoveProp) {
          onRemoveProp(file);
        }
      },
      [onRemoveProp]
    );

    const handleUpload = React.useCallback(async () => {
      if (files.length === 0) return;
      
      setIsUploading(true);
      
      // Update files to show uploading state
      setFiles(prevFiles =>
        prevFiles.map(file => ({
          ...file,
          status: 'uploading' as const,
          progress: 0,
        }))
      );
      
      try {
        if (onUploadProp) {
          // Simulate progress
          const totalFiles = files.length;
          let uploadedFiles = 0;
          
          const updateProgress = (index: number, progress: number) => {
            setFiles(prevFiles =>
              prevFiles.map((f, i) =>
                i === index ? { ...f, progress } : f
              )
            );
          };
          
          // Process files in sequence
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Simulate file upload progress
            for (let progress = 0; progress <= 100; progress += 10) {
              await new Promise(resolve => setTimeout(resolve, 50));
              updateProgress(i, progress);
            }
            
            uploadedFiles++;
            
            // Mark file as done
            setFiles(prevFiles =>
              prevFiles.map((f, idx) =>
                idx === i ? { ...f, status: 'done' as const, progress: 100 } : f
              )
            );
          }
          
          await onUploadProp(files);
        }
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prevFiles =>
          prevFiles.map(file => ({
            ...file,
            status: 'error' as const,
            error: error instanceof Error ? error.message : 'Upload failed',
          }))
        );
      } finally {
        setIsUploading(false);
      }
    }, [files, onUploadProp]);

    // Clean up object URLs to avoid memory leaks
    React.useEffect(() => {
      return () => {
        files.forEach((file) => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [files]);

    const renderDefaultDropzone = () => (
      <div
        {...getRootProps({
          className: cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
            'hover:border-primary/50 hover:bg-accent/50',
            isDragActive && 'border-primary bg-accent/50',
            isDragAccept && 'border-green-500',
            isDragReject && 'border-destructive',
            dropzoneClassName
          ),
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-2">
          <Upload className="h-10 w-10 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {isDragActive ? (
              <p>Drop the files here ...</p>
            ) : (
              <p>
                <span className="font-medium text-primary">Click to upload</span> or drag and drop
              </p>
            )}
            <p className="text-xs text-muted-foreground/70">
              {Object.entries(accept)
                .flatMap(([_, exts]) => exts)
                .join(', ')}{' '}
              (max {formatFileSize(maxSize)})
            </p>
          </div>
        </div>
      </div>
    );

    const renderDefaultFilePreview = (file: FileWithPreview) => {
      if (file.type.startsWith('image/') && file.preview) {
        return (
          <img
            src={file.preview}
            alt={file.name}
            className={cn('h-12 w-12 rounded object-cover', filePreviewClassName)}
            onLoad={() => {
              URL.revokeObjectURL(file.preview!);
            }}
          />
        );
      }
      return (
        <div className={cn('flex h-12 w-12 items-center justify-center rounded bg-muted', filePreviewClassName)}>
          {getFileIcon(file)}
        </div>
      );
    };

    const renderDefaultFileInfo = (file: FileWithPreview) => (
      <div className={cn('flex-1 truncate', fileInfoClassName)}>
        <div className={cn('truncate text-sm font-medium', fileNameClassName)}>
          {file.name}
        </div>
        {showFileSize && (
          <div className={cn('text-xs text-muted-foreground', fileSizeClassName)}>
            {file.size}
          </div>
        )}
        {showProgress && file.status === 'uploading' && (
          <div className={cn('mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted', fileProgressClassName)}>
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${file.progress}%` }}
            />
          </div>
        )}
        {file.status === 'error' && file.error && (
          <div className="mt-1 text-xs text-destructive">{file.error}</div>
        )}
      </div>
    );

    const renderDefaultRemoveButton = (file: FileWithPreview) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          removeFile(file);
        }}
        disabled={isUploading}
        className={cn(
          'rounded-full p-1 text-muted-foreground opacity-70 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          fileRemoveButtonClassName
        )}
      >
        <X className="h-4 w-4" />
      </button>
    );

    const renderDefaultUploadButton = () => (
      <Button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        variant={uploadButtonVariant}
        size={uploadButtonSize}
        className={fileUploadButtonClassName}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          uploadButtonText
        )}
      </Button>
    );

    return (
      <div className={cn('space-y-4', className)} ref={ref} {...props}>
        {renderDropzoneProp ? (
          renderDropzoneProp({
            getRootProps,
            getInputProps,
            isDragActive,
            isDragAccept,
            isDragReject,
            isFocused,
            isFileDialogActive,
            acceptedFiles: files,
            fileRejections,
          })
        ) : (
          renderDefaultDropzone()
        )}

        {showFileList && files.length > 0 && (
          <div className={cn('space-y-2', fileListClassName)}>
            {files.map((file, index) => (
              <div
                key={file.name + index}
                className={cn(
                  'flex items-center space-x-3 rounded-md border p-3',
                  file.status === 'error' && 'border-destructive/20 bg-destructive/5',
                  fileItemClassName
                )}
              >
                {!noPreview && (renderFilePreviewProp?.(file) || renderDefaultFilePreview(file))}
                {renderFileInfoProp?.(file) || renderDefaultFileInfo(file)}
                {showRemoveButton &&
                  (renderRemoveButtonProp ? (
                    renderRemoveButtonProp({
                      onClick: (e) => {
                        e.stopPropagation();
                        removeFile(file);
                      },
                      file,
                    })
                  ) : (
                    renderDefaultRemoveButton(file)
                  ))}
              </div>
            ))}
          </div>
        )}

        {showUploadButton && files.length > 0 && (
          <div className="flex justify-end">
            {renderUploadButtonProp ? (
              renderUploadButtonProp({
                onClick: handleUpload,
                disabled: files.length === 0 || isUploading,
                isUploading,
              })
            ) : (
              renderDefaultUploadButton()
            )}
          </div>
        )}

        {children}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export { FileUpload };

// Example usage:
/*
function Example() {
  const [files, setFiles] = React.useState<FileWithPreview[]>([]);

  const handleUpload = async (files: FileWithPreview[]) => {
    // Handle file upload here
    console.log('Uploading files:', files);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <FileUpload
        accept={{
          'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
          'application/pdf': ['.pdf'],
        }}
        maxSize={10 * 1024 * 1024} // 10MB
        maxFiles={5}
        onUpload={handleUpload}
        onDrop={(acceptedFiles) => {
          console.log('Dropped files:', acceptedFiles);
        }}
        onRemove={(file) => {
          console.log('Removed file:', file);
        }}
      />
    </div>
  );
}
*/
