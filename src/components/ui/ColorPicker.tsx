import { cn, COLOR_PALETTE } from '../../lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-gray-300">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {COLOR_PALETTE.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              'w-7 h-7 rounded-full border-2 transition-transform hover:scale-110',
              value === color ? 'border-white scale-110' : 'border-transparent',
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500">Eigene Farbe:</label>
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
        />
        <span className="text-xs text-gray-500 font-mono">{value}</span>
      </div>
    </div>
  );
}
