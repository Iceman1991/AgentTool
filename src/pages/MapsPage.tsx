import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, ZoomIn, ZoomOut, RotateCcw, Pencil, Eye, MapPin as MapPinIcon, ChevronLeft, ChevronRight, Trash2, Check, Navigation, Star, Skull, Home, Flag, Zap, Flame, Crown, Gem, Shield, Swords, Tent, Mountain, Anchor, AlertTriangle, type LucideIcon } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useEntityStore } from '../stores/entityStore';
import { useNotePageStore } from '../stores/notePageStore';
import { ImageUpload } from '../components/ui/ImageUpload';
import type { CampaignMap, MapPin, MapPinType } from '../types';

// ── Constants ───────────────────────────────────────────────────────────────

const MIN_SCALE = 0.15;
const MAX_SCALE = 8;
const PIN_COLORS = ['#C49A4A', '#E05252', '#52A8E0', '#52C07A', '#9B52E0', '#E07A52'];

const PIN_ICONS: Record<string, LucideIcon> = {
  'map-pin': MapPinIcon,
  'star': Star,
  'skull': Skull,
  'home': Home,
  'flag': Flag,
  'zap': Zap,
  'flame': Flame,
  'crown': Crown,
  'gem': Gem,
  'shield': Shield,
  'swords': Swords,
  'tent': Tent,
  'mountain': Mountain,
  'anchor': Anchor,
  'alert-triangle': AlertTriangle,
};

const PIN_SIZES: Record<string, number> = { sm: 10, md: 14, lg: 20, xl: 28 };
const PIN_SIZE_LABELS: Record<string, string> = { sm: 'S', md: 'M', lg: 'L', xl: 'XL' };

// ── Helpers ─────────────────────────────────────────────────────────────────

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

// ── Types ────────────────────────────────────────────────────────────────────

interface PinFormData {
  label: string;
  description: string;
  color: string;
  type: MapPinType;
  targetId: string;
  icon: string;
  size: string;
}

interface PendingPin {
  x: number;
  y: number;
}

// ── Pin Form Component ────────────────────────────────────────────────────────

interface PinFormProps {
  initial?: Partial<PinFormData>;
  onSave: (data: PinFormData) => void;
  onCancel: () => void;
  maps: CampaignMap[];
  currentMapId: string;
}

function PinForm({ initial, onSave, onCancel, maps, currentMapId }: PinFormProps) {
  const entities = useEntityStore(s => s.entities);
  const notePages = useNotePageStore(s => s.notePages);

  const [label, setLabel] = useState(initial?.label ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState(initial?.color ?? PIN_COLORS[0]);
  const [icon, setIcon] = useState(initial?.icon ?? 'map-pin');
  const [size, setSize] = useState(initial?.size ?? 'md');
  const [type, setType] = useState<MapPinType>(initial?.type ?? 'custom');
  const [targetId, setTargetId] = useState(initial?.targetId ?? '');

  const otherMaps = maps.filter(m => m.id !== currentMapId);

  const targetOptions = (() => {
    if (type === 'entity') return entities.map(e => ({ id: e.id, label: e.name }));
    if (type === 'map') return otherMaps.map(m => ({ id: m.id, label: m.name }));
    if (type === 'note') return notePages.map(p => ({ id: p.id, label: p.title }));
    return [];
  })();

  const typeLabel: Record<MapPinType, string> = {
    entity: 'Entität',
    map: 'Karte',
    note: 'Seite',
    custom: 'Notiz',
  };

  const handleTypeChange = (t: MapPinType) => {
    setType(t);
    setTargetId('');
  };

  return (
    <div style={{
      background: '#1c1c23',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      minWidth: 280,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: '#EDE8DC', fontWeight: 600, fontSize: 14 }}>
          {initial?.label ? 'Pin bearbeiten' : 'Pin hinzufügen'}
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 4 }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Label */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Bezeichnung</label>
        <input
          autoFocus
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Ortsname..."
          style={{
            background: '#09090b',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#EDE8DC',
            fontSize: 14,
            outline: 'none',
          }}
        />
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Beschreibung (optional)</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Kurze Beschreibung..."
          rows={2}
          style={{
            background: '#09090b',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 8,
            padding: '6px 10px',
            color: '#EDE8DC',
            fontSize: 13,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Typ</label>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(['custom', 'entity', 'map', 'note'] as MapPinType[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                border: type === t ? '1px solid #C49A4A' : '1px solid rgba(255,255,255,0.07)',
                background: type === t ? 'rgba(196,154,74,0.15)' : 'rgba(255,255,255,0.03)',
                color: type === t ? '#C49A4A' : '#8A8070',
              }}
            >
              {typeLabel[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Target selector */}
      {type !== 'custom' && targetOptions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ color: '#8A8070', fontSize: 12 }}>Verknüpfung</label>
          <select
            value={targetId}
            onChange={e => setTargetId(e.target.value)}
            style={{
              background: '#09090b',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: '6px 10px',
              color: targetId ? '#EDE8DC' : '#8A8070',
              fontSize: 13,
              outline: 'none',
            }}
          >
            <option value="">-- Bitte wählen --</option>
            {targetOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* Color */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Farbe</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {PIN_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: c,
                border: color === c ? '2px solid #EDE8DC' : '2px solid transparent',
                cursor: 'pointer',
                padding: 0,
                outline: color === c ? `2px solid ${c}` : 'none',
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Icon */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Icon</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Object.entries(PIN_ICONS).map(([key, IconComp]) => (
            <button
              key={key}
              type="button"
              onClick={() => setIcon(key)}
              title={key}
              style={{
                width: 30,
                height: 30,
                borderRadius: 7,
                border: icon === key ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.07)',
                background: icon === key ? `${color}22` : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >
              <IconComp size={14} color={icon === key ? color : '#8A8070'} />
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label style={{ color: '#8A8070', fontSize: 12 }}>Größe</label>
        <div style={{ display: 'flex', gap: 6 }}>
          {Object.entries(PIN_SIZE_LABELS).map(([key, label_]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSize(key)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                fontSize: 12,
                cursor: 'pointer',
                border: size === key ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.07)',
                background: size === key ? `${color}22` : 'rgba(255,255,255,0.03)',
                color: size === key ? color : '#8A8070',
              }}
            >
              {label_}
            </button>
          ))}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
            color: '#8A8070',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Abbrechen
        </button>
        <button
          type="button"
          onClick={() => onSave({ label: label.trim() || 'Pin', description, color, type, targetId, icon, size })}
          style={{
            padding: '6px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#C49A4A',
            color: '#09090b',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Speichern
        </button>
      </div>
    </div>
  );
}

// ── Pin Popup Component ───────────────────────────────────────────────────────

interface PinPopupProps {
  pin: MapPin;
  onClose: () => void;
  onEdit: () => void;
  onNavigate: () => void;
}

function PinPopup({ pin, onClose, onEdit, onNavigate }: PinPopupProps) {
  const typeLabel: Record<MapPinType, string> = {
    entity: 'Entität',
    map: 'Karte',
    note: 'Seite',
    custom: 'Notiz',
  };

  return (
    <div style={{
      background: '#1c1c23',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: 12,
      minWidth: 200,
      maxWidth: 280,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      pointerEvents: 'all',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: pin.color,
            flexShrink: 0,
          }} />
          <span style={{ color: '#EDE8DC', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pin.label}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button
            type="button"
            onClick={onEdit}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 3 }}
            title="Bearbeiten"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 3 }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {pin.description && (
        <p style={{ color: '#8A8070', fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>
          {pin.description}
        </p>
      )}

      {pin.type !== 'custom' && (
        <div style={{
          marginTop: 6,
          padding: '2px 8px',
          background: 'rgba(196,154,74,0.1)',
          borderRadius: 4,
          display: 'inline-block',
        }}>
          <span style={{ color: '#C49A4A', fontSize: 11 }}>{typeLabel[pin.type]}</span>
        </div>
      )}

      {pin.targetId && (
        <button
          type="button"
          onClick={onNavigate}
          style={{
            marginTop: 8,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '6px 10px',
            borderRadius: 7,
            border: 'none',
            background: '#C49A4A',
            color: '#09090b',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Navigation size={12} />
          Navigieren
        </button>
      )}
    </div>
  );
}

// ── MapViewer Component ───────────────────────────────────────────────────────

interface MapViewerProps {
  map: CampaignMap;
  pins: MapPin[];
  editMode: boolean;
  onAddPin: (x: number, y: number) => void;
  onDeletePin: (id: string) => void;
  onEditPin: (pin: MapPin) => void;
  onNavigatePin: (pin: MapPin) => void;
}

function MapViewer({ map, pins, editMode, onAddPin, onDeletePin, onEditPin, onNavigatePin }: MapViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const transformDivRef = useRef<HTMLDivElement>(null);

  // Pan state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffsetStart = useRef({ x: 0, y: 0 });
  const wasDrag = useRef(false);

  // Touch state
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMid = useRef<{ x: number; y: number } | null>(null);

  const [popupPin, setPopupPin] = useState<MapPin | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  // Force re-render of pins overlay when transform changes
  const [, forceUpdate] = useState(0);

  const applyTransform = useCallback(() => {
    if (!transformDivRef.current) return;
    const { x, y } = offsetRef.current;
    const s = scaleRef.current;
    transformDivRef.current.style.transform = `translate(${x}px, ${y}px) scale(${s})`;
    forceUpdate(n => n + 1);
  }, []);

  const resetView = useCallback(() => {
    if (!containerRef.current || !imageRef.current) return;
    const img = imageRef.current;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = img.naturalWidth || img.clientWidth;
    const ih = img.naturalHeight || img.clientHeight;
    if (!iw || !ih) return;

    const scaleX = cw / iw;
    const scaleY = ch / ih;
    const s = Math.min(scaleX, scaleY, 1);
    const x = (cw - iw * s) / 2;
    const y = (ch - ih * s) / 2;
    scaleRef.current = s;
    offsetRef.current = { x, y };
    applyTransform();
  }, [applyTransform]);

  // Reset view when map changes
  useEffect(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    applyTransform();
    setPopupPin(null);
    // Small delay to let image load
    const t = setTimeout(resetView, 100);
    return () => clearTimeout(t);
  }, [map.id, resetView, applyTransform]);

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      const delta = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const prevScale = scaleRef.current;
      const newScale = clamp(prevScale * delta, MIN_SCALE, MAX_SCALE);
      const ratio = newScale / prevScale;

      scaleRef.current = newScale;
      offsetRef.current = {
        x: cursorX - (cursorX - offsetRef.current.x) * ratio,
        y: cursorY - (cursorY - offsetRef.current.y) * ratio,
      };
      applyTransform();
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [applyTransform]);

  // Mouse pan
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      // Don't start pan if clicking on a pin
      if ((e.target as HTMLElement).closest('[data-pin]')) return;
      isPanning.current = true;
      wasDrag.current = false;
      panStart.current = { x: e.clientX, y: e.clientY };
      panOffsetStart.current = { ...offsetRef.current };
      el.style.cursor = 'grabbing';
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) wasDrag.current = true;
      offsetRef.current = {
        x: panOffsetStart.current.x + dx,
        y: panOffsetStart.current.y + dy,
      };
      applyTransform();
    };
    const onMouseUp = () => {
      isPanning.current = false;
      el.style.cursor = editMode ? 'crosshair' : 'grab';
    };

    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [applyTransform, editMode]);

  // Touch events
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getTouchDist = (t1: Touch, t2: Touch) => {
      const dx = t1.clientX - t2.clientX;
      const dy = t1.clientY - t2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    const getTouchMid = (t1: Touch, t2: Touch, rect: DOMRect) => ({
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    });

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const rect = el.getBoundingClientRect();
        lastTouchDist.current = getTouchDist(e.touches[0], e.touches[1]);
        lastTouchMid.current = getTouchMid(e.touches[0], e.touches[1], rect);
        isPanning.current = false;
      } else if (e.touches.length === 1) {
        isPanning.current = true;
        panStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panOffsetStart.current = { ...offsetRef.current };
        lastTouchDist.current = null;
        lastTouchMid.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2) {
        const rect = el.getBoundingClientRect();
        const dist = getTouchDist(e.touches[0], e.touches[1]);
        const mid = getTouchMid(e.touches[0], e.touches[1], rect);
        if (lastTouchDist.current !== null && lastTouchMid.current !== null) {
          const scaleFactor = dist / lastTouchDist.current;
          const prevScale = scaleRef.current;
          const newScale = clamp(prevScale * scaleFactor, MIN_SCALE, MAX_SCALE);
          const ratio = newScale / prevScale;
          scaleRef.current = newScale;
          offsetRef.current = {
            x: mid.x - (mid.x - offsetRef.current.x) * ratio,
            y: mid.y - (mid.y - offsetRef.current.y) * ratio,
          };
          // Also pan with midpoint movement
          const dmx = mid.x - lastTouchMid.current.x;
          const dmy = mid.y - lastTouchMid.current.y;
          offsetRef.current.x += dmx;
          offsetRef.current.y += dmy;
        }
        lastTouchDist.current = dist;
        lastTouchMid.current = mid;
        applyTransform();
      } else if (e.touches.length === 1 && isPanning.current) {
        const dx = e.touches[0].clientX - panStart.current.x;
        const dy = e.touches[0].clientY - panStart.current.y;
        offsetRef.current = {
          x: panOffsetStart.current.x + dx,
          y: panOffsetStart.current.y + dy,
        };
        applyTransform();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchDist.current = null;
        lastTouchMid.current = null;
      }
      if (e.touches.length === 0) isPanning.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, [applyTransform]);

  // Click on image to add pin
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!editMode) return;
    if (wasDrag.current) return;
    if ((e.target as HTMLElement).closest('[data-pin]')) return;
    const imageEl = imageRef.current;
    if (!imageEl) return;
    const rect = imageEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddPin(x, y);
  }, [editMode, onAddPin]);

  // Compute pin screen positions
  const pinPositions = pins.map(pin => {
    const img = imageRef.current;
    if (!img) return { pin, sx: 0, sy: 0, visible: false };
    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return { pin, sx: 0, sy: 0, visible: false };
    const sx = rect.left - containerRect.left + (pin.x / 100) * rect.width;
    const sy = rect.top - containerRect.top + (pin.y / 100) * rect.height;
    return { pin, sx, sy, visible: true };
  });

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        flex: 1,
        overflow: 'hidden',
        background: '#09090b',
        cursor: editMode ? 'crosshair' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Scrollable inner (transform layer) */}
      <div
        ref={transformDivRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <img
          ref={imageRef}
          src={map.imageUrl}
          alt={map.name}
          onLoad={resetView}
          onClick={handleImageClick}
          draggable={false}
          style={{
            display: 'block',
            maxWidth: 'none',
            userSelect: 'none',
            pointerEvents: editMode ? 'auto' : 'none',
          }}
        />
      </div>

      {/* Pin layer - positioned absolutely in the container, not in the transform div */}
      {pinPositions.map(({ pin, sx, sy, visible }) => {
        if (!visible) return null;
        const isHovered = hoveredPinId === pin.id;
        const showPopup = popupPin?.id === pin.id;
        return (
          <div
            key={pin.id}
            data-pin="true"
            style={{
              position: 'absolute',
              left: sx,
              top: sy,
              transform: 'translate(-50%, -100%)',
              zIndex: 10,
              pointerEvents: 'all',
            }}
            onMouseEnter={() => setHoveredPinId(pin.id)}
            onMouseLeave={() => setHoveredPinId(null)}
          >
            {/* Pin marker */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                gap: 2,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (showPopup) {
                  setPopupPin(null);
                } else {
                  setPopupPin(pin);
                }
              }}
            >
              {/* Icon */}
              {(() => {
                const IconComp = PIN_ICONS[pin.icon ?? 'map-pin'] ?? MapPinIcon;
                const sz = PIN_SIZES[pin.size ?? 'md'] ?? 14;
                return (
                  <div style={{
                    width: sz + 10,
                    height: sz + 10,
                    borderRadius: '50%',
                    background: `${pin.color}28`,
                    border: `2px solid ${pin.color}`,
                    boxShadow: `0 0 6px ${pin.color}66, 0 2px 4px rgba(0,0,0,0.5)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s',
                    transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                    flexShrink: 0,
                  }}>
                    <IconComp size={sz} color={pin.color} />
                  </div>
                );
              })()}
              {/* Label */}
              <div style={{
                background: 'rgba(9,9,11,0.85)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 4,
                padding: '1px 5px',
                fontSize: 10,
                color: '#EDE8DC',
                whiteSpace: 'nowrap',
                maxWidth: 100,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                pointerEvents: 'none',
              }}>
                {pin.label}
              </div>
            </div>

            {/* Edit mode: delete button */}
            {editMode && isHovered && (
              <button
                type="button"
                data-pin="true"
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#E05252',
                  border: '1px solid rgba(255,255,255,0.3)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 20,
                  padding: 0,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePin(pin.id);
                  if (popupPin?.id === pin.id) setPopupPin(null);
                }}
                title="Pin löschen"
              >
                <X size={10} color="#fff" />
              </button>
            )}

            {/* Popup */}
            {showPopup && (
              <div
                data-pin="true"
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 6px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 30,
                }}
                onClick={e => e.stopPropagation()}
              >
                <PinPopup
                  pin={pin}
                  onClose={() => setPopupPin(null)}
                  onEdit={() => { onEditPin(pin); setPopupPin(null); }}
                  onNavigate={() => { onNavigatePin(pin); setPopupPin(null); }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        zIndex: 20,
      }}>
        <button
          type="button"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const prevScale = scaleRef.current;
            const newScale = clamp(prevScale * 1.3, MIN_SCALE, MAX_SCALE);
            const ratio = newScale / prevScale;
            scaleRef.current = newScale;
            offsetRef.current = {
              x: cx - (cx - offsetRef.current.x) * ratio,
              y: cy - (cy - offsetRef.current.y) * ratio,
            };
            applyTransform();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#1c1c23',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8A8070',
          }}
        >
          <ZoomIn size={15} />
        </button>
        <button
          type="button"
          onClick={() => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.width / 2;
            const cy = rect.height / 2;
            const prevScale = scaleRef.current;
            const newScale = clamp(prevScale / 1.3, MIN_SCALE, MAX_SCALE);
            const ratio = newScale / prevScale;
            scaleRef.current = newScale;
            offsetRef.current = {
              x: cx - (cx - offsetRef.current.x) * ratio,
              y: cy - (cy - offsetRef.current.y) * ratio,
            };
            applyTransform();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#1c1c23',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8A8070',
          }}
        >
          <ZoomOut size={15} />
        </button>
        <button
          type="button"
          onClick={resetView}
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#1c1c23',
            border: '1px solid rgba(255,255,255,0.07)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8A8070',
          }}
          title="Ansicht zurücksetzen"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

// ── MapsPage ──────────────────────────────────────────────────────────────────

export function MapsPage() {
  const navigate = useNavigate();
  const { maps, pins, load, createMap, updateMap, deleteMap, createPin, updatePin, deletePin } = useMapStore();

  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Add map form
  const [showAddMap, setShowAddMap] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [newMapImage, setNewMapImage] = useState<string | null>(null);
  const [newMapDesc, setNewMapDesc] = useState('');
  const [savingMap, setSavingMap] = useState(false);
  const [saveMapError, setSaveMapError] = useState<string | null>(null);

  // Pin form state
  const [pendingPin, setPendingPin] = useState<PendingPin | null>(null);
  const [editingPin, setEditingPin] = useState<MapPin | null>(null);
  const [pinFormAnchor, setPinFormAnchor] = useState<{ x: number; y: number } | null>(null);

  // Edit map name
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editingMapName, setEditingMapName] = useState('');

  const selectedMap = maps.find(m => m.id === selectedMapId) ?? null;
  const mapPins = pins.filter(p => p.mapId === selectedMapId);

  // Reload when component mounts (in case store hasn't loaded yet or workspace changed)
  useEffect(() => {
    load();
  }, [load]);

  // Auto-select first map
  useEffect(() => {
    if (!selectedMapId && maps.length > 0) {
      setSelectedMapId(maps[0].id);
    }
  }, [maps, selectedMapId]);

  const handleAddMap = async () => {
    if (!newMapName.trim() || !newMapImage) return;
    setSavingMap(true);
    setSaveMapError(null);
    try {
      const m = await createMap({ name: newMapName.trim(), imageUrl: newMapImage, description: newMapDesc });
      setSelectedMapId(m.id);
      setShowAddMap(false);
      setNewMapName('');
      setNewMapImage(null);
      setNewMapDesc('');
    } catch (err) {
      setSaveMapError(err instanceof Error ? err.message : 'Karte konnte nicht gespeichert werden.');
    } finally {
      setSavingMap(false);
    }
  };

  const handleAddPin = useCallback((x: number, y: number) => {
    setPendingPin({ x, y });
    setPinFormAnchor({ x, y });
    setEditingPin(null);
  }, []);

  const handleEditPin = useCallback((pin: MapPin) => {
    setEditingPin(pin);
    setPendingPin(null);
    setPinFormAnchor({ x: pin.x, y: pin.y });
  }, []);

  const handleSavePin = async (data: PinFormData) => {
    if (!selectedMapId) return;
    if (editingPin) {
      await updatePin(editingPin.id, {
        label: data.label,
        description: data.description || undefined,
        color: data.color,
        type: data.type,
        targetId: data.targetId || undefined,
        icon: data.icon,
        size: data.size,
      });
    } else if (pendingPin) {
      await createPin({
        mapId: selectedMapId,
        x: pendingPin.x,
        y: pendingPin.y,
        label: data.label,
        description: data.description || undefined,
        color: data.color,
        type: data.type,
        targetId: data.targetId || undefined,
        icon: data.icon,
        size: data.size,
      });
    }
    setPendingPin(null);
    setEditingPin(null);
    setPinFormAnchor(null);
  };

  const handleDeletePin = async (id: string) => {
    await deletePin(id);
  };

  const handleNavigatePin = (pin: MapPin) => {
    if (!pin.targetId) return;
    if (pin.type === 'entity') navigate(`/entities/${pin.targetId}`);
    else if (pin.type === 'map') setSelectedMapId(pin.targetId);
    else if (pin.type === 'note') navigate(`/pages/${pin.targetId}`);
  };

  const handleCancelPinForm = () => {
    setPendingPin(null);
    setEditingPin(null);
    setPinFormAnchor(null);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      overflow: 'hidden',
      background: '#09090b',
      position: 'relative',
    }}>
      {/* Mobile overlay backdrop */}
      {isMobile && sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 40,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        overflow: 'hidden',
        transition: 'width 0.2s, min-width 0.2s',
        borderRight: sidebarOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
        background: '#141419',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        zIndex: isMobile ? 50 : undefined,
        position: isMobile ? 'fixed' : 'relative',
        top: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        bottom: isMobile ? 0 : undefined,
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '14px 12px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ color: '#EDE8DC', fontWeight: 700, fontSize: 15 }}>Karten</span>
          <span style={{ color: '#8A8070', fontSize: 12 }}>{maps.length}</span>
        </div>

        {/* Map list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0' }}>
          {maps.length === 0 && !showAddMap && (
            <div style={{
              color: '#8A8070',
              fontSize: 13,
              textAlign: 'center',
              padding: '24px 12px',
              lineHeight: 1.6,
            }}>
              Noch keine Karten.<br />Füge deine erste Karte hinzu.
            </div>
          )}

          {maps.map(m => (
            <div
              key={m.id}
              onClick={() => { setSelectedMapId(m.id); if (isMobile) setSidebarOpen(false); }}
              style={{
                borderRadius: 8,
                marginBottom: 4,
                overflow: 'hidden',
                cursor: 'pointer',
                border: selectedMapId === m.id
                  ? '1px solid rgba(196,154,74,0.4)'
                  : '1px solid rgba(255,255,255,0.05)',
                background: selectedMapId === m.id
                  ? 'rgba(196,154,74,0.08)'
                  : 'rgba(255,255,255,0.02)',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: '100%',
                height: 72,
                background: '#09090b',
                overflow: 'hidden',
              }}>
                <img
                  src={m.imageUrl}
                  alt={m.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              {/* Name row */}
              <div style={{
                padding: '6px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {editingMapId === m.id ? (
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      value={editingMapName}
                      onChange={e => setEditingMapName(e.target.value)}
                      onKeyDown={async e => {
                        if (e.key === 'Enter' && editingMapName.trim()) {
                          await updateMap(m.id, { name: editingMapName.trim() });
                          setEditingMapId(null);
                        }
                        if (e.key === 'Escape') setEditingMapId(null);
                      }}
                      style={{
                        flex: 1,
                        background: '#09090b',
                        border: '1px solid rgba(196,154,74,0.4)',
                        borderRadius: 5,
                        padding: '2px 6px',
                        color: '#EDE8DC',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (editingMapName.trim()) await updateMap(m.id, { name: editingMapName.trim() });
                        setEditingMapId(null);
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C49A4A', padding: 2 }}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMapId(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 2 }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span style={{
                      color: selectedMapId === m.id ? '#C49A4A' : '#EDE8DC',
                      fontSize: 12,
                      fontWeight: 500,
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {m.name}
                    </span>
                    <div
                      style={{ display: 'flex', gap: 2, flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Umbenennen"
                        onClick={() => { setEditingMapId(m.id); setEditingMapName(m.name); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 3, opacity: 0.6 }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        type="button"
                        title="Karte löschen"
                        onClick={async () => {
                          if (confirm(`Karte "${m.name}" wirklich löschen? Alle Pins werden ebenfalls gelöscht.`)) {
                            await deleteMap(m.id);
                            if (selectedMapId === m.id) setSelectedMapId(maps.find(x => x.id !== m.id)?.id ?? null);
                          }
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8A8070', padding: 3, opacity: 0.6 }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </>
                )}
              </div>
              {/* Pin count */}
              <div style={{ padding: '0 10px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPinIcon size={9} color="#8A8070" />
                <span style={{ color: '#8A8070', fontSize: 10 }}>
                  {pins.filter(p => p.mapId === m.id).length} Pins
                </span>
              </div>
            </div>
          ))}

          {/* Add map form */}
          {showAddMap && (
            <div style={{
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              background: '#1c1c23',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <span style={{ color: '#EDE8DC', fontSize: 13, fontWeight: 600 }}>Neue Karte</span>
              <ImageUpload
                value={newMapImage}
                onChange={setNewMapImage}
                label="Kartenbild"
              />
              <input
                value={newMapName}
                onChange={e => setNewMapName(e.target.value)}
                placeholder="Kartenname..."
                onKeyDown={e => { if (e.key === 'Enter') handleAddMap(); if (e.key === 'Escape') setShowAddMap(false); }}
                style={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 7,
                  padding: '6px 10px',
                  color: '#EDE8DC',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <textarea
                value={newMapDesc}
                onChange={e => setNewMapDesc(e.target.value)}
                placeholder="Beschreibung (optional)..."
                rows={2}
                style={{
                  background: '#09090b',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 7,
                  padding: '6px 10px',
                  color: '#EDE8DC',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => { setShowAddMap(false); setNewMapName(''); setNewMapImage(null); setNewMapDesc(''); }}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 7,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'transparent',
                    color: '#8A8070',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  onClick={handleAddMap}
                  disabled={savingMap || !newMapName.trim() || !newMapImage}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: 7,
                    border: 'none',
                    background: newMapName.trim() && newMapImage ? '#C49A4A' : 'rgba(196,154,74,0.3)',
                    color: newMapName.trim() && newMapImage ? '#09090b' : '#8A8070',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: newMapName.trim() && newMapImage ? 'pointer' : 'not-allowed',
                  }}
                >
                  {savingMap ? 'Speichern...' : 'Erstellen'}
                </button>
              </div>
              {saveMapError && (
                <div style={{ color: '#E05252', fontSize: 11, marginTop: 4 }}>{saveMapError}</div>
              )}
            </div>
          )}
        </div>

        {/* Add map button */}
        {!showAddMap && (
          <div style={{ padding: '8px 8px 12px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setShowAddMap(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 0',
                borderRadius: 8,
                border: '1px dashed rgba(255,255,255,0.12)',
                background: 'transparent',
                color: '#8A8070',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Plus size={14} />
              Karte hinzufügen
            </button>
          </div>
        )}
      </div>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        {/* Top bar */}
        <div style={{
          padding: '10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          background: '#141419',
          minHeight: 48,
        }}>
          {/* Sidebar toggle button */}
          <button
            type="button"
            onClick={() => setSidebarOpen(v => !v)}
            title={sidebarOpen ? 'Seitenleiste verbergen' : 'Seitenleiste zeigen'}
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8A8070',
              flexShrink: 0,
            }}
          >
            {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>

          {selectedMap ? (
            <>
              <span style={{ color: '#EDE8DC', fontWeight: 600, fontSize: 15, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {selectedMap.name}
              </span>
              <span style={{ color: '#8A8070', fontSize: 12, flexShrink: 0 }}>
                {mapPins.length} {mapPins.length === 1 ? 'Pin' : 'Pins'}
              </span>
              {/* Edit mode toggle */}
              <button
                type="button"
                onClick={() => {
                  setEditMode(v => !v);
                  setPendingPin(null);
                  setEditingPin(null);
                  setPinFormAnchor(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: editMode ? '1px solid rgba(196,154,74,0.5)' : '1px solid rgba(255,255,255,0.07)',
                  background: editMode ? 'rgba(196,154,74,0.12)' : 'rgba(255,255,255,0.03)',
                  color: editMode ? '#C49A4A' : '#8A8070',
                  fontSize: 12,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {editMode ? <><Eye size={13} /> Vorschau</> : <><Pencil size={13} /> Pins bearbeiten</>}
              </button>
            </>
          ) : (
            <span style={{ color: '#8A8070', fontSize: 14 }}>Karten</span>
          )}
        </div>

        {/* Map viewer area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {selectedMap ? (
            <>
              <MapViewer
                key={selectedMap.id}
                map={selectedMap}
                pins={mapPins}
                editMode={editMode}
                onAddPin={handleAddPin}
                onDeletePin={handleDeletePin}
                onEditPin={handleEditPin}
                onNavigatePin={handleNavigatePin}
              />

              {/* Pin form floating panel */}
              {(pendingPin || editingPin) && pinFormAnchor !== null && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: 16,
                    transform: 'translateY(-50%)',
                    zIndex: 100,
                    maxHeight: '80vh',
                    overflowY: 'auto',
                  }}
                >
                  <PinForm
                    initial={editingPin ? {
                      label: editingPin.label,
                      description: editingPin.description,
                      color: editingPin.color,
                      type: editingPin.type,
                      targetId: editingPin.targetId,
                      icon: editingPin.icon,
                      size: editingPin.size,
                    } : undefined}
                    onSave={handleSavePin}
                    onCancel={handleCancelPinForm}
                    maps={maps}
                    currentMapId={selectedMap.id}
                  />
                </div>
              )}

              {/* Edit mode hint */}
              {editMode && !pendingPin && !editingPin && (
                <div style={{
                  position: 'absolute',
                  bottom: 60,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(9,9,11,0.85)',
                  border: '1px solid rgba(196,154,74,0.3)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  color: '#C49A4A',
                  fontSize: 12,
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  zIndex: 10,
                }}>
                  Klicke auf die Karte, um einen Pin zu setzen
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              color: '#8A8070',
            }}>
              <MapPinIcon size={48} strokeWidth={1} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#EDE8DC', marginBottom: 6 }}>
                  Wähle eine Karte
                </p>
                <p style={{ fontSize: 13 }}>
                  {maps.length > 0
                    ? 'Wähle eine Karte aus der Seitenleiste'
                    : 'Füge eine neue Karte in der Seitenleiste hinzu'}
                </p>
              </div>
              {maps.length === 0 && (
                <button
                  type="button"
                  onClick={() => setShowAddMap(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#C49A4A',
                    color: '#09090b',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} /> Erste Karte erstellen
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
