import { useScene } from '@/store/SceneContext';
import { Trash2, Tag, Ruler, Copy, RotateCw, Layers } from 'lucide-react';

const PIXELS_PER_UNIT = 20;

export default function PropertiesPanel() {
  const { objects, selectedObjectId, updateObject, removeObject, addObject, evidence, addEvidence, updateEvidence, selectObject, measurements, removeMeasurement, walls } = useScene();
  const selectedObj = objects.find(o => o.id === selectedObjectId);
  const selectedIndex = objects.findIndex(o => o.id === selectedObjectId);

  const handleDuplicate = () => {
    if (!selectedObj) return;
    const newId = addObject({
      type: selectedObj.type, x: selectedObj.x + 20, y: selectedObj.y + 20,
      width: selectedObj.width, height: selectedObj.height, rotation: selectedObj.rotation,
      label: selectedObj.label + ' (copy)', color: selectedObj.color, category: selectedObj.category,
    });
    selectObject(newId);
  };

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col h-full">
      {/* Properties */}
      <div className="border-b border-border p-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Layers className="h-3 w-3" /> Properties
        </h2>
        {selectedObj ? (
          <div className="space-y-2.5">
            {/* Object type badge */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase">{selectedObj.type}</span>
              <span className="text-[9px] font-mono text-muted-foreground/40">#{selectedObj.id}</span>
              {selectedIndex >= 0 && (
                <span className="text-[9px] font-mono text-muted-foreground/40 ml-auto">Layer {selectedIndex + 1}/{objects.length}</span>
              )}
            </div>

            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Label</label>
              <input
                className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedObj.label}
                onChange={e => updateObject(selectedObj.id, { label: e.target.value })}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Notes</label>
              <textarea
                className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring resize-none h-12 placeholder:text-muted-foreground"
                placeholder="Add notes about this object..."
                value={selectedObj.notes || ''}
                onChange={e => updateObject(selectedObj.id, { notes: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">X</label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.x)} onChange={e => updateObject(selectedObj.id, { x: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Y</label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.y)} onChange={e => updateObject(selectedObj.id, { y: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">W</label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.width)} onChange={e => updateObject(selectedObj.id, { width: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">H</label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.height)} onChange={e => updateObject(selectedObj.id, { height: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                  <RotateCw className="h-2.5 w-2.5" /> Rotation
                </label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.rotation)} onChange={e => updateObject(selectedObj.id, { rotation: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Color</label>
                <div className="flex items-center gap-1.5">
                  <input type="color" className="w-8 h-7 rounded border border-border cursor-pointer shrink-0"
                    value={selectedObj.color} onChange={e => updateObject(selectedObj.id, { color: e.target.value })} />
                  <input className="flex-1 bg-secondary text-foreground text-[10px] rounded px-1.5 py-1 border border-border font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                    value={selectedObj.color} onChange={e => updateObject(selectedObj.id, { color: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Quick rotation presets */}
            <div className="flex gap-1">
              {[0, 45, 90, 180, 270].map(deg => (
                <button
                  key={deg}
                  onClick={() => updateObject(selectedObj.id, { rotation: deg })}
                  className={`flex-1 text-[9px] font-mono py-1 rounded transition-colors ${
                    Math.round(selectedObj.rotation) === deg
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {!selectedObj.evidenceId && (
                <button
                  onClick={() => addEvidence(selectedObj.id, selectedObj.label)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-accent text-accent-foreground rounded-md py-1.5 hover:opacity-90 transition-opacity font-medium"
                >
                  <Tag className="h-3 w-3" /> Mark Evidence
                </button>
              )}
              {selectedObj.evidenceId && (
                <div className="flex-1 flex items-center gap-1 text-xs text-foreground bg-secondary rounded-md py-1.5 px-2 font-mono">
                  <span className="font-bold text-accent">{selectedObj.evidenceId}</span>
                  <span className="text-muted-foreground">— Evidence</span>
                </div>
              )}
              <button
                onClick={handleDuplicate}
                title="Duplicate"
                className="flex items-center justify-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-md py-1.5 px-3 hover:opacity-90 transition-opacity"
              >
                <Copy className="h-3 w-3" />
              </button>
              <button
                onClick={() => removeObject(selectedObj.id)}
                className="flex items-center justify-center gap-1 text-xs bg-destructive text-destructive-foreground rounded-md py-1.5 px-3 hover:opacity-90 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">Select an object to edit</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Click on canvas or right-click for options</p>
          </div>
        )}
      </div>

      {/* Evidence Log */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evidence Log</h2>
          {evidence.length > 0 && (
            <span className="text-[9px] font-mono bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-bold">{evidence.length}</span>
          )}
        </div>
        {evidence.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No evidence logged</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Select an object → Mark Evidence</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidence.map(ev => (
              <button
                key={ev.id}
                onClick={() => selectObject(ev.objectId)}
                className={`w-full text-left p-2 rounded-md border transition-all ${
                  selectedObjectId === ev.objectId
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border bg-secondary/30 hover:bg-secondary/60 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold bg-accent text-accent-foreground w-6 h-6 flex items-center justify-center rounded">{ev.letter}</span>
                  <span className="text-xs font-medium text-foreground truncate flex-1">{ev.description}</span>
                </div>
                <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                  <span>{ev.location}</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{ev.timeLogged}</span>
                </div>
                <input
                  className="mt-1.5 w-full bg-secondary/50 text-foreground text-[10px] rounded px-1.5 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                  placeholder="Add notes..."
                  value={ev.notes}
                  onClick={e => e.stopPropagation()}
                  onChange={e => updateEvidence(ev.id, { notes: e.target.value })}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Measurements */}
      {measurements.length > 0 && (
        <div className="border-t border-border p-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <Ruler className="h-3 w-3" /> Measurements
            <span className="ml-auto text-[9px] font-mono text-muted-foreground/40">{measurements.length}</span>
          </h2>
          <div className="space-y-1.5">
            {measurements.map(m => {
              const dist = (Math.sqrt(Math.pow(m.x2 - m.x1, 2) + Math.pow(m.y2 - m.y1, 2)) / PIXELS_PER_UNIT).toFixed(1);
              return (
                <div key={m.id} className="flex items-center justify-between p-1.5 rounded bg-secondary/30 border border-border">
                  <div>
                    <span className="text-xs font-mono text-[#22d3ee] font-medium">{dist}'</span>
                    <span className="text-[10px] text-muted-foreground ml-2">
                      ({Math.round(m.x1)},{Math.round(m.y1)}) → ({Math.round(m.x2)},{Math.round(m.y2)})
                    </span>
                  </div>
                  <button onClick={() => removeMeasurement(m.id)} className="text-destructive hover:opacity-70">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scene summary */}
      <div className="border-t border-border p-3">
        <h2 className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-1">Scene Summary</h2>
        <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-muted-foreground">
          <div className="bg-secondary/30 rounded px-1.5 py-1 text-center">
            <div className="text-foreground font-bold">{objects.length}</div>
            <div>objects</div>
          </div>
          <div className="bg-secondary/30 rounded px-1.5 py-1 text-center">
            <div className="text-foreground font-bold">{walls.length}</div>
            <div>walls</div>
          </div>
          <div className="bg-secondary/30 rounded px-1.5 py-1 text-center">
            <div className="text-foreground font-bold">{evidence.length}</div>
            <div>evidence</div>
          </div>
        </div>
      </div>
    </div>
  );
}
