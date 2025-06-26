import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';import { FileAttachment } from '../types';

interface FileUploadProps {
  onFilesChange: (files: FileAttachment[], images: string[]) => void;
  disabled?: boolean;
  supportsVision?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, disabled = false, supportsVision = false }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList) => {
    const newFiles: FileAttachment[] = [];
    const newImages: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/') && supportsVision) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          newImages.push(dataUrl);
          setUploadedImages(prev => {
            const updated = [...prev, dataUrl];
            onFilesChange([...uploadedFiles, ...newFiles], updated);
            return updated;
          });
        };
        reader.readAsDataURL(file);
      } else {
        const fileAttachment: FileAttachment = {
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
        };
        newFiles.push(fileAttachment);
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles(prev => {
        const updated = [...prev, ...newFiles];
        onFilesChange(updated, uploadedImages);
        return updated;
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const removeFile = (index: number, type: 'file' | 'image') => {
    if (type === 'file') {
      const newFiles = uploadedFiles.filter((_, i) => i !== index);
      setUploadedFiles(newFiles);
      onFilesChange(newFiles, uploadedImages);
    } else {
      const newImages = uploadedImages.filter((_, i) => i !== index);
      setUploadedImages(newImages);
      onFilesChange(uploadedFiles, newImages);
    }
  };

  const hasFiles = uploadedFiles.length > 0 || uploadedImages.length > 0;

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 bg-gray-50/50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={supportsVision ? "image/*,text/*,.pdf,.doc,.docx" : "text/*,.pdf,.doc,.docx"}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-600">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {supportsVision ? 'Images, documents, and text files' : 'Documents and text files only'}
        </p>
        
        {!supportsVision && (
          <div className="flex items-center justify-center gap-2 mt-2 text-xs text-amber-600">
            <AlertCircle className="w-4 h-4" />
            <span>Selected model doesn't support vision - images will be ignored</span>
          </div>
        )}
      </div>

      {/* Uploaded Files Preview */}
      {hasFiles && (
        <div className="space-y-2">
          {/* Images */}
          {uploadedImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index, 'image');
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {file.type} • {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index, 'file')}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;