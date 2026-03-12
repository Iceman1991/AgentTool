import { useRef, useEffect, useState, useCallback } from 'react';
import { Pen, Eraser, Trash2, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DrawingCanvasProps {
  initialDataUrl?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  width?: number;
  height?: number;
}

const COLORS = [
  { label: 'Bronze', value: '#C49A4A' },
  { label: 'Weiß', value: '#EDE8DC' },
  { label: 'Rot', value: '#DC2626' },
  { label: 'Blau', value: '#2563EB' },
  { label: 'Grün', value: '#16A34A' },
  { label: 'Gelb', value: '#EAB308' },
  { label: 'Grau', value: '#6B7280' },
  { label: 'Schwarz', value: '#09090b' },
];

type Tool = 'pen' | 'eraser';

export function DrawingCanvas({ initialDataUrl, onSave, onCancel, height = 400 }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#EDE8DC');
  const [strokeSize, setStrokeSize] = useState(3);
  const [canvasReady, setCanvasReady] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth || 600;
    canvas.width = w;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = '#1c1c23';
    ctx.fillRect(0, 0, w, height);

    // Load initial image if provided
    if (initialDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, height);
        setCanvasReady(true);
      };
      img.src = initialDataUrl;
    } else {
      setCanvasReady(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const getPos = useCallback((e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e, canvas);
  }, [getPos]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e, canvas);
    const prev = lastPos.current ?? pos;

    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? '#1c1c23' : color;
    ctx.lineWidth = tool === 'eraser' ? strokeSize * 4 : strokeSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPos.current = pos;
  }, [tool, color, strokeSize, getPos]);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPos.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, [canvasReady, startDraw, draw, endDraw]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#1c1c23';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col gap-3 bg-gray-800 rounded-xl p-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Tools */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-lg p-1">
          <button
            type="button"
            title="Stift"
            onClick={() => setTool('pen')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              tool === 'pen' ? 'bg-accent-500 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
            )}
          >
            <Pen size={15} />
          </button>
          <button
            type="button"
            title="Radierer"
            onClick={() => setTool('eraser')}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              tool === 'eraser' ? 'bg-accent-500 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700',
            )}
          >
            <Eraser size={15} />
          </button>
        </div>

        {/* Color palette */}
        <div className="flex items-center gap-1.5">
          {COLORS.map(c => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => { setColor(c.value); setTool('pen'); }}
              className={cn(
                'w-5 h-5 rounded-full border-2 transition-transform hover:scale-110',
                color === c.value && tool === 'pen' ? 'border-white scale-110' : 'border-transparent',
              )}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        {/* Stroke size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Größe</span>
          <input
            type="range"
            min={1}
            max={20}
            value={strokeSize}
            onChange={e => setStrokeSize(Number(e.target.value))}
            className="w-20 accent-accent-500"
          />
          <span className="text-xs text-gray-400 w-4">{strokeSize}</span>
        </div>

        {/* Clear */}
        <button
          type="button"
          title="Alles löschen"
          onClick={clearCanvas}
          className="ml-auto p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-gray-700 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden border border-gray-700"
        style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
      >
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height }}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <X size={14} /> Abbrechen
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-accent-500 text-white hover:bg-accent-600 transition-colors font-medium"
        >
          <Check size={14} /> Fertig
        </button>
      </div>
    </div>
  );
}
