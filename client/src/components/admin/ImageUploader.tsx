"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { UploadCloud, Loader2, Image as ImageIcon } from "lucide-react";
import api from "@/lib/api";

interface ImageUploaderProps {
  currentImageUrl: string;
  endpoint: string; // The full URL to POST the image to
  label?: string;
  aspectHint?: string; // e.g. "16:9 or 3:2"
  onUploadSuccess: (newUrl: string) => void;
  onUploadError: (error: string) => void;
}

export default function ImageUploader({
  currentImageUrl,
  endpoint,
  label = "Hero Image",
  aspectHint = "16:9",
  onUploadSuccess,
  onUploadError,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onUploadError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onUploadError("Image must be less than 5MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("image", selectedFile);

    try {
      // POST to the API
      const response = await api.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success || response.data.hero_image_url || response.data.image_url) {
        const newUrl = response.data.hero_image_url || response.data.image_url;
        onUploadSuccess(newUrl);
        setPreview(null);
        setSelectedFile(null);
      } else {
        onUploadError("Upload failed. Please try again.");
      }
    } catch (error: any) {
      onUploadError(error.response?.data?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = preview || currentImageUrl;

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-ink)]">{label}</span>
        {aspectHint && <span className="text-[10px] text-[var(--color-ink-muted)]">{aspectHint}</span>}
      </div>

      <div className="relative border border-[var(--color-navy)]/10 bg-white group overflow-hidden" style={{ aspectRatio: aspectHint === "16:9" ? 16/9 : aspectHint === "3:4" ? 3/4 : 1 }}>
        {displayUrl ? (
          <Image
            src={displayUrl}
            alt="Preview"
            fill
            className="object-cover"
            unoptimized={!!preview} // don't optimize local blob URLs
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--color-ink)]/30">
            <ImageIcon size={32} className="mb-2" />
            <span className="text-xs font-medium">No image set</span>
          </div>
        )}

        {/* Hover overlay for changing image */}
        <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-200 ${selectedFile ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"}`}>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-white text-[var(--color-ink)] text-xs font-bold uppercase tracking-widest px-4 py-2 hover:bg-[var(--color-bg)] transition-colors flex items-center gap-2"
          >
            <UploadCloud size={16} /> Change Image
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      {selectedFile && (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-primary flex-1 py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <UploadCloud size={16} /> Confirm Upload
              </>
            )}
          </button>
          <button
            onClick={() => {
              setPreview(null);
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            disabled={isUploading}
            className="p-2 border border-[var(--color-navy)]/20 text-[var(--color-ink)] hover:bg-[var(--color-navy)]/5 disabled:opacity-50"
            title="Cancel"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
