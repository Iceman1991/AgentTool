import { useRef, useState, useCallback, useEffect } from 'react';
import { Move, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ImagePosition } from '../../types';

interface ImagePositionEditorProps {
  src: string;
  alt?: string;
  position?: ImagePosition;
  onSave: (pos: ImagePosition) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode; // overlay content (e.g. name/buttons in hero)
  editButtonLabel?: string;
}

export function ImagePositionEditor({
  src,
  alt = '',
  position,
  onSave,
  className,
  style,
  children,
  editButtonLabel = 'Verschieben',
}: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [current, setCurrent] = useState<ImagePosition>(position ?? { x: 50, y: 50 });

  // Mutable refs for drag — no React state updates during mousemove
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const draftRef = useRef<ImagePosition>(position ?? { x: 50, y: 50 });

  // Sync if external position changes
  useEffect(() => {
    const p = position ?? { x: 50, y: 50 };
    setCurrent(p);
    draftRef.current = p;
    if (imgRef.current) {
      imgRef.current.style.objectPosition = `${p.x}% ${p.y}%`;
    }
  }, [position?.x, position?.y]);

  const startEdit = () => {
    draftRef.current = { ...current };
    setIsEditing(true);
  };

  const cancelEdit = () => {
    // Reset img to current (committed) position
    if (imgRef.current) {
      imgRef.current.style.objectPosition = `${current.x}% ${current.y}%`;
    }
    draftRef.current = { ...current };
    setIsEditing(false);
  };

  const confirmEdit = () => {
    const pos = { ...draftRef.current };
    setCurrent(pos);
    onSave(pos);
    setIsEditing(false);
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    dragging.current = true;
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current || !imgRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      lastMouse.current = { x: e.clientX, y: e.clientY };

      const dxPct = (dx / rect.width) * -100;
      const dyPct = (dy / rect.height) * -100;

      draftRef.current = {
        x: Math.max(0, Math.min(100, draftRef.current.x + dxPct)),
        y: Math.max(0, Math.min(100, draftRef.current.y + dyPct)),
      };

      // Direct DOM update — zero React re-renders during drag
      imgRef.current.style.objectPosition = `${draftRef.current.x}% ${draftRef.current.y}%`;
    };

    const onMouseUp = () => { dragging.current = false; };

    // Touch support
    let lastTouch = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || !imgRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.touches[0].clientX - lastTouch.x;
      const dy = e.touches[0].clientY - lastTouch.y;
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const dxPct = (dx / rect.width) * -100;
      const dyPct = (dy / rect.height) * -100;
      draftRef.current = {
        x: Math.max(0, Math.min(100, draftRef.current.x + dxPct)),
        y: Math.max(0, Math.min(100, draftRef.current.y + dyPct)),
      };
      imgRef.current.style.objectPosition = `${draftRef.current.x}% ${draftRef.current.y}%`;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    containerRef.current?.addEventListener('touchstart', onTouchStart, { passive: true });
    containerRef.current?.addEventListener('touchmove', onTouchMove, { passive: false });

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [isEditing]);

  return (
    <div ref={containerRef} className={cn('relative overflow-hidden group', className)} style={style}>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        loading="lazy"
        decoding="async"
        onMouseDown={onMouseDown}
        className={cn(
          'w-full h-full object-cover select-none',
          isEditing && 'cursor-grab active:cursor-grabbing',
        )}
        style={{ objectPosition: `${current.x}% ${current.y}%` }}
      />

      {/* Edit mode overlay */}
      {isEditing ? (
        <div className="absolute inset-0 pointer-events-none">
          {/* Hint banner */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm pointer-events-auto">
            <div className="flex items-center gap-2 text-sm text-white">
              <Move size={14} className="opacity-70" />
              <span>Ziehe das Bild um es zu verschieben</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm text-gray-300 bg-gray-800/80 hover:bg-gray-700/80 border border-white/10"
              >
                <X size={13} /> Abbrechen
              </button>
              <button
                type="button"
                onClick={confirmEdit}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm text-white bg-accent-500 hover:bg-accent-400"
              >
                <Check size={13} /> Speichern
              </button>
            </div>
          </div>
          {/* Center crosshair */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 rounded-full border-2 border-white/60 shadow-lg" />
          </div>
        </div>
      ) : (
        /* Normal mode: show reposition button centered on hover */
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-white bg-black/60 hover:bg-black/80 border border-white/20 backdrop-blur-sm pointer-events-auto"
          >
            <Move size={12} /> {editButtonLabel}
          </button>
        </div>
      )}

      {/* Slot for overlay content (hero text, action buttons) — hidden during edit */}
      {!isEditing && children && (
        <div className="absolute inset-0 pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}
