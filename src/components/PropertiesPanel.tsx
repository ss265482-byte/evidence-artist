import { useState } from 'react';
import { useScene, EvidencePriority, EvidenceStatus } from '@/store/SceneContext';
import { Trash2, Tag, Ruler, Copy, RotateCw, Layers, Lock, Unlock, ChevronsUp, ChevronsDown, ArrowUp, ArrowDown, Eye, Filter, AlertTriangle, CheckCircle2, Clock, FlaskConical, Camera } from 'lucide-react';

const PIXELS_PER_UNIT = 20;

const priorityConfig: Record<EvidencePriority, { label: string; color: string; bg: string }> = {
  critical: { label: 'CRIT', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  high: { label: 'HIGH', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/30' },
  medium: { label: 'MED', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  low: { label: 'LOW', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
};

const statusConfig: Record<EvidenceStatus, { label: string; icon: React.ElementType; color: string }> = {
  'identified': { label: 'Identified', icon: AlertTriangle, color: 'text-yellow-400' },
  'photographed': { label: 'Photographed', icon: Camera, color: 'text-blue-400' },
  'collected': { label: 'Collected', icon: CheckCircle2, color: 'text-green-400' },
  'processed': { label: 'Processed', icon: Clock, color: 'text-purple-400' },
  'sent-to-lab': { label: 'Sent to Lab', icon: FlaskConical, color: 'text-cyan-400' },
};

export default function PropertiesPanel() {
  const {
    objects, selectedObjectId, updateObject, removeObject, addObject, evidence,
    addEvidence, updateEvidence, selectObject, measurements, removeMeasurement, walls,
    bringToFront, sendToBack, moveLayerUp, moveLayerDown,
  } = useScene();
  const [evidenceFilter, setEvidenceFilter] = useState<'all' | EvidencePriority>('all');
  const selectedObj = objects.find(o => o.id === selectedObjectId);
  const selectedIndex = objects.findIndex(o => o.id === selectedObjectId);

  const handleDuplicate = () => {
    if (!selectedObj) return;
    const newId = addObject({
      type: selectedObj.type, x: selectedObj.x + 20, y: selectedObj.y + 20,
      width: selectedObj.width, height: selectedObj.height, rotation: selectedObj.rotation,
      label: selectedObj.label + ' (copy)', color: selectedObj.color, category: selectedObj.category,
      opacity: selectedObj.opacity, locked: false,
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
            {/* Object type badge + lock */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono bg-secondary text-muted-foreground px-1.5 py-0.5 rounded uppercase">{selectedObj.type}</span>
              <span className="text-[9px] font-mono text-muted-foreground/40">#{selectedObj.id}</span>
              <button
                onClick={() => updateObject(selectedObj.id, { locked: !selectedObj.locked })}
                className={`ml-auto h-5 w-5 flex items-center justify-center rounded transition-colors ${
                  selectedObj.locked ? 'text-destructive bg-destructive/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
                title={selectedObj.locked ? 'Unlock' : 'Lock'}
              >
                {selectedObj.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              </button>
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

            {/* Rotation + Color */}
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
                <button key={deg} onClick={() => updateObject(selectedObj.id, { rotation: deg })}
                  className={`flex-1 text-[9px] font-mono py-1 rounded transition-colors ${
                    Math.round(selectedObj.rotation) === deg
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                  }`}
                >{deg}°</button>
              ))}
            </div>

            {/* Opacity slider */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Eye className="h-2.5 w-2.5" /> Opacity
                <span className="ml-auto font-mono text-foreground">{Math.round((selectedObj.opacity ?? 1) * 100)}%</span>
              </label>
              <input
                type="range" min="0.1" max="1" step="0.05"
                value={selectedObj.opacity ?? 1}
                onChange={e => updateObject(selectedObj.id, { opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 mt-1 accent-primary cursor-pointer"
              />
            </div>

            {/* Layer ordering */}
            <div>
              <label className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mb-1">
                <Layers className="h-2.5 w-2.5" /> Layer {selectedIndex + 1}/{objects.length}
              </label>
              <div className="flex gap-1">
                <button onClick={() => sendToBack(selectedObj.id)} title="Send to Back"
                  className="flex-1 flex items-center justify-center py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors text-[9px]">
                  <ChevronsDown className="h-3 w-3" />
                </button>
                <button onClick={() => moveLayerDown(selectedObj.id)} title="Move Down"
                  className="flex-1 flex items-center justify-center py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors text-[9px]">
                  <ArrowDown className="h-3 w-3" />
                </button>
                <button onClick={() => moveLayerUp(selectedObj.id)} title="Move Up"
                  className="flex-1 flex items-center justify-center py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors text-[9px]">
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button onClick={() => bringToFront(selectedObj.id)} title="Bring to Front"
                  className="flex-1 flex items-center justify-center py-1 rounded bg-secondary text-muted-foreground hover:text-foreground transition-colors text-[9px]">
                  <ChevronsUp className="h-3 w-3" />
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {!selectedObj.evidenceId && (
                <button onClick={() => addEvidence(selectedObj.id, selectedObj.label)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs bg-accent text-accent-foreground rounded-md py-1.5 hover:opacity-90 transition-opacity font-medium">
                  <Tag className="h-3 w-3" /> Mark Evidence
                </button>
              )}
              {selectedObj.evidenceId && (
                <div className="flex-1 flex items-center gap-1 text-xs text-foreground bg-secondary rounded-md py-1.5 px-2 font-mono">
                  <span className="font-bold text-accent">{selectedObj.evidenceId}</span>
                  <span className="text-muted-foreground">— Evidence</span>
                </div>
              )}
              <button onClick={handleDuplicate} title="Duplicate"
                className="flex items-center justify-center gap-1 text-xs bg-secondary text-secondary-foreground rounded-md py-1.5 px-3 hover:opacity-90 transition-opacity">
                <Copy className="h-3 w-3" />
              </button>
              <button onClick={() => removeObject(selectedObj.id)}
                className="flex items-center justify-center gap-1 text-xs bg-destructive text-destructive-foreground rounded-md py-1.5 px-3 hover:opacity-90 transition-opacity">
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

        {/* Filter bar */}
        {evidence.length > 0 && (
          <div className="flex gap-1 mb-2 flex-wrap">
            <button
              onClick={() => setEvidenceFilter('all')}
              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${evidenceFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-muted-foreground border-border hover:text-foreground'}`}
            >All</button>
            {(['critical', 'high', 'medium', 'low'] as EvidencePriority[]).map(p => {
              const count = evidence.filter(e => e.priority === p).length;
              if (count === 0) return null;
              return (
                <button key={p} onClick={() => setEvidenceFilter(p)}
                  className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${evidenceFilter === p ? `${priorityConfig[p].bg} ${priorityConfig[p].color}` : 'bg-secondary text-muted-foreground border-border hover:text-foreground'}`}
                >{priorityConfig[p].label} ({count})</button>
              );
            })}
          </div>
        )}

        {evidence.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">No evidence logged</p>
            <p className="text-[10px] text-muted-foreground/50 mt-1">Select an object → Mark Evidence</p>
          </div>
        ) : (
          <div className="space-y-2">
            {evidence
              .filter(ev => evidenceFilter === 'all' || ev.priority === evidenceFilter)
              .map(ev => {
              const prio = priorityConfig[ev.priority];
              const stat = statusConfig[ev.status];
              const StatusIcon = stat.icon;
              return (
                <button key={ev.id} onClick={() => selectObject(ev.objectId)}
                  className={`w-full text-left p-2 rounded-md border transition-all ${
                    selectedObjectId === ev.objectId
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border bg-secondary/30 hover:bg-secondary/60 hover:shadow-sm'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold bg-accent text-accent-foreground w-6 h-6 flex items-center justify-center rounded">{ev.letter}</span>
                    <span className="text-xs font-medium text-foreground truncate flex-1">{ev.description}</span>
                    <span className={`text-[8px] font-mono font-bold px-1 py-0.5 rounded border ${prio.bg} ${prio.color}`}>{prio.label}</span>
                  </div>

                  {/* Status row */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <StatusIcon className={`h-3 w-3 ${stat.color}`} />
                    <select
                      value={ev.status}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateEvidence(ev.id, { status: e.target.value as EvidenceStatus }); }}
                      className="text-[10px] bg-secondary border border-border rounded px-1 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {Object.entries(statusConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                    <select
                      value={ev.priority}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); updateEvidence(ev.id, { priority: e.target.value as EvidencePriority }); }}
                      className="text-[10px] bg-secondary border border-border rounded px-1 py-0.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                    >
                      {Object.entries(priorityConfig).map(([key, val]) => (
                        <option key={key} value={key}>{val.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                    <span>{ev.location}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span>{ev.timeLogged}</span>
                    {ev.collectedBy && (
                      <>
                        <span className="text-muted-foreground/30">·</span>
                        <span>by {ev.collectedBy}</span>
                      </>
                    )}
                  </div>
                  <input
                    className="mt-1.5 w-full bg-secondary/50 text-foreground text-[10px] rounded px-1.5 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    placeholder="Add notes..."
                    value={ev.notes}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateEvidence(ev.id, { notes: e.target.value })}
                  />
                  <input
                    className="mt-1 w-full bg-secondary/50 text-foreground text-[10px] rounded px-1.5 py-1 border border-border focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                    placeholder="Collected by..."
                    value={ev.collectedBy}
                    onClick={e => e.stopPropagation()}
                    onChange={e => updateEvidence(ev.id, { collectedBy: e.target.value })}
                  />
                </button>
              );
            })}
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
              if (m.type === 'angle') {
                const vx = m.x1, vy = m.y1, ax = m.x2, ay = m.y2, bx = m.x3 ?? m.x2, by = m.y3 ?? m.y2;
                const a1 = Math.atan2(ay - vy, ax - vx);
                const a2 = Math.atan2(by - vy, bx - vx);
                let deg = ((a2 - a1) * 180) / Math.PI;
                if (deg < 0) deg += 360;
                if (deg > 180) deg = 360 - deg;
                return (
                  <div key={m.id} className="flex items-center justify-between p-1.5 rounded bg-secondary/30 border border-border">
                    <div>
                      <span className="text-[9px] font-mono text-orange-400 bg-orange-500/10 px-1 rounded mr-1.5">∠</span>
                      <span className="text-xs font-mono text-orange-400 font-medium">{deg.toFixed(1)}°</span>
                    </div>
                    <button onClick={() => removeMeasurement(m.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
              if (m.type === 'arc') {
                const sx = m.x1, sy = m.y1, ex = m.x2, ey = m.y2, cx = m.x3 ?? (sx+ex)/2, cy = m.y3 ?? (sy+ey)/2;
                let arcLen = 0; let px = sx, py = sy;
                for (let i = 1; i <= 40; i++) {
                  const t = i / 40;
                  const x = (1-t)*(1-t)*sx + 2*(1-t)*t*cx + t*t*ex;
                  const y = (1-t)*(1-t)*sy + 2*(1-t)*t*cy + t*t*ey;
                  arcLen += Math.sqrt((x-px)**2 + (y-py)**2);
                  px = x; py = y;
                }
                const distUnits = (arcLen / PIXELS_PER_UNIT).toFixed(1);
                return (
                  <div key={m.id} className="flex items-center justify-between p-1.5 rounded bg-secondary/30 border border-border">
                    <div>
                      <span className="text-[9px] font-mono text-purple-400 bg-purple-500/10 px-1 rounded mr-1.5">⌒</span>
                      <span className="text-xs font-mono text-purple-400 font-medium">{distUnits}'</span>
                    </div>
                    <button onClick={() => removeMeasurement(m.id)} className="text-destructive hover:opacity-70">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                );
              }
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
