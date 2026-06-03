'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { Upload, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentUrl?: string;
  onUploaded: (url: string) => void;
  storagePath: string;
  label?: string;
}

export function ImageUpload({ currentUrl, onUploaded, storagePath, label = 'Upload Gambar' }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [preview, setPreview] = useState<string>(currentUrl ?? '');
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar.');
      return;
    }
    setError(null);
    setProgress(20);

    const reader = new FileReader();
    reader.onload = (e) => {
      setProgress(50);
      const img = new window.Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Canvas context not available');
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.7 quality to get a very small base64 string (typically 15-30 KB)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          
          setProgress(100);
          setTimeout(() => {
            setPreview(compressedBase64);
            onUploaded(compressedBase64);
            setProgress(null);
          }, 150);
        } catch (err) {
          console.error(err);
          setError('Gagal mengompresi gambar.');
          setProgress(null);
        }
      };
      img.onerror = () => {
        setError('Gagal memproses file gambar.');
        setProgress(null);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setError('Gagal membaca file.');
      setProgress(null);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm font-semibold text-brown">{label}</label>}

      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
        className={cn(
          'relative border-2 border-dashed rounded-input overflow-hidden cursor-pointer',
          'flex flex-col items-center justify-center min-h-[120px]',
          'hover:border-primary/60 hover:bg-primary/5 transition-all',
          preview ? 'border-brown/30' : 'border-brown/20'
        )}
      >
        {preview ? (
          <>
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setPreview(''); onUploaded(''); }}
              aria-label="Hapus gambar"
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:text-error transition-colors z-10"
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-brown/40 p-4">
            <Upload size={32} strokeWidth={1.5} />
            <p className="text-sm text-center">Klik atau drag gambar ke sini</p>
            <p className="text-xs">JPG, PNG · Maks 5MB</p>
          </div>
        )}

        {/* Progress overlay */}
        {progress !== null && (
          <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-primary animate-spin" />
            <p className="text-sm font-semibold text-brown">{progress}%</p>
            <div className="w-32 h-1.5 bg-brown/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
