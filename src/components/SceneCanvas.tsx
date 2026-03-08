import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line, Circle, Group, Transformer } from 'react-konva';
import { useScene, SceneObject, Measurement, WallSegment } from '@/store/SceneContext';
import Konva from 'konva';
import { stageStore } from '@/lib/stageRef';

const GRID_SIZE = 20;
const PIXELS_PER_UNIT = 20;

function GridLayer({ width, height, zoom, isDark }: { width: number; height: number; zoom: number; isDark: boolean }) {
  const lines: React.ReactElement[] = [];
  const step = GRID_SIZE;
  const w = width / zoom + step;
  const h = height / zoom + step;
  const gridColor = isDark ? 'hsl(225, 18%, 18%)' : 'hsl(220, 15%, 82%)';
  for (let i = 0; i <= w / step; i++) {
    lines.push(<Line key={`v-${i}`} points={[i * step, 0, i * step, h]} stroke={gridColor} strokeWidth={0.5} opacity={0.5} />);
  }
  for (let i = 0; i <= h / step; i++) {
    lines.push(<Line key={`h-${i}`} points={[0, i * step, w, i * step]} stroke={gridColor} strokeWidth={0.5} opacity={0.5} />);
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
  const { updateObject, updateObjectSilent, snapToGrid } = useScene();
  const shapeRef = useRef<Konva.Group>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const snapPos = (val: number) => snapToGrid ? Math.round(val / GRID_SIZE) * GRID_SIZE : val;

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Push undo once on drag completion (not during drag)
    updateObject(obj.id, { x: snapPos(e.target.x()), y: snapPos(e.target.y()) });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    // Push undo once on transform completion
    updateObject(obj.id, {
      x: snapPos(node.x()), y: snapPos(node.y()),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const c = obj.color || '#3b82f6';
  const w = obj.width;
  const h = obj.height;

  const renderShape = () => {
    switch (obj.type) {
      // === BODIES ===
      case 'body-outline':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" stroke={c} strokeWidth={2} dash={[5, 3]} cornerRadius={4} />
            {/* Head */}
            <Circle x={w / 2} y={16} radius={13} stroke={c} strokeWidth={2} />
            <Circle x={w / 2 - 3} y={14} radius={1.5} fill={c} />
            <Circle x={w / 2 + 3} y={14} radius={1.5} fill={c} />
            {/* Torso */}
            <Line points={[w / 2, 29, w / 2, 78]} stroke={c} strokeWidth={2} />
            {/* Shoulders */}
            <Line points={[w / 2, 35, w / 2 - 20, 35]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 35, w / 2 + 20, 35]} stroke={c} strokeWidth={2} />
            {/* Arms */}
            <Line points={[w / 2 - 20, 35, w / 2 - 25, 60]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2 + 20, 35, w / 2 + 25, 60]} stroke={c} strokeWidth={2} />
            {/* Hips */}
            <Line points={[w / 2, 78, w / 2 - 15, 78]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 78, w / 2 + 15, 78]} stroke={c} strokeWidth={2} />
            {/* Legs */}
            <Line points={[w / 2 - 15, 78, w / 2 - 18, h - 5]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2 + 15, 78, w / 2 + 18, h - 5]} stroke={c} strokeWidth={2} />
          </>
        );
      case 'body-standing':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            <Circle x={w / 2} y={10} radius={9} stroke={c} strokeWidth={2} fill={c} opacity={0.2} />
            <Line points={[w / 2, 19, w / 2, 50]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 28, 5, 42]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 28, w - 5, 42]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 50, 8, h - 2]} stroke={c} strokeWidth={2} />
            <Line points={[w / 2, 50, w - 8, h - 2]} stroke={c} strokeWidth={2} />
          </>
        );
      case 'body-prone':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" stroke={c} strokeWidth={1.5} dash={[4, 4]} cornerRadius={8} opacity={0.5} />
            {/* Head */}
            <Circle x={15} y={h / 2} radius={10} stroke={c} strokeWidth={2} fill={c} opacity={0.15} />
            {/* Torso */}
            <Line points={[25, h / 2, 70, h / 2]} stroke={c} strokeWidth={3} lineCap="round" />
            {/* Arms */}
            <Line points={[35, h / 2, 30, h / 2 - 14]} stroke={c} strokeWidth={2} />
            <Line points={[35, h / 2, 30, h / 2 + 14]} stroke={c} strokeWidth={2} />
            {/* Legs */}
            <Line points={[70, h / 2, w - 5, h / 2 - 10]} stroke={c} strokeWidth={2} />
            <Line points={[70, h / 2, w - 5, h / 2 + 10]} stroke={c} strokeWidth={2} />
          </>
        );

      // === WEAPONS ===
      case 'knife':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Blade */}
            <Line points={[2, h / 2, w * 0.65, h / 2 - 2, w * 0.65, h / 2 + 3, 2, h / 2]} stroke="#94a3b8" strokeWidth={1} fill="#cbd5e1" closed />
            {/* Handle */}
            <Rect x={w * 0.65} y={h / 2 - 4} width={w * 0.32} height={8} fill="#78350f" stroke="#451a03" strokeWidth={0.5} cornerRadius={2} />
            {/* Guard */}
            <Rect x={w * 0.63} y={h / 2 - 5} width={3} height={10} fill="#a3a3a3" />
          </>
        );
      case 'gun':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Barrel */}
            <Rect x={w * 0.35} y={h * 0.2} width={w * 0.65} height={h * 0.25} fill="#374151" stroke="#1f2937" strokeWidth={1} cornerRadius={2} />
            {/* Body */}
            <Rect x={w * 0.1} y={h * 0.15} width={w * 0.45} height={h * 0.35} fill="#4b5563" stroke="#1f2937" strokeWidth={1} cornerRadius={3} />
            {/* Grip */}
            <Line points={[w * 0.15, h * 0.5, w * 0.1, h * 0.9, w * 0.35, h * 0.9, w * 0.4, h * 0.5]} fill="#78350f" stroke="#451a03" strokeWidth={1} closed />
            {/* Trigger guard */}
            <Line points={[w * 0.35, h * 0.5, w * 0.35, h * 0.7, w * 0.5, h * 0.7, w * 0.5, h * 0.45]} stroke="#374151" strokeWidth={1.5} />
            {/* Trigger */}
            <Line points={[w * 0.42, h * 0.5, w * 0.42, h * 0.65]} stroke="#1f2937" strokeWidth={1.5} />
            {/* Front sight */}
            <Rect x={w * 0.95} y={h * 0.12} width={3} height={5} fill="#374151" />
          </>
        );
      case 'bullet-casing':
        return (
          <>
            <Circle x={w / 2} y={h / 2} radius={w / 2} fill={c} stroke="#b45309" strokeWidth={1} />
            <Circle x={w / 2} y={h / 2} radius={w / 4} stroke="#92400e" strokeWidth={0.8} />
            <Circle x={w / 2} y={h / 2} radius={1} fill="#92400e" />
          </>
        );
      case 'bullet-hole':
        return (
          <>
            <Circle x={w / 2} y={h / 2} radius={w / 2} fill="#0f172a" stroke="#334155" strokeWidth={1} />
            {/* Crack lines */}
            <Line points={[w / 2, 0, w / 2, h / 2 - 3]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[w / 2, h, w / 2, h / 2 + 3]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[0, h / 2, w / 2 - 3, h / 2]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[w, h / 2, w / 2 + 3, h / 2]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[2, 2, w / 2 - 2, h / 2 - 2]} stroke="#475569" strokeWidth={0.5} />
            <Line points={[w - 2, h - 2, w / 2 + 2, h / 2 + 2]} stroke="#475569" strokeWidth={0.5} />
          </>
        );

      // === EVIDENCE ===
      case 'evidence-marker':
        return (
          <>
            {/* Tent-style marker */}
            <Line points={[w / 2, 0, w, h, 0, h]} fill={c} stroke="#a16207" strokeWidth={1} closed />
            <Line points={[w / 2, 0, w / 2, h * 0.35]} stroke="#a16207" strokeWidth={0.5} />
            <Text text={obj.evidenceId || '#'} x={0} y={h * 0.35} width={w} align="center" fontSize={Math.min(16, w * 0.5)} fontStyle="bold" fill="#000" fontFamily="JetBrains Mono, monospace" />
          </>
        );
      case 'blood-stain':
        return (
          <>
            {/* Irregular blood pool */}
            <Circle x={w * 0.45} y={h * 0.5} radius={Math.min(w, h) * 0.4} fill={c} opacity={0.8} />
            <Circle x={w * 0.6} y={h * 0.4} radius={Math.min(w, h) * 0.25} fill={c} opacity={0.6} />
            <Circle x={w * 0.35} y={h * 0.65} radius={Math.min(w, h) * 0.15} fill={c} opacity={0.5} />
            {/* Splatter dots */}
            <Circle x={w * 0.8} y={h * 0.3} radius={2} fill={c} opacity={0.7} />
            <Circle x={w * 0.15} y={h * 0.2} radius={1.5} fill={c} opacity={0.6} />
            <Circle x={w * 0.75} y={h * 0.75} radius={2.5} fill={c} opacity={0.5} />
          </>
        );
      case 'footprint':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Sole */}
            <Line points={[w * 0.3, h * 0.05, w * 0.7, h * 0.05, w * 0.75, h * 0.6, w * 0.7, h * 0.72, w * 0.65, h * 0.68, w * 0.6, h * 0.72, w * 0.5, h * 0.72, w * 0.4, h * 0.72, w * 0.35, h * 0.68, w * 0.3, h * 0.72, w * 0.25, h * 0.6]} fill={c} opacity={0.6} closed stroke={c} strokeWidth={1} />
            {/* Heel */}
            <Line points={[w * 0.3, h * 0.78, w * 0.7, h * 0.78, w * 0.68, h * 0.95, w * 0.32, h * 0.95]} fill={c} opacity={0.7} closed stroke={c} strokeWidth={1} />
            {/* Tread lines */}
            <Line points={[w * 0.35, h * 0.2, w * 0.65, h * 0.2]} stroke="#a3a3a3" strokeWidth={0.8} />
            <Line points={[w * 0.33, h * 0.35, w * 0.67, h * 0.35]} stroke="#a3a3a3" strokeWidth={0.8} />
            <Line points={[w * 0.32, h * 0.5, w * 0.68, h * 0.5]} stroke="#a3a3a3" strokeWidth={0.8} />
          </>
        );
      case 'tire-mark':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Double track lines */}
            <Line points={[0, h * 0.3, w, h * 0.3]} stroke={c} strokeWidth={3} opacity={0.7} />
            <Line points={[0, h * 0.7, w, h * 0.7]} stroke={c} strokeWidth={3} opacity={0.7} />
            {/* Tread pattern */}
            {Array.from({ length: Math.floor(w / 12) }).map((_, i) => (
              <Line key={i} points={[i * 12 + 4, h * 0.2, i * 12 + 4, h * 0.8]} stroke={c} strokeWidth={1.5} opacity={0.4} />
            ))}
          </>
        );

      // === FURNITURE ===
      case 'bed':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            {/* Headboard */}
            <Rect x={0} y={0} width={w} height={8} fill={c} opacity={0.5} cornerRadius={[4, 4, 0, 0]} />
            {/* Pillow */}
            <Rect x={w * 0.15} y={12} width={w * 0.3} height={12} fill={c} opacity={0.3} cornerRadius={4} stroke={c} strokeWidth={0.5} />
            <Rect x={w * 0.55} y={12} width={w * 0.3} height={12} fill={c} opacity={0.3} cornerRadius={4} stroke={c} strokeWidth={0.5} />
            {/* Blanket fold */}
            <Line points={[w * 0.1, h * 0.55, w * 0.9, h * 0.55]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Text text="BED" x={0} y={h / 2 + 2} width={w} fontSize={9} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.7} />
          </>
        );
      case 'table':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.2} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Table surface lines */}
            <Line points={[4, 4, w - 4, 4, w - 4, h - 4, 4, h - 4, 4, 4]} stroke={c} strokeWidth={0.8} opacity={0.5} />
            <Text text="TABLE" x={0} y={h / 2 - 5} width={w} fontSize={9} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.7} />
          </>
        );
      case 'chair':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.2} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Seat */}
            <Rect x={4} y={h * 0.35} width={w - 8} height={h * 0.55} fill={c} opacity={0.15} cornerRadius={2} />
            {/* Backrest */}
            <Rect x={4} y={2} width={w - 8} height={h * 0.3} fill={c} opacity={0.25} cornerRadius={[4, 4, 0, 0]} />
          </>
        );
      case 'sofa':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            {/* Backrest */}
            <Rect x={0} y={0} width={w} height={h * 0.3} fill={c} opacity={0.3} cornerRadius={[4, 4, 0, 0]} />
            {/* Cushions */}
            <Rect x={4} y={h * 0.35} width={w * 0.3} height={h * 0.55} fill={c} opacity={0.15} cornerRadius={3} stroke={c} strokeWidth={0.5} />
            <Rect x={w * 0.35} y={h * 0.35} width={w * 0.3} height={h * 0.55} fill={c} opacity={0.15} cornerRadius={3} stroke={c} strokeWidth={0.5} />
            <Rect x={w * 0.67} y={h * 0.35} width={w * 0.3} height={h * 0.55} fill={c} opacity={0.15} cornerRadius={3} stroke={c} strokeWidth={0.5} />
            {/* Armrests */}
            <Rect x={0} y={h * 0.25} width={6} height={h * 0.7} fill={c} opacity={0.3} cornerRadius={3} />
            <Rect x={w - 6} y={h * 0.25} width={6} height={h * 0.7} fill={c} opacity={0.3} cornerRadius={3} />
            <Text text="SOFA" x={0} y={h / 2 - 3} width={w} fontSize={9} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.5} />
          </>
        );
      case 'cabinet':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.2} stroke={c} strokeWidth={1.5} />
            {/* Doors */}
            <Line points={[w / 2, 2, w / 2, h - 2]} stroke={c} strokeWidth={1} opacity={0.5} />
            {/* Handles */}
            <Rect x={w / 2 - 6} y={h / 2 - 3} width={4} height={6} fill={c} opacity={0.5} cornerRadius={1} />
            <Rect x={w / 2 + 2} y={h / 2 - 3} width={4} height={6} fill={c} opacity={0.5} cornerRadius={1} />
          </>
        );

      // === STRUCTURES ===
      case 'wall':
        return <Rect width={w} height={h} fill={c} stroke="#1e293b" strokeWidth={0.5} />;
      case 'door':
        return (
          <>
            {/* Door frame */}
            <Rect width={w} height={h} fill={c} stroke="#78350f" strokeWidth={1} />
            {/* Swing arc */}
            <Line points={[0, h, 0, h + w * 0.5]} stroke={c} strokeWidth={1.5} dash={[3, 3]} opacity={0.6} />
            <Line points={[0, h + w * 0.5, w * 0.35, h + w * 0.35]} stroke={c} strokeWidth={1.5} dash={[3, 3]} opacity={0.6} />
            {/* Arc quarter-circle approximation */}
            <Line points={[0, h, w * 0.15, h + w * 0.4, w * 0.35, h + w * 0.35]} stroke={c} strokeWidth={1} dash={[2, 4]} opacity={0.4} tension={0.5} />
          </>
        );
      case 'window':
        return (
          <>
            <Rect width={w} height={h} fill="#38bdf8" opacity={0.15} stroke="#38bdf8" strokeWidth={1.5} />
            {/* Glass panes */}
            <Line points={[w * 0.33, 0, w * 0.33, h]} stroke="#38bdf8" strokeWidth={0.8} opacity={0.5} />
            <Line points={[w * 0.66, 0, w * 0.66, h]} stroke="#38bdf8" strokeWidth={0.8} opacity={0.5} />
            {/* Cross lines indicating glass */}
            <Line points={[0, 0, w * 0.33, h]} stroke="#38bdf8" strokeWidth={0.3} opacity={0.3} />
            <Line points={[w * 0.33, 0, w * 0.66, h]} stroke="#38bdf8" strokeWidth={0.3} opacity={0.3} />
            <Line points={[w * 0.66, 0, w, h]} stroke="#38bdf8" strokeWidth={0.3} opacity={0.3} />
          </>
        );
      case 'stairs':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.1} stroke={c} strokeWidth={1.5} />
            {/* Stair treads */}
            {Array.from({ length: 6 }).map((_, i) => (
              <React.Fragment key={i}>
                <Line points={[0, (i + 1) * (h / 7), w, (i + 1) * (h / 7)]} stroke={c} strokeWidth={1} opacity={0.6} />
              </React.Fragment>
            ))}
            {/* Direction arrow */}
            <Line points={[w / 2, h * 0.85, w / 2, h * 0.15]} stroke={c} strokeWidth={1.5} opacity={0.5} />
            <Line points={[w / 2 - 6, h * 0.25, w / 2, h * 0.15, w / 2 + 6, h * 0.25]} stroke={c} strokeWidth={1.5} opacity={0.5} />
            <Text text="UP" x={0} y={h * 0.4} width={w} fontSize={8} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.5} />
          </>
        );

      // === VEHICLES ===
      case 'car':
        return (
          <>
            {/* Body */}
            <Rect x={2} y={h * 0.15} width={w - 4} height={h * 0.7} fill={c} opacity={0.2} stroke={c} strokeWidth={1.5} cornerRadius={6} />
            {/* Roof / cabin */}
            <Rect x={w * 0.25} y={h * 0.05} width={w * 0.45} height={h * 0.9} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={8} />
            {/* Windshield */}
            <Line points={[w * 0.25, h * 0.2, w * 0.35, h * 0.15, w * 0.35, h * 0.85, w * 0.25, h * 0.8]} stroke="#38bdf8" strokeWidth={1} opacity={0.5} />
            {/* Rear window */}
            <Line points={[w * 0.7, h * 0.2, w * 0.6, h * 0.15, w * 0.6, h * 0.85, w * 0.7, h * 0.8]} stroke="#38bdf8" strokeWidth={1} opacity={0.5} />
            {/* Wheels */}
            <Circle x={w * 0.18} y={h * 0.08} radius={5} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <Circle x={w * 0.18} y={h * 0.92} radius={5} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <Circle x={w * 0.82} y={h * 0.08} radius={5} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <Circle x={w * 0.82} y={h * 0.92} radius={5} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            {/* Headlights */}
            <Rect x={0} y={h * 0.25} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.7} cornerRadius={1} />
            <Rect x={0} y={h * 0.6} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.7} cornerRadius={1} />
            <Text text="CAR" x={0} y={h / 2 - 4} width={w} fontSize={8} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.6} />
          </>
        );
      case 'motorcycle':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Frame */}
            <Line points={[w * 0.2, h * 0.4, w * 0.5, h * 0.3, w * 0.8, h * 0.4]} stroke={c} strokeWidth={2} />
            <Line points={[w * 0.5, h * 0.3, w * 0.45, h * 0.15]} stroke={c} strokeWidth={2} />
            {/* Wheels */}
            <Circle x={w * 0.18} y={h * 0.6} radius={h * 0.3} stroke="#475569" strokeWidth={2} />
            <Circle x={w * 0.82} y={h * 0.6} radius={h * 0.3} stroke="#475569" strokeWidth={2} />
            <Circle x={w * 0.18} y={h * 0.6} radius={2} fill="#475569" />
            <Circle x={w * 0.82} y={h * 0.6} radius={2} fill="#475569" />
            {/* Seat */}
            <Line points={[w * 0.35, h * 0.28, w * 0.65, h * 0.28]} stroke={c} strokeWidth={4} lineCap="round" />
          </>
        );
      case 'bicycle':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Wheels */}
            <Circle x={w * 0.2} y={h * 0.6} radius={h * 0.3} stroke={c} strokeWidth={1.5} />
            <Circle x={w * 0.8} y={h * 0.6} radius={h * 0.3} stroke={c} strokeWidth={1.5} />
            <Circle x={w * 0.2} y={h * 0.6} radius={1.5} fill={c} />
            <Circle x={w * 0.8} y={h * 0.6} radius={1.5} fill={c} />
            {/* Frame */}
            <Line points={[w * 0.2, h * 0.6, w * 0.5, h * 0.3, w * 0.8, h * 0.6, w * 0.5, h * 0.6, w * 0.2, h * 0.6]} stroke={c} strokeWidth={1.5} />
            <Line points={[w * 0.5, h * 0.3, w * 0.5, h * 0.6]} stroke={c} strokeWidth={1.5} />
            {/* Handlebars */}
            <Line points={[w * 0.75, h * 0.2, w * 0.8, h * 0.35]} stroke={c} strokeWidth={1.5} />
            {/* Seat */}
            <Line points={[w * 0.45, h * 0.25, w * 0.55, h * 0.25]} stroke={c} strokeWidth={3} lineCap="round" />
          </>
        );

      // === ANNOTATIONS ===
      case 'room-label':
        return (
          <>
            <Rect width={w} height={h + 4} fill="transparent" />
            <Line points={[0, h + 2, w, h + 2]} stroke="#475569" strokeWidth={0.5} dash={[4, 4]} opacity={0.4} />
            <Text
              text={obj.label}
              fontSize={14}
              fontStyle="bold"
              fill="#94a3b8"
              fontFamily="Inter, sans-serif"
              width={w}
              align="center"
            />
          </>
        );
      default:
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={3} />
            <Text text={obj.label} x={2} y={h / 2 - 6} width={w - 4} fontSize={10} fill={c} align="center" fontFamily="JetBrains Mono, monospace" />
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
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hover glow */}
        {hovered && !isSelected && (
          <Rect x={-3} y={-3} width={w + 6} height={h + 6} stroke="#3b82f6" strokeWidth={1.5} cornerRadius={4} opacity={0.4} dash={[4, 3]} />
        )}
        {renderShape()}
        {/* Evidence badge */}
        {obj.evidenceId && obj.type !== 'evidence-marker' && (
          <Group x={w + 5} y={-5}>
            <Circle radius={12} fill="#eab308" stroke="#a16207" strokeWidth={1.5} />
            <Text text={obj.evidenceId} x={-10} y={-7} fontSize={13} fontStyle="bold" fill="#000" width={20} align="center" fontFamily="JetBrains Mono, monospace" />
          </Group>
        )}
        {/* Label below object (for non-annotation types) */}
        {obj.type !== 'room-label' && obj.type !== 'text-label' && obj.type !== 'evidence-marker' && (
          <Text text={obj.label} x={0} y={h + 4} width={w} fontSize={9} fill="#64748b" align="center" fontFamily="JetBrains Mono, monospace" />
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

// Compass and scale bar moved to HTML overlays for fixed positioning

export default function SceneCanvas() {
  const { objects, selectedObjectId, selectObject, removeObject, addEvidence, activeTool, setTool, showGrid, showLegend, zoom, setZoom, addObject, snapToGrid, measurements, addMeasurement, removeMeasurement, walls, addWall, removeWall, evidence, isDark } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  // Sync stage ref to shared store for export
  useEffect(() => {
    stageStore.current = stageRef.current;
    return () => { stageStore.current = null; };
  });
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measurePreview, setMeasurePreview] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallPreview, setWallPreview] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string } | null>(null);

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

  // Keyboard shortcuts: Delete, Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = document.activeElement?.tagName;
        if (selectedObjectId && tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          removeObject(selectedObjectId);
        }
      }
      if (e.key === 'Escape') {
        selectObject(null);
        setTool('select');
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedObjectId, removeObject, selectObject, setTool]);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handler = () => setContextMenu(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [contextMenu]);

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
        setWallStart(pos);
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

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = getCanvasPos(stage);
    if (pos) setMousePos({ x: Math.round(pos.x), y: Math.round(pos.y) });
    if (activeTool === 'measure' && measureStart) {
      if (pos) setMeasurePreview(pos);
    }
    if (activeTool === 'wall' && wallStart) {
      if (pos) setWallPreview(pos);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    // Find if right-click was on an object
    const stage = stageRef.current;
    if (!stage) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    const canvasX = (pointerPos.x - stagePos.x) / zoom;
    const canvasY = (pointerPos.y - stagePos.y) / zoom;

    // Find closest object
    const clickedObj = objects.find(obj => {
      return canvasX >= obj.x && canvasX <= obj.x + obj.width && canvasY >= obj.y && canvasY <= obj.y + obj.height;
    });

    if (clickedObj) {
      selectObject(clickedObj.id);
      setContextMenu({ x: e.clientX, y: e.clientY, objectId: clickedObj.id });
    }
  }, [objects, stagePos, zoom, selectObject]);

  const handleDuplicate = useCallback((objId: string) => {
    const obj = objects.find(o => o.id === objId);
    if (!obj) return;
    addObject({
      type: obj.type, x: obj.x + 20, y: obj.y + 20,
      width: obj.width, height: obj.height, rotation: obj.rotation,
      label: obj.label, color: obj.color, category: obj.category,
    });
    setContextMenu(null);
  }, [objects, addObject]);

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

  // Compute legend position
  const legendX = (dims.width - stagePos.x) / zoom - 200;
  const legendY = 20 / zoom;

  const scaleBarFeet = Math.round(100 / PIXELS_PER_UNIT);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-canvas-bg relative overflow-hidden"
      style={{ cursor: activeTool === 'measure' || activeTool === 'wall' ? 'crosshair' : activeTool === 'pan' ? 'grab' : 'default' }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onContextMenu={handleContextMenu}
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
          {showGrid && <GridLayer width={dims.width} height={dims.height} zoom={zoom} isDark={isDark} />}
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

      {/* Compass rose overlay (fixed position) */}
      <div className="absolute bottom-10 right-3 w-14 h-14 flex items-center justify-center">
        <div className="relative w-12 h-12 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-destructive">N</span>
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-muted-foreground">S</span>
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground">E</span>
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground">W</span>
          {/* Arrow */}
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-destructive">
            <polygon points="10,1 7,10 10,8 13,10" fill="currentColor" />
            <polygon points="10,19 7,10 10,12 13,10" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Scale bar overlay (fixed position) */}
      <div className="absolute bottom-10 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 flex flex-col items-center gap-0.5">
        <span className="text-[8px] font-mono text-muted-foreground">{scaleBarFeet} ft</span>
        <div className="flex items-center">
          <div className="w-px h-2 bg-foreground/60" />
          <div className="w-[60px] h-0.5 bg-foreground/60" />
          <div className="w-px h-2 bg-foreground/60" />
        </div>
      </div>

      {/* Status bar */}
      <div className="absolute bottom-0 left-0 right-0 h-7 bg-card/90 backdrop-blur-sm border-t border-border flex items-center px-3 gap-4 text-[10px] font-mono text-muted-foreground">
        <span>Zoom: {Math.round(zoom * 100)}%</span>
        <span className="h-3 w-px bg-border" />
        <span>({mousePos.x}, {mousePos.y})</span>
        <span className="h-3 w-px bg-border" />
        <span>{objects.length} obj</span>
        <span className="h-3 w-px bg-border" />
        <span>{walls.length} walls</span>
        <span className="h-3 w-px bg-border" />
        <span>{evidence.length} ev</span>
        <span className="flex-1" />
        <span className="text-muted-foreground/50">Grid: {showGrid ? 'ON' : 'OFF'} · Snap: {snapToGrid ? 'ON' : 'OFF'}</span>
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const ctxObj = objects.find(o => o.id === contextMenu.objectId);
        if (!ctxObj) return null;
        const containerRect = containerRef.current?.getBoundingClientRect();
        const menuX = containerRect ? contextMenu.x - containerRect.left : contextMenu.x;
        const menuY = containerRect ? contextMenu.y - containerRect.top : contextMenu.y;
        return (
          <div
            className="absolute z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[160px] animate-in fade-in-0 zoom-in-95"
            style={{ left: menuX, top: menuY }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-mono border-b border-border mb-1 truncate">
              {ctxObj.label} ({ctxObj.type})
            </div>
            <button
              onClick={() => handleDuplicate(contextMenu.objectId)}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <span className="text-muted-foreground text-[10px] w-4">⎘</span> Duplicate
            </button>
            {!ctxObj.evidenceId && (
              <button
                onClick={() => { addEvidence(contextMenu.objectId, ctxObj.label); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <span className="text-muted-foreground text-[10px] w-4">🏷</span> Mark as Evidence
              </button>
            )}
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => { removeObject(contextMenu.objectId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
            >
              <span className="text-[10px] w-4">🗑</span> Delete
            </button>
          </div>
        );
      })()}

      {/* Tool hints */}
      {activeTool === 'measure' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#22d3ee]" />
          {measureStart ? 'Click second point to complete measurement' : 'Click to set first measurement point'}
          {measureStart && (
            <button onClick={() => { setMeasureStart(null); setMeasurePreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Cancel</button>
          )}
        </div>
      )}

      {activeTool === 'wall' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          {wallStart ? 'Click to place next wall point (walls chain automatically)' : 'Click to set wall start point'}
          {wallStart && (
            <button onClick={() => { setWallStart(null); setWallPreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Finish</button>
          )}
        </div>
      )}

      {activeTool === 'text' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          Click to place a text label
        </div>
      )}

      {activeTool === 'room-label' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          Click to place a room label
        </div>
      )}
    </div>
  );
}
