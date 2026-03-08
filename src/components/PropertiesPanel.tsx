import { useScene } from '@/store/SceneContext';
import { Trash2, Tag, Ruler } from 'lucide-react';

const PIXELS_PER_UNIT = 20;

export default function PropertiesPanel() {
  const { objects, selectedObjectId, updateObject, removeObject, evidence, addEvidence, updateEvidence, selectObject, measurements, removeMeasurement } = useScene();
  const selectedObj = objects.find(o => o.id === selectedObjectId);

  return (
    <div className="w-64 bg-card border-l border-border flex flex-col h-full">
      {/* Properties */}
      <div className="border-b border-border p-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Properties</h2>
        {selectedObj ? (
          <div className="space-y-2.5">
            <div>
              <label className="text-[10px] text-muted-foreground uppercase">Label</label>
              <input
                className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedObj.label}
                onChange={e => updateObject(selectedObj.id, { label: e.target.value })}
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
                <label className="text-[10px] text-muted-foreground uppercase">Rotation</label>
                <input type="number" className="w-full bg-secondary text-foreground text-xs rounded-md px-2 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-ring font-mono"
                  value={Math.round(selectedObj.rotation)} onChange={e => updateObject(selectedObj.id, { rotation: +e.target.value })} />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase">Color</label>
                <input type="color" className="w-full h-7 rounded-md border border-border cursor-pointer"
                  value={selectedObj.color} onChange={e => updateObject(selectedObj.id, { color: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              {!selectedObj.evidenceId && (
                <button
                  onClick={() => addEvidence(selectedObj.id, selectedObj.label)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-evidence-marker text-accent-foreground rounded-md py-1.5 hover:opacity-90 transition-opacity font-medium"
                >
                  <Tag className="h-3 w-3" /> Mark Evidence
                </button>
              )}
              {selectedObj.evidenceId && (
                <div className="flex-1 flex items-center gap-1 text-xs text-foreground bg-secondary rounded-md py-1.5 px-2 font-mono">
                  <span className="font-bold text-evidence-marker">{selectedObj.evidenceId}</span>
                  <span className="text-muted-foreground">— Evidence</span>
                </div>
              )}
              <button
                onClick={() => removeObject(selectedObj.id)}
                className="flex items-center justify-center gap-1 text-xs bg-destructive text-destructive-foreground rounded-md py-1.5 px-3 hover:opacity-90 transition-opacity"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Select an object to edit properties</p>
        )}
      </div>

      {/* Evidence Log */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Evidence Log</h2>
        {evidence.length === 0 ? (
          <p className="text-xs text-muted-foreground">No evidence logged yet</p>
        ) : (
          <div className="space-y-2">
            {evidence.map(ev => (
              <button
                key={ev.id}
                onClick={() => selectObject(ev.objectId)}
                className={`w-full text-left p-2 rounded-md border transition-colors ${
                  selectedObjectId === ev.objectId
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/30 hover:bg-secondary/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold bg-evidence-marker text-accent-foreground w-6 h-6 flex items-center justify-center rounded">{ev.letter}</span>
                  <span className="text-xs font-medium text-foreground truncate">{ev.description}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {ev.location} · {ev.timeLogged}
                </div>
                <input
                  className="mt-1 w-full bg-secondary/50 text-foreground text-[10px] rounded px-1.5 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
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
    </div>
  );
}
