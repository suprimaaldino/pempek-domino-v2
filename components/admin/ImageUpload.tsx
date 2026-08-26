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

  const handleFile = async (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Format tidak didukung. Gunakan JPG, PNG, atau WebP.');
      return;
    }

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Ukuran file terlalu besar. Maksimal 5MB.');
      return;
    }

    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '');
    if (sanitizedName !== file.name) {
      setError('Nama file mengandung karakter tidak valid.');
      return;
    }

    setError(null);
    setProgress(10);

    try {
      const fileName = `${Date.now()}-${sanitizedName}`;
      const storageRef = ref(storage, `${storagePath}/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setProgress(pct);
        },
        () => {
          setError('Gagal mengupload gambar. Coba lagi.');
          setProgress(null);
        },
        async () => {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setProgress(100);
          setTimeout(() => {
            setPreview(downloadUrl);
            onUploaded(downloadUrl);
            setProgress(null);
          }, 150);
        }
      );
    } catch {
      setError('Gagal mengupload gambar.');
      setProgress(null);
    }
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
              unoptimized
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