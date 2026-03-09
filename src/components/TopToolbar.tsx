import { useEffect, useState, useRef } from 'react';
import { useScene, ToolType, MeasurementUnit, UNIT_CONFIG } from '@/store/SceneContext';
import { themes, themeCategories, ThemeDefinition } from '@/lib/themes';
import { stageStore } from '@/lib/stageRef';
import {
  MousePointer2, Hand, Minus, ArrowRight, Pencil, Type, Ruler,
  Grid3X3, Magnet, Sun, Moon, LayoutList, Square,
  Undo2, Redo2, Maximize, Info, Keyboard, ChevronDown, Trash2,
  ImagePlus, Eye, EyeOff, X as XIcon, Palette, Check, Compass, Spline
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Slider } from '@/components/ui/slider';
import ExportDialog from '@/components/ExportDialog';

const tools: { type: ToolType; icon: React.ElementType; label: string; shortcut: string }[] = [
  { type: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
  { type: 'pan', icon: Hand, label: 'Pan', shortcut: 'H' },
  { type: 'wall', icon: Minus, label: 'Wall', shortcut: 'W' },
  { type: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  { type: 'freehand', icon: Pencil, label: 'Draw', shortcut: 'P' },
  { type: 'text', icon: Type, label: 'Text', shortcut: 'T' },
  { type: 'room-label', icon: Square, label: 'Room', shortcut: 'R' },
];

const measureTools: { type: ToolType; icon: React.ElementType; label: string; shortcut: string; desc: string }[] = [
  { type: 'measure', icon: Ruler, label: 'Distance', shortcut: 'M', desc: '2 clicks — straight line' },
  { type: 'measure-angle', icon: Compass, label: 'Angle', shortcut: '', desc: '3 clicks — ray, vertex, ray' },
  { type: 'measure-arc', icon: Spline, label: 'Arc/Curve', shortcut: '', desc: '3 clicks — start, end, bend' },
];

const shortcutMap: Record<string, ToolType> = {
  v: 'select', h: 'pan', w: 'wall', a: 'arrow', p: 'freehand', t: 'text', r: 'room-label', m: 'measure',
};

export default function TopToolbar() {
  const { activeTool, setTool, showGrid, toggleGrid, snapToGrid, toggleSnap, showLegend, toggleLegend, isDark, toggleDark, themeId, setTheme, caseInfo, setCaseInfo, zoom, setZoom, undo, redo, canUndo, canRedo, objects, clearAll, walls, measurements, backgroundImage, setBackgroundImage, updateBackgroundImage } = useScene();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFloorPlan = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setBackgroundImage({
        url,
        opacity: 0.4,
        visible: true,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = url;
    e.target.value = '';
  };

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

          {/* Measure dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={`h-7 flex items-center gap-0.5 px-1.5 rounded transition-colors ${
                  activeTool === 'measure' || activeTool === 'measure-angle' || activeTool === 'measure-arc'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {(() => {
                  const active = measureTools.find(mt => mt.type === activeTool);
                  const Icon = active?.icon || Ruler;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                <ChevronDown className="h-2.5 w-2.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1.5" align="start">
              {measureTools.map(mt => (
                <button
                  key={mt.type}
                  onClick={() => setTool(mt.type)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    activeTool === mt.type ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'
                  }`}
                >
                  <mt.icon className="h-3.5 w-3.5 shrink-0" />
                  <div className="text-left">
                    <div className="font-medium">{mt.label}{mt.shortcut ? ` (${mt.shortcut})` : ''}</div>
                    <div className={`text-[10px] ${activeTool === mt.type ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{mt.desc}</div>
                  </div>
                </button>
              ))}
            </PopoverContent>
          </Popover>
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

        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <button disabled={objects.length === 0 && walls.length === 0 && measurements.length === 0} className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${objects.length > 0 || walls.length > 0 || measurements.length > 0 ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground/30 cursor-not-allowed'}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Clear All</TooltipContent>
          </Tooltip>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear entire scene?</AlertDialogTitle>
              <AlertDialogDescription>This will remove all objects, walls, and measurements. This action can be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={clearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Clear All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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

        {/* Floor Plan Import */}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        {!backgroundImage ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleImportFloorPlan} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <ImagePlus className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Import Floor Plan</TooltipContent>
          </Tooltip>
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] bg-secondary text-foreground hover:bg-secondary/80 transition-colors border border-border">
                <ImagePlus className="h-3 w-3 text-muted-foreground" />
                <span className="hidden sm:inline">Floor Plan</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3 space-y-3" align="end">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Floor Plan</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Visible</span>
                  <button onClick={() => updateBackgroundImage({ visible: !backgroundImage.visible })} className="h-6 w-6 flex items-center justify-center rounded hover:bg-secondary transition-colors">
                    {backgroundImage.visible ? <Eye className="h-3.5 w-3.5 text-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground uppercase block mb-1">Opacity: {Math.round(backgroundImage.opacity * 100)}%</label>
                  <Slider
                    value={[backgroundImage.opacity]}
                    onValueChange={([v]) => updateBackgroundImage({ opacity: v })}
                    min={0.05}
                    max={1}
                    step={0.05}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-1">
                  <button onClick={handleImportFloorPlan} className="flex-1 text-[10px] py-1.5 rounded bg-secondary text-foreground hover:bg-secondary/80 transition-colors">
                    Replace
                  </button>
                  <button onClick={() => setBackgroundImage(null)} className="flex-1 text-[10px] py-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    Remove
                  </button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <ExportDialog />
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <button className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Palette className="h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Themes</TooltipContent>
          </Tooltip>
          <PopoverContent className="w-64 p-3" align="end">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Themes</h3>
            <div className="space-y-3">
              {(Object.keys(themeCategories) as Array<keyof typeof themeCategories>).map(catKey => {
                const cat = themeCategories[catKey];
                const catThemes = themes.filter(t => t.category === catKey);
                return (
                  <div key={catKey}>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>{cat.icon}</span> {cat.label}
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {catThemes.map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] transition-colors border ${
                            themeId === t.id
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-transparent bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                          }`}
                        >
                          <span className="text-xs">{t.icon}</span>
                          <span className="truncate">{t.name}</span>
                          {themeId === t.id && <Check className="h-3 w-3 ml-auto text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </TooltipProvider>
  );
}
