import { useEffect, useState } from 'react';
import { useScene, ToolType } from '@/store/SceneContext';
import { stageStore } from '@/lib/stageRef';
import { jsPDF } from 'jspdf';
import {
  MousePointer2, Hand, Minus, ArrowRight, Pencil, Type, Ruler,
  Grid3X3, Magnet, Sun, Moon, Download, FileText, LayoutList, Square,
  Undo2, Redo2, Maximize, Info, Keyboard, ChevronDown, Trash2
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const tools: { type: ToolType; icon: React.ElementType; label: string; shortcut: string }[] = [
  { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { type: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { type: 'wall', icon: Minus, label: 'Wall', shortcut: 'W' },
  { type: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { type: 'freehand', icon: Pencil, label: 'Draw', shortcut: 'P' },
  { type: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { type: 'room-label', icon: Square, label: 'Room', shortcut: 'R' },
  { type: 'measure', icon: Ruler, label: 'Measure', shortcut: 'M' },
];

const shortcutMap: Record<string, ToolType> = {
  v: 'select', h: 'pan', w: 'wall', a: 'arrow', p: 'freehand', t: 'text', r: 'room-label', m: 'measure',
};

export default function TopToolbar() {
  const { activeTool, setTool, showGrid, toggleGrid, snapToGrid, toggleSnap, showLegend, toggleLegend, isDark, toggleDark, caseInfo, setCaseInfo, zoom, setZoom, undo, redo, canUndo, canRedo, objects } = useScene();
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const tool = shortcutMap[e.key.toLowerCase()];
        if (tool) { e.preventDefault(); setTool(tool); }
        if (e.key === 'g') { e.preventDefault(); toggleGrid(); }
        if (e.key === 's' && !e.shiftKey) { e.preventDefault(); toggleSnap(); }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, setTool, toggleGrid, toggleSnap]);

  const getStageDataURL = (pixelRatio = 2): string | null => {
    const stage = stageStore.current;
    if (!stage) return null;
    return stage.toDataURL({ pixelRatio });
  };

  const handleExportPNG = () => {
    const dataURL = getStageDataURL();
    if (!dataURL) return;
    const link = document.createElement('a');
    link.download = `crime-scene${caseInfo.caseNumber ? `-${caseInfo.caseNumber}` : ''}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleExportPDF = () => {
    const dataURL = getStageDataURL(2);
    if (!dataURL) return;
    const stage = stageStore.current!;
    const w = stage.width();
    const h = stage.height();
    const orientation = w > h ? 'landscape' : 'portrait';
    const pdf = new jsPDF({ orientation, unit: 'px', format: [w, h] });
    pdf.addImage(dataURL, 'PNG', 0, 0, w, h);
    pdf.save(`crime-scene${caseInfo.caseNumber ? `-${caseInfo.caseNumber}` : ''}.pdf`);
  };

  const handleFitToContent = () => {
    if (objects.length === 0) return;
    const stage = stageStore.current;
    if (!stage) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    objects.forEach(obj => {
      minX = Math.min(minX, obj.x);
      minY = Math.min(minY, obj.y);
      maxX = Math.max(maxX, obj.x + obj.width);
      maxY = Math.max(maxY, obj.y + obj.height);
    });
    const contentW = maxX - minX + 100;
    const contentH = maxY - minY + 100;
    const scaleX = stage.width() / contentW;
    const scaleY = stage.height() / contentH;
    const newZoom = Math.min(scaleX, scaleY, 2);
    setZoom(newZoom);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="h-11 bg-card border-b border-border flex items-center px-3 gap-2 shrink-0">
        {/* App brand */}
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">CS</span>
          </div>
          <span className="text-sm font-semibold text-foreground hidden sm:inline">Crime Scene Sketcher</span>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Drawing tools with tooltips */}
        <div className="flex items-center gap-0.5">
          {tools.map(t => (
            <Tooltip key={t.type}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setTool(t.type)}
                  className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${
                    activeTool === t.type
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {t.label} <kbd className="ml-1.5 px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">{t.shortcut}</kbd>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={undo} disabled={!canUndo} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${canUndo ? 'text-muted-foreground hover:text-foreground hover:bg-secondary' : 'text-muted-foreground/30 cursor-not-allowed'}`}>
              <Undo2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Undo <kbd className="ml-1.5 px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘Z</kbd></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={redo} disabled={!canRedo} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${canRedo ? 'text-muted-foreground hover:text-foreground hover:bg-secondary' : 'text-muted-foreground/30 cursor-not-allowed'}`}>
              <Redo2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Redo <kbd className="ml-1.5 px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">⌘⇧Z</kbd></TooltipContent>
        </Tooltip>

        <div className="h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggleGrid} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${showGrid ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Grid <kbd className="ml-1.5 px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">G</kbd></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggleSnap} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${snapToGrid ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <Magnet className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Snap <kbd className="ml-1.5 px-1 py-0.5 bg-secondary rounded text-[10px] font-mono">S</kbd></TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggleLegend} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${showLegend ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Legend</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleFitToContent} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Maximize className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Fit to Content</TooltipContent>
        </Tooltip>

        <div className="h-5 w-px bg-border" />

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold">−</button>
          <button onClick={() => setZoom(1)} className="text-[10px] font-mono text-muted-foreground w-10 text-center hover:text-foreground transition-colors cursor-pointer">{Math.round(zoom * 100)}%</button>
          <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-xs font-bold">+</button>
        </div>

        <div className="flex-1" />

        {/* Case info popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-foreground text-[11px] hover:bg-secondary/80 transition-colors border border-border">
              <Info className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium truncate max-w-[120px]">
                {caseInfo.caseNumber || 'Case Info'}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 space-y-2" align="end">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Case Information</h3>
            <div className="space-y-2">
              {[
                { key: 'caseNumber', label: 'Case #', placeholder: 'e.g. 2026-0042' },
                { key: 'investigator', label: 'Investigator', placeholder: 'Det. Smith' },
                { key: 'location', label: 'Location', placeholder: '123 Main St' },
                { key: 'incident', label: 'Incident', placeholder: 'Homicide / B&E' },
                { key: 'sketchBy', label: 'Sketch By', placeholder: 'Officer name' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">{field.label}</label>
                  <input
                    placeholder={field.placeholder}
                    value={(caseInfo as any)[field.key]}
                    onChange={e => setCaseInfo({ [field.key]: e.target.value })}
                    className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono placeholder:text-muted-foreground"
                  />
                </div>
              ))}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">Date / Time</label>
                <input
                  type="datetime-local"
                  value={caseInfo.dateTime}
                  onChange={e => setCaseInfo({ dateTime: e.target.value })}
                  className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase block mb-0.5">Scene Type</label>
                <div className="flex gap-1">
                  {(['indoor', 'outdoor'] as const).map(st => (
                    <button key={st} onClick={() => setCaseInfo({ sceneType: st })}
                      className={`flex-1 text-[10px] font-mono py-1.5 rounded transition-colors capitalize ${
                        caseInfo.sceneType === st ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >{st}</button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-5 w-px bg-border" />

        {/* Keyboard shortcuts */}
        <Popover open={showShortcuts} onOpenChange={setShowShortcuts}>
          <PopoverTrigger asChild>
            <button className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Keyboard className="h-3.5 w-3.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="end">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shortcuts</h3>
            <div className="space-y-1 text-[11px]">
              {tools.map(t => (
                <div key={t.type} className="flex justify-between text-muted-foreground">
                  <span>{t.label}</span>
                  <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">{t.shortcut}</kbd>
                </div>
              ))}
              <div className="h-px bg-border my-1.5" />
              <div className="flex justify-between text-muted-foreground"><span>Toggle Grid</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">G</kbd></div>
              <div className="flex justify-between text-muted-foreground"><span>Snap to Grid</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">S</kbd></div>
              <div className="flex justify-between text-muted-foreground"><span>Undo</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">⌘Z</kbd></div>
              <div className="flex justify-between text-muted-foreground"><span>Redo</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">⌘⇧Z</kbd></div>
              <div className="flex justify-between text-muted-foreground"><span>Delete</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">Del</kbd></div>
              <div className="flex justify-between text-muted-foreground"><span>Deselect</span><kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">Esc</kbd></div>
            </div>
          </PopoverContent>
        </Popover>

        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleExportPNG} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Download className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Export PNG</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleExportPDF} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <FileText className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">Export PDF</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={toggleDark} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">{isDark ? 'Light Mode' : 'Dark Mode'}</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
