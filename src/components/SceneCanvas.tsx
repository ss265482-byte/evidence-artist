import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line, Circle, Group, Transformer } from 'react-konva';
import { useScene, SceneObject, Measurement, WallSegment } from '@/store/SceneContext';
import Konva from 'konva';

const GRID_SIZE = 20;
const PIXELS_PER_UNIT = 20;

function GridLayer({ width, height, zoom }: { width: number; height: number; zoom: number }) {
  const lines: React.ReactElement[] = [];
  const step = GRID_SIZE;
  const w = width / zoom + step;
  const h = height / zoom + step;
  for (let i = 0; i <= w / step; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * step, 0, i * step, h]} stroke="hsl(220, 15%, 82%)" strokeWidth={0.5} opacity={0.4} />);
  }
  for (let i = 0; i <= h / step; i++) {
    lines.push(<Line key={`h-${i}`} points={[0, i * step, w, i * step]} stroke="hsl(220, 15%, 82%)" strokeWidth={0.5} opacity={0.4} />);
  }
  return <>{lines}</>;
}

function MeasurementLine({ m, onRemove }: { m: Measurement; onRemove: () => void }) {
  const dx = m.x2 - m.x1;
  const dy = m.y2 - m.y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distUnits = (dist / PIXELS_PER_UNIT).toFixed(1);
  const midX = (m.x1 + m.x2) / 2;
  const midY = (m.y1 + m.y2) / 2;
  const len = dist || 1;
  const perpX = (-dy / len) * 6;
  const perpY = (dx / len) * 6;

  return (
    <Group>
      <Line points={[m.x1, m.y1, m.x2, m.y2]} stroke="#22d3ee" strokeWidth={1.5} dash={[6, 3]} />
      <Line points={[m.x1 + perpX, m.y1 + perpY, m.x1 - perpX, m.y1 - perpY]} stroke="#22d3ee" strokeWidth={2} />
      <Line points={[m.x2 + perpX, m.y2 + perpY, m.x2 - perpX, m.y2 - perpY]} stroke="#22d3ee" strokeWidth={2} />
      <Circle x={m.x1} y={m.y1} radius={4} fill="#22d3ee" />
      <Circle x={m.x2} y={m.y2} radius={4} fill="#22d3ee" />
      <Group x={midX} y={midY}>
        <Rect x={-30} y={-22} width={60} height={18} fill="hsl(225, 22%, 11%)" stroke="#22d3ee" strokeWidth={1} cornerRadius={3} opacity={0.9} />
        <Text x={-30} y={-20} width={60} text={`${distUnits}'`} fontSize={11} fontFamily="JetBrains Mono, monospace" fill="#22d3ee" align="center" />
      </Group>
      <Group x={midX + 35} y={midY - 22} onClick={onRemove} onTap={onRemove}>
        <Circle radius={7} fill="#ef4444" opacity={0.8} />
        <Text x={-4} y={-5} text="×" fontSize={10} fill="#fff" fontStyle="bold" />
      </Group>
    </Group>
  );
}

function WallLine({ w, onRemove }: { w: WallSegment; onRemove: () => void }) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distUnits = (dist / PIXELS_PER_UNIT).toFixed(1);
  const midX = (w.x1 + w.x2) / 2;
  const midY = (w.y1 + w.y2) / 2;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const len = dist || 1;
  const perpX = (-dy / len) * 12;
  const perpY = (dx / len) * 12;

  return (
    <Group>
      {/* Main wall line */}
      <Line points={[w.x1, w.y1, w.x2, w.y2]} stroke="#a3a3a3" strokeWidth={w.thickness} lineCap="round" />
      {/* Wall edge lines */}
      <Line points={[w.x1, w.y1, w.x2, w.y2]} stroke="#737373" strokeWidth={w.thickness + 2} opacity={0.3} lineCap="round" />
      {/* Endpoint indicators */}
      <Circle x={w.x1} y={w.y1} radius={3} fill="#d4d4d4" />
      <Circle x={w.x2} y={w.y2} radius={3} fill="#d4d4d4" />
      {/* Dimension label */}
      <Group x={midX + perpX} y={midY + perpY}>
        <Rect x={-24} y={-9} width={48} height={18} fill="hsl(225, 22%, 11%)" stroke="#737373" strokeWidth={0.5} cornerRadius={3} opacity={0.9} />
        <Text x={-24} y={-7} width={48} text={`${distUnits}'`} fontSize={10} fontFamily="JetBrains Mono, monospace" fill="#d4d4d4" align="center" />
      </Group>
      {/* Delete button */}
      <Group x={midX - perpX} y={midY - perpY} onClick={onRemove} onTap={onRemove}>
        <Circle radius={6} fill="#ef4444" opacity={0.7} />
        <Text x={-3} y={-5} text="×" fontSize={9} fill="#fff" fontStyle="bold" />
      </Group>
    </Group>
  );
}

function CanvasLegend({ x, y }: { x: number; y: number }) {
  const { evidence, caseInfo } = useScene();
  if (evidence.length === 0 && !caseInfo.location) return null;

  const lineHeight = 16;
  const padding = 12;
  const headerH = caseInfo.location || caseInfo.caseNumber ? 80 : 0;
  const legendH = evidence.length * lineHeight + padding * 2 + (evidence.length > 0 ? 20 : 0) + headerH;
  const legendW = 180;

  return (
    <Group x={x} y={y} draggable>
      <Rect width={legendW} height={legendH} fill="hsl(225, 22%, 11%)" stroke="#475569" strokeWidth={1} cornerRadius={4} opacity={0.95} />

      {/* Case info header */}
      {(caseInfo.location || caseInfo.caseNumber) && (
        <>
          {caseInfo.location && (
            <Text x={padding} y={padding} text={`Location: ${caseInfo.location}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />
          )}
          {caseInfo.dateTime && (
            <Text x={padding} y={padding + 14} text={`Date: ${caseInfo.dateTime}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />
          )}
          {caseInfo.incident && (
            <Text x={padding} y={padding + 28} text={`Incident: ${caseInfo.incident}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />
          )}
          {caseInfo.sketchBy && (
            <Text x={padding} y={padding + 42} text={`Sketch by: ${caseInfo.sketchBy}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />
          )}
          <Line points={[padding, headerH - 8, legendW - padding, headerH - 8]} stroke="#475569" strokeWidth={0.5} />
        </>
      )}

      {/* Evidence key */}
      {evidence.length > 0 && (
        <>
          <Text x={padding} y={headerH + padding - 4} text="EVIDENCE KEY" fontSize={9} fill="#94a3b8" fontStyle="bold" letterSpacing={1} />
          {evidence.map((ev, i) => (
            <React.Fragment key={ev.id}>
              <Text
                x={padding}
                y={headerH + padding + 14 + i * lineHeight}
                text={`${ev.letter} -`}
                fontSize={11}
                fill="#eab308"
                fontStyle="bold"
                fontFamily="JetBrains Mono, monospace"
              />
              <Text
                x={padding + 28}
                y={headerH + padding + 14 + i * lineHeight}
                text={ev.description}
                fontSize={10}
                fill="#e2e8f0"
                fontFamily="Inter, sans-serif"
                width={legendW - padding * 2 - 28}
              />
            </React.Fragment>
          ))}
        </>
      )}
    </Group>
  );
}

function SceneObjectShape({ obj, isSelected, onSelect }: {
  obj: SceneObject; isSelected: boolean; onSelect: () => void;
}) {
  const { updateObject, snapToGrid } = useScene();
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const snapPos = (val: number) => snapToGrid ? Math.round(val / GRID_SIZE) * GRID_SIZE : val;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    updateObject(obj.id, { x: snapPos(e.target.x()), y: snapPos(e.target.y()) });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateObject(obj.id, {
      x: snapPos(node.x()), y: snapPos(node.y()),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const c = obj.color || '#3b82f6';

  const renderShape = () => {
    switch (obj.type) {
      case 'body-outline':
        return (
          <>
            <Rect width={obj.width} height={obj.height} fill="transparent" stroke={c} strokeWidth={2} dash={[5, 3]} cornerRadius={4} />
            <Circle x={obj.width / 2} y={15} radius={12} stroke={c} strokeWidth={2} />
            <Line points={[obj.width / 2, 27, obj.width / 2, 75]} stroke={c} strokeWidth={2} />
            <Line points={[10, 45, obj.width - 10, 45]} stroke={c} strokeWidth={2} />
            <Line points={[obj.width / 2, 75, 15, obj.height - 5]} stroke={c} strokeWidth={2} />
            <Line points={[obj.width / 2, 75, obj.width - 15, obj.height - 5]} stroke={c} strokeWidth={2} />
          </>
        );
      case 'evidence-marker':
        return (
          <>
            <Rect width={obj.width} height={obj.height} fill={c} cornerRadius={3} />
            <Text text={obj.evidenceId || '#'} x={0} y={6} width={obj.width} align="center" fontSize={14} fontStyle="bold" fill="#000" />
          </>
        );
      case 'wall':
        return <Rect width={obj.width} height={obj.height} fill={c} />;
      case 'door':
        return (
          <>
            <Rect width={obj.width} height={obj.height} fill={c} />
            <Line points={[0, obj.height, 0, obj.height + 30]} stroke={c} strokeWidth={2} dash={[4, 4]} />
          </>
        );
      case 'window':
        return (
          <>
            <Rect width={obj.width} height={obj.height} fill={c} opacity={0.5} />
            <Line points={[0, obj.height / 2, obj.width, obj.height / 2]} stroke={c} strokeWidth={1} />
          </>
        );
      case 'blood-stain':
        return <Circle x={obj.width / 2} y={obj.height / 2} radius={Math.min(obj.width, obj.height) / 2} fill={c} opacity={0.7} />;
      case 'bullet-casing':
      case 'bullet-hole':
        return <Circle x={obj.width / 2} y={obj.height / 2} radius={Math.min(obj.width, obj.height) / 2} fill={c} stroke="#000" strokeWidth={1} />;
      case 'room-label':
        return (
          <Text
            text={obj.label}
            fontSize={14}
            fontStyle="bold"
            fill="#94a3b8"
            fontFamily="Inter, sans-serif"
            width={obj.width}
            align="center"
          />
        );
      default:
        return (
          <>
            <Rect width={obj.width} height={obj.height} fill={c} opacity={0.6} stroke={c} strokeWidth={1} cornerRadius={3} />
            <Text text={obj.label} x={2} y={obj.height / 2 - 6} width={obj.width - 4} fontSize={11} fill="#fff" align="center" />
          </>
        );
    }
  };

  return (
    <>
      <Group
        ref={shapeRef}
        x={obj.x}
        y={obj.y}
        rotation={obj.rotation}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      >
        {renderShape()}
        {obj.evidenceId && obj.type !== 'evidence-marker' && (
          <Group x={obj.width + 5} y={-5}>
            <Circle radius={12} fill="#eab308" stroke="#000" strokeWidth={1} />
            <Text text={obj.evidenceId} x={-10} y={-7} fontSize={13} fontStyle="bold" fill="#000" width={20} align="center" fontFamily="JetBrains Mono, monospace" />
          </Group>
        )}
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          borderStroke="hsl(215, 80%, 55%)"
          anchorFill="hsl(215, 80%, 55%)"
          anchorStroke="#fff"
          anchorSize={8}
        />
      )}
    </>
  );
}

export default function SceneCanvas() {
  const { objects, selectedObjectId, selectObject, activeTool, showGrid, showLegend, zoom, setZoom, addObject, snapToGrid, measurements, addMeasurement, removeMeasurement, walls, addWall, removeWall, evidence } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measurePreview, setMeasurePreview] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallPreview, setWallPreview] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDims({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = { x: (pointer.x - stagePos.x) / oldScale, y: (pointer.y - stagePos.y) / oldScale };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setZoom(clampedScale);
    setStagePos({ x: pointer.x - mousePointTo.x * clampedScale, y: pointer.y - mousePointTo.y * clampedScale });
  }, [zoom, stagePos, setZoom]);

  const getCanvasPos = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    const x = (pos.x - stagePos.x) / zoom;
    const y = (pos.y - stagePos.y) / zoom;
    return snapToGrid ? { x: Math.round(x / GRID_SIZE) * GRID_SIZE, y: Math.round(y / GRID_SIZE) * GRID_SIZE } : { x, y };
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.target === e.target.getStage()) selectObject(null);

    if (activeTool === 'measure') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!measureStart) { setMeasureStart(pos); }
      else { addMeasurement({ x1: measureStart.x, y1: measureStart.y, x2: pos.x, y2: pos.y }); setMeasureStart(null); setMeasurePreview(null); }
      return;
    }

    if (activeTool === 'wall') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!wallStart) {
        setWallStart(pos);
      } else {
        addWall({ x1: wallStart.x, y1: wallStart.y, x2: pos.x, y2: pos.y, thickness: 6 });
        setWallStart(pos); // chain walls: end point becomes next start
        setWallPreview(null);
      }
    }

    if (activeTool === 'text' || activeTool === 'room-label') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      addObject({
        type: activeTool === 'room-label' ? 'room-label' : 'text-label',
        x: pos.x, y: pos.y,
        width: activeTool === 'room-label' ? 140 : 100,
        height: activeTool === 'room-label' ? 20 : 24,
        rotation: 0,
        label: activeTool === 'room-label' ? 'Room Name' : 'Label',
        color: '#94a3b8',
        category: 'Annotation',
      });
    }
  };

  const handleMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (activeTool === 'measure' && measureStart) {
      const pos = getCanvasPos(stage);
      if (pos) setMeasurePreview(pos);
    }
    if (activeTool === 'wall' && wallStart) {
      const pos = getCanvasPos(stage);
      if (pos) setWallPreview(pos);
    }
  };

  useEffect(() => {
    if (activeTool !== 'measure') { setMeasureStart(null); setMeasurePreview(null); }
    if (activeTool !== 'wall') { setWallStart(null); setWallPreview(null); }
  }, [activeTool]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/scene-object');
    if (!data) return;
    const template = JSON.parse(data);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - stagePos.x) / zoom;
    const y = (e.clientY - rect.top - stagePos.y) / zoom;
    const snapPos = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
    addObject({
      type: template.type, x: snapPos(x - template.width / 2), y: snapPos(y - template.height / 2),
      width: template.width, height: template.height, rotation: 0,
      label: template.label, color: template.color, category: template.category,
    });
  }, [addObject, zoom, stagePos, snapToGrid]);

  // Compute legend position (bottom-right of visible area)
  const legendX = (dims.width - stagePos.x) / zoom - 200;
  const legendY = 20 / zoom;

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-canvas-bg relative overflow-hidden"
      style={{ cursor: activeTool === 'measure' || activeTool === 'wall' ? 'crosshair' : activeTool === 'pan' ? 'grab' : 'default' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <Stage
        ref={stageRef}
        width={dims.width}
        height={dims.height}
        scaleX={zoom}
        scaleY={zoom}
        x={stagePos.x}
        y={stagePos.y}
        draggable={activeTool === 'pan'}
        onWheel={handleWheel}
        onClick={handleStageClick}
        onMouseMove={handleMouseMove}
        onDragEnd={(e) => { if (activeTool === 'pan') setStagePos({ x: e.target.x(), y: e.target.y() }); }}
      >
        <Layer>
          {showGrid && <GridLayer width={dims.width} height={dims.height} zoom={zoom} />}
          {objects.map(obj => (
            <SceneObjectShape key={obj.id} obj={obj} isSelected={selectedObjectId === obj.id} onSelect={() => selectObject(obj.id)} />
          ))}
          {measurements.map(m => (
            <MeasurementLine key={m.id} m={m} onRemove={() => removeMeasurement(m.id)} />
          ))}
          {walls.map(w => (
            <WallLine key={w.id} w={w} onRemove={() => removeWall(w.id)} />
          ))}
          {wallStart && wallPreview && (
            <WallLine w={{ id: 'wall-preview', x1: wallStart.x, y1: wallStart.y, x2: wallPreview.x, y2: wallPreview.y, thickness: 6 }} onRemove={() => { setWallStart(null); setWallPreview(null); }} />
          )}
          {wallStart && !wallPreview && (
            <Circle x={wallStart.x} y={wallStart.y} radius={5} fill="#a3a3a3" opacity={0.8} />
          )}
          {measureStart && measurePreview && (
            <MeasurementLine m={{ id: 'preview', x1: measureStart.x, y1: measureStart.y, x2: measurePreview.x, y2: measurePreview.y }} onRemove={() => { setMeasureStart(null); setMeasurePreview(null); }} />
          )}
          {measureStart && !measurePreview && (
            <Circle x={measureStart.x} y={measureStart.y} radius={5} fill="#22d3ee" opacity={0.8} />
          )}
          {showLegend && <CanvasLegend x={legendX} y={legendY} />}
        </Layer>
      </Stage>

      <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {Math.round(zoom * 100)}%
      </div>

      {activeTool === 'measure' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#22d3ee]" />
          {measureStart ? 'Click second point to complete measurement' : 'Click to set first measurement point'}
          {measureStart && (
            <button onClick={() => { setMeasureStart(null); setMeasurePreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Cancel</button>
          )}
        </div>
      )}

      {activeTool === 'room-label' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground">
          Click to place a room label
        </div>
      )}
    </div>
  );
}
