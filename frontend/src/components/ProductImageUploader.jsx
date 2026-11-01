import React, { useState } from 'react';
import {
  Upload, Trash2, ArrowLeft, ArrowRight, Star, Plus,
  AlertCircle, CheckCircle, RefreshCw, Image as ImageIcon
} from 'lucide-react';

export default function ProductImageUploader({
  images = [],
  onChange,
  onUploadFile,
  isUploading,
  label = "Product Images (Upload Up to 5 Images)"
}) {
  const [directUrl, setDirectUrl] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const currentImages = Array.isArray(images) ? images.filter(Boolean) : (images ? [images] : []);

  // Handle files upload
  const handleFiles = async (filesList) => {
    if (!filesList || filesList.length === 0) return;
    setUploadError('');

    const files = Array.from(filesList);
    const availableSlots = 5 - currentImages.length;

    if (availableSlots <= 0) {
      setUploadError('Maximum limit of 5 product images reached. Remove an image to add a new one.');
      return;
    }

    const filesToUpload = files.slice(0, availableSlots);
    if (files.length > availableSlots) {
      setUploadError(`Only ${availableSlots} more image(s) could be added (max 5 images allowed).`);
    }

    const newUrls = [];

    for (const file of filesToUpload) {
      // Validate format
      if (!file.type.startsWith('image/')) {
        setUploadError(`"${file.name}" is not a valid image format. Please upload JPG, PNG, or WEBP.`);
        continue;
      }

      // Validate size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" exceeds the 10MB file size limit.`);
        continue;
      }

      try {
        const result = await onUploadFile(file);
        if (result && result.success && result.url) {
          newUrls.push(result.url);
        } else if (result?.warning) {
          newUrls.push(result.url);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setUploadError(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    if (newUrls.length > 0) {
      const updated = [...currentImages, ...newUrls].slice(0, 5);
      onChange(updated);
    }
  };

  // Drag and drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Add direct image URL
  const handleAddUrl = (e) => {
    e.preventDefault();
    setUploadError('');
    const cleanUrl = directUrl.trim();
    if (!cleanUrl) return;

    if (currentImages.length >= 5) {
      setUploadError('Maximum limit of 5 product images reached.');
      return;
    }

    onChange([...currentImages, cleanUrl].slice(0, 5));
    setDirectUrl('');
  };

  // Remove image
  const handleRemove = (index) => {
    const updated = currentImages.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Set as primary/cover image (move to index 0)
  const handleSetCover = (index) => {
    if (index === 0) return;
    const copy = [...currentImages];
    const [selected] = copy.splice(index, 1);
    copy.unshift(selected);
    onChange(copy);
  };

  // Reorder left
  const handleMoveLeft = (index) => {
    if (index === 0) return;
    const copy = [...currentImages];
    const temp = copy[index - 1];
    copy[index - 1] = copy[index];
    copy[index] = temp;
    onChange(copy);
  };

  // Reorder right
  const handleMoveRight = (index) => {
    if (index >= currentImages.length - 1) return;
    const copy = [...currentImages];
    const temp = copy[index + 1];
    copy[index + 1] = copy[index];
    copy[index] = temp;
    onChange(copy);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {label} *
        </label>
        <span className="text-xs font-mono text-gray-500">
          {currentImages.length} / 5 Images Uploaded
        </span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive
            ? 'border-[#FF6B6B] bg-red-50/50 scale-[1.01]'
            : currentImages.length >= 5
              ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="p-3 bg-gray-100 rounded-full text-[#1A1A1A]">
            {isUploading ? (
              <RefreshCw className="w-6 h-6 animate-spin text-[#FF6B6B]" />
            ) : (
              <Upload className="w-6 h-6 text-[#FF6B6B]" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {isUploading ? 'Uploading to Supabase Storage...' : 'Drag & drop product images here, or browse'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Select multiple files (PNG, JPG, WEBP • Max 10MB each)
            </p>
          </div>

          <label className={`mt-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#333333] text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-sm ${
            currentImages.length >= 5 || isUploading ? 'pointer-events-none opacity-50' : ''
          }`}>
            <span>Select Files</span>
            <input
              type="file"
              multiple
              accept="image/*"
              disabled={currentImages.length >= 5 || isUploading}
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFiles(e.target.files);
                }
              }}
            />
          </label>
        </div>
      </div>

      {/* Direct Image URL input */}
      <div className="flex gap-2">
        <input
          type="url"
          value={directUrl}
          onChange={(e) => setDirectUrl(e.target.value)}
          placeholder="Or paste direct image URL (https://...)"
          disabled={currentImages.length >= 5 || isUploading}
          className="flex-1 px-3.5 py-2 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B6B] disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleAddUrl}
          disabled={!directUrl.trim() || currentImages.length >= 5 || isUploading}
          className="px-4 py-2 bg-gray-800 hover:bg-[#1A1A1A] disabled:bg-gray-300 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add URL</span>
        </button>
      </div>

      {/* Error / Validation Alert */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Thumbnails Strip with Reorder, Remove, and Primary Cover Selector */}
      {currentImages.length > 0 && (
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Uploaded Angles ({currentImages.length} of 5) — Click "Cover" to set primary image
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {currentImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl border-2 p-1.5 bg-white flex flex-col justify-between transition-all group ${
                  idx === 0
                    ? 'border-[#FF6B6B] shadow-sm ring-1 ring-[#FF6B6B]'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Image Container with 3:4 Aspect Ratio & Contain Fitting */}
                <div className="relative aspect-[3/4] w-full bg-white rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                  <img
                    src={imgUrl}
                    alt={`Product angle ${idx + 1}`}
                    className="w-full h-full object-contain object-center"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {idx === 0 && (
                    <span className="absolute top-1 left-1 bg-[#FF6B6B] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">
                      PRIMARY COVER
                    </span>
                  )}
                </div>

                {/* Control Actions Strip */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                  <div className="flex items-center gap-0.5">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveLeft(idx)}
                        className="p-1 text-gray-500 hover:text-black rounded hover:bg-gray-100 cursor-pointer"
                        title="Move left"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < currentImages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveRight(idx)}
                        className="p-1 text-gray-500 hover:text-black rounded hover:bg-gray-100 cursor-pointer"
                        title="Move right"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx !== 0 && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(idx)}
                        className="text-[10px] font-bold text-[#FF6B6B] hover:underline px-1 cursor-pointer"
                        title="Set as Primary Cover"
                      >
                        Make Cover
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

