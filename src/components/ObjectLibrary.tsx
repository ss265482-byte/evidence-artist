import { useState } from 'react';
import { objectLibrary } from '@/lib/sceneObjects';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

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

  return (
    <div className="w-56 bg-card border-r border-border flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Object Library</h2>
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
        {Object.entries(filtered).map(([category, items]) => (
          <div key={category}>
            <button
              onClick={() => toggle(category)}
              className="flex items-center gap-1 w-full text-left px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded"
            >
              {expandedCategories[category] ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {category}
              <span className="ml-auto text-[10px] text-muted-foreground/60">{items.length}</span>
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
                    className="flex flex-col items-center gap-0.5 p-2 rounded-md bg-secondary/50 hover:bg-secondary cursor-grab active:cursor-grabbing transition-colors border border-transparent hover:border-border text-center"
                  >
                    <span className="text-lg leading-none">{item.icon}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
