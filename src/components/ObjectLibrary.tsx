import { useState, useCallback, useMemo } from 'react';
import { objectLibrary } from '@/lib/sceneObjects';
import {
  ChevronDown, ChevronRight, Search, Skull, Crosshair, Fingerprint,
  Sofa, Building, Car, Trees, Star, Clock, ChevronsUpDown, GripVertical,
  X, ChefHat, Briefcase, HeartPulse, Wrench, Lightbulb, Shield, Tag
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const categoryIcons: Record<string, React.ElementType> = {
  'Bodies': Skull,
  'Weapons': Crosshair,
  'Evidence': Fingerprint,
  'Furniture': Sofa,
  'Structures': Building,
  'Vehicles': Car,
  'Outdoor': Trees,
  'Kitchen & Bath': ChefHat,
  'Office': Briefcase,
  'Medical': HeartPulse,
  'Garage & Workshop': Wrench,
  'Lighting & Safety': Lightbulb,
  'Scene Markers': Shield,
  'Hazmat & Industrial': Tag,
  'Recreation': Star,
};

const categoryColors: Record<string, string> = {
  'Bodies': 'text-destructive',
  'Weapons': 'text-muted-foreground',
  'Evidence': 'text-warning',
  'Furniture': 'text-accent-foreground',
  'Structures': 'text-primary',
  'Vehicles': 'text-primary',
  'Outdoor': 'text-primary',
  'Kitchen & Bath': 'text-accent-foreground',
  'Office': 'text-primary',
  'Medical': 'text-destructive',
  'Garage & Workshop': 'text-muted-foreground',
  'Lighting & Safety': 'text-warning',
  'Scene Markers': 'text-primary',
  'Hazmat & Industrial': 'text-warning',
  'Recreation': 'text-primary',
};

const FAVORITES_KEY = 'scene-object-favorites';
const RECENTS_KEY = 'scene-object-recents';
const MAX_RECENTS = 8;

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

type ViewMode = 'all' | 'favorites' | 'recent';

export default function ObjectLibrary() {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Bodies': true, 'Evidence': true,
  });
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [favorites, setFavorites] = useState<string[]>(() => loadFromStorage(FAVORITES_KEY, []));
  const [recents, setRecents] = useState<string[]>(() => loadFromStorage(RECENTS_KEY, []));
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const allItems = useMemo(() => Object.values(objectLibrary).flat(), []);

  const toggleFavorite = useCallback((type: string) => {
    setFavorites(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const addRecent = useCallback((type: string) => {
    setRecents(prev => {
      const next = [type, ...prev.filter(t => t !== type)].slice(0, MAX_RECENTS);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const toggle = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleAll = () => {
    const allExpanded = Object.keys(objectLibrary).every(k => expandedCategories[k]);
    const next: Record<string, boolean> = {};
    Object.keys(objectLibrary).forEach(k => { next[k] = !allExpanded; });
    setExpandedCategories(next);
  };

  const filtered = useMemo(() => {
    if (viewMode === 'favorites') {
      const favItems = allItems.filter(i => favorites.includes(i.type) && i.label.toLowerCase().includes(search.toLowerCase()));
      return favItems.length ? { 'Favorites': favItems } : {};
    }
    if (viewMode === 'recent') {
      const recentItems = recents.map(t => allItems.find(i => i.type === t)).filter(Boolean).filter(i => i!.label.toLowerCase().includes(search.toLowerCase()));
      return recentItems.length ? { 'Recently Used': recentItems as typeof allItems } : {};
    }
    return Object.entries(objectLibrary).reduce((acc, [cat, items]) => {
      const f = items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()));
      if (f.length) acc[cat] = f;
      return acc;
    }, {} as typeof objectLibrary);
  }, [viewMode, search, favorites, recents, allItems]);

  const totalObjects = Object.values(objectLibrary).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-56 bg-card border-r border-border flex flex-col h-full">
        {/* Header */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Object Library</h2>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-mono text-muted-foreground/50 bg-secondary px-1.5 py-0.5 rounded">{totalObjects}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={toggleAll} className="p-0.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronsUpDown className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom"><p className="text-xs">Toggle all categories</p></TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search objects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-secondary text-foreground text-xs rounded-md pl-7 pr-7 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* View mode tabs */}
          <Tabs value={viewMode} onValueChange={v => setViewMode(v as ViewMode)} className="w-full">
            <TabsList className="w-full h-7 bg-secondary/50 p-0.5">
              <TabsTrigger value="all" className="text-[10px] h-full flex-1 data-[state=active]:bg-background px-1.5">All</TabsTrigger>
              <TabsTrigger value="favorites" className="text-[10px] h-full flex-1 data-[state=active]:bg-background px-1.5 gap-0.5">
                <Star className="h-2.5 w-2.5" /> Favs
                {favorites.length > 0 && <span className="text-[8px] font-mono opacity-60">{favorites.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-[10px] h-full flex-1 data-[state=active]:bg-background px-1.5 gap-0.5">
                <Clock className="h-2.5 w-2.5" /> Recent
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Object list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
          {Object.entries(filtered).map(([category, items]) => {
            const Icon = categoryIcons[category];
            const colorClass = categoryColors[category] || 'text-muted-foreground';
            const isSpecial = category === 'Favorites' || category === 'Recently Used';
            return (
              <div key={category}>
                {!isSpecial ? (
                  <button
                    onClick={() => toggle(category)}
                    className="flex items-center gap-1.5 w-full text-left px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-secondary/50"
                  >
                    {expandedCategories[category] ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                    {Icon && <Icon className={`h-3 w-3 shrink-0 ${colorClass}`} />}
                    <span className="truncate">{category}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">{items.length}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {category === 'Favorites' ? <Star className="h-3 w-3 text-yellow-500" /> : <Clock className="h-3 w-3" />}
                    <span>{category}</span>
                    <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">{items.length}</span>
                  </div>
                )}
                {(isSpecial || expandedCategories[category]) && (
                  <div className="grid grid-cols-2 gap-1 px-1 pb-1">
                    {items.map(item => {
                      const isFav = favorites.includes(item.type);
                      const isHovered = hoveredItem === item.type;
                      return (
                        <Tooltip key={item.type}>
                          <TooltipTrigger asChild>
                            <div
                              draggable
                              onDragStart={e => {
                                e.dataTransfer.setData('application/scene-object', JSON.stringify(item));
                                addRecent(item.type);
                              }}
                              onMouseEnter={() => setHoveredItem(item.type)}
                              onMouseLeave={() => setHoveredItem(null)}
                              className={`relative flex flex-col items-center gap-0.5 p-2 rounded-md cursor-grab active:cursor-grabbing transition-all border text-center group
                                ${isFav
                                  ? 'bg-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40 hover:bg-yellow-500/10'
                                  : 'bg-secondary/50 hover:bg-secondary border-transparent hover:border-border'
                                } hover:shadow-sm`}
                            >
                              {/* Favorite star */}
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item.type); }}
                                className={`absolute top-0.5 right-0.5 p-0.5 rounded transition-opacity ${isHovered || isFav ? 'opacity-100' : 'opacity-0'}`}
                              >
                                <Star className={`h-2.5 w-2.5 ${isFav ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`} />
                              </button>

                              {/* Drag grip */}
                              <div className={`absolute top-0.5 left-0.5 transition-opacity ${isHovered ? 'opacity-40' : 'opacity-0'}`}>
                                <GripVertical className="h-2.5 w-2.5 text-muted-foreground" />
                              </div>

                              <span className="text-lg leading-none group-hover:scale-110 transition-transform">{item.icon}</span>
                              <span className="text-[10px] text-muted-foreground leading-tight group-hover:text-foreground transition-colors">{item.label}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="text-xs space-y-1">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-muted-foreground">{item.width} × {item.height} px</p>
                            <div className="flex items-center gap-1.5">
                              <div className="w-3 h-3 rounded-sm border border-border" style={{ backgroundColor: item.color }} />
                              <span className="text-muted-foreground font-mono text-[10px]">{item.color}</span>
                            </div>
                            <p className="text-muted-foreground/60 text-[10px]">Drag to place on canvas</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {Object.keys(filtered).length === 0 && (
            <div className="text-center py-6 space-y-1">
              {search ? (
                <p className="text-xs text-muted-foreground">No objects found for "{search}"</p>
              ) : viewMode === 'favorites' ? (
                <>
                  <Star className="h-5 w-5 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No favorites yet</p>
                  <p className="text-[10px] text-muted-foreground/50">Hover an object and click ★</p>
                </>
              ) : (
                <>
                  <Clock className="h-5 w-5 mx-auto text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No recent objects</p>
                  <p className="text-[10px] text-muted-foreground/50">Drag objects to track history</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border flex items-center justify-between">
          <p className="text-[9px] text-muted-foreground/40">Drag objects onto canvas</p>
          <div className="flex gap-1">
            <kbd className="text-[8px] text-muted-foreground/30 bg-secondary px-1 py-0.5 rounded font-mono">⌘F</kbd>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
