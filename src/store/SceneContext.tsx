import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';

export type SceneObjectType = 
  | 'body-outline' | 'body-standing' | 'body-prone'
  | 'knife' | 'gun' | 'bullet-casing' | 'bullet-hole'
  | 'evidence-marker' | 'blood-stain' | 'footprint' | 'tire-mark'
  | 'bed' | 'table' | 'chair' | 'sofa' | 'cabinet'
  | 'door' | 'window' | 'wall' | 'stairs'
  | 'car' | 'motorcycle' | 'bicycle'
  | 'text-label' | 'arrow' | 'line' | 'freehand' | 'room-label';

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

export interface Measurement {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface EvidenceItem {
  id: string;
  letter: string;
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
  incident: string;
  sketchBy: string;
}

export type ToolType = 'select' | 'pan' | 'wall' | 'line' | 'arrow' | 'freehand' | 'text' | 'measure' | 'room-label';

// Snapshot of undoable state
interface SceneSnapshot {
  objects: SceneObject[];
  evidence: EvidenceItem[];
  measurements: Measurement[];
  walls: WallSegment[];
}

interface SceneState {
  objects: SceneObject[];
  evidence: EvidenceItem[];
  measurements: Measurement[];
  walls: WallSegment[];
  caseInfo: CaseInfo;
  selectedObjectId: string | null;
  activeTool: ToolType;
  showGrid: boolean;
  snapToGrid: boolean;
  showLegend: boolean;
  zoom: number;
  isDark: boolean;
  canUndo: boolean;
  canRedo: boolean;
  addObject: (obj: Omit<SceneObject, 'id'>) => string;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  updateObjectSilent: (id: string, updates: Partial<SceneObject>) => void;
  removeObject: (id: string) => void;
  selectObject: (id: string | null) => void;
  setTool: (tool: ToolType) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleLegend: () => void;
  setZoom: (z: number) => void;
  toggleDark: () => void;
  setCaseInfo: (info: Partial<CaseInfo>) => void;
  addEvidence: (objectId: string, description: string) => void;
  updateEvidence: (id: string, updates: Partial<EvidenceItem>) => void;
  addMeasurement: (m: Omit<Measurement, 'id'>) => void;
  removeMeasurement: (id: string) => void;
  addWall: (w: Omit<WallSegment, 'id'>) => void;
  removeWall: (id: string) => void;
  undo: () => void;
  redo: () => void;
}

const SceneContext = createContext<SceneState | null>(null);

let nextId = 1;
let nextMeasurement = 1;
let nextWall = 1;

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_HISTORY = 50;

export function SceneProvider({ children }: { children: ReactNode }) {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [caseInfo, setCaseInfoState] = useState<CaseInfo>({
    caseNumber: '',
    investigator: '',
    location: '',
    dateTime: new Date().toISOString().slice(0, 16),
    sceneType: 'indoor',
    incident: '',
    sketchBy: '',
  });
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ToolType>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isDark, setIsDark] = useState(true);

  // Undo/redo history
  const undoStack = useRef<SceneSnapshot[]>([]);
  const redoStack = useRef<SceneSnapshot[]>([]);
  const [historyVersion, setHistoryVersion] = useState(0); // trigger re-renders for canUndo/canRedo

  const takeSnapshot = (): SceneSnapshot => ({
    objects: [...objects],
    evidence: [...evidence],
    measurements: [...measurements],
    walls: [...walls],
  });

  // We need current refs for snapshot inside callbacks
  const objectsRef = useRef(objects);
  const evidenceRef = useRef(evidence);
  const measurementsRef = useRef(measurements);
  const wallsRef = useRef(walls);
  objectsRef.current = objects;
  evidenceRef.current = evidence;
  measurementsRef.current = measurements;
  wallsRef.current = walls;

  const pushUndo = useCallback(() => {
    const snapshot: SceneSnapshot = {
      objects: [...objectsRef.current],
      evidence: [...evidenceRef.current],
      measurements: [...measurementsRef.current],
      walls: [...wallsRef.current],
    };
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
    redoStack.current = [];
    setHistoryVersion(v => v + 1);
  }, []);

  const applySnapshot = useCallback((snap: SceneSnapshot) => {
    setObjects(snap.objects);
    setEvidence(snap.evidence);
    setMeasurements(snap.measurements);
    setWalls(snap.walls);
  }, []);

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return;
    const currentSnap: SceneSnapshot = {
      objects: objectsRef.current,
      evidence: evidenceRef.current,
      measurements: measurementsRef.current,
      walls: wallsRef.current,
    };
    redoStack.current.push(currentSnap);
    const prev = undoStack.current.pop()!;
    applySnapshot(prev);
    setHistoryVersion(v => v + 1);
  }, [applySnapshot]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return;
    const currentSnap: SceneSnapshot = {
      objects: objectsRef.current,
      evidence: evidenceRef.current,
      measurements: measurementsRef.current,
      walls: wallsRef.current,
    };
    undoStack.current.push(currentSnap);
    const next = redoStack.current.pop()!;
    applySnapshot(next);
    setHistoryVersion(v => v + 1);
  }, [applySnapshot]);

  const addObject = useCallback((obj: Omit<SceneObject, 'id'>) => {
    pushUndo();
    const id = `obj-${nextId++}`;
    setObjects(prev => [...prev, { ...obj, id }]);
    return id;
  }, [pushUndo]);

  // updateObject without undo (for drag moves - undo is pushed on dragStart)
  const updateObjectSilent = useCallback((id: string, updates: Partial<SceneObject>) => {
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const updateObject = useCallback((id: string, updates: Partial<SceneObject>) => {
    pushUndo();
    setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, [pushUndo]);

  const removeObject = useCallback((id: string) => {
    pushUndo();
    setObjects(prev => prev.filter(o => o.id !== id));
    setEvidence(prev => prev.filter(e => e.objectId !== id));
    setSelectedObjectId(prev => prev === id ? null : prev);
  }, [pushUndo]);

  const selectObject = useCallback((id: string | null) => {
    setSelectedObjectId(id);
  }, []);

  const addEvidence = useCallback((objectId: string, description: string) => {
    pushUndo();
    setEvidence(prev => {
      const letterIndex = prev.length;
      const letter = letterIndex < 26 ? LETTERS[letterIndex] : `${LETTERS[Math.floor(letterIndex / 26) - 1]}${LETTERS[letterIndex % 26]}`;
      const obj = objectsRef.current.find(o => o.id === objectId);
      const newEvidence: EvidenceItem = {
        id: `ev-${objectId}`,
        letter,
        objectId,
        description,
        notes: '',
        location: obj ? `(${Math.round(obj.x)}, ${Math.round(obj.y)})` : '',
        timeLogged: new Date().toLocaleTimeString(),
      };
      setObjects(objs => objs.map(o => o.id === objectId ? { ...o, evidenceId: letter } : o));
      return [...prev, newEvidence];
    });
  }, [pushUndo]);

  // Evidence note updates don't push undo (too granular)
  const updateEvidence = useCallback((id: string, updates: Partial<EvidenceItem>) => {
    setEvidence(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  }, []);

  const addMeasurement = useCallback((m: Omit<Measurement, 'id'>) => {
    pushUndo();
    const id = `meas-${nextMeasurement++}`;
    setMeasurements(prev => [...prev, { ...m, id }]);
  }, [pushUndo]);

  const removeMeasurement = useCallback((id: string) => {
    pushUndo();
    setMeasurements(prev => prev.filter(m => m.id !== id));
  }, [pushUndo]);

  const addWall = useCallback((w: Omit<WallSegment, 'id'>) => {
    pushUndo();
    const id = `wall-${nextWall++}`;
    setWalls(prev => [...prev, { ...w, id }]);
  }, [pushUndo]);

  const removeWall = useCallback((id: string) => {
    pushUndo();
    setWalls(prev => prev.filter(w => w.id !== id));
  }, [pushUndo]);

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

  const toggleGrid = useCallback(() => setShowGrid(p => !p), []);
  const toggleLegend = useCallback(() => setShowLegend(p => !p), []);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return (
    <SceneContext.Provider value={{
      objects, evidence, measurements, walls, caseInfo, selectedObjectId, activeTool,
      showGrid, snapToGrid, showLegend, zoom, isDark,
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
      addObject, updateObject, updateObjectSilent, removeObject, selectObject,
      setTool: setActiveTool, toggleGrid, toggleSnap: () => setSnapToGrid(p => !p),
      toggleLegend, setZoom, toggleDark, setCaseInfo, addEvidence, updateEvidence,
      addMeasurement, removeMeasurement, addWall, removeWall,
      undo, redo,
    }}>
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useScene must be used within SceneProvider');
  return ctx;
}
