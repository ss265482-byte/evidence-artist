import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type SceneObjectType = 
  | 'body-outline' | 'body-standing' | 'body-prone'
  | 'knife' | 'gun' | 'bullet-casing' | 'bullet-hole'
  | 'evidence-marker' | 'blood-stain' | 'footprint' | 'tire-mark'
  | 'bed' | 'table' | 'chair' | 'sofa' | 'cabinet'
  | 'door' | 'window' | 'wall' | 'stairs'
  | 'car' | 'motorcycle' | 'bicycle'
  | 'text-label' | 'arrow' | 'line' | 'freehand';

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  color: string;
  category: string;
  evidenceId?: string;
  notes?: string;
  timeLogged?: string;
}

export interface EvidenceItem {
  id: string;
  objectId: string;
  description: string;
  notes: string;
  location: string;
  timeLogged: string;
}

export interface CaseInfo {
  caseNumber: string;
  investigator: string;
  location: string;
  dateTime: string;
  sceneType: 'indoor' | 'outdoor';
}

export type ToolType = 'select' | 'pan' | 'wall' | 'line' | 'arrow' | 'freehand' | 'text' | 'measure';

interface SceneState {
  objects: SceneObject[];
  evidence: EvidenceItem[];
  caseInfo: CaseInfo;
  selectedObjectId: string | null;
  activeTool: ToolType;
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  isDark: boolean;
  addObject: (obj: Omit<SceneObject, 'id'>) => string;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  setZoom: (z: number) => void;
  toggleDark: () => void;
  setCaseInfo: (info: Partial<CaseInfo>) => void;
  addEvidence: (objectId: string, description: string) => void;
  updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
}

const SceneContext = createContext<SceneState | null>(null);

let nextId = 1;
let nextEvidence = 1;

export function SceneProvider({ children }: { children: ReactNode }) {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [caseInfo, setCaseInfoState] = useState<CaseInfo>({
    caseNumber: '',
    investigator: '',
    location: '',
    dateTime: new Date().toISOString().slice(0, 16),
    sceneType: 'indoor',
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isDark, setIsDark] = useState(true);

  const addObject = useCallback((obj: Omit<SceneObject, 'id'>) => {
    const id = `obj-${nextId++}`;
    setObjects(prev => [...prev, { ...obj, id }]);
    return id;
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const removeObject = useCallback((id: string) => {
    setObjects(prev => prev.filter(o => o.id !== id));
    setEvidence(prev => prev.filter(e => e.objectId !== id));
    setSelectedObjectId(prev => prev === id ? null : prev);
  }, []);

  const selectObject = useCallback((id: string | null) => {
    setSelectedObjectId(id);
  }, []);

  const addEvidence = useCallback((objectId: string, description: string) => {
    const id = `EV-${String(nextEvidence++).padStart(3, '0')}`;
    const obj = objects.find(o => o.id === objectId);
    setEvidence(prev => [...prev, {
      id,
      objectId,
      description,
      notes: '',
      location: obj ? `(${Math.round(obj.x)}, ${Math.round(obj.y)})` : '',
      timeLogged: new Date().toLocaleTimeString(),
    }]);
    setObjects(prev => prev.map(o => o.id === objectId ? { ...o, evidenceId: id } : o));
  }, [objects]);

  const updateEvidence = useCallback((id: string, updates: Partial<EvidenceItem>) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const setCaseInfo = useCallback((info: Partial<CaseInfo>) => {
    setCaseInfoState(prev => ({ ...prev, ...info }));
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  // Initialize dark mode
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return (
    <SceneContext.Provider value={{
      objects, evidence, caseInfo, selectedObjectId, activeTool,
      showGrid, snapToGrid, zoom, isDark,
      addObject, updateObject, removeObject, selectObject,
      setTool: setActiveTool, toggleGrid, toggleSnap: () => setSnapToGrid(p => !p),
      setZoom, toggleDark, setCaseInfo, addEvidence, updateEvidence,
    }}>
      {children}
    </SceneContext.Provider>
  );

  function toggleGrid() {
    setShowGrid(p => !p);
  }
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used within SceneProvider');
  return ctx;
}
