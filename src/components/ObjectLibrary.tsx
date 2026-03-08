import { useState } from 'react';
import { objectLibrary } from '@/lib/sceneObjects';
import { ChevronDown, ChevronRight, Search, Skull, Crosshair, Fingerprint, Sofa, Building, Car, Trees } from 'lucide-react';

const categoryIcons: Record<string, React.ElementType> = {
  'Bodies': Skull,
  'Weapons': Crosshair,
  'Evidence': Fingerprint,
  'Furniture': Sofa,
  'Structures': Building,
  'Vehicles': Car,
};

const categoryColors: Record<string, string> = {
  'Bodies': 'text-red-400',
  'Weapons': 'text-slate-400',
  'Evidence': 'text-yellow-400',
  'Furniture': 'text-violet-400',
  'Structures': 'text-blue-400',
  'Vehicles': 'text-emerald-400',
};

export default function ObjectLibrary() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Bodies': true, 'Evidence': true,
  });
  const [search, setSearch] = useState('');

  const toggle = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const filtered = Object.entries(objectLibrary).reduce((acc, [cat, items]) => {
    const f = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
    if (f.length) acc[cat] = f;
    return acc;
  }, {} as typeof objectLibrary);

  const totalObjects = Object.values(objectLibrary).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Object Library</h2>
          <span className="text-[9px] font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">{totalObjects}</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search objects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary text-foreground text-xs rounded-md pl-7 pr-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {Object.entries(filtered).map(([category, items]) => {
          const Icon = categoryIcons[category];
          const colorClass = categoryColors[category] || 'text-muted-foreground';
          return (
            <div key={category}>
              <button
                onClick={() => toggle(category)}
                className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary/50"
              >
                {expandedCategories[category] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                {Icon && <Icon className={`h-3 w-3 shrink-0 ${colorClass}`} />}
                <span className="truncate">{category}</span>
                <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">{items.length}</span>
              </button>
              {expandedCategories[category] && (
                <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                  {items.map(item => (
                    <div
                      key={item.type}
                      draggable
                      onDragStart={e => {
                        e.dataTransfer.setData('application/scene-object', JSON.stringify(item));
                      }}
                      title={`Drag to canvas: ${item.label}\nSize: ${item.width}×${item.height}`}
                      className="flex flex-col items-center gap-0.5 p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-all border border-transparent hover:border-border hover:shadow-sm text-center group"
                    >
                      <span className="text-lg leading-none group-hover:scale-110 transition-transform">{item.icon}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(filtered).length === 0 && search && (
          <div className="text-center py-6">
            <p className="text-xs text-muted-foreground">No objects found for "{search}"</p>
          </div>
        )}
      </div>
      <div className="p-2 border-t border-border">
        <p className="text-[9px] text-muted-foreground/40 text-center">Drag objects onto the canvas</p>
      </div>
    </div>
  );
}
