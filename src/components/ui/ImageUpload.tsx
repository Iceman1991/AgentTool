import { useRef, useState } from 'react';
import { Upload, X, Image } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ImageUploadProps {
  value?: string | null;
  onChange: (base64: string | null) => void;
  label?: string;
  className?: string;
}

export function ImageUpload({ value, onChange, label = 'Bild', className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1600;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      onChange(canvas.toDataURL('image/jpeg', 0.88));
    };
    img.src = url;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}

      {value ? (
        <div className="relative group w-full">
          <img
            src={value}
            alt="Vorschau"
            className="w-full max-h-64 object-cover rounded-xl border border-white/[0.08]"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-gray-800/90 rounded-lg text-gray-300 hover:text-white border border-white/10"
            >
              <Upload size={16} />
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="p-2 bg-gray-800/90 rounded-lg text-red-400 hover:text-red-300 border border-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 cursor-pointer',
            'border-white/[0.08] bg-gray-700/30 hover:bg-gray-700/50 hover:border-white/[0.15]',
            dragging && 'border-accent-500/60 bg-accent-500/5',
          )}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Image size={28} className="text-gray-600" />
          <div className="text-center">
            <p className="text-sm text-gray-400">Bild hierher ziehen oder klicken</p>
            <p className="text-xs text-gray-600 mt-0.5">PNG, JPG, WEBP, GIF</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
