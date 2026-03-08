import { useScene, ToolType } from '@/store/SceneContext';
import {
  MousePointer2, Hand, Minus, ArrowRight, Pencil, Type, Ruler,
  Grid3X3, Magnet, Sun, Moon, Download, FileText
} from 'lucide-react';

const tools: { type: ToolType; icon: React.ElementType; label: string }[] = [
  { type: 'select', icon: MousePointer2, label: 'Select' },
  { type: 'pan', icon: Hand, label: 'Pan' },
  { type: 'wall', icon: Minus, label: 'Wall' },
  { type: 'arrow', icon: ArrowRight, label: 'Arrow' },
  { type: 'freehand', icon: Pencil, label: 'Draw' },
  { type: 'text', icon: Type, label: 'Text' },
  { type: 'measure', icon: Ruler, label: 'Measure' },
];

export default function TopToolbar() {
  const { activeTool, setTool, showGrid, toggleGrid, snapToGrid, toggleSnap, isDark, toggleDark, caseInfo, setCaseInfo, zoom, setZoom } = useScene();

  return (
    <div className="h-11 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
      {/* App brand */}
      <div className="flex items-center gap-2 mr-4 shrink-0">
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">CS</span>
        </div>
        <span className="text-sm font-semibold text-foreground hidden sm:inline">Crime Scene Sketcher</span>
      </div>

      {/* Divider */}
      <div className="h-5 w-px bg-border" />

      {/* Drawing tools */}
      <div className="flex items-center gap-0.5">
        {tools.map(t => (
          <button
            key={t.type}
            onClick={() => setTool(t.type)}
            title={t.label}
            className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
              activeTool === t.type
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Grid & snap */}
      <button onClick={toggleGrid} title="Toggle Grid" className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${showGrid ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
        <Grid3X3 className="h-3.5 w-3.5" />
      </button>
      <button onClick={toggleSnap} title="Snap to Grid" className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${snapToGrid ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
        <Magnet className="h-3.5 w-3.5" />
      </button>

      <div className="h-5 w-px bg-border" />

      {/* Zoom controls */}
      <div className="flex items-center gap-1">
        <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold">−</button>
        <span className="text-[10px] font-mono text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold">+</button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Case info */}
      <div className="hidden lg:flex items-center gap-2">
        <input
          placeholder="Case #"
          value={caseInfo.caseNumber}
          onChange={e => setCaseInfo({ caseNumber: e.target.value })}
          className="w-24 bg-secondary text-foreground text-[11px] rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono placeholder:text-muted-foreground"
        />
        <input
          placeholder="Investigator"
          value={caseInfo.investigator}
          onChange={e => setCaseInfo({ investigator: e.target.value })}
          className="w-28 bg-secondary text-foreground text-[11px] rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
        <input
          placeholder="Location"
          value={caseInfo.location}
          onChange={e => setCaseInfo({ location: e.target.value })}
          className="w-28 bg-secondary text-foreground text-[11px] rounded px-2 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      <div className="h-5 w-px bg-border" />

      {/* Export & theme */}
      <button title="Export PNG" className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <Download className="h-3.5 w-3.5" />
      </button>
      <button title="Export PDF" className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        <FileText className="h-3.5 w-3.5" />
      </button>
      <button onClick={toggleDark} title="Toggle theme" className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}
