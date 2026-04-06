import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line, Circle, Group, Transformer, Arrow as KonvaArrow, Image as KonvaImage } from 'react-konva';
import { useScene, SceneObject, Measurement, WallSegment } from '@/store/SceneContext';
import Konva from 'konva';
import { stageStore } from '@/lib/stageRef';
import { Trash2, Copy, Lock, Unlock, ArrowUpToLine, ArrowDownToLine, X } from 'lucide-react';

const GRID_SIZE = 20;
const PIXELS_PER_UNIT = 20;

function BackgroundImageLayer({ backgroundImage }: { backgroundImage: import('@/store/SceneContext').BackgroundImage | null }) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!backgroundImage?.url) { setImage(null); return; }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setImage(img);
    img.src = backgroundImage.url;
  }, [backgroundImage?.url]);

  if (!image || !backgroundImage?.visible) return null;

  const w = backgroundImage.width || image.naturalWidth;
  const h = backgroundImage.height || image.naturalHeight;

  return (
    <KonvaImage
      image={image}
      x={0}
      y={0}
      width={w}
      height={h}
      opacity={backgroundImage.opacity}
      listening={false}
    />
  );
}

function GridLayer({ width, height, zoom, isDark, isNight }: { width: number; height: number; zoom: number; isDark: boolean; isNight?: boolean }) {
  const lines: React.ReactElement[] = [];
  const step = GRID_SIZE;
  const w = width / zoom + step;
  const h = height / zoom + step;
  const gridColor = isNight ? 'hsl(225, 30%, 12%)' : isDark ? 'hsl(225, 18%, 18%)' : 'hsl(220, 15%, 82%)';
  const majorColor = isNight ? 'hsl(225, 30%, 16%)' : isDark ? 'hsl(225, 18%, 22%)' : 'hsl(220, 15%, 75%)';
  const gridOpacity = isNight ? 0.3 : 0.4;
  const majorOpacity = isNight ? 0.4 : 0.6;
  for (let i = 0; i <= w / step; i++) {
    const isMajor = i % 5 === 0;
    lines.push(<Line key={`v-${i}`} points={[i * step, 0, i * step, h]} stroke={isMajor ? majorColor : gridColor} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? majorOpacity : gridOpacity} />);
  }
  for (let i = 0; i <= h / step; i++) {
    const isMajor = i % 5 === 0;
    lines.push(<Line key={`h-${i}`} points={[0, i * step, w, i * step]} stroke={isMajor ? majorColor : gridColor} strokeWidth={isMajor ? 1 : 0.5} opacity={isMajor ? majorOpacity : gridOpacity} />);
  }
  return <>{lines}</>;
}

// Night sky with stars, constellations, and moon with glow
function NightSkyLayer({ width, height, zoom }: { width: number; height: number; zoom: number }) {
  const stars = React.useMemo(() => {
    const s: { x: number; y: number; r: number; o: number; twinkle: boolean }[] = [];
    const rng = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };
    const w = width / zoom + 200;
    const h = height / zoom + 200;
    for (let i = 0; i < 120; i++) {
      s.push({
        x: rng(i * 13.37) * w,
        y: rng(i * 7.91) * h,
        r: rng(i * 3.14) * 2 + 0.3,
        o: rng(i * 2.71) * 0.6 + 0.15,
        twinkle: rng(i * 5.55) > 0.7,
      });
    }
    return s;
  }, [width, height, zoom]);

  return (
    <>
      {stars.map((s, i) => (
        <React.Fragment key={`star-${i}`}>
          <Circle x={s.x} y={s.y} radius={s.r} fill="#e2e8f0" opacity={s.o} listening={false} />
          {s.twinkle && <Circle x={s.x} y={s.y} radius={s.r * 3} fill="#e2e8f0" opacity={s.o * 0.15} listening={false} />}
        </React.Fragment>
      ))}
      {/* Moon with glow halo */}
      <Circle x={width / zoom - 80} y={60} radius={35} fill="#c8d6e5" opacity={0.06} listening={false} />
      <Circle x={width / zoom - 80} y={60} radius={28} fill="#dfe6e9" opacity={0.1} listening={false} />
      <Circle x={width / zoom - 80} y={60} radius={22} fill="#f1f5f9" opacity={0.3} listening={false} />
      <Circle x={width / zoom - 74} y={56} radius={18} fill="#0a1628" opacity={0.3} listening={false} />
      {/* Distant horizon glow */}
      <Rect x={-500} y={height / zoom - 60} width={width / zoom + 1000} height={60}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 0, y: 60 }}
        fillLinearGradientColorStops={[0, 'rgba(30,58,138,0.08)', 1, 'transparent']} listening={false} />
    </>
  );
}

// Enhanced glow halos with flashlight cones and evidence marker pools
function EvidenceGlowLayer({ objects }: { objects: import('@/store/SceneContext').SceneObject[] }) {
  return (
    <>
      {objects.filter(o => o.evidenceId).map(o => (
        <React.Fragment key={`glow-${o.id}`}>
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={Math.max(o.width, o.height) * 1.2} fill="#eab308" opacity={0.03} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={Math.max(o.width, o.height) * 0.8} fill="#eab308" opacity={0.06} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={Math.max(o.width, o.height) * 0.5} fill="#eab308" opacity={0.12} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={3} fill="#fbbf24" opacity={0.6} listening={false} />
        </React.Fragment>
      ))}
      {/* Streetlight cones with layered falloff */}
      {objects.filter(o => o.type === 'streetlight').map(o => (
        <React.Fragment key={`light-${o.id}`}>
          <Line points={[o.x + o.width / 2, o.y + o.height * 0.2, o.x - o.width * 2.5, o.y + o.height * 4, o.x + o.width * 3.5, o.y + o.height * 4]} closed fill="#fbbf24" opacity={0.03} listening={false} />
          <Line points={[o.x + o.width / 2, o.y + o.height * 0.3, o.x - o.width * 1.2, o.y + o.height * 3, o.x + o.width * 2.2, o.y + o.height * 3]} closed fill="#fbbf24" opacity={0.07} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height * 0.25} radius={8} fill="#fbbf24" opacity={0.35} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height * 0.25} radius={4} fill="#fff" opacity={0.5} listening={false} />
        </React.Fragment>
      ))}
      {/* Flashlight pools under evidence markers */}
      {objects.filter(o => o.type === 'evidence-marker').map(o => (
        <React.Fragment key={`flash-${o.id}`}>
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={Math.max(o.width, o.height) * 2} fill="#fef3c7" opacity={0.04} listening={false} />
          <Circle x={o.x + o.width / 2} y={o.y + o.height / 2} radius={Math.max(o.width, o.height) * 1.2} fill="#fef3c7" opacity={0.08} listening={false} />
        </React.Fragment>
      ))}
    </>
  );
}

function MeasurementLine({ m, isSelected, onSelect, onRemove }: { m: Measurement; isSelected?: boolean; onSelect?: () => void; onRemove: () => void }) {
  const dx = m.x2 - m.x1;
  const dy = m.y2 - m.y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distUnits = (dist / PIXELS_PER_UNIT).toFixed(1);
  const midX = (m.x1 + m.x2) / 2;
  const midY = (m.y1 + m.y2) / 2;
  const len = dist || 1;
  const perpX = (-dy / len) * 6;
  const perpY = (dx / len) * 6;
  const strokeColor = isSelected ? '#f59e0b' : '#22d3ee';

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      {/* Wider invisible hit area */}
      <Line points={[m.x1, m.y1, m.x2, m.y2]} stroke="transparent" strokeWidth={12} />
      <Line points={[m.x1, m.y1, m.x2, m.y2]} stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} dash={[6, 3]} />
      <Line points={[m.x1 + perpX, m.y1 + perpY, m.x1 - perpX, m.y1 - perpY]} stroke={strokeColor} strokeWidth={2} />
      <Line points={[m.x2 + perpX, m.y2 + perpY, m.x2 - perpX, m.y2 - perpY]} stroke={strokeColor} strokeWidth={2} />
      <Circle x={m.x1} y={m.y1} radius={4} fill={strokeColor} />
      <Circle x={m.x2} y={m.y2} radius={4} fill={strokeColor} />
      <Group x={midX} y={midY}>
        <Rect x={-30} y={-22} width={60} height={18} fill="hsl(225, 22%, 11%)" stroke={strokeColor} strokeWidth={1} cornerRadius={3} opacity={0.9} />
        <Text x={-30} y={-20} width={60} text={`${distUnits}'`} fontSize={11} fontFamily="JetBrains Mono, monospace" fill={strokeColor} align="center" />
      </Group>
      {isSelected && (
        <Group x={midX + 35} y={midY - 22} onClick={onRemove} onTap={onRemove}>
          <Circle radius={8} fill="#ef4444" opacity={0.9} />
          <Text x={-4} y={-6} text="×" fontSize={12} fill="#fff" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

function AngleMeasurement({ m, isSelected, onSelect, onRemove }: { m: Measurement; isSelected?: boolean; onSelect?: () => void; onRemove: () => void }) {
  // m.x1,y1 = vertex, m.x2,y2 = ray1 end, m.x3,y3 = ray2 end
  const vx = m.x1, vy = m.y1;
  const ax = m.x2, ay = m.y2;
  const bx = m.x3 ?? m.x2, by = m.y3 ?? m.y2;

  const angle1 = Math.atan2(ay - vy, ax - vx);
  const angle2 = Math.atan2(by - vy, bx - vx);
  let angleDeg = ((angle2 - angle1) * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  if (angleDeg > 180) angleDeg = 360 - angleDeg;

  const strokeColor = isSelected ? '#f59e0b' : '#f97316';
  const arcRadius = 30;
  
  // Draw arc for angle visualization
  const startAngle = angle1;
  const endAngle = angle2;
  const arcPoints: number[] = [];
  let sweep = endAngle - startAngle;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = startAngle + (sweep * i) / steps;
    arcPoints.push(vx + Math.cos(t) * arcRadius, vy + Math.sin(t) * arcRadius);
  }

  const labelAngle = startAngle + sweep / 2;
  const labelX = vx + Math.cos(labelAngle) * (arcRadius + 18);
  const labelY = vy + Math.sin(labelAngle) * (arcRadius + 18);

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      <Line points={[ax, ay, vx, vy]} stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} dash={[6, 3]} />
      <Line points={[vx, vy, bx, by]} stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} dash={[6, 3]} />
      {arcPoints.length >= 4 && <Line points={arcPoints} stroke={strokeColor} strokeWidth={1.5} />}
      <Circle x={vx} y={vy} radius={4} fill={strokeColor} />
      <Circle x={ax} y={ay} radius={3} fill={strokeColor} />
      <Circle x={bx} y={by} radius={3} fill={strokeColor} />
      <Group x={labelX} y={labelY}>
        <Rect x={-24} y={-10} width={48} height={18} fill="hsl(225, 22%, 11%)" stroke={strokeColor} strokeWidth={1} cornerRadius={3} opacity={0.9} />
        <Text x={-24} y={-8} width={48} text={`${angleDeg.toFixed(1)}°`} fontSize={11} fontFamily="JetBrains Mono, monospace" fill={strokeColor} align="center" />
      </Group>
      {isSelected && (
        <Group x={labelX + 30} y={labelY - 10} onClick={onRemove} onTap={onRemove}>
          <Circle radius={8} fill="#ef4444" opacity={0.9} />
          <Text x={-4} y={-6} text="×" fontSize={12} fill="#fff" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

function ArcMeasurement({ m, isSelected, onSelect, onRemove }: { m: Measurement; isSelected?: boolean; onSelect?: () => void; onRemove: () => void }) {
  // m.x1,y1 = start, m.x2,y2 = end, m.x3,y3 = control point
  const sx = m.x1, sy = m.y1;
  const ex = m.x2, ey = m.y2;
  const cx = m.x3 ?? (sx + ex) / 2, cy = m.y3 ?? (sy + ey) / 2;

  const strokeColor = isSelected ? '#f59e0b' : '#a855f7';

  // Quadratic bezier curve points
  const curvePoints: number[] = [];
  const steps = 40;
  let arcLength = 0;
  let prevX = sx, prevY = sy;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex;
    const y = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey;
    curvePoints.push(x, y);
    if (i > 0) {
      arcLength += Math.sqrt((x - prevX) ** 2 + (y - prevY) ** 2);
    }
    prevX = x; prevY = y;
  }

  const distUnits = (arcLength / PIXELS_PER_UNIT).toFixed(1);
  const midT = 0.5;
  const midX = (1 - midT) * (1 - midT) * sx + 2 * (1 - midT) * midT * cx + midT * midT * ex;
  const midY = (1 - midT) * (1 - midT) * sy + 2 * (1 - midT) * midT * cy + midT * midT * ey;

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      <Line points={curvePoints} stroke="transparent" strokeWidth={12} />
      <Line points={curvePoints} stroke={strokeColor} strokeWidth={isSelected ? 2.5 : 1.5} dash={[6, 3]} />
      <Circle x={sx} y={sy} radius={4} fill={strokeColor} />
      <Circle x={ex} y={ey} radius={4} fill={strokeColor} />
      <Circle x={cx} y={cy} radius={3} fill={strokeColor} opacity={0.5} />
      {/* Dotted lines to control point */}
      <Line points={[sx, sy, cx, cy]} stroke={strokeColor} strokeWidth={0.5} dash={[2, 4]} opacity={0.4} />
      <Line points={[ex, ey, cx, cy]} stroke={strokeColor} strokeWidth={0.5} dash={[2, 4]} opacity={0.4} />
      <Group x={midX} y={midY - 4}>
        <Rect x={-32} y={-22} width={64} height={18} fill="hsl(225, 22%, 11%)" stroke={strokeColor} strokeWidth={1} cornerRadius={3} opacity={0.9} />
        <Text x={-32} y={-20} width={64} text={`⌒ ${distUnits}'`} fontSize={11} fontFamily="JetBrains Mono, monospace" fill={strokeColor} align="center" />
      </Group>
      {isSelected && (
        <Group x={midX + 38} y={midY - 26} onClick={onRemove} onTap={onRemove}>
          <Circle radius={8} fill="#ef4444" opacity={0.9} />
          <Text x={-4} y={-6} text="×" fontSize={12} fill="#fff" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

function WallLine({ w, isSelected, onSelect, onRemove }: { w: WallSegment; isSelected?: boolean; onSelect?: () => void; onRemove: () => void }) {
  const dx = w.x2 - w.x1;
  const dy = w.y2 - w.y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const distUnits = (dist / PIXELS_PER_UNIT).toFixed(1);
  const midX = (w.x1 + w.x2) / 2;
  const midY = (w.y1 + w.y2) / 2;
  const len = dist || 1;
  const perpX = (-dy / len) * 12;
  const perpY = (dx / len) * 12;
  const strokeColor = isSelected ? '#f59e0b' : '#a3a3a3';

  return (
    <Group onClick={onSelect} onTap={onSelect}>
      {/* Wider invisible hit area for easier clicking */}
      <Line points={[w.x1, w.y1, w.x2, w.y2]} stroke="transparent" strokeWidth={Math.max(16, w.thickness + 10)} />
      <Line points={[w.x1, w.y1, w.x2, w.y2]} stroke={isSelected ? '#f59e0b' : '#737373'} strokeWidth={w.thickness + 2} opacity={0.3} lineCap="round" />
      <Line points={[w.x1, w.y1, w.x2, w.y2]} stroke={strokeColor} strokeWidth={w.thickness} lineCap="round" />
      <Circle x={w.x1} y={w.y1} radius={3} fill={isSelected ? '#f59e0b' : '#d4d4d4'} />
      <Circle x={w.x2} y={w.y2} radius={3} fill={isSelected ? '#f59e0b' : '#d4d4d4'} />
      <Group x={midX + perpX} y={midY + perpY}>
        <Rect x={-24} y={-9} width={48} height={18} fill="hsl(225, 22%, 11%)" stroke={isSelected ? '#f59e0b' : '#737373'} strokeWidth={0.5} cornerRadius={3} opacity={0.9} />
        <Text x={-24} y={-7} width={48} text={`${distUnits}'`} fontSize={10} fontFamily="JetBrains Mono, monospace" fill={isSelected ? '#f59e0b' : '#d4d4d4'} align="center" />
      </Group>
      {isSelected && (
        <Group x={midX - perpX} y={midY - perpY} onClick={(e) => { e.cancelBubble = true; onRemove(); }} onTap={(e) => { e.cancelBubble = true; onRemove(); }}>
          <Circle radius={8} fill="#ef4444" opacity={0.9} />
          <Text x={-4} y={-6} text="×" fontSize={12} fill="#fff" fontStyle="bold" />
        </Group>
      )}
    </Group>
  );
}

function CanvasLegend({ x, y, evidence, caseInfo }: { x: number; y: number; evidence: import('@/store/SceneContext').EvidenceItem[]; caseInfo: import('@/store/SceneContext').CaseInfo }) {
  if (evidence.length === 0 && !caseInfo.location) return null;

  const lineHeight = 16;
  const padding = 12;
  const headerH = caseInfo.location || caseInfo.caseNumber ? 80 : 0;
  const legendH = evidence.length * lineHeight + padding * 2 + (evidence.length > 0 ? 20 : 0) + headerH;
  const legendW = 180;

  return (
    <Group x={x} y={y} draggable>
      <Rect width={legendW} height={legendH} fill="hsl(225, 22%, 11%)" stroke="#475569" strokeWidth={1} cornerRadius={4} opacity={0.95} />
      {(caseInfo.location || caseInfo.caseNumber) && (
        <>
          {caseInfo.location && <Text x={padding} y={padding} text={`Location: ${caseInfo.location}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
          {caseInfo.dateTime && <Text x={padding} y={padding + 14} text={`Date: ${caseInfo.dateTime}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
          {caseInfo.incident && <Text x={padding} y={padding + 28} text={`Incident: ${caseInfo.incident}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
          {caseInfo.sketchBy && <Text x={padding} y={padding + 42} text={`Sketch by: ${caseInfo.sketchBy}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
          <Line points={[padding, headerH - 8, legendW - padding, headerH - 8]} stroke="#475569" strokeWidth={0.5} />
        </>
      )}
      {evidence.length > 0 && (
        <>
          <Text x={padding} y={headerH + padding - 4} text="EVIDENCE KEY" fontSize={9} fill="#94a3b8" fontStyle="bold" letterSpacing={1} />
          {evidence.map((ev, i) => (
            <React.Fragment key={ev.id}>
              <Text x={padding} y={headerH + padding + 14 + i * lineHeight} text={`${ev.letter} -`} fontSize={11} fill="#eab308" fontStyle="bold" fontFamily="JetBrains Mono, monospace" />
              <Text x={padding + 28} y={headerH + padding + 14 + i * lineHeight} text={ev.description} fontSize={10} fill="#e2e8f0" fontFamily="Inter, sans-serif" width={legendW - padding * 2 - 28} />
            </React.Fragment>
          ))}
        </>
      )}
    </Group>
  );
}

const SNAP_THRESHOLD = 5;

interface SnapGuide {
  orientation: 'h' | 'v';
  pos: number;
}

function SceneObjectShape({ obj, isSelected, onSelect, allObjects, onSnapGuides, updateObject, updateObjectSilent, snapToGrid }: {
  obj: SceneObject; isSelected: boolean; onSelect: () => void;
  allObjects: SceneObject[];
  onSnapGuides: (guides: SnapGuide[]) => void;
  updateObject: (id: string, updates: Partial<SceneObject>) => void;
  updateObjectSilent: (id: string, updates: Partial<SceneObject>) => void;
  snapToGrid: boolean;
}) {
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

  const getSnapEdges = (o: SceneObject) => ({
    left: o.x,
    right: o.x + o.width,
    centerX: o.x + o.width / 2,
    top: o.y,
    bottom: o.y + o.height,
    centerY: o.y + o.height / 2,
  });

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (obj.locked) return;
    const node = e.target;
    const others = allObjects.filter(o => o.id !== obj.id);
    if (others.length === 0) return;

    let dx = node.x();
    let dy = node.y();
    const dragW = obj.width;
    const dragH = obj.height;

    const dragEdges = {
      left: dx, right: dx + dragW, centerX: dx + dragW / 2,
      top: dy, bottom: dy + dragH, centerY: dy + dragH / 2,
    };

    const guides: SnapGuide[] = [];
    let snappedX = false;
    let snappedY = false;

    for (const other of others) {
      const e2 = getSnapEdges(other);

      // Vertical guides (snap X)
      if (!snappedX) {
        const xChecks = [
          { drag: dragEdges.left, target: e2.left },
          { drag: dragEdges.left, target: e2.right },
          { drag: dragEdges.left, target: e2.centerX },
          { drag: dragEdges.right, target: e2.left },
          { drag: dragEdges.right, target: e2.right },
          { drag: dragEdges.right, target: e2.centerX },
          { drag: dragEdges.centerX, target: e2.centerX },
          { drag: dragEdges.centerX, target: e2.left },
          { drag: dragEdges.centerX, target: e2.right },
        ];
        for (const check of xChecks) {
          if (Math.abs(check.drag - check.target) < SNAP_THRESHOLD) {
            dx += check.target - check.drag;
            guides.push({ orientation: 'v', pos: check.target });
            snappedX = true;
            break;
          }
        }
      }

      // Horizontal guides (snap Y)
      if (!snappedY) {
        const yChecks = [
          { drag: dragEdges.top, target: e2.top },
          { drag: dragEdges.top, target: e2.bottom },
          { drag: dragEdges.top, target: e2.centerY },
          { drag: dragEdges.bottom, target: e2.top },
          { drag: dragEdges.bottom, target: e2.bottom },
          { drag: dragEdges.bottom, target: e2.centerY },
          { drag: dragEdges.centerY, target: e2.centerY },
          { drag: dragEdges.centerY, target: e2.top },
          { drag: dragEdges.centerY, target: e2.bottom },
        ];
        for (const check of yChecks) {
          if (Math.abs(check.drag - check.target) < SNAP_THRESHOLD) {
            dy += check.target - check.drag;
            guides.push({ orientation: 'h', pos: check.target });
            snappedY = true;
            break;
          }
        }
      }

      if (snappedX && snappedY) break;
    }

    node.position({ x: dx, y: dy });
    onSnapGuides(guides);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    if (obj.locked) { e.target.position({ x: obj.x, y: obj.y }); return; }
    onSnapGuides([]);
    updateObject(obj.id, { x: snapPos(e.target.x()), y: snapPos(e.target.y()) });
  };

  const handleTransformEnd = () => {
    if (obj.locked) return;
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();
    
    // Reset scale and apply to dimensions
    node.scaleX(1);
    node.scaleY(1);
    
    const newWidth = Math.max(5, Math.abs(node.width() * scaleX));
    const newHeight = Math.max(5, Math.abs(node.height() * scaleY));
    
    updateObject(obj.id, {
      x: snapPos(node.x()),
      y: snapPos(node.y()),
      width: newWidth,
      height: newHeight,
      rotation,
    });
  };

  const c = obj.color || '#3b82f6';
  const w = obj.width;
  const h = obj.height;
  const r = Math.min(w, h);
  const opacity = obj.opacity ?? 1;

  const renderShape = () => {
    switch (obj.type) {
      case 'body-outline':
        return (
          <>
            {/* Ground chalk outline glow */}
            <Rect width={w} height={h} fill="transparent" stroke={c} strokeWidth={2} dash={[8, 4]} cornerRadius={6} opacity={0.2} />
            <Rect x={2} y={2} width={w - 4} height={h - 4} fill="transparent" stroke={c} strokeWidth={0.5} dash={[4, 6]} cornerRadius={5} opacity={0.08} />
            {/* Ground shadow */}
            <Line points={[w * 0.15, h * 0.86, w * 0.85, h * 0.86, w * 0.9, h * 0.94, w * 0.1, h * 0.94]} fill={c} opacity={0.05} closed tension={0.4} />
            {/* HEAD */}
            <Circle x={w / 2} y={h * 0.1} radius={w * 0.22} stroke={c} strokeWidth={2.8} />
            <Circle x={w / 2} y={h * 0.1} radius={w * 0.19} stroke={c} strokeWidth={0.6} opacity={0.12} />
            {/* Hairline */}
            <Line points={[w * 0.3, h * 0.04, w * 0.38, h * 0.015, w * 0.5, h * 0.005, w * 0.62, h * 0.015, w * 0.7, h * 0.04]} stroke={c} strokeWidth={1.5} tension={0.5} opacity={0.3} />
            {/* Ears */}
            <Line points={[w * 0.28, h * 0.08, w * 0.25, h * 0.09, w * 0.24, h * 0.11, w * 0.26, h * 0.13, w * 0.28, h * 0.12]} stroke={c} strokeWidth={1} opacity={0.3} tension={0.4} />
            <Line points={[w * 0.72, h * 0.08, w * 0.75, h * 0.09, w * 0.76, h * 0.11, w * 0.74, h * 0.13, w * 0.72, h * 0.12]} stroke={c} strokeWidth={1} opacity={0.3} tension={0.4} />
            {/* Eyebrows */}
            <Line points={[w * 0.36, h * 0.075, w * 0.4, h * 0.068, w * 0.45, h * 0.072]} stroke={c} strokeWidth={1.2} opacity={0.4} tension={0.3} />
            <Line points={[w * 0.55, h * 0.072, w * 0.6, h * 0.068, w * 0.64, h * 0.075]} stroke={c} strokeWidth={1.2} opacity={0.4} tension={0.3} />
            {/* Eyes */}
            <Line points={[w * 0.37, h * 0.09, w * 0.41, h * 0.085, w * 0.46, h * 0.09, w * 0.41, h * 0.095]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Circle x={w * 0.41} y={h * 0.09} radius={1} fill={c} opacity={0.4} />
            <Line points={[w * 0.54, h * 0.09, w * 0.59, h * 0.085, w * 0.63, h * 0.09, w * 0.59, h * 0.095]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Circle x={w * 0.59} y={h * 0.09} radius={1} fill={c} opacity={0.4} />
            {/* Nose */}
            <Line points={[w * 0.5, h * 0.085, w * 0.48, h * 0.11, w * 0.47, h * 0.125, w * 0.5, h * 0.13, w * 0.53, h * 0.125, w * 0.52, h * 0.11]} stroke={c} strokeWidth={0.7} opacity={0.3} tension={0.3} />
            <Circle x={w * 0.48} y={h * 0.128} radius={0.8} fill={c} opacity={0.2} />
            <Circle x={w * 0.52} y={h * 0.128} radius={0.8} fill={c} opacity={0.2} />
            {/* Mouth */}
            <Line points={[w * 0.43, h * 0.145, w * 0.47, h * 0.15, w * 0.5, h * 0.152, w * 0.53, h * 0.15, w * 0.57, h * 0.145]} stroke={c} strokeWidth={1} opacity={0.35} tension={0.3} />
            <Line points={[w * 0.45, h * 0.15, w * 0.5, h * 0.155, w * 0.55, h * 0.15]} stroke={c} strokeWidth={0.5} opacity={0.15} tension={0.3} />
            {/* Chin */}
            <Line points={[w * 0.44, h * 0.16, w * 0.5, h * 0.17, w * 0.56, h * 0.16]} stroke={c} strokeWidth={0.5} opacity={0.12} tension={0.3} />
            {/* NECK */}
            <Line points={[w * 0.43, h * 0.19, w * 0.43, h * 0.25]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.57, h * 0.19, w * 0.57, h * 0.25]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.44, h * 0.2, w * 0.46, h * 0.24]} stroke={c} strokeWidth={0.6} opacity={0.12} />
            <Line points={[w * 0.56, h * 0.2, w * 0.54, h * 0.24]} stroke={c} strokeWidth={0.6} opacity={0.12} />
            <Line points={[w * 0.49, h * 0.22, w * 0.5, h * 0.215, w * 0.51, h * 0.22]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            {/* SHOULDERS */}
            <Line points={[w * 0.06, h * 0.32, w * 0.15, h * 0.28, w * 0.25, h * 0.26, w * 0.43, h * 0.25, w * 0.57, h * 0.25, w * 0.75, h * 0.26, w * 0.85, h * 0.28, w * 0.94, h * 0.32]} stroke={c} strokeWidth={2.2} tension={0.3} lineCap="round" />
            {/* Clavicles */}
            <Line points={[w * 0.25, h * 0.27, w * 0.35, h * 0.26, w * 0.45, h * 0.265]} stroke={c} strokeWidth={0.7} opacity={0.2} tension={0.2} />
            <Line points={[w * 0.55, h * 0.265, w * 0.65, h * 0.26, w * 0.75, h * 0.27]} stroke={c} strokeWidth={0.7} opacity={0.2} tension={0.2} />
            {/* Deltoids */}
            <Line points={[w * 0.08, h * 0.31, w * 0.12, h * 0.28, w * 0.18, h * 0.27]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.3} />
            <Line points={[w * 0.92, h * 0.31, w * 0.88, h * 0.28, w * 0.82, h * 0.27]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.3} />
            {/* TORSO */}
            <Line points={[w * 0.33, h * 0.26, w * 0.31, h * 0.38, w * 0.3, h * 0.5, w * 0.33, h * 0.58]} stroke={c} strokeWidth={2} tension={0.3} />
            <Line points={[w * 0.67, h * 0.26, w * 0.69, h * 0.38, w * 0.7, h * 0.5, w * 0.67, h * 0.58]} stroke={c} strokeWidth={2} tension={0.3} />
            <Line points={[w * 0.5, h * 0.26, w * 0.5, h * 0.58]} stroke={c} strokeWidth={0.8} dash={[2, 4]} opacity={0.1} />
            {/* Pectorals */}
            <Line points={[w * 0.35, h * 0.28, w * 0.42, h * 0.3, w * 0.48, h * 0.3]} stroke={c} strokeWidth={0.7} opacity={0.15} tension={0.3} />
            <Line points={[w * 0.65, h * 0.28, w * 0.58, h * 0.3, w * 0.52, h * 0.3]} stroke={c} strokeWidth={0.7} opacity={0.15} tension={0.3} />
            {/* Ribs */}
            <Line points={[w * 0.36, h * 0.34, w * 0.44, h * 0.33, w * 0.5, h * 0.335]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Line points={[w * 0.64, h * 0.34, w * 0.56, h * 0.33, w * 0.5, h * 0.335]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Line points={[w * 0.35, h * 0.38, w * 0.43, h * 0.37, w * 0.5, h * 0.375]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Line points={[w * 0.65, h * 0.38, w * 0.57, h * 0.37, w * 0.5, h * 0.375]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Line points={[w * 0.34, h * 0.42, w * 0.42, h * 0.41, w * 0.5, h * 0.415]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Line points={[w * 0.66, h * 0.42, w * 0.58, h * 0.41, w * 0.5, h * 0.415]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.2} />
            <Circle x={w * 0.5} y={h * 0.48} radius={1.5} stroke={c} strokeWidth={0.7} opacity={0.2} />
            {/* LEFT ARM */}
            <Line points={[w * 0.06, h * 0.32, w * 0.04, h * 0.38, w * 0.03, h * 0.44, w * 0.035, h * 0.48]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.07, h * 0.34, w * 0.055, h * 0.38, w * 0.045, h * 0.42]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.035} y={h * 0.48} radius={2.5} stroke={c} strokeWidth={0.8} opacity={0.25} />
            <Line points={[w * 0.035, h * 0.48, w * 0.05, h * 0.53, w * 0.08, h * 0.57]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.1} y={h * 0.59} radius={4} stroke={c} strokeWidth={1.2} opacity={0.5} />
            <Line points={[w * 0.075, h * 0.585, w * 0.055, h * 0.578]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.08, h * 0.575, w * 0.06, h * 0.56]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.09, h * 0.57, w * 0.075, h * 0.548]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.1, h * 0.568, w * 0.09, h * 0.545]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.115, h * 0.58, w * 0.12, h * 0.6]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* RIGHT ARM */}
            <Line points={[w * 0.94, h * 0.32, w * 0.96, h * 0.38, w * 0.97, h * 0.44, w * 0.965, h * 0.48]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.93, h * 0.34, w * 0.945, h * 0.38, w * 0.955, h * 0.42]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.965} y={h * 0.48} radius={2.5} stroke={c} strokeWidth={0.8} opacity={0.25} />
            <Line points={[w * 0.965, h * 0.48, w * 0.95, h * 0.53, w * 0.92, h * 0.57]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.9} y={h * 0.59} radius={4} stroke={c} strokeWidth={1.2} opacity={0.5} />
            <Line points={[w * 0.925, h * 0.585, w * 0.945, h * 0.578]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.92, h * 0.575, w * 0.94, h * 0.56]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.91, h * 0.57, w * 0.925, h * 0.548]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.9, h * 0.568, w * 0.91, h * 0.545]} stroke={c} strokeWidth={0.7} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.885, h * 0.58, w * 0.88, h * 0.6]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* HIP */}
            <Line points={[w * 0.25, h * 0.6, w * 0.35, h * 0.58, w * 0.5, h * 0.575, w * 0.65, h * 0.58, w * 0.75, h * 0.6]} stroke={c} strokeWidth={2.2} tension={0.3} lineCap="round" />
            <Line points={[w * 0.32, h * 0.57, w * 0.38, h * 0.56]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            <Line points={[w * 0.68, h * 0.57, w * 0.62, h * 0.56]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            {/* LEFT LEG */}
            <Line points={[w * 0.35, h * 0.6, w * 0.32, h * 0.66, w * 0.28, h * 0.72, w * 0.26, h * 0.77]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.34, h * 0.63, w * 0.31, h * 0.68, w * 0.28, h * 0.73]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.255} y={h * 0.78} radius={3} stroke={c} strokeWidth={1} opacity={0.3} />
            <Circle x={w * 0.255} y={h * 0.78} radius={1.5} fill={c} opacity={0.08} />
            <Line points={[w * 0.255, h * 0.8, w * 0.24, h * 0.84, w * 0.22, h * 0.88]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.215} y={h * 0.885} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.22, h * 0.89, w * 0.16, h * 0.92, w * 0.13, h * 0.935, w * 0.11, h * 0.94]} stroke={c} strokeWidth={2.8} lineCap="round" tension={0.3} />
            <Line points={[w * 0.11, h * 0.935, w * 0.095, h * 0.93]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.105, h * 0.94, w * 0.09, h * 0.938]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.11, h * 0.945, w * 0.095, h * 0.946]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* RIGHT LEG */}
            <Line points={[w * 0.65, h * 0.6, w * 0.68, h * 0.66, w * 0.72, h * 0.72, w * 0.74, h * 0.77]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.66, h * 0.63, w * 0.69, h * 0.68, w * 0.72, h * 0.73]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.745} y={h * 0.78} radius={3} stroke={c} strokeWidth={1} opacity={0.3} />
            <Circle x={w * 0.745} y={h * 0.78} radius={1.5} fill={c} opacity={0.08} />
            <Line points={[w * 0.745, h * 0.8, w * 0.76, h * 0.84, w * 0.78, h * 0.88]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.785} y={h * 0.885} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.78, h * 0.89, w * 0.84, h * 0.92, w * 0.87, h * 0.935, w * 0.89, h * 0.94]} stroke={c} strokeWidth={2.8} lineCap="round" tension={0.3} />
            <Line points={[w * 0.89, h * 0.935, w * 0.905, h * 0.93]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.895, h * 0.94, w * 0.91, h * 0.938]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.89, h * 0.945, w * 0.905, h * 0.946]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* FORENSIC MARKERS */}
            <Line points={[w / 2 - 6, h * 0.45, w / 2 + 6, h * 0.45]} stroke={c} strokeWidth={0.8} opacity={0.2} />
            <Line points={[w / 2, h * 0.45 - 6, w / 2, h * 0.45 + 6]} stroke={c} strokeWidth={0.8} opacity={0.2} />
            <Line points={[2, 2, 12, 2]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[2, 2, 2, 12]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[w - 2, 2, w - 12, 2]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[w - 2, 2, w - 2, 12]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[2, h - 2, 12, h - 2]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[2, h - 2, 2, h - 12]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[w - 2, h - 2, w - 12, h - 2]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Line points={[w - 2, h - 2, w - 2, h - 12]} stroke={c} strokeWidth={1} opacity={0.15} />
            <Circle x={w / 2} y={h * 0.005} radius={1.5} fill={c} opacity={0.15} />
            <Circle x={w / 2} y={h * 0.96} radius={1.5} fill={c} opacity={0.15} />
            <Circle x={w * 0.03} y={h * 0.48} radius={1.5} fill={c} opacity={0.15} />
            <Circle x={w * 0.97} y={h * 0.48} radius={1.5} fill={c} opacity={0.15} />
          </>
        );
      case 'body-standing':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Floor shadow */}
            <Line points={[w * 0.2, h * 0.95, w * 0.35, h * 0.98, w * 0.65, h * 0.98, w * 0.8, h * 0.95]} fill={c} opacity={0.06} closed tension={0.5} />
            {/* HEAD */}
            <Circle x={w / 2} y={h * 0.07} radius={w * 0.24} stroke={c} strokeWidth={2.8} />
            <Circle x={w / 2} y={h * 0.07} radius={w * 0.2} stroke={c} strokeWidth={0.5} opacity={0.08} />
            {/* Hair */}
            <Line points={[w * 0.28, h * 0.03, w * 0.35, h * 0.01, w * 0.5, h * 0.003, w * 0.65, h * 0.01, w * 0.72, h * 0.03]} stroke={c} strokeWidth={1.8} tension={0.5} opacity={0.35} />
            <Line points={[w * 0.32, h * 0.02, w * 0.42, h * 0.008, w * 0.5, h * 0.005]} stroke={c} strokeWidth={0.6} opacity={0.12} tension={0.4} />
            {/* Ears */}
            <Line points={[w * 0.26, h * 0.06, w * 0.22, h * 0.065, w * 0.21, h * 0.08, w * 0.23, h * 0.095, w * 0.26, h * 0.085]} stroke={c} strokeWidth={0.9} opacity={0.3} tension={0.4} />
            <Line points={[w * 0.74, h * 0.06, w * 0.78, h * 0.065, w * 0.79, h * 0.08, w * 0.77, h * 0.095, w * 0.74, h * 0.085]} stroke={c} strokeWidth={0.9} opacity={0.3} tension={0.4} />
            {/* Eyebrows */}
            <Line points={[w * 0.35, h * 0.055, w * 0.39, h * 0.05, w * 0.44, h * 0.053]} stroke={c} strokeWidth={1.2} opacity={0.45} tension={0.3} />
            <Line points={[w * 0.56, h * 0.053, w * 0.61, h * 0.05, w * 0.65, h * 0.055]} stroke={c} strokeWidth={1.2} opacity={0.45} tension={0.3} />
            {/* Eyes */}
            <Line points={[w * 0.36, h * 0.068, w * 0.4, h * 0.063, w * 0.45, h * 0.068, w * 0.4, h * 0.073]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Circle x={w * 0.405} y={h * 0.068} radius={1.2} fill={c} opacity={0.45} />
            <Line points={[w * 0.55, h * 0.068, w * 0.6, h * 0.063, w * 0.64, h * 0.068, w * 0.6, h * 0.073]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Circle x={w * 0.595} y={h * 0.068} radius={1.2} fill={c} opacity={0.45} />
            {/* Nose */}
            <Line points={[w * 0.5, h * 0.065, w * 0.48, h * 0.085, w * 0.47, h * 0.098, w * 0.5, h * 0.102, w * 0.53, h * 0.098, w * 0.52, h * 0.085]} stroke={c} strokeWidth={0.7} opacity={0.3} tension={0.3} />
            {/* Mouth */}
            <Line points={[w * 0.43, h * 0.112, w * 0.48, h * 0.117, w * 0.5, h * 0.118, w * 0.52, h * 0.117, w * 0.57, h * 0.112]} stroke={c} strokeWidth={1} opacity={0.3} tension={0.3} />
            {/* Jaw */}
            <Line points={[w * 0.28, h * 0.065, w * 0.32, h * 0.1, w * 0.4, h * 0.12, w * 0.5, h * 0.13]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Line points={[w * 0.72, h * 0.065, w * 0.68, h * 0.1, w * 0.6, h * 0.12, w * 0.5, h * 0.13]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            {/* NECK */}
            <Line points={[w * 0.42, h * 0.14, w * 0.42, h * 0.21]} stroke={c} strokeWidth={2.2} lineCap="round" />
            <Line points={[w * 0.58, h * 0.14, w * 0.58, h * 0.21]} stroke={c} strokeWidth={2.2} lineCap="round" />
            <Line points={[w * 0.44, h * 0.16, w * 0.46, h * 0.2]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            <Line points={[w * 0.56, h * 0.16, w * 0.54, h * 0.2]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            <Line points={[w * 0.48, h * 0.21, w * 0.5, h * 0.215, w * 0.52, h * 0.21]} stroke={c} strokeWidth={0.6} opacity={0.15} />
            {/* SHOULDERS */}
            <Line points={[w * 0.05, h * 0.27, w * 0.15, h * 0.23, w * 0.28, h * 0.215, w * 0.42, h * 0.21, w * 0.58, h * 0.21, w * 0.72, h * 0.215, w * 0.85, h * 0.23, w * 0.95, h * 0.27]} stroke={c} strokeWidth={2.5} tension={0.3} lineCap="round" />
            {/* Deltoids */}
            <Line points={[w * 0.07, h * 0.26, w * 0.1, h * 0.24, w * 0.16, h * 0.225]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.3} />
            <Line points={[w * 0.93, h * 0.26, w * 0.9, h * 0.24, w * 0.84, h * 0.225]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.3} />
            {/* Clavicle */}
            <Line points={[w * 0.3, h * 0.22, w * 0.4, h * 0.215, w * 0.48, h * 0.218]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.2} />
            <Line points={[w * 0.7, h * 0.22, w * 0.6, h * 0.215, w * 0.52, h * 0.218]} stroke={c} strokeWidth={0.6} opacity={0.15} tension={0.2} />
            {/* TORSO */}
            <Line points={[w * 0.32, h * 0.22, w * 0.29, h * 0.35, w * 0.28, h * 0.45, w * 0.3, h * 0.54]} stroke={c} strokeWidth={2} tension={0.3} />
            <Line points={[w * 0.68, h * 0.22, w * 0.71, h * 0.35, w * 0.72, h * 0.45, w * 0.7, h * 0.54]} stroke={c} strokeWidth={2} tension={0.3} />
            {/* Pectorals */}
            <Line points={[w * 0.34, h * 0.24, w * 0.4, h * 0.26, w * 0.47, h * 0.265]} stroke={c} strokeWidth={0.7} opacity={0.15} tension={0.3} />
            <Line points={[w * 0.66, h * 0.24, w * 0.6, h * 0.26, w * 0.53, h * 0.265]} stroke={c} strokeWidth={0.7} opacity={0.15} tension={0.3} />
            {/* Sternum */}
            <Line points={[w * 0.5, h * 0.22, w * 0.5, h * 0.54]} stroke={c} strokeWidth={0.6} dash={[2, 4]} opacity={0.08} />
            {/* Abs */}
            <Line points={[w * 0.45, h * 0.38, w * 0.45, h * 0.5]} stroke={c} strokeWidth={0.4} opacity={0.08} />
            <Line points={[w * 0.55, h * 0.38, w * 0.55, h * 0.5]} stroke={c} strokeWidth={0.4} opacity={0.08} />
            <Line points={[w * 0.42, h * 0.4, w * 0.48, h * 0.4]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.52, h * 0.4, w * 0.58, h * 0.4]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.42, h * 0.44, w * 0.48, h * 0.44]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.52, h * 0.44, w * 0.58, h * 0.44]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Circle x={w * 0.5} y={h * 0.48} radius={1.5} stroke={c} strokeWidth={0.6} opacity={0.15} />
            {/* LEFT ARM */}
            <Line points={[w * 0.05, h * 0.27, w * 0.04, h * 0.33, w * 0.03, h * 0.39, w * 0.035, h * 0.44]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.06, h * 0.29, w * 0.05, h * 0.34, w * 0.04, h * 0.38]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.035} y={h * 0.44} radius={2.5} stroke={c} strokeWidth={0.7} opacity={0.2} />
            <Line points={[w * 0.035, h * 0.44, w * 0.05, h * 0.49, w * 0.08, h * 0.54]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.08, h * 0.54, w * 0.09, h * 0.555, w * 0.1, h * 0.57, w * 0.12, h * 0.575, w * 0.115, h * 0.56, w * 0.1, h * 0.545]} stroke={c} strokeWidth={1} opacity={0.5} tension={0.3} closed />
            <Line points={[w * 0.085, h * 0.56, w * 0.07, h * 0.555]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            <Line points={[w * 0.095, h * 0.565, w * 0.08, h * 0.558]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            <Line points={[w * 0.105, h * 0.568, w * 0.095, h * 0.555]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            {/* RIGHT ARM */}
            <Line points={[w * 0.95, h * 0.27, w * 0.96, h * 0.33, w * 0.97, h * 0.39, w * 0.965, h * 0.44]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.94, h * 0.29, w * 0.95, h * 0.34, w * 0.96, h * 0.38]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.965} y={h * 0.44} radius={2.5} stroke={c} strokeWidth={0.7} opacity={0.2} />
            <Line points={[w * 0.965, h * 0.44, w * 0.95, h * 0.49, w * 0.92, h * 0.54]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.92, h * 0.54, w * 0.91, h * 0.555, w * 0.9, h * 0.57, w * 0.88, h * 0.575, w * 0.885, h * 0.56, w * 0.9, h * 0.545]} stroke={c} strokeWidth={1} opacity={0.5} tension={0.3} closed />
            <Line points={[w * 0.915, h * 0.56, w * 0.93, h * 0.555]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            <Line points={[w * 0.905, h * 0.565, w * 0.92, h * 0.558]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            <Line points={[w * 0.895, h * 0.568, w * 0.905, h * 0.555]} stroke={c} strokeWidth={0.6} opacity={0.35} lineCap="round" />
            {/* BELT */}
            <Line points={[w * 0.26, h * 0.555, w * 0.35, h * 0.545, w * 0.5, h * 0.54, w * 0.65, h * 0.545, w * 0.74, h * 0.555]} stroke={c} strokeWidth={1.8} tension={0.2} />
            {/* HIP */}
            <Line points={[w * 0.24, h * 0.58, w * 0.35, h * 0.565, w * 0.5, h * 0.56, w * 0.65, h * 0.565, w * 0.76, h * 0.58]} stroke={c} strokeWidth={2} tension={0.3} />
            {/* LEFT LEG */}
            <Line points={[w * 0.35, h * 0.58, w * 0.33, h * 0.64, w * 0.3, h * 0.7, w * 0.28, h * 0.75]} stroke={c} strokeWidth={2.8} lineCap="round" tension={0.2} />
            <Line points={[w * 0.34, h * 0.6, w * 0.32, h * 0.65, w * 0.295, h * 0.7]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.275} y={h * 0.76} radius={3.5} stroke={c} strokeWidth={1} opacity={0.3} />
            <Circle x={w * 0.275} y={h * 0.76} radius={1.5} fill={c} opacity={0.06} />
            <Line points={[w * 0.275, h * 0.78, w * 0.26, h * 0.84, w * 0.24, h * 0.89]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.29, h * 0.79, w * 0.28, h * 0.83, w * 0.265, h * 0.87]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.235} y={h * 0.895} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.24, h * 0.9, w * 0.18, h * 0.935, w * 0.14, h * 0.95, w * 0.12, h * 0.955]} stroke={c} strokeWidth={3} lineCap="round" tension={0.3} />
            <Line points={[w * 0.12, h * 0.95, w * 0.105, h * 0.948]} stroke={c} strokeWidth={0.7} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.115, h * 0.956, w * 0.1, h * 0.955]} stroke={c} strokeWidth={0.7} opacity={0.3} lineCap="round" />
            {/* RIGHT LEG */}
            <Line points={[w * 0.65, h * 0.58, w * 0.67, h * 0.64, w * 0.7, h * 0.7, w * 0.72, h * 0.75]} stroke={c} strokeWidth={2.8} lineCap="round" tension={0.2} />
            <Line points={[w * 0.66, h * 0.6, w * 0.68, h * 0.65, w * 0.705, h * 0.7]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.725} y={h * 0.76} radius={3.5} stroke={c} strokeWidth={1} opacity={0.3} />
            <Circle x={w * 0.725} y={h * 0.76} radius={1.5} fill={c} opacity={0.06} />
            <Line points={[w * 0.725, h * 0.78, w * 0.74, h * 0.84, w * 0.76, h * 0.89]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.71, h * 0.79, w * 0.72, h * 0.83, w * 0.735, h * 0.87]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            <Circle x={w * 0.765} y={h * 0.895} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.76, h * 0.9, w * 0.82, h * 0.935, w * 0.86, h * 0.95, w * 0.88, h * 0.955]} stroke={c} strokeWidth={3} lineCap="round" tension={0.3} />
            <Line points={[w * 0.88, h * 0.95, w * 0.895, h * 0.948]} stroke={c} strokeWidth={0.7} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.885, h * 0.956, w * 0.9, h * 0.955]} stroke={c} strokeWidth={0.7} opacity={0.3} lineCap="round" />
          </>
        );
      case 'body-prone':
        return (
          <>
            {/* Outline */}
            <Rect width={w} height={h} fill="transparent" stroke={c} strokeWidth={1.2} dash={[6, 4]} cornerRadius={8} opacity={0.2} />
            <Rect x={3} y={3} width={w - 6} height={h - 6} fill="transparent" stroke={c} strokeWidth={0.4} dash={[3, 5]} cornerRadius={6} opacity={0.06} />
            {/* Ground shadow */}
            <Rect x={w * 0.04} y={h * 0.15} width={w * 0.92} height={h * 0.7} fill={c} opacity={0.03} cornerRadius={14} />
            {/* HEAD face down */}
            <Circle x={w * 0.09} y={h / 2} radius={h * 0.3} stroke={c} strokeWidth={2.8} />
            <Circle x={w * 0.09} y={h / 2} radius={h * 0.24} stroke={c} strokeWidth={0.5} opacity={0.08} />
            {/* Hair whorl */}
            <Line points={[w * 0.06, h * 0.35, w * 0.08, h * 0.32, w * 0.11, h * 0.31, w * 0.13, h * 0.33]} stroke={c} strokeWidth={0.7} opacity={0.2} tension={0.5} />
            <Line points={[w * 0.07, h * 0.38, w * 0.1, h * 0.35, w * 0.12, h * 0.36]} stroke={c} strokeWidth={0.5} opacity={0.12} tension={0.5} />
            {/* Ear */}
            <Line points={[w * 0.04, h * 0.42, w * 0.025, h * 0.46, w * 0.025, h * 0.52, w * 0.04, h * 0.56]} stroke={c} strokeWidth={1} opacity={0.3} tension={0.4} />
            <Line points={[w * 0.035, h * 0.44, w * 0.03, h * 0.48, w * 0.03, h * 0.52, w * 0.035, h * 0.54]} stroke={c} strokeWidth={0.5} opacity={0.15} tension={0.3} />
            {/* Face-down X */}
            <Line points={[w * 0.065, h * 0.45, w * 0.115, h * 0.55]} stroke={c} strokeWidth={1} opacity={0.2} />
            <Line points={[w * 0.115, h * 0.45, w * 0.065, h * 0.55]} stroke={c} strokeWidth={1} opacity={0.2} />
            <Circle x={w * 0.09} y={h * 0.52} radius={1.5} fill={c} opacity={0.15} />
            {/* NECK */}
            <Line points={[w * 0.17, h * 0.42, w * 0.23, h * 0.42]} stroke={c} strokeWidth={2.5} lineCap="round" />
            <Line points={[w * 0.17, h * 0.58, w * 0.23, h * 0.58]} stroke={c} strokeWidth={2.5} lineCap="round" />
            <Line points={[w * 0.18, h * 0.46, w * 0.2, h * 0.46]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            <Line points={[w * 0.19, h * 0.5, w * 0.21, h * 0.5]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            <Line points={[w * 0.18, h * 0.54, w * 0.2, h * 0.54]} stroke={c} strokeWidth={0.5} opacity={0.1} />
            {/* SHOULDERS */}
            <Line points={[w * 0.23, h * 0.28, w * 0.23, h * 0.72]} stroke={c} strokeWidth={2.2} />
            {/* Shoulder blades */}
            <Line points={[w * 0.27, h * 0.32, w * 0.32, h * 0.3, w * 0.36, h * 0.33, w * 0.33, h * 0.38, w * 0.28, h * 0.37]} stroke={c} strokeWidth={0.6} opacity={0.12} tension={0.3} closed />
            <Line points={[w * 0.27, h * 0.68, w * 0.32, h * 0.7, w * 0.36, h * 0.67, w * 0.33, h * 0.62, w * 0.28, h * 0.63]} stroke={c} strokeWidth={0.6} opacity={0.12} tension={0.3} closed />
            {/* SPINE */}
            <Line points={[w * 0.24, h * 0.5, w * 0.55, h * 0.5]} stroke={c} strokeWidth={1.2} dash={[2, 3]} opacity={0.12} />
            {[0.28, 0.32, 0.36, 0.4, 0.44, 0.48, 0.52].map((xp, i) => (
              <Circle key={`vert-${i}`} x={w * xp} y={h * 0.5} radius={1} fill={c} opacity={0.08} />
            ))}
            {/* TORSO */}
            <Line points={[w * 0.55, h * 0.26, w * 0.55, h * 0.74]} stroke={c} strokeWidth={2.2} />
            <Line points={[w * 0.23, h * 0.28, w * 0.55, h * 0.26, w * 0.55, h * 0.74, w * 0.23, h * 0.72]} fill={c} opacity={0.025} closed />
            {/* Lats */}
            <Line points={[w * 0.25, h * 0.34, w * 0.35, h * 0.32, w * 0.45, h * 0.33]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.3} />
            <Line points={[w * 0.25, h * 0.66, w * 0.35, h * 0.68, w * 0.45, h * 0.67]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.3} />
            {/* Ribs */}
            <Line points={[w * 0.28, h * 0.38, w * 0.38, h * 0.37]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.28, h * 0.42, w * 0.4, h * 0.41]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.28, h * 0.58, w * 0.4, h * 0.59]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            <Line points={[w * 0.28, h * 0.62, w * 0.38, h * 0.63]} stroke={c} strokeWidth={0.4} opacity={0.06} />
            {/* HIP */}
            <Line points={[w * 0.55, h * 0.28, w * 0.58, h * 0.34, w * 0.58, h * 0.66, w * 0.55, h * 0.72]} stroke={c} strokeWidth={1.5} tension={0.2} />
            <Line points={[w * 0.57, h * 0.44, w * 0.58, h * 0.5, w * 0.57, h * 0.56]} stroke={c} strokeWidth={0.5} opacity={0.1} tension={0.3} />
            {/* LEFT ARM */}
            <Line points={[w * 0.24, h * 0.28, w * 0.2, h * 0.2, w * 0.17, h * 0.14]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.17} y={h * 0.14} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.17, h * 0.14, w * 0.2, h * 0.1, w * 0.24, h * 0.07]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.24, h * 0.07, w * 0.26, h * 0.055, w * 0.265, h * 0.045, w * 0.255, h * 0.04, w * 0.24, h * 0.05, w * 0.235, h * 0.065]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Line points={[w * 0.255, h * 0.045, w * 0.265, h * 0.03]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.26, h * 0.05, w * 0.275, h * 0.038]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.255, h * 0.058, w * 0.27, h * 0.05]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* RIGHT ARM */}
            <Line points={[w * 0.24, h * 0.72, w * 0.2, h * 0.8, w * 0.17, h * 0.86]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.17} y={h * 0.86} radius={2} stroke={c} strokeWidth={0.6} opacity={0.2} />
            <Line points={[w * 0.17, h * 0.86, w * 0.2, h * 0.9, w * 0.24, h * 0.93]} stroke={c} strokeWidth={2} lineCap="round" tension={0.2} />
            <Line points={[w * 0.24, h * 0.93, w * 0.26, h * 0.945, w * 0.265, h * 0.955, w * 0.255, h * 0.96, w * 0.24, h * 0.95, w * 0.235, h * 0.935]} stroke={c} strokeWidth={0.9} opacity={0.5} tension={0.3} closed />
            <Line points={[w * 0.255, h * 0.955, w * 0.265, h * 0.97]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.26, h * 0.95, w * 0.275, h * 0.962]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.255, h * 0.942, w * 0.27, h * 0.95]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* LEFT LEG */}
            <Line points={[w * 0.58, h * 0.3, w * 0.67, h * 0.26, w * 0.76, h * 0.2]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.6, h * 0.32, w * 0.66, h * 0.29, w * 0.72, h * 0.24]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.3} />
            <Circle x={w * 0.76} y={h * 0.2} radius={2.5} stroke={c} strokeWidth={0.7} opacity={0.2} />
            <Line points={[w * 0.76, h * 0.2, w * 0.84, h * 0.19, w * 0.9, h * 0.17]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.9} y={h * 0.17} radius={1.8} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[w * 0.9, h * 0.17, w * 0.94, h * 0.15, w * 0.96, h * 0.135]} stroke={c} strokeWidth={2.8} lineCap="round" />
            <Line points={[w * 0.96, h * 0.13, w * 0.968, h * 0.12]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.965, h * 0.14, w * 0.975, h * 0.133]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* RIGHT LEG */}
            <Line points={[w * 0.58, h * 0.7, w * 0.67, h * 0.74, w * 0.76, h * 0.8]} stroke={c} strokeWidth={2.5} lineCap="round" tension={0.2} />
            <Line points={[w * 0.6, h * 0.68, w * 0.66, h * 0.71, w * 0.72, h * 0.76]} stroke={c} strokeWidth={0.5} opacity={0.08} tension={0.3} />
            <Circle x={w * 0.76} y={h * 0.8} radius={2.5} stroke={c} strokeWidth={0.7} opacity={0.2} />
            <Line points={[w * 0.76, h * 0.8, w * 0.84, h * 0.81, w * 0.9, h * 0.83]} stroke={c} strokeWidth={2.2} lineCap="round" tension={0.2} />
            <Circle x={w * 0.9} y={h * 0.83} radius={1.8} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[w * 0.9, h * 0.83, w * 0.94, h * 0.85, w * 0.96, h * 0.865]} stroke={c} strokeWidth={2.8} lineCap="round" />
            <Line points={[w * 0.96, h * 0.87, w * 0.968, h * 0.88]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            <Line points={[w * 0.965, h * 0.86, w * 0.975, h * 0.867]} stroke={c} strokeWidth={0.6} opacity={0.3} lineCap="round" />
            {/* FORENSIC MARKERS */}
            <Circle x={w * 0.4} y={h / 2} radius={4} stroke={c} strokeWidth={0.7} opacity={0.15} />
            <Line points={[w * 0.4 - 5, h / 2, w * 0.4 + 5, h / 2]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[w * 0.4, h / 2 - 5, w * 0.4, h / 2 + 5]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[2, 2, 10, 2]} stroke={c} strokeWidth={0.8} opacity={0.12} />
            <Line points={[2, 2, 2, 10]} stroke={c} strokeWidth={0.8} opacity={0.12} />
            <Line points={[w - 2, h - 2, w - 10, h - 2]} stroke={c} strokeWidth={0.8} opacity={0.12} />
            <Line points={[w - 2, h - 2, w - 2, h - 10]} stroke={c} strokeWidth={0.8} opacity={0.12} />
          </>
        );
      case 'knife':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Blade with spine and edge */}
            <Line points={[2, h / 2 + 1, w * 0.15, h / 2 - 3, w * 0.6, h / 2 - 2, w * 0.63, h / 2]} stroke="#94a3b8" strokeWidth={0.8} fill="#e2e8f0" closed />
            <Line points={[2, h / 2 + 1, w * 0.6, h / 2 + 2, w * 0.63, h / 2]} stroke="#94a3b8" strokeWidth={0.8} fill="#cbd5e1" closed />
            {/* Blade reflection */}
            <Line points={[w * 0.1, h / 2 - 1, w * 0.5, h / 2 - 1]} stroke="#f8fafc" strokeWidth={0.5} opacity={0.4} />
            {/* Blood spot */}
            <Circle x={w * 0.25} y={h / 2} radius={2} fill="#dc2626" opacity={0.4} />
            {/* Guard */}
            <Rect x={w * 0.61} y={h / 2 - 5} width={4} height={10} fill="#a8a29e" stroke="#78716c" strokeWidth={0.5} cornerRadius={1} />
            {/* Handle with grip texture */}
            <Rect x={w * 0.65} y={h / 2 - 4} width={w * 0.32} height={8} fill="#78350f" stroke="#451a03" strokeWidth={0.8} cornerRadius={2} />
            <Line points={[w * 0.7, h / 2 - 3, w * 0.7, h / 2 + 3]} stroke="#451a03" strokeWidth={0.5} opacity={0.5} />
            <Line points={[w * 0.76, h / 2 - 3, w * 0.76, h / 2 + 3]} stroke="#451a03" strokeWidth={0.5} opacity={0.5} />
            <Line points={[w * 0.82, h / 2 - 3, w * 0.82, h / 2 + 3]} stroke="#451a03" strokeWidth={0.5} opacity={0.5} />
            <Line points={[w * 0.88, h / 2 - 3, w * 0.88, h / 2 + 3]} stroke="#451a03" strokeWidth={0.5} opacity={0.5} />
            {/* Pommel */}
            <Circle x={w * 0.97} y={h / 2} radius={3} fill="#78716c" stroke="#57534e" strokeWidth={0.5} />
          </>
        );
      case 'gun':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Barrel */}
            <Rect x={w * 0.5} y={h * 0.18} width={w * 0.48} height={h * 0.18} fill="#374151" stroke="#1f2937" strokeWidth={1} cornerRadius={[1, 3, 3, 1]} />
            {/* Barrel bore */}
            <Circle x={w * 0.98} y={h * 0.27} radius={2} fill="#111827" stroke="#1f2937" strokeWidth={0.5} />
            {/* Slide */}
            <Rect x={w * 0.15} y={h * 0.12} width={w * 0.55} height={h * 0.3} fill="#4b5563" stroke="#1f2937" strokeWidth={1} cornerRadius={3} />
            {/* Slide serrations */}
            {Array.from({ length: 5 }).map((_, i) => (
              <Line key={i} points={[w * 0.2 + i * 6, h * 0.14, w * 0.2 + i * 6, h * 0.4]} stroke="#374151" strokeWidth={0.8} opacity={0.5} />
            ))}
            {/* Ejection port */}
            <Rect x={w * 0.4} y={h * 0.15} width={w * 0.1} height={h * 0.12} fill="#1f2937" stroke="#111827" strokeWidth={0.5} cornerRadius={1} />
            {/* Frame */}
            <Rect x={w * 0.15} y={h * 0.38} width={w * 0.42} height={h * 0.15} fill="#6b7280" stroke="#4b5563" strokeWidth={0.8} />
            {/* Trigger guard */}
            <Line points={[w * 0.32, h * 0.5, w * 0.32, h * 0.72, w * 0.48, h * 0.72, w * 0.48, h * 0.5]} stroke="#4b5563" strokeWidth={1.5} fill="#1f2937" opacity={0.3} />
            {/* Trigger */}
            <Line points={[w * 0.4, h * 0.52, w * 0.38, h * 0.66]} stroke="#374151" strokeWidth={2} lineCap="round" />
            {/* Grip */}
            <Line points={[w * 0.15, h * 0.5, w * 0.08, h * 0.92, w * 0.32, h * 0.95, w * 0.38, h * 0.5]} fill="#78350f" stroke="#451a03" strokeWidth={1} closed />
            {/* Grip texture */}
            <Line points={[w * 0.14, h * 0.6, w * 0.3, h * 0.6]} stroke="#451a03" strokeWidth={0.5} opacity={0.4} />
            <Line points={[w * 0.12, h * 0.7, w * 0.31, h * 0.7]} stroke="#451a03" strokeWidth={0.5} opacity={0.4} />
            <Line points={[w * 0.1, h * 0.8, w * 0.32, h * 0.8]} stroke="#451a03" strokeWidth={0.5} opacity={0.4} />
            {/* Magazine base */}
            <Rect x={w * 0.1} y={h * 0.9} width={w * 0.2} height={h * 0.08} fill="#6b7280" stroke="#4b5563" strokeWidth={0.5} cornerRadius={1} />
            {/* Front sight */}
            <Rect x={w * 0.92} y={h * 0.1} width={3} height={h * 0.08} fill="#374151" />
            {/* Rear sight */}
            <Rect x={w * 0.18} y={h * 0.1} width={5} height={h * 0.05} fill="#374151" />
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
            <Line points={[w / 2, 0, w / 2, h / 2 - 3]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[w / 2, h, w / 2, h / 2 + 3]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[0, h / 2, w / 2 - 3, h / 2]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[w, h / 2, w / 2 + 3, h / 2]} stroke="#475569" strokeWidth={0.8} />
            <Line points={[2, 2, w / 2 - 2, h / 2 - 2]} stroke="#475569" strokeWidth={0.5} />
            <Line points={[w - 2, h - 2, w / 2 + 2, h / 2 + 2]} stroke="#475569" strokeWidth={0.5} />
          </>
        );
      case 'evidence-marker':
        return (
          <>
            {/* Ground shadow */}
            <Line points={[w * 0.15, h * 0.94, w * 0.85, h * 0.94, w * 0.9, h * 0.98, w * 0.1, h * 0.98]} fill="#000" opacity={0.1} closed tension={0.2} />
            {/* Tent base with thickness */}
            <Rect x={w * 0.06} y={h * 0.9} width={w * 0.88} height={h * 0.06} fill="#92400e" cornerRadius={1} opacity={0.6} />
            <Line points={[w * 0.06, h * 0.9, w * 0.94, h * 0.9]} stroke="#a16207" strokeWidth={1.5} />
            {/* Tent back face (darker) */}
            <Line points={[w / 2, h * 0.01, w * 0.06, h * 0.9, w * 0.94, h * 0.9]} fill="#a16207" opacity={0.15} closed />
            {/* Tent front face */}
            <Line points={[w / 2, h * 0.01, w * 0.94, h * 0.9, w * 0.06, h * 0.9]} fill={c} stroke="#b45309" strokeWidth={1.5} closed />
            {/* Left edge highlight */}
            <Line points={[w / 2, h * 0.01, w * 0.06, h * 0.9]} stroke="#fde047" strokeWidth={0.8} opacity={0.5} />
            {/* Right edge shadow */}
            <Line points={[w / 2, h * 0.01, w * 0.94, h * 0.9]} stroke="#92400e" strokeWidth={0.8} opacity={0.4} />
            {/* Center fold crease */}
            <Line points={[w / 2, h * 0.01, w / 2, h * 0.9]} stroke="#a16207" strokeWidth={0.6} opacity={0.35} />
            {/* Surface texture lines */}
            <Line points={[w * 0.3, h * 0.5, w * 0.35, h * 0.48]} stroke="#a16207" strokeWidth={0.4} opacity={0.2} />
            <Line points={[w * 0.6, h * 0.55, w * 0.65, h * 0.53]} stroke="#a16207" strokeWidth={0.4} opacity={0.2} />
            <Line points={[w * 0.45, h * 0.7, w * 0.52, h * 0.68]} stroke="#a16207" strokeWidth={0.4} opacity={0.2} />
            {/* Number background circle */}
            <Circle x={w / 2} y={h * 0.5} radius={Math.min(w, h) * 0.18} fill="#1c1917" opacity={0.15} />
            {/* Number/letter */}
            <Text text={obj.evidenceId || '#'} x={0} y={h * 0.36} width={w} align="center" fontSize={Math.min(20, w * 0.5)} fontStyle="bold" fill="#1c1917" fontFamily="JetBrains Mono, monospace" />
            {/* Top apex detail */}
            <Circle x={w / 2} y={h * 0.01} radius={2} fill="#fbbf24" opacity={0.6} />
            {/* Reflective strip at base */}
            <Rect x={w * 0.08} y={h * 0.84} width={w * 0.84} height={h * 0.04} fill="#fde047" opacity={0.15} cornerRadius={1} />
          </>
        );
      case 'blood-stain':
        return (
            <>
              {/* Main pooling - organic shape */}
              <Line points={[
                w * 0.2, h * 0.35, w * 0.25, h * 0.2, w * 0.4, h * 0.12, w * 0.6, h * 0.15,
                w * 0.75, h * 0.25, w * 0.82, h * 0.4, w * 0.8, h * 0.6, w * 0.72, h * 0.75,
                w * 0.55, h * 0.82, w * 0.35, h * 0.8, w * 0.2, h * 0.7, w * 0.15, h * 0.5
              ]} fill="#991b1b" opacity={0.6} closed tension={0.35} />
              {/* Inner darker core */}
              <Line points={[
                w * 0.3, h * 0.38, w * 0.4, h * 0.28, w * 0.55, h * 0.3,
                w * 0.65, h * 0.4, w * 0.62, h * 0.58, w * 0.5, h * 0.65,
                w * 0.35, h * 0.6, w * 0.28, h * 0.48
              ]} fill="#7f1d1d" opacity={0.55} closed tension={0.35} />
              {/* Darkest center */}
              <Line points={[
                w * 0.38, h * 0.4, w * 0.48, h * 0.35, w * 0.56, h * 0.42,
                w * 0.52, h * 0.55, w * 0.42, h * 0.55
              ]} fill="#450a0a" opacity={0.5} closed tension={0.3} />
              {/* Surface reflection */}
              <Line points={[w * 0.42, h * 0.38, w * 0.5, h * 0.36, w * 0.54, h * 0.4]} stroke="#fca5a5" strokeWidth={0.8} opacity={0.15} tension={0.3} />
              {/* Coagulation edge */}
              <Line points={[
                w * 0.2, h * 0.35, w * 0.25, h * 0.2, w * 0.4, h * 0.12, w * 0.6, h * 0.15,
                w * 0.75, h * 0.25, w * 0.82, h * 0.4, w * 0.8, h * 0.6, w * 0.72, h * 0.75,
                w * 0.55, h * 0.82, w * 0.35, h * 0.8, w * 0.2, h * 0.7, w * 0.15, h * 0.5
              ]} stroke="#7f1d1d" strokeWidth={1.2} opacity={0.4} closed tension={0.35} />
              {/* Satellite spatter */}
              <Circle x={w * 0.88} y={h * 0.2} radius={r * 0.04} fill={c} opacity={0.6} />
              <Circle x={w * 0.92} y={h * 0.15} radius={r * 0.025} fill={c} opacity={0.5} />
              <Circle x={w * 0.95} y={h * 0.12} radius={r * 0.015} fill={c} opacity={0.4} />
              <Circle x={w * 0.1} y={h * 0.15} radius={r * 0.035} fill={c} opacity={0.5} />
              <Circle x={w * 0.05} y={h * 0.1} radius={r * 0.02} fill={c} opacity={0.4} />
              <Circle x={w * 0.08} y={h * 0.22} radius={r * 0.015} fill={c} opacity={0.35} />
              <Circle x={w * 0.82} y={h * 0.82} radius={r * 0.03} fill={c} opacity={0.5} />
              <Circle x={w * 0.88} y={h * 0.88} radius={r * 0.018} fill={c} opacity={0.4} />
              <Circle x={w * 0.18} y={h * 0.88} radius={r * 0.025} fill={c} opacity={0.45} />
              {/* Elongated directional spatter */}
              <Line points={[w * 0.85, h * 0.3, w * 0.9, h * 0.25]} stroke={c} strokeWidth={2.5} lineCap="round" opacity={0.45} />
              <Line points={[w * 0.87, h * 0.35, w * 0.93, h * 0.28]} stroke={c} strokeWidth={1.5} lineCap="round" opacity={0.35} />
              {/* Drag/smear trail */}
              <Line points={[w * 0.7, h * 0.55, w * 0.85, h * 0.5, w * 0.92, h * 0.48]} stroke={c} strokeWidth={3} opacity={0.2} lineCap="round" tension={0.3} />
              <Line points={[w * 0.72, h * 0.58, w * 0.88, h * 0.53, w * 0.95, h * 0.52]} stroke={c} strokeWidth={1.5} opacity={0.12} lineCap="round" tension={0.3} />
              {/* Transfer pattern */}
              <Line points={[w * 0.35, h * 0.85, w * 0.42, h * 0.86]} stroke="#7f1d1d" strokeWidth={0.6} opacity={0.2} />
              <Line points={[w * 0.36, h * 0.87, w * 0.41, h * 0.88]} stroke="#7f1d1d" strokeWidth={0.6} opacity={0.2} />
              {/* Void pattern */}
              <Circle x={w * 0.48} y={h * 0.48} radius={r * 0.06} stroke="#450a0a" strokeWidth={0.5} opacity={0.15} dash={[2, 2]} />
            </>
        );
      case 'footprint':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Sole outline with anatomical shape */}
            <Line points={[
              w * 0.3, h * 0.08, w * 0.4, h * 0.03, w * 0.6, h * 0.03, w * 0.7, h * 0.08,
              w * 0.75, h * 0.2, w * 0.78, h * 0.35, w * 0.76, h * 0.48,
              w * 0.72, h * 0.58, w * 0.68, h * 0.62, w * 0.32, h * 0.62, w * 0.28, h * 0.58,
              w * 0.24, h * 0.48, w * 0.22, h * 0.35, w * 0.25, h * 0.2
            ]} fill={c} opacity={0.45} closed stroke={c} strokeWidth={1.5} tension={0.15} />
            {/* Heel with rounded shape */}
            <Line points={[
              w * 0.3, h * 0.72, w * 0.32, h * 0.68, w * 0.68, h * 0.68, w * 0.7, h * 0.72,
              w * 0.72, h * 0.85, w * 0.68, h * 0.95, w * 0.32, h * 0.95, w * 0.28, h * 0.85
            ]} fill={c} opacity={0.55} closed stroke={c} strokeWidth={1.5} tension={0.15} />
            {/* Arch gap */}
            <Line points={[w * 0.32, h * 0.62, w * 0.38, h * 0.66, w * 0.38, h * 0.68, w * 0.32, h * 0.72]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Line points={[w * 0.68, h * 0.62, w * 0.62, h * 0.66, w * 0.62, h * 0.68, w * 0.68, h * 0.72]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            {/* Toe impressions */}
            <Circle x={w * 0.38} y={h * 0.06} radius={r * 0.04} fill={c} opacity={0.3} />
            <Circle x={w * 0.5} y={h * 0.04} radius={r * 0.045} fill={c} opacity={0.3} />
            <Circle x={w * 0.62} y={h * 0.06} radius={r * 0.04} fill={c} opacity={0.3} />
            {/* Tread pattern - herringbone */}
            {Array.from({ length: 6 }).map((_, i) => {
              const ty = h * (0.12 + i * 0.08);
              return (
                <React.Fragment key={`tread-${i}`}>
                  <Line points={[w * 0.32, ty, w * 0.5, ty - h * 0.015, w * 0.68, ty]} stroke="#a3a3a3" strokeWidth={0.7} opacity={0.4} />
                  <Line points={[w * 0.35, ty + h * 0.02, w * 0.5, ty + h * 0.005, w * 0.65, ty + h * 0.02]} stroke="#a3a3a3" strokeWidth={0.5} opacity={0.25} />
                </React.Fragment>
              );
            })}
            {/* Heel tread - cross-hatch */}
            <Line points={[w * 0.35, h * 0.76, w * 0.65, h * 0.76]} stroke="#a3a3a3" strokeWidth={0.6} opacity={0.35} />
            <Line points={[w * 0.34, h * 0.82, w * 0.66, h * 0.82]} stroke="#a3a3a3" strokeWidth={0.6} opacity={0.35} />
            <Line points={[w * 0.35, h * 0.88, w * 0.65, h * 0.88]} stroke="#a3a3a3" strokeWidth={0.6} opacity={0.35} />
            {/* Brand mark hint */}
            <Circle x={w * 0.5} y={h * 0.82} radius={r * 0.06} stroke="#a3a3a3" strokeWidth={0.5} opacity={0.2} />
            {/* Pressure map - darker at ball and heel */}
            <Circle x={w * 0.5} y={h * 0.3} radius={r * 0.12} fill={c} opacity={0.12} />
            <Circle x={w * 0.5} y={h * 0.82} radius={r * 0.1} fill={c} opacity={0.1} />
            {/* Scale reference */}
            <Line points={[w * 0.02, h * 0.95, w * 0.02, h * 0.05]} stroke={c} strokeWidth={0.4} opacity={0.3} />
            <Line points={[w * 0.01, h * 0.05, w * 0.03, h * 0.05]} stroke={c} strokeWidth={0.4} opacity={0.3} />
            <Line points={[w * 0.01, h * 0.95, w * 0.03, h * 0.95]} stroke={c} strokeWidth={0.4} opacity={0.3} />
          </>
        );
      case 'tire-mark':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Left track */}
            <Line points={[0, h * 0.2, w, h * 0.2]} stroke={c} strokeWidth={5} opacity={0.5} lineCap="round" />
            <Line points={[0, h * 0.2, w, h * 0.2]} stroke={c} strokeWidth={3} opacity={0.3} />
            <Line points={[0, h * 0.3, w, h * 0.3]} stroke={c} strokeWidth={1} opacity={0.15} />
            {/* Right track */}
            <Line points={[0, h * 0.75, w, h * 0.75]} stroke={c} strokeWidth={5} opacity={0.5} lineCap="round" />
            <Line points={[0, h * 0.75, w, h * 0.75]} stroke={c} strokeWidth={3} opacity={0.3} />
            <Line points={[0, h * 0.65, w, h * 0.65]} stroke={c} strokeWidth={1} opacity={0.15} />
            {/* Tread pattern - detailed chevron */}
            {Array.from({ length: Math.floor(w / 8) }).map((_, i) => (
              <React.Fragment key={i}>
                <Line points={[i * 8, h * 0.14, i * 8 + 4, h * 0.26, i * 8 + 8, h * 0.14]} stroke={c} strokeWidth={1} opacity={0.3} />
                <Line points={[i * 8 + 2, h * 0.16, i * 8 + 4, h * 0.24, i * 8 + 6, h * 0.16]} stroke={c} strokeWidth={0.5} opacity={0.15} />
                <Line points={[i * 8, h * 0.81, i * 8 + 4, h * 0.69, i * 8 + 8, h * 0.81]} stroke={c} strokeWidth={1} opacity={0.3} />
                <Line points={[i * 8 + 2, h * 0.79, i * 8 + 4, h * 0.71, i * 8 + 6, h * 0.79]} stroke={c} strokeWidth={0.5} opacity={0.15} />
              </React.Fragment>
            ))}
            {/* Track edges - debris */}
            <Circle x={w * 0.15} y={h * 0.12} radius={1} fill={c} opacity={0.2} />
            <Circle x={w * 0.4} y={h * 0.33} radius={0.8} fill={c} opacity={0.15} />
            <Circle x={w * 0.7} y={h * 0.85} radius={1.2} fill={c} opacity={0.2} />
            <Circle x={w * 0.85} y={h * 0.1} radius={0.6} fill={c} opacity={0.15} />
            {/* Skid fade effect */}
            <Rect x={0} y={0} width={w * 0.06} height={h} fill="transparent" opacity={0.3} />
          </>
        );
      case 'fingerprint':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Latent print background */}
            <Circle x={w / 2} y={h / 2} radius={r * 0.47} fill={c} opacity={0.04} />
            {/* Outer ridges - loop pattern */}
            <Line points={[w * 0.12, h * 0.55, w * 0.15, h * 0.3, w * 0.3, h * 0.12, w * 0.5, h * 0.05, w * 0.7, h * 0.12, w * 0.85, h * 0.3, w * 0.88, h * 0.55]} stroke={c} strokeWidth={0.7} opacity={0.2} tension={0.4} />
            <Line points={[w * 0.15, h * 0.55, w * 0.18, h * 0.32, w * 0.32, h * 0.16, w * 0.5, h * 0.1, w * 0.68, h * 0.16, w * 0.82, h * 0.32, w * 0.85, h * 0.55]} stroke={c} strokeWidth={0.7} opacity={0.25} tension={0.4} />
            <Line points={[w * 0.18, h * 0.55, w * 0.21, h * 0.34, w * 0.34, h * 0.2, w * 0.5, h * 0.15, w * 0.66, h * 0.2, w * 0.79, h * 0.34, w * 0.82, h * 0.55]} stroke={c} strokeWidth={0.7} opacity={0.3} tension={0.4} />
            {/* Core whorl pattern */}
            <Circle x={w / 2} y={h * 0.42} radius={r * 0.3} stroke={c} strokeWidth={0.7} opacity={0.25} />
            <Circle x={w / 2} y={h * 0.41} radius={r * 0.24} stroke={c} strokeWidth={0.7} opacity={0.3} />
            <Circle x={w / 2} y={h * 0.4} radius={r * 0.18} stroke={c} strokeWidth={0.7} opacity={0.35} />
            <Circle x={w / 2} y={h * 0.39} radius={r * 0.12} stroke={c} strokeWidth={0.7} opacity={0.4} />
            <Circle x={w / 2} y={h * 0.38} radius={r * 0.06} stroke={c} strokeWidth={0.7} opacity={0.5} />
            <Circle x={w / 2} y={h * 0.37} radius={r * 0.02} fill={c} opacity={0.5} />
            {/* Delta point (left) */}
            <Line points={[w * 0.2, h * 0.65, w * 0.25, h * 0.58, w * 0.3, h * 0.65]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Delta point (right) */}
            <Line points={[w * 0.7, h * 0.65, w * 0.75, h * 0.58, w * 0.8, h * 0.65]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Lower ridges */}
            <Line points={[w * 0.15, h * 0.65, w * 0.3, h * 0.78, w * 0.5, h * 0.85, w * 0.7, h * 0.78, w * 0.85, h * 0.65]} stroke={c} strokeWidth={0.6} opacity={0.2} tension={0.3} />
            <Line points={[w * 0.18, h * 0.72, w * 0.35, h * 0.84, w * 0.5, h * 0.9, w * 0.65, h * 0.84, w * 0.82, h * 0.72]} stroke={c} strokeWidth={0.6} opacity={0.18} tension={0.3} />
            <Line points={[w * 0.22, h * 0.78, w * 0.38, h * 0.88, w * 0.5, h * 0.94, w * 0.62, h * 0.88, w * 0.78, h * 0.78]} stroke={c} strokeWidth={0.5} opacity={0.15} tension={0.3} />
            {/* Ridge ending minutiae (forensic markers) */}
            <Circle x={w * 0.35} y={h * 0.3} radius={1.5} stroke="#22d3ee" strokeWidth={0.5} opacity={0.4} />
            <Circle x={w * 0.62} y={h * 0.35} radius={1.5} stroke="#22d3ee" strokeWidth={0.5} opacity={0.4} />
            <Circle x={w * 0.45} y={h * 0.55} radius={1.5} stroke="#22d3ee" strokeWidth={0.5} opacity={0.4} />
            {/* Bifurcation minutiae */}
            <Line points={[w * 0.55, h * 0.25, w * 0.58, h * 0.22]} stroke="#22d3ee" strokeWidth={0.4} opacity={0.35} />
            <Line points={[w * 0.55, h * 0.25, w * 0.58, h * 0.28]} stroke="#22d3ee" strokeWidth={0.4} opacity={0.35} />
            {/* Partial smudge */}
            <Line points={[w * 0.7, h * 0.45, w * 0.82, h * 0.42, w * 0.9, h * 0.45]} stroke={c} strokeWidth={2} opacity={0.06} lineCap="round" tension={0.3} />
          </>
        );
      case 'hair-fiber':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Collection circle */}
            <Circle x={w / 2} y={h / 2} radius={r * 0.46} stroke={c} strokeWidth={0.6} opacity={0.12} dash={[3, 3]} />
            {/* Main hair strand with natural curve */}
            <Line points={[
              w * 0.12, h * 0.88, w * 0.15, h * 0.7, w * 0.2, h * 0.55, w * 0.28, h * 0.42,
              w * 0.38, h * 0.35, w * 0.48, h * 0.45, w * 0.55, h * 0.32, w * 0.62, h * 0.2,
              w * 0.72, h * 0.28, w * 0.8, h * 0.18, w * 0.88, h * 0.12
            ]} stroke={c} strokeWidth={2} tension={0.45} lineCap="round" />
            {/* Hair thickness variation */}
            <Line points={[
              w * 0.14, h * 0.86, w * 0.17, h * 0.68, w * 0.22, h * 0.53, w * 0.3, h * 0.4,
              w * 0.4, h * 0.33, w * 0.5, h * 0.43, w * 0.57, h * 0.3, w * 0.64, h * 0.18,
              w * 0.74, h * 0.26, w * 0.82, h * 0.16, w * 0.9, h * 0.1
            ]} stroke={c} strokeWidth={0.8} tension={0.45} lineCap="round" opacity={0.4} />
            {/* Cuticle scale pattern */}
            <Line points={[w * 0.3, h * 0.4, w * 0.33, h * 0.38]} stroke={c} strokeWidth={0.5} opacity={0.3} />
            <Line points={[w * 0.45, h * 0.42, w * 0.48, h * 0.4]} stroke={c} strokeWidth={0.5} opacity={0.3} />
            <Line points={[w * 0.6, h * 0.22, w * 0.63, h * 0.2]} stroke={c} strokeWidth={0.5} opacity={0.3} />
            <Line points={[w * 0.75, h * 0.25, w * 0.78, h * 0.23]} stroke={c} strokeWidth={0.5} opacity={0.3} />
            {/* Root bulb (if visible) */}
            <Circle x={w * 0.12} y={h * 0.89} radius={2.5} fill={c} opacity={0.5} />
            <Circle x={w * 0.12} y={h * 0.89} radius={1.5} fill={c} opacity={0.3} />
            {/* Medulla hint (center line) */}
            <Line points={[w * 0.25, h * 0.5, w * 0.45, h * 0.4, w * 0.6, h * 0.25, w * 0.75, h * 0.22]} stroke={c} strokeWidth={0.4} opacity={0.15} tension={0.4} dash={[1, 2]} />
            {/* Scale bar */}
            <Line points={[w * 0.03, h * 0.96, w * 0.18, h * 0.96]} stroke={c} strokeWidth={0.6} opacity={0.4} />
            <Line points={[w * 0.03, h * 0.94, w * 0.03, h * 0.98]} stroke={c} strokeWidth={0.6} opacity={0.4} />
            <Line points={[w * 0.18, h * 0.94, w * 0.18, h * 0.98]} stroke={c} strokeWidth={0.6} opacity={0.4} />
            <Line points={[w * 0.105, h * 0.95, w * 0.105, h * 0.97]} stroke={c} strokeWidth={0.4} opacity={0.3} />
            {/* Microscope crosshair */}
            <Line points={[w * 0.45, h / 2, w * 0.55, h / 2]} stroke={c} strokeWidth={0.3} opacity={0.2} />
            <Line points={[w / 2, h * 0.45, w / 2, h * 0.55]} stroke={c} strokeWidth={0.3} opacity={0.2} />
          </>
        );
      case 'clothing':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={1.5} cornerRadius={3} />
            {/* Collar */}
            <Line points={[w * 0.3, 0, w * 0.42, h * 0.08, w * 0.5, h * 0.12, w * 0.58, h * 0.08, w * 0.7, 0]} stroke={c} strokeWidth={1.5} />
            <Line points={[w * 0.42, h * 0.08, w * 0.5, h * 0.04, w * 0.58, h * 0.08]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            {/* Shoulders */}
            <Line points={[w * 0.3, 0, 0, h * 0.22]} stroke={c} strokeWidth={1.5} />
            <Line points={[w * 0.7, 0, w, h * 0.22]} stroke={c} strokeWidth={1.5} />
            {/* Sleeves */}
            <Line points={[0, h * 0.22, w * 0.05, h * 0.35, w * 0.18, h * 0.35, w * 0.2, h * 0.22]} stroke={c} strokeWidth={1.2} />
            <Line points={[w, h * 0.22, w * 0.95, h * 0.35, w * 0.82, h * 0.35, w * 0.8, h * 0.22]} stroke={c} strokeWidth={1.2} />
            {/* Sides */}
            <Line points={[w * 0.2, h * 0.25, w * 0.18, h * 0.98]} stroke={c} strokeWidth={1.5} />
            <Line points={[w * 0.8, h * 0.25, w * 0.82, h * 0.98]} stroke={c} strokeWidth={1.5} />
            {/* Hem */}
            <Line points={[w * 0.18, h * 0.98, w * 0.82, h * 0.98]} stroke={c} strokeWidth={1.5} />
            {/* Button line */}
            <Line points={[w * 0.5, h * 0.12, w * 0.5, h * 0.95]} stroke={c} strokeWidth={0.5} opacity={0.25} />
            {/* Buttons */}
            <Circle x={w * 0.5} y={h * 0.25} radius={1.5} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Circle x={w * 0.5} y={h * 0.4} radius={1.5} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Circle x={w * 0.5} y={h * 0.55} radius={1.5} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Circle x={w * 0.5} y={h * 0.7} radius={1.5} stroke={c} strokeWidth={0.8} opacity={0.4} />
            {/* Wrinkle hints */}
            <Line points={[w * 0.3, h * 0.5, w * 0.4, h * 0.52]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Line points={[w * 0.6, h * 0.45, w * 0.7, h * 0.48]} stroke={c} strokeWidth={0.5} opacity={0.2} />
          </>
        );
      case 'document-evidence':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={1} cornerRadius={2} />
            {/* Dog ear */}
            <Line points={[w * 0.7, 0, w, h * 0.18]} stroke={c} strokeWidth={1} />
            <Line points={[w * 0.7, 0, w * 0.7, h * 0.18, w, h * 0.18]} stroke={c} strokeWidth={0.8} fill={c} opacity={0.12} closed />
            {/* Header line */}
            <Line points={[w * 0.12, h * 0.08, w * 0.55, h * 0.08]} stroke={c} strokeWidth={1.2} opacity={0.5} />
            {/* Text lines */}
            <Line points={[w * 0.12, h * 0.28, w * 0.88, h * 0.28]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.12, h * 0.38, w * 0.88, h * 0.38]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.12, h * 0.48, w * 0.75, h * 0.48]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.12, h * 0.58, w * 0.88, h * 0.58]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.12, h * 0.68, w * 0.65, h * 0.68]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.12, h * 0.78, w * 0.88, h * 0.78]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Signature area */}
            <Line points={[w * 0.5, h * 0.88, w * 0.88, h * 0.88]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Line points={[w * 0.55, h * 0.86, w * 0.62, h * 0.84, w * 0.7, h * 0.86, w * 0.78, h * 0.83, w * 0.85, h * 0.86]} stroke={c} strokeWidth={0.8} opacity={0.3} tension={0.5} />
          </>
        );
      case 'drug-paraphernalia':
        return (
          <>
            {/* Container outline */}
            <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) * 0.46} fill={c} opacity={0.08} stroke={c} strokeWidth={1.5} />
            {/* Pill shape */}
            <Rect x={w * 0.25} y={h * 0.32} width={w * 0.5} height={h * 0.36} fill={c} opacity={0.2} stroke={c} strokeWidth={1} cornerRadius={[h * 0.18, h * 0.18, h * 0.18, h * 0.18]} />
            {/* Pill divider */}
            <Line points={[w * 0.25, h * 0.5, w * 0.75, h * 0.5]} stroke={c} strokeWidth={1.2} opacity={0.5} />
            {/* Cross mark */}
            <Line points={[w * 0.42, h * 0.38, w * 0.58, h * 0.38]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.5, h * 0.34, w * 0.5, h * 0.46]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            {/* Rx symbol */}
            <Text text="Rx" x={w * 0.35} y={h * 0.52} width={w * 0.3} fontSize={7} fill={c} align="center" fontStyle="bold" opacity={0.4} />
            {/* Warning triangle */}
            <Line points={[w * 0.5, h * 0.08, w * 0.58, h * 0.22, w * 0.42, h * 0.22]} stroke={c} strokeWidth={0.8} opacity={0.3} closed />
            <Text text="!" x={w * 0.46} y={h * 0.11} fontSize={6} fill={c} fontStyle="bold" opacity={0.3} />
          </>
        );
      case 'glass-fragment':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Main shard */}
            <Line points={[w * 0.08, h * 0.5, w * 0.25, h * 0.08, w * 0.55, h * 0.12, w * 0.92, h * 0.38, w * 0.75, h * 0.88, w * 0.35, h * 0.85]} fill={c} opacity={0.12} closed stroke={c} strokeWidth={1.2} />
            {/* Crack lines */}
            <Line points={[w * 0.25, h * 0.08, w * 0.48, h * 0.45]} stroke={c} strokeWidth={0.6} opacity={0.5} />
            <Line points={[w * 0.55, h * 0.12, w * 0.42, h * 0.55]} stroke={c} strokeWidth={0.6} opacity={0.45} />
            <Line points={[w * 0.92, h * 0.38, w * 0.58, h * 0.52]} stroke={c} strokeWidth={0.5} opacity={0.35} />
            <Line points={[w * 0.48, h * 0.45, w * 0.35, h * 0.85]} stroke={c} strokeWidth={0.4} opacity={0.3} />
            {/* Reflection highlights */}
            <Line points={[w * 0.3, h * 0.2, w * 0.4, h * 0.15, w * 0.5, h * 0.2]} stroke="#f8fafc" strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.6, h * 0.35, w * 0.7, h * 0.3]} stroke="#f8fafc" strokeWidth={0.5} opacity={0.25} />
            {/* Secondary shard */}
            <Line points={[w * 0.7, h * 0.65, w * 0.85, h * 0.6, w * 0.9, h * 0.75, w * 0.78, h * 0.8]} fill={c} opacity={0.08} closed stroke={c} strokeWidth={0.8} />
            {/* Tiny fragment */}
            <Line points={[w * 0.15, h * 0.7, w * 0.22, h * 0.65, w * 0.25, h * 0.75]} fill={c} opacity={0.1} closed stroke={c} strokeWidth={0.6} />
          </>
        );
      case 'shell-casing':
        return (
          <>
            {/* Cylindrical body */}
            <Rect x={w * 0.12} y={h * 0.18} width={w * 0.76} height={h * 0.82} fill={c} opacity={0.25} stroke={c} strokeWidth={1.2} cornerRadius={[0, 0, 2, 2]} />
            {/* Rim */}
            <Rect x={w * 0.08} y={h * 0.15} width={w * 0.84} height={h * 0.08} fill={c} opacity={0.4} stroke={c} strokeWidth={1} cornerRadius={1} />
            {/* Primer */}
            <Circle x={w / 2} y={h * 0.08} radius={w * 0.22} fill={c} opacity={0.3} stroke={c} strokeWidth={1} />
            <Circle x={w / 2} y={h * 0.08} radius={w * 0.1} fill={c} opacity={0.5} />
            <Circle x={w / 2} y={h * 0.08} radius={1} fill="#d97706" />
            {/* Neck taper */}
            <Line points={[w * 0.2, h * 0.78, w * 0.25, h * 0.95, w * 0.75, h * 0.95, w * 0.8, h * 0.78]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            {/* Brass shine */}
            <Line points={[w * 0.3, h * 0.25, w * 0.3, h * 0.75]} stroke="#fde047" strokeWidth={0.5} opacity={0.2} />
            {/* Headstamp text hint */}
            <Text text="●" x={0} y={h * 0.02} width={w} fontSize={5} fill={c} align="center" opacity={0.3} />
          </>
        );
      case 'dna-sample':
        return (
          <>
            {/* Test tube outline */}
            <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) * 0.46} fill="#22c55e" opacity={0.06} stroke={c} strokeWidth={1} />
            {/* Double helix - strand 1 */}
            <Line points={[w * 0.3, h * 0.1, w * 0.7, h * 0.25, w * 0.3, h * 0.4, w * 0.7, h * 0.55, w * 0.3, h * 0.7, w * 0.7, h * 0.9]} stroke={c} strokeWidth={1.8} tension={0.5} />
            {/* Double helix - strand 2 */}
            <Line points={[w * 0.7, h * 0.1, w * 0.3, h * 0.25, w * 0.7, h * 0.4, w * 0.3, h * 0.55, w * 0.7, h * 0.7, w * 0.3, h * 0.9]} stroke={c} strokeWidth={1.8} tension={0.5} opacity={0.6} />
            {/* Base pair rungs */}
            <Line points={[w * 0.38, h * 0.17, w * 0.62, h * 0.17]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Line points={[w * 0.35, h * 0.33, w * 0.65, h * 0.33]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Line points={[w * 0.38, h * 0.48, w * 0.62, h * 0.48]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Line points={[w * 0.35, h * 0.63, w * 0.65, h * 0.63]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Line points={[w * 0.38, h * 0.8, w * 0.62, h * 0.8]} stroke={c} strokeWidth={1} opacity={0.4} />
            {/* Nucleotide dots */}
            <Circle x={w * 0.38} y={h * 0.17} radius={1.5} fill="#ef4444" opacity={0.5} />
            <Circle x={w * 0.62} y={h * 0.17} radius={1.5} fill="#3b82f6" opacity={0.5} />
            <Circle x={w * 0.35} y={h * 0.33} radius={1.5} fill="#22c55e" opacity={0.5} />
            <Circle x={w * 0.65} y={h * 0.33} radius={1.5} fill="#eab308" opacity={0.5} />
          </>
        );
      case 'phone':
        return (
          <>
            {/* Body */}
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            {/* Screen */}
            <Rect x={w * 0.08} y={h * 0.1} width={w * 0.84} height={h * 0.72} fill="#0f172a" opacity={0.5} cornerRadius={2} />
            {/* Screen content hint */}
            <Rect x={w * 0.15} y={h * 0.14} width={w * 0.7} height={h * 0.08} fill={c} opacity={0.08} cornerRadius={1} />
            <Rect x={w * 0.15} y={h * 0.26} width={w * 0.5} height={h * 0.04} fill={c} opacity={0.06} cornerRadius={1} />
            <Rect x={w * 0.15} y={h * 0.34} width={w * 0.65} height={h * 0.04} fill={c} opacity={0.06} cornerRadius={1} />
            {/* Notch/speaker */}
            <Rect x={w * 0.3} y={h * 0.03} width={w * 0.4} height={h * 0.02} fill={c} opacity={0.3} cornerRadius={2} />
            {/* Front camera */}
            <Circle x={w * 0.75} y={h * 0.04} radius={1.5} fill={c} opacity={0.3} />
            {/* Home button/bar */}
            <Rect x={w * 0.3} y={h * 0.9} width={w * 0.4} height={h * 0.02} fill={c} opacity={0.25} cornerRadius={2} />
            {/* Side buttons */}
            <Rect x={-1} y={h * 0.3} width={2} height={h * 0.08} fill={c} opacity={0.3} cornerRadius={1} />
            <Rect x={w - 1} y={h * 0.25} width={2} height={h * 0.06} fill={c} opacity={0.3} cornerRadius={1} />
            <Rect x={w - 1} y={h * 0.35} width={2} height={h * 0.12} fill={c} opacity={0.3} cornerRadius={1} />
          </>
        );
      case 'camera':
        return (
          <>
            {/* Body */}
            <Rect x={0} y={h * 0.2} width={w} height={h * 0.72} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            {/* Viewfinder hump */}
            <Rect x={w * 0.28} y={0} width={w * 0.35} height={h * 0.28} fill={c} opacity={0.12} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Viewfinder window */}
            <Rect x={w * 0.38} y={h * 0.05} width={w * 0.15} height={h * 0.1} fill="#0f172a" opacity={0.4} cornerRadius={1} />
            {/* Main lens ring */}
            <Circle x={w * 0.5} y={h * 0.56} radius={Math.min(w, h) * 0.25} stroke={c} strokeWidth={2} />
            <Circle x={w * 0.5} y={h * 0.56} radius={Math.min(w, h) * 0.2} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Circle x={w * 0.5} y={h * 0.56} radius={Math.min(w, h) * 0.14} fill="#0f172a" opacity={0.4} stroke={c} strokeWidth={0.5} />
            {/* Lens reflection */}
            <Circle x={w * 0.45} y={h * 0.5} radius={Math.min(w, h) * 0.05} fill="#f8fafc" opacity={0.15} />
            {/* Flash */}
            <Rect x={w * 0.72} y={h * 0.25} width={w * 0.12} height={h * 0.08} fill="#fbbf24" opacity={0.3} cornerRadius={1} stroke={c} strokeWidth={0.5} />
            {/* Record indicator */}
            <Circle x={w * 0.85} y={h * 0.3} radius={2.5} fill="#ef4444" opacity={0.7} />
            {/* Mode dial */}
            <Circle x={w * 0.15} y={h * 0.3} radius={4} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Circle x={w * 0.15} y={h * 0.3} radius={1} fill={c} opacity={0.4} />
            {/* Grip texture */}
            <Rect x={w * 0.82} y={h * 0.45} width={w * 0.12} height={h * 0.4} fill={c} opacity={0.1} cornerRadius={2} />
            <Line points={[w * 0.85, h * 0.5, w * 0.85, h * 0.8]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[w * 0.9, h * 0.5, w * 0.9, h * 0.8]} stroke={c} strokeWidth={0.5} opacity={0.15} />
          </>
        );
      case 'id-card':
        return (
          <>
            {/* Card body */}
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={1.2} cornerRadius={2} />
            {/* Header stripe */}
            <Rect x={0} y={0} width={w} height={h * 0.18} fill={c} opacity={0.2} cornerRadius={[2, 2, 0, 0]} />
            {/* Photo placeholder */}
            <Rect x={w * 0.05} y={h * 0.25} width={w * 0.28} height={h * 0.5} fill={c} opacity={0.12} stroke={c} strokeWidth={0.5} cornerRadius={2} />
            {/* Person silhouette in photo */}
            <Circle x={w * 0.19} y={h * 0.38} radius={3} fill={c} opacity={0.15} />
            <Line points={[w * 0.13, h * 0.65, w * 0.19, h * 0.5, w * 0.25, h * 0.65]} fill={c} opacity={0.1} closed />
            {/* Text lines */}
            <Line points={[w * 0.4, h * 0.3, w * 0.92, h * 0.3]} stroke={c} strokeWidth={1} opacity={0.5} />
            <Line points={[w * 0.4, h * 0.42, w * 0.85, h * 0.42]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.4, h * 0.52, w * 0.78, h * 0.52]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.4, h * 0.62, w * 0.7, h * 0.62]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Barcode */}
            {Array.from({ length: 12 }).map((_, i) => (
              <Line key={i} points={[w * 0.4 + i * 3, h * 0.75, w * 0.4 + i * 3, h * 0.88]} stroke={c} strokeWidth={i % 3 === 0 ? 1.5 : 0.8} opacity={0.3} />
            ))}
            {/* Chip */}
            <Rect x={w * 0.06} y={h * 0.8} width={w * 0.12} height={h * 0.12} fill="#d4a574" opacity={0.3} stroke="#b8956a" strokeWidth={0.5} cornerRadius={1} />
          </>
        );
      case 'bag':
        return (
          <>
            {/* Main body */}
            <Line points={[w * 0.08, h * 0.3, w * 0.92, h * 0.3, w * 0.88, h * 0.95, w * 0.12, h * 0.95]} fill={c} opacity={0.12} closed stroke={c} strokeWidth={1.5} />
            {/* Top flap */}
            <Rect x={w * 0.05} y={h * 0.24} width={w * 0.9} height={h * 0.1} fill={c} opacity={0.2} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Handles */}
            <Line points={[w * 0.25, h * 0.24, w * 0.25, h * 0.08, w * 0.42, h * 0.05, w * 0.42, h * 0.24]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.58, h * 0.24, w * 0.58, h * 0.08, w * 0.75, h * 0.05, w * 0.75, h * 0.24]} stroke={c} strokeWidth={2} lineCap="round" />
            {/* Front pocket */}
            <Rect x={w * 0.2} y={h * 0.5} width={w * 0.6} height={h * 0.25} stroke={c} strokeWidth={0.8} opacity={0.25} cornerRadius={2} fill="transparent" />
            {/* Zipper */}
            <Line points={[w * 0.2, h * 0.5, w * 0.8, h * 0.5]} stroke={c} strokeWidth={0.8} opacity={0.35} />
            <Circle x={w * 0.78} y={h * 0.5} radius={2} stroke={c} strokeWidth={0.5} opacity={0.4} />
            {/* Clasp */}
            <Circle x={w * 0.5} y={h * 0.38} radius={3} stroke={c} strokeWidth={1} opacity={0.4} />
            <Circle x={w * 0.5} y={h * 0.38} radius={1.2} fill={c} opacity={0.3} />
            {/* Stitching hints */}
            <Line points={[w * 0.12, h * 0.35, w * 0.12, h * 0.9]} stroke={c} strokeWidth={0.4} opacity={0.15} dash={[2, 2]} />
            <Line points={[w * 0.88, h * 0.35, w * 0.88, h * 0.9]} stroke={c} strokeWidth={0.4} opacity={0.15} dash={[2, 2]} />
          </>
        );
      case 'bed':
        return (
          <>
            {/* Frame */}
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={2} cornerRadius={4} />
            {/* Headboard */}
            <Rect x={0} y={0} width={w} height={h * 0.12} fill={c} opacity={0.45} cornerRadius={[4, 4, 0, 0]} stroke={c} strokeWidth={1} />
            <Line points={[w * 0.2, h * 0.03, w * 0.2, h * 0.1]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.5, h * 0.03, w * 0.5, h * 0.1]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.8, h * 0.03, w * 0.8, h * 0.1]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            {/* Pillows */}
            <Rect x={w * 0.08} y={h * 0.16} width={w * 0.35} height={h * 0.18} fill={c} opacity={0.25} cornerRadius={6} stroke={c} strokeWidth={0.8} />
            <Rect x={w * 0.57} y={h * 0.16} width={w * 0.35} height={h * 0.18} fill={c} opacity={0.25} cornerRadius={6} stroke={c} strokeWidth={0.8} />
            {/* Pillow indent */}
            <Circle x={w * 0.25} y={h * 0.25} radius={4} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Circle x={w * 0.75} y={h * 0.25} radius={4} stroke={c} strokeWidth={0.5} opacity={0.2} />
            {/* Blanket fold line */}
            <Line points={[w * 0.05, h * 0.4, w * 0.95, h * 0.4]} stroke={c} strokeWidth={1.2} opacity={0.35} />
            {/* Blanket texture */}
            <Line points={[w * 0.05, h * 0.55, w * 0.95, h * 0.55]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            <Line points={[w * 0.05, h * 0.7, w * 0.95, h * 0.7]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            {/* Footboard */}
            <Rect x={0} y={h * 0.92} width={w} height={h * 0.08} fill={c} opacity={0.3} cornerRadius={[0, 0, 4, 4]} stroke={c} strokeWidth={0.8} />
            {/* Legs */}
            <Circle x={4} y={h - 2} radius={3} fill={c} opacity={0.25} />
            <Circle x={w - 4} y={h - 2} radius={3} fill={c} opacity={0.25} />
            <Circle x={4} y={4} radius={3} fill={c} opacity={0.25} />
            <Circle x={w - 4} y={4} radius={3} fill={c} opacity={0.25} />
          </>
        );
      case 'table':
        return (
          <>
            {/* Tabletop */}
            <Rect width={w} height={h} fill={c} opacity={0.18} stroke={c} strokeWidth={1.5} cornerRadius={3} />
            {/* Wood grain lines */}
            <Line points={[w * 0.1, h * 0.25, w * 0.9, h * 0.25]} stroke={c} strokeWidth={0.5} opacity={0.12} />
            <Line points={[w * 0.1, h * 0.5, w * 0.9, h * 0.5]} stroke={c} strokeWidth={0.5} opacity={0.12} />
            <Line points={[w * 0.1, h * 0.75, w * 0.9, h * 0.75]} stroke={c} strokeWidth={0.5} opacity={0.12} />
            {/* Inner edge bevel */}
            <Rect x={3} y={3} width={w - 6} height={h - 6} stroke={c} strokeWidth={0.6} opacity={0.3} cornerRadius={2} fill="transparent" />
            {/* Legs */}
            <Circle x={8} y={8} radius={4} fill={c} opacity={0.3} stroke={c} strokeWidth={0.5} />
            <Circle x={w - 8} y={8} radius={4} fill={c} opacity={0.3} stroke={c} strokeWidth={0.5} />
            <Circle x={8} y={h - 8} radius={4} fill={c} opacity={0.3} stroke={c} strokeWidth={0.5} />
            <Circle x={w - 8} y={h - 8} radius={4} fill={c} opacity={0.3} stroke={c} strokeWidth={0.5} />
            <Text text="TABLE" x={0} y={h / 2 - 5} width={w} fontSize={9} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.5} />
          </>
        );
      case 'chair':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Seat */}
            <Rect x={w * 0.1} y={h * 0.4} width={w * 0.8} height={h * 0.25} fill={c} opacity={0.25} stroke={c} strokeWidth={1.5} cornerRadius={3} />
            {/* Backrest */}
            <Rect x={w * 0.12} y={h * 0.05} width={w * 0.76} height={h * 0.32} fill={c} opacity={0.2} stroke={c} strokeWidth={1.2} cornerRadius={[6, 6, 0, 0]} />
            {/* Backrest slats */}
            <Line points={[w * 0.3, h * 0.1, w * 0.3, h * 0.33]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.5, h * 0.08, w * 0.5, h * 0.33]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.7, h * 0.1, w * 0.7, h * 0.33]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            {/* Front legs */}
            <Line points={[w * 0.18, h * 0.65, w * 0.12, h * 0.98]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.82, h * 0.65, w * 0.88, h * 0.98]} stroke={c} strokeWidth={2} lineCap="round" />
            {/* Back legs */}
            <Line points={[w * 0.18, h * 0.37, w * 0.15, h * 0.65]} stroke={c} strokeWidth={1.5} opacity={0.6} />
            <Line points={[w * 0.82, h * 0.37, w * 0.85, h * 0.65]} stroke={c} strokeWidth={1.5} opacity={0.6} />
            {/* Cross brace */}
            <Line points={[w * 0.2, h * 0.8, w * 0.8, h * 0.8]} stroke={c} strokeWidth={1} opacity={0.3} />
          </>
        );
      case 'sofa':
        return (
          <>
            {/* Frame */}
            <Rect width={w} height={h} fill={c} opacity={0.1} stroke={c} strokeWidth={1.5} cornerRadius={5} />
            {/* Backrest */}
            <Rect x={0} y={0} width={w} height={h * 0.28} fill={c} opacity={0.28} cornerRadius={[5, 5, 0, 0]} stroke={c} strokeWidth={0.5} />
            {/* Backrest cushion lines */}
            <Line points={[w * 0.33, h * 0.04, w * 0.33, h * 0.26]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Line points={[w * 0.66, h * 0.04, w * 0.66, h * 0.26]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            {/* Seat cushions */}
            <Rect x={8} y={h * 0.33} width={w * 0.3} height={h * 0.55} fill={c} opacity={0.12} cornerRadius={4} stroke={c} strokeWidth={0.5} />
            <Rect x={w * 0.34} y={h * 0.33} width={w * 0.32} height={h * 0.55} fill={c} opacity={0.12} cornerRadius={4} stroke={c} strokeWidth={0.5} />
            <Rect x={w * 0.68} y={h * 0.33} width={w * 0.28} height={h * 0.55} fill={c} opacity={0.12} cornerRadius={4} stroke={c} strokeWidth={0.5} />
            {/* Cushion indent */}
            <Circle x={w * 0.18} y={h * 0.55} radius={5} stroke={c} strokeWidth={0.3} opacity={0.12} />
            <Circle x={w * 0.5} y={h * 0.55} radius={5} stroke={c} strokeWidth={0.3} opacity={0.12} />
            <Circle x={w * 0.82} y={h * 0.55} radius={5} stroke={c} strokeWidth={0.3} opacity={0.12} />
            {/* Armrests */}
            <Rect x={0} y={h * 0.22} width={8} height={h * 0.72} fill={c} opacity={0.28} cornerRadius={[0, 3, 3, 3]} />
            <Rect x={w - 8} y={h * 0.22} width={8} height={h * 0.72} fill={c} opacity={0.28} cornerRadius={[3, 0, 3, 3]} />
            {/* Legs */}
            <Circle x={5} y={h - 2} radius={2.5} fill={c} opacity={0.25} />
            <Circle x={w - 5} y={h - 2} radius={2.5} fill={c} opacity={0.25} />
            <Circle x={w * 0.35} y={h - 2} radius={2} fill={c} opacity={0.15} />
            <Circle x={w * 0.65} y={h - 2} radius={2} fill={c} opacity={0.15} />
          </>
        );
      case 'cabinet':
        return (
          <>
            {/* Body */}
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Top surface */}
            <Rect x={0} y={0} width={w} height={h * 0.12} fill={c} opacity={0.3} cornerRadius={[2, 2, 0, 0]} />
            {/* Center divider */}
            <Line points={[w / 2, h * 0.14, w / 2, h - 3]} stroke={c} strokeWidth={1} opacity={0.5} />
            {/* Left door panel */}
            <Rect x={3} y={h * 0.15} width={w / 2 - 5} height={h * 0.8} stroke={c} strokeWidth={0.5} opacity={0.25} cornerRadius={1} fill="transparent" />
            {/* Right door panel */}
            <Rect x={w / 2 + 2} y={h * 0.15} width={w / 2 - 5} height={h * 0.8} stroke={c} strokeWidth={0.5} opacity={0.25} cornerRadius={1} fill="transparent" />
            {/* Door handles */}
            <Rect x={w / 2 - 7} y={h * 0.45} width={3} height={h * 0.15} fill={c} opacity={0.5} cornerRadius={2} />
            <Rect x={w / 2 + 4} y={h * 0.45} width={3} height={h * 0.15} fill={c} opacity={0.5} cornerRadius={2} />
            {/* Shelf line hint */}
            <Line points={[5, h * 0.55, w / 2 - 3, h * 0.55]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Line points={[w / 2 + 3, h * 0.55, w - 5, h * 0.55]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            {/* Base */}
            <Rect x={2} y={h * 0.92} width={w - 4} height={h * 0.06} fill={c} opacity={0.2} cornerRadius={1} />
          </>
        );
      case 'wall':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.85} stroke="#1e293b" strokeWidth={1} />
            {/* Wall hatch pattern */}
            {Array.from({ length: Math.max(1, Math.floor(w / 8)) }).map((_, i) => (
              <Line key={i} points={[i * 8, 0, i * 8 + h, h]} stroke="#1e293b" strokeWidth={0.4} opacity={0.25} />
            ))}
            <Line points={[0, h / 2, w, h / 2]} stroke="#0f172a" strokeWidth={0.3} opacity={0.2} />
          </>
        );
      case 'door':
        return (
          <>
            {/* Door panel */}
            <Rect width={w} height={h} fill={c} opacity={0.5} stroke="#78350f" strokeWidth={1.5} cornerRadius={1} />
            {/* Wood grain */}
            <Line points={[w * 0.2, 0, w * 0.2, h]} stroke="#451a03" strokeWidth={0.3} opacity={0.15} />
            <Line points={[w * 0.5, 0, w * 0.5, h]} stroke="#451a03" strokeWidth={0.3} opacity={0.15} />
            <Line points={[w * 0.8, 0, w * 0.8, h]} stroke="#451a03" strokeWidth={0.3} opacity={0.15} />
            {/* Handle */}
            <Circle x={w * 0.85} y={h / 2} radius={2.5} fill="#d4a574" stroke="#b8956a" strokeWidth={0.8} />
            {/* Swing arc */}
            <Line points={[0, h, 0, h + w * 0.55]} stroke={c} strokeWidth={1.5} dash={[3, 3]} opacity={0.5} />
            <Line points={[0, h + w * 0.55, w * 0.4, h + w * 0.35]} stroke={c} strokeWidth={1.5} dash={[3, 3]} opacity={0.5} />
            {/* Arc curve */}
            <Line points={[0, h, w * 0.08, h + w * 0.22, w * 0.2, h + w * 0.38, w * 0.4, h + w * 0.35]} stroke={c} strokeWidth={1} dash={[2, 4]} opacity={0.3} tension={0.5} />
            {/* Threshold */}
            <Rect x={0} y={h - 1} width={w} height={2} fill={c} opacity={0.3} />
          </>
        );
      case 'window':
        return (
          <>
            {/* Frame outer */}
            <Rect width={w} height={h} fill="#38bdf8" opacity={0.1} stroke="#64748b" strokeWidth={2} />
            {/* Frame inner */}
            <Rect x={2} y={1} width={w - 4} height={h - 2} stroke="#64748b" strokeWidth={0.5} opacity={0.4} fill="transparent" />
            {/* Mullions */}
            <Line points={[w * 0.33, 0, w * 0.33, h]} stroke="#64748b" strokeWidth={1.5} />
            <Line points={[w * 0.66, 0, w * 0.66, h]} stroke="#64748b" strokeWidth={1.5} />
            {/* Glass reflections */}
            <Line points={[w * 0.05, h * 0.2, w * 0.28, 0]} stroke="#38bdf8" strokeWidth={0.5} opacity={0.35} />
            <Line points={[w * 0.38, h * 0.2, w * 0.61, 0]} stroke="#38bdf8" strokeWidth={0.5} opacity={0.3} />
            <Line points={[w * 0.71, h * 0.2, w * 0.94, 0]} stroke="#38bdf8" strokeWidth={0.5} opacity={0.25} />
            {/* Glass fill */}
            <Rect x={3} y={1} width={w * 0.33 - 4} height={h - 2} fill="#38bdf8" opacity={0.06} />
            <Rect x={w * 0.33 + 1} y={1} width={w * 0.33 - 2} height={h - 2} fill="#38bdf8" opacity={0.06} />
            <Rect x={w * 0.66 + 1} y={1} width={w * 0.33 - 2} height={h - 2} fill="#38bdf8" opacity={0.06} />
            {/* Sill */}
            <Rect x={-2} y={h - 1} width={w + 4} height={3} fill="#64748b" opacity={0.3} cornerRadius={1} />
          </>
        );
      case 'stairs':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Steps with 3D effect */}
            {Array.from({ length: 7 }).map((_, i) => {
              const sy = (i + 1) * (h / 8);
              return (
                <React.Fragment key={i}>
                  <Line points={[0, sy, w, sy]} stroke={c} strokeWidth={1.2} opacity={0.5} />
                  <Rect x={0} y={sy - h / 16} width={w} height={h / 16} fill={c} opacity={0.03 + i * 0.015} />
                </React.Fragment>
              );
            })}
            {/* Handrail */}
            <Line points={[w * 0.08, h * 0.92, w * 0.08, h * 0.08]} stroke={c} strokeWidth={2} opacity={0.4} lineCap="round" />
            <Line points={[w * 0.92, h * 0.92, w * 0.92, h * 0.08]} stroke={c} strokeWidth={2} opacity={0.4} lineCap="round" />
            {/* Direction arrow */}
            <Line points={[w / 2, h * 0.85, w / 2, h * 0.12]} stroke={c} strokeWidth={1.5} opacity={0.4} />
            <Line points={[w / 2 - 7, h * 0.22, w / 2, h * 0.12, w / 2 + 7, h * 0.22]} stroke={c} strokeWidth={1.5} opacity={0.4} />
            <Text text="UP" x={0} y={h * 0.42} width={w} fontSize={9} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.4} fontStyle="bold" />
            {/* Step numbers hint */}
            <Text text="1" x={2} y={h * 0.82} fontSize={6} fill={c} opacity={0.2} fontFamily="JetBrains Mono, monospace" />
            <Text text="7" x={2} y={h * 0.12} fontSize={6} fill={c} opacity={0.2} fontFamily="JetBrains Mono, monospace" />
          </>
        );
      case 'car':
        return (
          <>
            {/* Body shell */}
            <Rect x={2} y={h * 0.15} width={w - 4} height={h * 0.7} fill={c} opacity={0.18} stroke={c} strokeWidth={1.5} cornerRadius={8} />
            {/* Cabin/roof */}
            <Rect x={w * 0.25} y={h * 0.08} width={w * 0.45} height={h * 0.84} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={10} />
            {/* Windshield */}
            <Line points={[w * 0.25, h * 0.2, w * 0.32, h * 0.12, w * 0.32, h * 0.88, w * 0.25, h * 0.8]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            {/* Rear window */}
            <Line points={[w * 0.7, h * 0.2, w * 0.63, h * 0.14, w * 0.63, h * 0.86, w * 0.7, h * 0.8]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.12} closed />
            {/* Side windows */}
            <Rect x={w * 0.35} y={h * 0.15} width={w * 0.12} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.35} y={h * 0.55} width={w * 0.12} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.49} y={h * 0.15} width={w * 0.12} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.49} y={h * 0.55} width={w * 0.12} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            {/* Door lines */}
            <Line points={[w * 0.47, h * 0.12, w * 0.47, h * 0.88]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Wheels with detail */}
            <Circle x={w * 0.15} y={h * 0.12} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.15} y={h * 0.12} radius={2.5} fill="#475569" />
            <Circle x={w * 0.15} y={h * 0.88} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.15} y={h * 0.88} radius={2.5} fill="#475569" />
            <Circle x={w * 0.85} y={h * 0.12} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.12} radius={2.5} fill="#475569" />
            <Circle x={w * 0.85} y={h * 0.88} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.88} radius={2.5} fill="#475569" />
            {/* Headlights */}
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.62} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            {/* Tail lights */}
            <Rect x={w - 4} y={h * 0.2} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.68} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            {/* Side mirrors */}
            <Rect x={w * 0.22} y={h * 0.02} width={5} height={4} fill={c} opacity={0.4} cornerRadius={1} />
            <Rect x={w * 0.22} y={h * 0.94} width={5} height={4} fill={c} opacity={0.4} cornerRadius={1} />
            {/* Hood line */}
            <Line points={[w * 0.12, h * 0.5, w * 0.22, h * 0.5]} stroke={c} strokeWidth={0.5} opacity={0.25} />
          </>
        );
      case 'motorcycle':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Rear wheel */}
            <Circle x={w * 0.18} y={h * 0.6} radius={h * 0.32} stroke="#475569" strokeWidth={2} />
            <Circle x={w * 0.18} y={h * 0.6} radius={h * 0.22} stroke="#475569" strokeWidth={0.5} opacity={0.3} />
            <Circle x={w * 0.18} y={h * 0.6} radius={2.5} fill="#6b7280" />
            {/* Front wheel */}
            <Circle x={w * 0.82} y={h * 0.6} radius={h * 0.32} stroke="#475569" strokeWidth={2} />
            <Circle x={w * 0.82} y={h * 0.6} radius={h * 0.22} stroke="#475569" strokeWidth={0.5} opacity={0.3} />
            <Circle x={w * 0.82} y={h * 0.6} radius={2.5} fill="#6b7280" />
            {/* Frame */}
            <Line points={[w * 0.18, h * 0.6, w * 0.35, h * 0.35, w * 0.55, h * 0.3, w * 0.75, h * 0.35, w * 0.82, h * 0.6]} stroke={c} strokeWidth={2} />
            {/* Engine block */}
            <Rect x={w * 0.32} y={h * 0.4} width={w * 0.2} height={h * 0.2} fill={c} opacity={0.2} stroke={c} strokeWidth={1} cornerRadius={2} />
            {/* Tank */}
            <Line points={[w * 0.35, h * 0.3, w * 0.55, h * 0.22, w * 0.6, h * 0.3]} stroke={c} strokeWidth={1.5} fill={c} opacity={0.25} closed tension={0.3} />
            {/* Seat */}
            <Line points={[w * 0.28, h * 0.32, w * 0.42, h * 0.28, w * 0.55, h * 0.3]} stroke={c} strokeWidth={3} lineCap="round" />
            {/* Handlebars */}
            <Line points={[w * 0.65, h * 0.15, w * 0.72, h * 0.3]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.62, h * 0.12, w * 0.68, h * 0.18]} stroke={c} strokeWidth={3} lineCap="round" />
            {/* Exhaust */}
            <Line points={[w * 0.32, h * 0.55, w * 0.15, h * 0.52]} stroke="#a3a3a3" strokeWidth={2.5} lineCap="round" />
            {/* Headlight */}
            <Circle x={w * 0.78} y={h * 0.28} radius={3} fill="#fbbf24" opacity={0.6} stroke="#fbbf24" strokeWidth={0.5} />
            {/* Taillight */}
            <Rect x={w * 0.12} y={h * 0.35} width={4} height={3} fill="#ef4444" opacity={0.6} cornerRadius={1} />
          </>
        );
      case 'bicycle':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Rear wheel */}
            <Circle x={w * 0.2} y={h * 0.6} radius={h * 0.32} stroke={c} strokeWidth={1.5} />
            <Circle x={w * 0.2} y={h * 0.6} radius={h * 0.2} stroke={c} strokeWidth={0.4} opacity={0.2} />
            <Circle x={w * 0.2} y={h * 0.6} radius={2} fill={c} />
            {/* Spokes */}
            {[0, 60, 120].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const r = h * 0.3;
              return <Line key={angle} points={[w * 0.2 + Math.cos(rad) * r, h * 0.6 + Math.sin(rad) * r, w * 0.2 - Math.cos(rad) * r, h * 0.6 - Math.sin(rad) * r]} stroke={c} strokeWidth={0.5} opacity={0.3} />;
            })}
            {/* Front wheel */}
            <Circle x={w * 0.8} y={h * 0.6} radius={h * 0.32} stroke={c} strokeWidth={1.5} />
            <Circle x={w * 0.8} y={h * 0.6} radius={h * 0.2} stroke={c} strokeWidth={0.4} opacity={0.2} />
            <Circle x={w * 0.8} y={h * 0.6} radius={2} fill={c} />
            {[0, 60, 120].map((angle) => {
              const rad = (angle * Math.PI) / 180;
              const r = h * 0.3;
              return <Line key={`f-${angle}`} points={[w * 0.8 + Math.cos(rad) * r, h * 0.6 + Math.sin(rad) * r, w * 0.8 - Math.cos(rad) * r, h * 0.6 - Math.sin(rad) * r]} stroke={c} strokeWidth={0.5} opacity={0.3} />;
            })}
            {/* Frame triangle */}
            <Line points={[w * 0.2, h * 0.6, w * 0.45, h * 0.3, w * 0.5, h * 0.6, w * 0.2, h * 0.6]} stroke={c} strokeWidth={1.8} />
            {/* Top tube + down tube */}
            <Line points={[w * 0.45, h * 0.3, w * 0.7, h * 0.32]} stroke={c} strokeWidth={1.8} />
            <Line points={[w * 0.5, h * 0.6, w * 0.8, h * 0.6]} stroke={c} strokeWidth={1.2} opacity={0.5} />
            {/* Fork */}
            <Line points={[w * 0.7, h * 0.32, w * 0.8, h * 0.6]} stroke={c} strokeWidth={1.8} />
            {/* Seat post */}
            <Line points={[w * 0.45, h * 0.3, w * 0.43, h * 0.18]} stroke={c} strokeWidth={1.5} />
            {/* Seat */}
            <Line points={[w * 0.38, h * 0.18, w * 0.48, h * 0.18]} stroke={c} strokeWidth={3.5} lineCap="round" />
            {/* Handlebars */}
            <Line points={[w * 0.7, h * 0.32, w * 0.72, h * 0.2]} stroke={c} strokeWidth={1.5} />
            <Line points={[w * 0.68, h * 0.18, w * 0.76, h * 0.22]} stroke={c} strokeWidth={3} lineCap="round" />
            {/* Pedal crank */}
            <Circle x={w * 0.5} y={h * 0.6} radius={3} stroke={c} strokeWidth={1} fill={c} opacity={0.3} />
            {/* Chain guard hint */}
            <Line points={[w * 0.2, h * 0.6, w * 0.5, h * 0.6]} stroke={c} strokeWidth={0.5} opacity={0.2} dash={[2, 2]} />
          </>
        );
      case 'pickup-truck':
        return (
          <>
            <Rect x={w * 0.55} y={h * 0.12} width={w * 0.42} height={h * 0.76} fill={c} opacity={0.1} stroke={c} strokeWidth={1.2} cornerRadius={3} />
            <Line points={[w * 0.55, h * 0.18, w * 0.55, h * 0.82]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Rect x={w * 0.08} y={h * 0.1} width={w * 0.48} height={h * 0.8} fill={c} opacity={0.18} stroke={c} strokeWidth={1.5} cornerRadius={8} />
            <Rect x={w * 0.2} y={h * 0.05} width={w * 0.3} height={h * 0.9} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={8} />
            <Line points={[w * 0.2, h * 0.2, w * 0.26, h * 0.1, w * 0.26, h * 0.9, w * 0.2, h * 0.8]} stroke="#38bdf8" strokeWidth={1} fill="#38bdf8" opacity={0.15} closed />
            <Circle x={w * 0.15} y={h * 0.1} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.15} y={h * 0.9} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.1} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.9} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.62} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.2} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.68} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
          </>
        );
      case 'suv':
        return (
          <>
            <Rect x={2} y={h * 0.12} width={w - 4} height={h * 0.76} fill={c} opacity={0.18} stroke={c} strokeWidth={1.5} cornerRadius={6} />
            <Rect x={w * 0.18} y={h * 0.04} width={w * 0.6} height={h * 0.92} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={8} />
            <Line points={[w * 0.18, h * 0.18, w * 0.24, h * 0.08, w * 0.24, h * 0.92, w * 0.18, h * 0.82]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            <Rect x={w * 0.28} y={h * 0.12} width={w * 0.18} height={h * 0.34} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.28} y={h * 0.54} width={w * 0.18} height={h * 0.34} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.5} y={h * 0.12} width={w * 0.18} height={h * 0.34} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.5} y={h * 0.54} width={w * 0.18} height={h * 0.34} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Circle x={w * 0.14} y={h * 0.1} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.14} y={h * 0.9} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.86} y={h * 0.1} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.86} y={h * 0.9} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.62} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.2} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.68} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Line points={[w * 0.3, h * 0.03, w * 0.65, h * 0.03]} stroke={c} strokeWidth={1} opacity={0.2} />
            <Line points={[w * 0.3, h * 0.97, w * 0.65, h * 0.97]} stroke={c} strokeWidth={1} opacity={0.2} />
          </>
        );
      case 'van':
        return (
          <>
            <Rect x={2} y={h * 0.08} width={w - 4} height={h * 0.84} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            <Line points={[w * 0.12, h * 0.18, w * 0.18, h * 0.1, w * 0.18, h * 0.9, w * 0.12, h * 0.82]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            <Rect x={w * 0.22} y={h * 0.14} width={w * 0.14} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Rect x={w * 0.22} y={h * 0.56} width={w * 0.14} height={h * 0.3} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.8} cornerRadius={2} />
            <Line points={[w * 0.38, h * 0.1, w * 0.38, h * 0.9]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            <Line points={[w * 0.55, h * 0.1, w * 0.55, h * 0.9]} stroke={c} strokeWidth={0.5} opacity={0.2} />
            <Circle x={w * 0.14} y={h * 0.08} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.14} y={h * 0.92} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.08} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.92} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.22} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.63} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.18} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.7} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
          </>
        );
      case 'bus':
        return (
          <>
            <Rect x={2} y={h * 0.08} width={w - 4} height={h * 0.84} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={4} />
            <Rect x={4} y={h * 0.4} width={w - 8} height={h * 0.2} fill={c} opacity={0.12} />
            <Line points={[w * 0.04, h * 0.15, w * 0.08, h * 0.1, w * 0.08, h * 0.9, w * 0.04, h * 0.85]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            {Array.from({ length: 7 }, (_, i) => (
              <Rect key={`bw-t-${i}`} x={w * 0.12 + i * w * 0.11} y={h * 0.14} width={w * 0.08} height={h * 0.28} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.6} cornerRadius={1} />
            ))}
            {Array.from({ length: 7 }, (_, i) => (
              <Rect key={`bw-b-${i}`} x={w * 0.12 + i * w * 0.11} y={h * 0.58} width={w * 0.08} height={h * 0.28} fill="#38bdf8" opacity={0.1} stroke="#38bdf8" strokeWidth={0.6} cornerRadius={1} />
            ))}
            <Circle x={w * 0.1} y={h * 0.06} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.1} y={h * 0.94} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.06} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.94} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.78} y={h * 0.06} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.78} y={h * 0.94} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.65} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.18} width={4} height={h * 0.15} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.67} width={4} height={h * 0.15} fill="#ef4444" opacity={0.6} cornerRadius={2} />
          </>
        );
      case 'semi-truck':
        return (
          <>
            <Rect x={w * 0.3} y={h * 0.06} width={w * 0.68} height={h * 0.88} fill={c} opacity={0.1} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {Array.from({ length: 5 }, (_, i) => (
              <Line key={`tr-${i}`} points={[w * 0.38 + i * w * 0.12, h * 0.08, w * 0.38 + i * w * 0.12, h * 0.92]} stroke={c} strokeWidth={0.4} opacity={0.15} />
            ))}
            <Rect x={2} y={h * 0.1} width={w * 0.28} height={h * 0.8} fill={c} opacity={0.2} stroke={c} strokeWidth={1.5} cornerRadius={6} />
            <Rect x={w * 0.08} y={h * 0.04} width={w * 0.16} height={h * 0.92} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={6} />
            <Line points={[w * 0.08, h * 0.18, w * 0.12, h * 0.08, w * 0.12, h * 0.92, w * 0.08, h * 0.82]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            <Line points={[w * 0.28, h * 0.4, w * 0.32, h * 0.4, w * 0.32, h * 0.6, w * 0.28, h * 0.6]} stroke={c} strokeWidth={1} opacity={0.3} />
            <Circle x={w * 0.08} y={h * 0.08} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.08} y={h * 0.92} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.22} y={h * 0.08} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.22} y={h * 0.92} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.06} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.82} y={h * 0.94} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.9} y={h * 0.06} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.9} y={h * 0.94} radius={7} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.65} width={4} height={h * 0.15} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.18} width={4} height={h * 0.15} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.67} width={4} height={h * 0.15} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w * 0.06} y={h * 0.02} width={3} height={h * 0.1} fill="#6b7280" opacity={0.4} cornerRadius={1} />
            <Rect x={w * 0.06} y={h * 0.88} width={3} height={h * 0.1} fill="#6b7280" opacity={0.4} cornerRadius={1} />
          </>
        );
      case 'police-car':
        return (
          <>
            <Rect x={2} y={h * 0.15} width={w - 4} height={h * 0.7} fill={c} opacity={0.18} stroke={c} strokeWidth={1.5} cornerRadius={8} />
            <Rect x={w * 0.25} y={h * 0.08} width={w * 0.45} height={h * 0.84} fill={c} opacity={0.1} stroke={c} strokeWidth={1} cornerRadius={10} />
            <Line points={[w * 0.25, h * 0.2, w * 0.32, h * 0.12, w * 0.32, h * 0.88, w * 0.25, h * 0.8]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.15} closed />
            <Line points={[w * 0.7, h * 0.2, w * 0.63, h * 0.14, w * 0.63, h * 0.86, w * 0.7, h * 0.8]} stroke="#38bdf8" strokeWidth={1.2} fill="#38bdf8" opacity={0.12} closed />
            {/* Light bar */}
            <Rect x={w * 0.32} y={h * 0.04} width={w * 0.15} height={h * 0.92} fill="transparent" stroke="#475569" strokeWidth={1} cornerRadius={3} />
            <Rect x={w * 0.33} y={h * 0.08} width={w * 0.06} height={h * 0.35} fill="#3b82f6" opacity={0.7} cornerRadius={2} />
            <Rect x={w * 0.33} y={h * 0.57} width={w * 0.06} height={h * 0.35} fill="#ef4444" opacity={0.7} cornerRadius={2} />
            <Rect x={w * 0.4} y={h * 0.08} width={w * 0.06} height={h * 0.35} fill="#ef4444" opacity={0.7} cornerRadius={2} />
            <Rect x={w * 0.4} y={h * 0.57} width={w * 0.06} height={h * 0.35} fill="#3b82f6" opacity={0.7} cornerRadius={2} />
            {/* White stripe */}
            <Rect x={w * 0.05} y={h * 0.42} width={w * 0.88} height={h * 0.16} fill="#ffffff" opacity={0.15} />
            {/* Wheels */}
            <Circle x={w * 0.15} y={h * 0.12} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.15} y={h * 0.88} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.12} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Circle x={w * 0.85} y={h * 0.88} radius={6} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
            <Rect x={0} y={h * 0.2} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={0} y={h * 0.62} width={4} height={h * 0.18} fill="#fbbf24" opacity={0.8} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.2} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            <Rect x={w - 4} y={h * 0.68} width={4} height={h * 0.12} fill="#ef4444" opacity={0.6} cornerRadius={2} />
            {/* Push bar */}
            <Line points={[0, h * 0.15, -3, h * 0.15, -3, h * 0.85, 0, h * 0.85]} stroke="#6b7280" strokeWidth={1.5} />
          </>
        );
      case 'freehand':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {obj.points && obj.points.length >= 4 && (
              <Line points={obj.points} stroke={c} strokeWidth={2} lineCap="round" lineJoin="round" tension={0.5} />
            )}
          </>
        );
      case 'arrow':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            <KonvaArrow points={[0, h / 2, w, h / 2]} stroke={c} fill={c} strokeWidth={2} pointerLength={8} pointerWidth={6} />
          </>
        );
      case 'line':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            <Line points={[0, h / 2, w, h / 2]} stroke={c} strokeWidth={2} />
          </>
        );
      case 'room-label':
        return (
          <>
            <Rect width={w} height={h + 4} fill="transparent" />
            <Line points={[0, h + 2, w, h + 2]} stroke="#475569" strokeWidth={0.5} dash={[4, 4]} opacity={0.4} />
            <Text text={obj.label} fontSize={14} fontStyle="bold" fill="#94a3b8" fontFamily="Inter, sans-serif" width={w} align="center" />
          </>
        );
      case 'tree':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Trunk */}
            <Rect x={w * 0.38} y={h * 0.55} width={w * 0.24} height={h * 0.42} fill="#78350f" stroke="#451a03" strokeWidth={1} cornerRadius={2} />
            <Line points={[w * 0.42, h * 0.65, w * 0.42, h * 0.9]} stroke="#451a03" strokeWidth={0.5} opacity={0.4} />
            <Line points={[w * 0.55, h * 0.6, w * 0.55, h * 0.85]} stroke="#451a03" strokeWidth={0.5} opacity={0.3} />
            {/* Canopy layers */}
            <Circle x={w * 0.5} y={h * 0.35} radius={w * 0.38} fill={c} opacity={0.25} />
            <Circle x={w * 0.35} y={h * 0.3} radius={w * 0.28} fill={c} opacity={0.3} />
            <Circle x={w * 0.65} y={h * 0.3} radius={w * 0.28} fill={c} opacity={0.3} />
            <Circle x={w * 0.5} y={h * 0.2} radius={w * 0.22} fill={c} opacity={0.35} />
            {/* Canopy outline */}
            <Circle x={w * 0.5} y={h * 0.35} radius={w * 0.38} stroke={c} strokeWidth={1.5} />
          </>
        );
      case 'bush':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            <Circle x={w * 0.25} y={h * 0.55} radius={w * 0.22} fill={c} opacity={0.25} />
            <Circle x={w * 0.5} y={h * 0.4} radius={w * 0.28} fill={c} opacity={0.3} />
            <Circle x={w * 0.75} y={h * 0.55} radius={w * 0.22} fill={c} opacity={0.25} />
            <Circle x={w * 0.4} y={h * 0.3} radius={w * 0.18} fill={c} opacity={0.35} />
            <Circle x={w * 0.6} y={h * 0.35} radius={w * 0.16} fill={c} opacity={0.3} />
            {/* Outline */}
            <Line points={[w * 0.05, h * 0.7, w * 0.15, h * 0.35, w * 0.35, h * 0.15, w * 0.55, h * 0.12, w * 0.75, h * 0.2, w * 0.9, h * 0.4, w * 0.95, h * 0.7]} stroke={c} strokeWidth={1.5} tension={0.4} />
            {/* Ground shadow */}
            <Line points={[w * 0.1, h * 0.85, w * 0.9, h * 0.85]} stroke={c} strokeWidth={1} opacity={0.2} lineCap="round" />
          </>
        );
      case 'fence':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Horizontal rails */}
            <Line points={[0, h * 0.3, w, h * 0.3]} stroke={c} strokeWidth={2} />
            <Line points={[0, h * 0.7, w, h * 0.7]} stroke={c} strokeWidth={2} />
            {/* Vertical posts */}
            {Array.from({ length: Math.max(2, Math.floor(w / 15) + 1) }).map((_, i) => {
              const x = i * (w / Math.floor(w / 15));
              return <Line key={i} points={[Math.min(x, w), 0, Math.min(x, w), h]} stroke={c} strokeWidth={i % 3 === 0 ? 2.5 : 1.5} opacity={i % 3 === 0 ? 1 : 0.7} />;
            })}
            {/* Post caps */}
            {Array.from({ length: Math.max(2, Math.floor(w / 45) + 1) }).map((_, i) => {
              const x = i * 45;
              return x <= w ? <Rect key={`cap-${i}`} x={x - 3} y={-2} width={6} height={4} fill={c} opacity={0.6} cornerRadius={1} /> : null;
            })}
          </>
        );
      case 'streetlight':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Pole */}
            <Rect x={w * 0.42} y={h * 0.25} width={w * 0.16} height={h * 0.72} fill="#6b7280" stroke="#4b5563" strokeWidth={1} cornerRadius={1} />
            {/* Base */}
            <Rect x={w * 0.3} y={h * 0.88} width={w * 0.4} height={h * 0.12} fill="#4b5563" stroke="#374151" strokeWidth={1} cornerRadius={2} />
            {/* Lamp head */}
            <Rect x={w * 0.2} y={h * 0.12} width={w * 0.6} height={h * 0.16} fill="#374151" stroke="#1f2937" strokeWidth={1} cornerRadius={[3, 3, 1, 1]} />
            {/* Light glow */}
            <Circle x={w * 0.5} y={h * 0.28} radius={w * 0.35} fill={c} opacity={0.12} />
            <Circle x={w * 0.5} y={h * 0.25} radius={w * 0.2} fill={c} opacity={0.2} />
            {/* Bulb */}
            <Rect x={w * 0.35} y={h * 0.22} width={w * 0.3} height={h * 0.06} fill={c} opacity={0.7} cornerRadius={1} />
          </>
        );
      case 'fire-hydrant':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Body */}
            <Rect x={w * 0.25} y={h * 0.2} width={w * 0.5} height={h * 0.55} fill={c} opacity={0.4} stroke={c} strokeWidth={1.5} cornerRadius={3} />
            {/* Top dome */}
            <Circle x={w * 0.5} y={h * 0.2} radius={w * 0.2} fill={c} opacity={0.5} stroke={c} strokeWidth={1.5} />
            <Rect x={w * 0.4} y={h * 0.05} width={w * 0.2} height={h * 0.12} fill={c} opacity={0.5} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Side nozzles */}
            <Rect x={w * 0.05} y={h * 0.35} width={w * 0.22} height={h * 0.12} fill={c} opacity={0.4} stroke={c} strokeWidth={1} cornerRadius={2} />
            <Rect x={w * 0.73} y={h * 0.35} width={w * 0.22} height={h * 0.12} fill={c} opacity={0.4} stroke={c} strokeWidth={1} cornerRadius={2} />
            {/* Base */}
            <Rect x={w * 0.15} y={h * 0.75} width={w * 0.7} height={h * 0.2} fill={c} opacity={0.3} stroke={c} strokeWidth={1} cornerRadius={[0, 0, 4, 4]} />
            {/* Bolts */}
            <Circle x={w * 0.35} y={h * 0.5} radius={2} fill={c} opacity={0.7} />
            <Circle x={w * 0.65} y={h * 0.5} radius={2} fill={c} opacity={0.7} />
          </>
        );
      case 'dumpster':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Main body - trapezoidal */}
            <Line points={[w * 0.05, h * 0.25, w * 0.95, h * 0.25, w * 0.9, h * 0.88, w * 0.1, h * 0.88]} fill={c} opacity={0.25} closed stroke={c} strokeWidth={1.5} />
            {/* Lid */}
            <Rect x={w * 0.03} y={h * 0.15} width={w * 0.94} height={h * 0.12} fill={c} opacity={0.35} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Lid handle */}
            <Line points={[w * 0.4, h * 0.15, w * 0.4, h * 0.08, w * 0.6, h * 0.08, w * 0.6, h * 0.15]} stroke={c} strokeWidth={1.5} lineCap="round" />
            {/* Vertical ridges */}
            <Line points={[w * 0.33, h * 0.27, w * 0.35, h * 0.86]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Line points={[w * 0.66, h * 0.27, w * 0.65, h * 0.86]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            {/* Side handles */}
            <Rect x={w * 0.02} y={h * 0.45} width={w * 0.06} height={h * 0.15} fill={c} opacity={0.4} cornerRadius={1} />
            <Rect x={w * 0.92} y={h * 0.45} width={w * 0.06} height={h * 0.15} fill={c} opacity={0.4} cornerRadius={1} />
            {/* Wheels */}
            <Circle x={w * 0.2} y={h * 0.94} radius={h * 0.06} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <Circle x={w * 0.8} y={h * 0.94} radius={h * 0.06} fill="#1e293b" stroke="#475569" strokeWidth={1} />
            <Text text="WASTE" x={0} y={h * 0.5} width={w} fontSize={8} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.5} />
          </>
        );
      case 'bench':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Seat */}
            <Rect x={w * 0.05} y={h * 0.35} width={w * 0.9} height={h * 0.25} fill={c} opacity={0.3} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Seat slats */}
            <Line points={[w * 0.08, h * 0.42, w * 0.92, h * 0.42]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            <Line points={[w * 0.08, h * 0.52, w * 0.92, h * 0.52]} stroke={c} strokeWidth={0.8} opacity={0.4} />
            {/* Backrest */}
            <Rect x={w * 0.05} y={h * 0.08} width={w * 0.9} height={h * 0.22} fill={c} opacity={0.2} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Backrest slats */}
            <Line points={[w * 0.08, h * 0.16, w * 0.92, h * 0.16]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.08, h * 0.24, w * 0.92, h * 0.24]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            {/* Legs */}
            <Line points={[w * 0.12, h * 0.6, w * 0.08, h * 0.95]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.88, h * 0.6, w * 0.92, h * 0.95]} stroke={c} strokeWidth={2} lineCap="round" />
            <Line points={[w * 0.35, h * 0.6, w * 0.33, h * 0.95]} stroke={c} strokeWidth={1.5} lineCap="round" opacity={0.7} />
            <Line points={[w * 0.65, h * 0.6, w * 0.67, h * 0.95]} stroke={c} strokeWidth={1.5} lineCap="round" opacity={0.7} />
          </>
        );
      case 'sidewalk':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.08} stroke={c} strokeWidth={1} />
            {/* Concrete joints */}
            {Array.from({ length: Math.max(1, Math.floor(w / 40)) }).map((_, i) => (
              <Line key={i} points={[(i + 1) * 40, 0, (i + 1) * 40, h]} stroke={c} strokeWidth={0.8} opacity={0.3} />
            ))}
            <Line points={[0, h / 2, w, h / 2]} stroke={c} strokeWidth={0.5} opacity={0.15} />
            {/* Texture dots */}
            {Array.from({ length: 8 }).map((_, i) => (
              <Circle key={`dot-${i}`} x={w * (0.1 + Math.random() * 0.8)} y={h * (0.1 + Math.random() * 0.8)} radius={0.8} fill={c} opacity={0.15} />
            ))}
            <Text text="SIDEWALK" x={0} y={h / 2 - 4} width={w} fontSize={8} fill={c} align="center" fontFamily="JetBrains Mono, monospace" opacity={0.3} />
          </>
        );
      case 'road':
        return (
          <>
            <Rect width={w} height={h} fill={c} opacity={0.15} stroke={c} strokeWidth={1.5} cornerRadius={2} />
            {/* Center dashed line */}
            {Array.from({ length: Math.max(1, Math.floor(w / 20)) }).map((_, i) => (
              <Rect key={i} x={i * 20 + 4} y={h * 0.47} width={12} height={h * 0.06} fill="#facc15" opacity={0.6} cornerRadius={1} />
            ))}
            {/* Edge lines */}
            <Line points={[0, h * 0.1, w, h * 0.1]} stroke="#e2e8f0" strokeWidth={1.5} opacity={0.3} />
            <Line points={[0, h * 0.9, w, h * 0.9]} stroke="#e2e8f0" strokeWidth={1.5} opacity={0.3} />
            {/* Lane markings */}
            <Line points={[0, h * 0.28, w, h * 0.28]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.15} />
            <Line points={[0, h * 0.72, w, h * 0.72]} stroke="#e2e8f0" strokeWidth={0.5} opacity={0.15} />
            <Text text="ROAD" x={0} y={h * 0.15} width={w} fontSize={8} fill="#94a3b8" align="center" fontFamily="JetBrains Mono, monospace" opacity={0.4} />
          </>
        );
      case 'mailbox':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Post */}
            <Rect x={w * 0.4} y={h * 0.45} width={w * 0.2} height={h * 0.52} fill="#6b7280" stroke="#4b5563" strokeWidth={1} />
            {/* Box body */}
            <Rect x={w * 0.1} y={h * 0.15} width={w * 0.8} height={h * 0.35} fill={c} opacity={0.4} stroke={c} strokeWidth={1.5} cornerRadius={[0, 0, 2, 2]} />
            {/* Rounded top */}
            <Line points={[w * 0.1, h * 0.2, w * 0.2, h * 0.08, w * 0.5, h * 0.03, w * 0.8, h * 0.08, w * 0.9, h * 0.2]} stroke={c} strokeWidth={1.5} fill={c} opacity={0.35} closed={false} tension={0.3} />
            {/* Flag */}
            <Line points={[w * 0.88, h * 0.2, w * 0.88, h * 0.05]} stroke="#ef4444" strokeWidth={2} lineCap="round" />
            <Rect x={w * 0.88} y={h * 0.05} width={w * 0.1} height={h * 0.08} fill="#ef4444" opacity={0.8} />
            {/* Mail slot */}
            <Line points={[w * 0.25, h * 0.3, w * 0.65, h * 0.3]} stroke={c} strokeWidth={1} opacity={0.5} />
          </>
        );
      case 'manhole':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Outer ring */}
            <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) * 0.48} fill={c} opacity={0.15} stroke={c} strokeWidth={2} />
            {/* Inner ring */}
            <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) * 0.38} stroke={c} strokeWidth={1} opacity={0.5} />
            <Circle x={w / 2} y={h / 2} radius={Math.min(w, h) * 0.28} stroke={c} strokeWidth={0.8} opacity={0.3} />
            {/* Cross pattern */}
            <Line points={[w * 0.2, h / 2, w * 0.8, h / 2]} stroke={c} strokeWidth={1} opacity={0.4} />
            <Line points={[w / 2, h * 0.2, w / 2, h * 0.8]} stroke={c} strokeWidth={1} opacity={0.4} />
            {/* Diagonal pattern */}
            <Line points={[w * 0.25, h * 0.25, w * 0.75, h * 0.75]} stroke={c} strokeWidth={0.6} opacity={0.25} />
            <Line points={[w * 0.75, h * 0.25, w * 0.25, h * 0.75]} stroke={c} strokeWidth={0.6} opacity={0.25} />
            {/* Grip holes */}
            <Rect x={w * 0.38} y={h * 0.35} width={w * 0.24} height={h * 0.06} fill={c} opacity={0.3} cornerRadius={2} />
            <Rect x={w * 0.38} y={h * 0.58} width={w * 0.24} height={h * 0.06} fill={c} opacity={0.3} cornerRadius={2} />
          </>
        );
      case 'trash-can':
        return (
          <>
            <Rect width={w} height={h} fill="transparent" />
            {/* Body */}
            <Line points={[w * 0.15, h * 0.2, w * 0.85, h * 0.2, w * 0.8, h * 0.92, w * 0.2, h * 0.92]} fill={c} opacity={0.2} closed stroke={c} strokeWidth={1.5} />
            {/* Lid */}
            <Rect x={w * 0.1} y={h * 0.12} width={w * 0.8} height={h * 0.1} fill={c} opacity={0.3} stroke={c} strokeWidth={1} cornerRadius={[3, 3, 0, 0]} />
            {/* Handle */}
            <Line points={[w * 0.4, h * 0.12, w * 0.4, h * 0.05, w * 0.6, h * 0.05, w * 0.6, h * 0.12]} stroke={c} strokeWidth={1.5} lineCap="round" />
            {/* Vertical ridges */}
            <Line points={[w * 0.35, h * 0.22, w * 0.36, h * 0.9]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.5, h * 0.22, w * 0.5, h * 0.9]} stroke={c} strokeWidth={0.6} opacity={0.3} />
            <Line points={[w * 0.65, h * 0.22, w * 0.64, h * 0.9]} stroke={c} strokeWidth={0.6} opacity={0.3} />
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
        opacity={opacity}
        draggable={!obj.locked}
        onClick={onSelect}
        onTap={onSelect}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Lock indicator */}
        {obj.locked && (
          <Rect x={-2} y={-2} width={w + 4} height={h + 4} stroke="#ef4444" strokeWidth={1} dash={[3, 3]} cornerRadius={3} opacity={0.5} />
        )}
        {/* Hover glow */}
        {hovered && !isSelected && !obj.locked && (
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
        {/* Label below object */}
        {obj.type !== 'room-label' && obj.type !== 'text-label' && obj.type !== 'evidence-marker' && obj.type !== 'freehand' && obj.type !== 'arrow' && obj.type !== 'line' && (
          <Text text={obj.label} x={0} y={h + 4} width={w} fontSize={9} fill="#64748b" align="center" fontFamily="JetBrains Mono, monospace" />
        )}
      </Group>
      {isSelected && !obj.locked && (
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
          borderStroke="hsl(215, 80%, 55%)"
          anchorFill="hsl(215, 80%, 55%)"
          anchorStroke="#fff"
          anchorSize={8}
          keepRatio={false}
          centeredScaling={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 5 || Math.abs(newBox.height) < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}

// Minimap component
function Minimap({ objects, walls, dims, stagePos, zoom }: {
  objects: SceneObject[]; walls: WallSegment[]; dims: { width: number; height: number }; stagePos: { x: number; y: number }; zoom: number;
}) {
  const mmW = 140;
  const mmH = 100;
  const allX = objects.map(o => o.x).concat(walls.flatMap(w => [w.x1, w.x2]));
  const allY = objects.map(o => o.y).concat(walls.flatMap(w => [w.y1, w.y2]));
  if (allX.length === 0) return null;

  const minX = Math.min(...allX) - 50;
  const minY = Math.min(...allY) - 50;
  const maxX = Math.max(...allX, ...objects.map(o => o.x + o.width)) + 50;
  const maxY = Math.max(...allY, ...objects.map(o => o.y + o.height)) + 50;
  const sceneW = maxX - minX || 1;
  const sceneH = maxY - minY || 1;
  const scale = Math.min(mmW / sceneW, mmH / sceneH);

  // Viewport rect in minimap coords
  const vpX = (-stagePos.x / zoom - minX) * scale;
  const vpY = (-stagePos.y / zoom - minY) * scale;
  const vpW = (dims.width / zoom) * scale;
  const vpH = (dims.height / zoom) * scale;

  return (
    <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden shadow-lg">
      <div className="px-2 py-1 border-b border-border">
        <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">Minimap</span>
      </div>
      <svg width={mmW} height={mmH} className="block">
        <rect width={mmW} height={mmH} fill="hsl(225, 25%, 8%)" opacity={0.5} />
        {/* Walls */}
        {walls.map(w => (
          <line key={w.id} x1={(w.x1 - minX) * scale} y1={(w.y1 - minY) * scale} x2={(w.x2 - minX) * scale} y2={(w.y2 - minY) * scale} stroke="#a3a3a3" strokeWidth={1.5} />
        ))}
        {/* Objects */}
        {objects.map(o => (
          <rect key={o.id} x={(o.x - minX) * scale} y={(o.y - minY) * scale} width={Math.max(2, o.width * scale)} height={Math.max(2, o.height * scale)}
            fill={o.color} opacity={0.6} rx={1} />
        ))}
        {/* Viewport indicator */}
        <rect x={vpX} y={vpY} width={vpW} height={vpH} fill="none" stroke="hsl(215, 80%, 55%)" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.8} />
      </svg>
    </div>
  );
}

export default function SceneCanvas() {
  const { objects, selectedObjectId, selectedWallId, selectedMeasurementId, selectObject, selectWall, selectMeasurement, removeObject, updateObject, updateObjectSilent, addEvidence, activeTool, setTool, showGrid, showLegend, zoom, setZoom, addObject, snapToGrid, measurements, addMeasurement, removeMeasurement, walls, addWall, removeWall, evidence, isDark, bringToFront, sendToBack, backgroundImage, caseInfo, sceneTime } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  useEffect(() => {
    stageStore.current = stageRef.current;
    return () => { stageStore.current = null; };
  });

  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [measureStart, setMeasureStart] = useState<{ x: number; y: number } | null>(null);
  const [measureMid, setMeasureMid] = useState<{ x: number; y: number } | null>(null);
  const [measurePreview, setMeasurePreview] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [wallPreview, setWallPreview] = useState<{ x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; objectId: string } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [arrowPreview, setArrowPreview] = useState<{ x: number; y: number } | null>(null);
  const [snapGuides, setSnapGuides] = useState<SnapGuide[]>([]);

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        e.preventDefault();
        if (selectedObjectId) { removeObject(selectedObjectId); }
        else if (selectedWallId) { removeWall(selectedWallId); selectWall(null); }
        else if (selectedMeasurementId) { removeMeasurement(selectedMeasurementId); selectMeasurement(null); }
      }
      if (e.key === 'Escape') {
        selectObject(null);
        selectWall(null);
        selectMeasurement(null);
        setTool('select');
        setContextMenu(null);
        setIsDrawing(false);
        setFreehandPoints([]);
        setArrowStart(null);
        setArrowPreview(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedObjectId, selectedWallId, selectedMeasurementId, removeObject, removeWall, removeMeasurement, selectObject, selectWall, selectMeasurement, setTool]);

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

  const getRawCanvasPos = (stage: Konva.Stage) => {
    const pos = stage.getPointerPosition();
    if (!pos) return null;
    return { x: (pos.x - stagePos.x) / zoom, y: (pos.y - stagePos.y) / zoom };
  };

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    // Freehand drawing start
    if (activeTool === 'freehand') {
      const pos = getRawCanvasPos(stage);
      if (!pos) return;
      setIsDrawing(true);
      setFreehandPoints([pos.x, pos.y]);
      return;
    }
  };

  const handleStageMouseUp = () => {
    // Freehand drawing end
    if (activeTool === 'freehand' && isDrawing && freehandPoints.length >= 4) {
      const xs = freehandPoints.filter((_, i) => i % 2 === 0);
      const ys = freehandPoints.filter((_, i) => i % 2 === 1);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const maxX = Math.max(...xs);
      const maxY = Math.max(...ys);
      // Normalize points relative to bounding box
      const normalized = freehandPoints.map((v, i) => i % 2 === 0 ? v - minX : v - minY);
      addObject({
        type: 'freehand',
        x: minX, y: minY,
        width: Math.max(10, maxX - minX),
        height: Math.max(10, maxY - minY),
        rotation: 0,
        label: 'Drawing',
        color: '#94a3b8',
        category: 'Annotation',
        points: normalized,
      });
      setIsDrawing(false);
      setFreehandPoints([]);
      return;
    }
    setIsDrawing(false);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;

    if (e.target === e.target.getStage()) { selectObject(null); selectWall(null); selectMeasurement(null); }

    if (activeTool === 'measure') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!measureStart) { setMeasureStart(pos); }
      else { addMeasurement({ type: 'distance', x1: measureStart.x, y1: measureStart.y, x2: pos.x, y2: pos.y }); setMeasureStart(null); setMeasurePreview(null); }
      return;
    }

    if (activeTool === 'measure-angle') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!measureStart) { setMeasureStart(pos); }
      else if (!measureMid) { setMeasureMid(pos); }
      else {
        addMeasurement({ type: 'angle', x1: measureMid.x, y1: measureMid.y, x2: measureStart.x, y2: measureStart.y, x3: pos.x, y3: pos.y });
        setMeasureStart(null); setMeasureMid(null); setMeasurePreview(null);
      }
      return;
    }

    if (activeTool === 'measure-arc') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!measureStart) { setMeasureStart(pos); }
      else if (!measureMid) { setMeasureMid(pos); }
      else {
        addMeasurement({ type: 'arc', x1: measureStart.x, y1: measureStart.y, x2: measureMid.x, y2: measureMid.y, x3: pos.x, y3: pos.y });
        setMeasureStart(null); setMeasureMid(null); setMeasurePreview(null);
      }
      return;
    }

    if (activeTool === 'wall') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!wallStart) { setWallStart(pos); }
      else { addWall({ x1: wallStart.x, y1: wallStart.y, x2: pos.x, y2: pos.y, thickness: 6 }); setWallStart(pos); setWallPreview(null); }
    }

    if (activeTool === 'arrow') {
      const pos = getCanvasPos(stage);
      if (!pos) return;
      if (!arrowStart) { setArrowStart(pos); }
      else {
        const dx = pos.x - arrowStart.x;
        const dy = pos.y - arrowStart.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 5) {
          addObject({
            type: 'arrow',
            x: arrowStart.x, y: arrowStart.y - 5,
            width: len,
            height: 10,
            rotation: Math.atan2(dy, dx) * (180 / Math.PI),
            label: 'Arrow',
            color: '#94a3b8',
            category: 'Annotation',
          });
        }
        setArrowStart(null);
        setArrowPreview(null);
      }
      return;
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
    if ((activeTool === 'measure' || activeTool === 'measure-angle' || activeTool === 'measure-arc') && measureStart && pos) setMeasurePreview(pos);
    if (activeTool === 'wall' && wallStart && pos) setWallPreview(pos);
    if (activeTool === 'arrow' && arrowStart && pos) setArrowPreview(pos);

    // Freehand drawing
    if (activeTool === 'freehand' && isDrawing) {
      const rawPos = getRawCanvasPos(stage);
      if (rawPos) setFreehandPoints(prev => [...prev, rawPos.x, rawPos.y]);
    }
  };

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;
    const canvasX = (pointerPos.x - stagePos.x) / zoom;
    const canvasY = (pointerPos.y - stagePos.y) / zoom;

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
      points: obj.points,
    });
    setContextMenu(null);
  }, [objects, addObject]);

  useEffect(() => {
    if (activeTool !== 'measure' && activeTool !== 'measure-angle' && activeTool !== 'measure-arc') { setMeasureStart(null); setMeasureMid(null); setMeasurePreview(null); }
    if (activeTool !== 'wall') { setWallStart(null); setWallPreview(null); }
    if (activeTool !== 'arrow') { setArrowStart(null); setArrowPreview(null); }
    if (activeTool !== 'freehand') { setIsDrawing(false); setFreehandPoints([]); }
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

  const legendX = (dims.width - stagePos.x) / zoom - 200;
  const legendY = 20 / zoom;
  const scaleBarFeet = Math.round(100 / PIXELS_PER_UNIT);

  const getCursor = () => {
    if (activeTool === 'freehand' && isDrawing) return 'crosshair';
    if (activeTool === 'measure' || activeTool === 'measure-angle' || activeTool === 'measure-arc' || activeTool === 'wall' || activeTool === 'arrow' || activeTool === 'freehand') return 'crosshair';
    if (activeTool === 'pan') return 'grab';
    if (activeTool === 'text' || activeTool === 'room-label') return 'text';
    return 'default';
  };

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden transition-colors duration-700 ${sceneTime === 'night' ? 'bg-[#050d1a]' : 'bg-canvas-bg'}`}
      style={{ cursor: getCursor() }}
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
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handleMouseMove}
        onDragEnd={(e) => { if (activeTool === 'pan') setStagePos({ x: e.target.x(), y: e.target.y() }); }}
      >
        <Layer>
          {/* Night sky background */}
          {sceneTime === 'night' && (
            <Rect x={-10000} y={-10000} width={30000} height={30000} fill="#050d1a" listening={false} />
          )}
          <BackgroundImageLayer backgroundImage={backgroundImage} />
          {sceneTime === 'night' && <NightSkyLayer width={dims.width} height={dims.height} zoom={zoom} />}
          {showGrid && <GridLayer width={dims.width} height={dims.height} zoom={zoom} isDark={isDark} isNight={sceneTime === 'night'} />}
          {objects.map(obj => (
            <SceneObjectShape key={obj.id} obj={obj} isSelected={selectedObjectId === obj.id} onSelect={() => selectObject(obj.id)} allObjects={objects} onSnapGuides={setSnapGuides} updateObject={updateObject} updateObjectSilent={updateObjectSilent} snapToGrid={snapToGrid} />
          ))}
          {/* Snap alignment guides */}
          {snapGuides.map((g, i) =>
            g.orientation === 'v'
              ? <Line key={`sg-${i}`} points={[g.pos, -10000, g.pos, 10000]} stroke="#f59e0b" strokeWidth={1} dash={[4, 4]} opacity={0.7} />
              : <Line key={`sg-${i}`} points={[-10000, g.pos, 10000, g.pos]} stroke="#f59e0b" strokeWidth={1} dash={[4, 4]} opacity={0.7} />
          )}
          {measurements.map(m => {
            if (m.type === 'angle') return <AngleMeasurement key={m.id} m={m} isSelected={selectedMeasurementId === m.id} onSelect={() => selectMeasurement(m.id)} onRemove={() => removeMeasurement(m.id)} />;
            if (m.type === 'arc') return <ArcMeasurement key={m.id} m={m} isSelected={selectedMeasurementId === m.id} onSelect={() => selectMeasurement(m.id)} onRemove={() => removeMeasurement(m.id)} />;
            return <MeasurementLine key={m.id} m={m} isSelected={selectedMeasurementId === m.id} onSelect={() => selectMeasurement(m.id)} onRemove={() => removeMeasurement(m.id)} />;
          })}
          {walls.map(w => (
            <WallLine key={w.id} w={w} isSelected={selectedWallId === w.id} onSelect={() => selectWall(w.id)} onRemove={() => removeWall(w.id)} />
          ))}
          {wallStart && wallPreview && (
            <WallLine w={{ id: 'wall-preview', x1: wallStart.x, y1: wallStart.y, x2: wallPreview.x, y2: wallPreview.y, thickness: 6 }} onRemove={() => { setWallStart(null); setWallPreview(null); }} />
          )}
          {wallStart && !wallPreview && (
            <Circle x={wallStart.x} y={wallStart.y} radius={5} fill="#a3a3a3" opacity={0.8} />
          )}
          {/* Distance measure preview */}
          {activeTool === 'measure' && measureStart && measurePreview && (
            <MeasurementLine m={{ id: 'preview', type: 'distance', x1: measureStart.x, y1: measureStart.y, x2: measurePreview.x, y2: measurePreview.y }} onRemove={() => { setMeasureStart(null); setMeasurePreview(null); }} />
          )}
          {/* Angle measure preview */}
          {activeTool === 'measure-angle' && measureStart && measurePreview && !measureMid && (
            <Line points={[measureStart.x, measureStart.y, measurePreview.x, measurePreview.y]} stroke="#f97316" strokeWidth={1.5} dash={[6, 3]} opacity={0.7} />
          )}
          {activeTool === 'measure-angle' && measureStart && measureMid && measurePreview && (
            <AngleMeasurement m={{ id: 'preview', type: 'angle', x1: measureMid.x, y1: measureMid.y, x2: measureStart.x, y2: measureStart.y, x3: measurePreview.x, y3: measurePreview.y }} onRemove={() => { setMeasureStart(null); setMeasureMid(null); setMeasurePreview(null); }} />
          )}
          {/* Arc measure preview */}
          {activeTool === 'measure-arc' && measureStart && measurePreview && !measureMid && (
            <Line points={[measureStart.x, measureStart.y, measurePreview.x, measurePreview.y]} stroke="#a855f7" strokeWidth={1.5} dash={[6, 3]} opacity={0.7} />
          )}
          {activeTool === 'measure-arc' && measureStart && measureMid && measurePreview && (
            <ArcMeasurement m={{ id: 'preview', type: 'arc', x1: measureStart.x, y1: measureStart.y, x2: measureMid.x, y2: measureMid.y, x3: measurePreview.x, y3: measurePreview.y }} onRemove={() => { setMeasureStart(null); setMeasureMid(null); setMeasurePreview(null); }} />
          )}
          {(activeTool === 'measure' || activeTool === 'measure-angle' || activeTool === 'measure-arc') && measureStart && !measurePreview && (
            <Circle x={measureStart.x} y={measureStart.y} radius={5} fill={activeTool === 'measure-angle' ? '#f97316' : activeTool === 'measure-arc' ? '#a855f7' : '#22d3ee'} opacity={0.8} />
          )}
          {(activeTool === 'measure-angle' || activeTool === 'measure-arc') && measureMid && !measurePreview && (
            <Circle x={measureMid.x} y={measureMid.y} radius={5} fill={activeTool === 'measure-angle' ? '#f97316' : '#a855f7'} opacity={0.8} />
          )}
          {/* Arrow preview */}
          {arrowStart && arrowPreview && (
            <KonvaArrow points={[arrowStart.x, arrowStart.y, arrowPreview.x, arrowPreview.y]} stroke="#94a3b8" fill="#94a3b8" strokeWidth={2} pointerLength={8} pointerWidth={6} dash={[6, 3]} opacity={0.6} />
          )}
          {arrowStart && !arrowPreview && (
            <Circle x={arrowStart.x} y={arrowStart.y} radius={5} fill="#94a3b8" opacity={0.8} />
          )}
          {/* Freehand preview */}
          {isDrawing && freehandPoints.length >= 4 && (
            <Line points={freehandPoints} stroke="#94a3b8" strokeWidth={2} lineCap="round" lineJoin="round" tension={0.5} opacity={0.7} />
          )}
          {showLegend && (() => {
            const ev = evidence || [];
            const ci = caseInfo || {} as any;
            if (ev.length === 0 && !ci.location) return null;
            const lineHeight = 16;
            const padding = 12;
            const headerH = ci.location || ci.caseNumber ? 80 : 0;
            const legendH = ev.length * lineHeight + padding * 2 + (ev.length > 0 ? 20 : 0) + headerH;
            const legendW = 180;
            return (
              <Group x={legendX} y={legendY} draggable>
                <Rect width={legendW} height={legendH} fill="hsl(225, 22%, 11%)" stroke="#475569" strokeWidth={1} cornerRadius={4} opacity={0.95} />
                {(ci.location || ci.caseNumber) && (
                  <>
                    {ci.location && <Text x={padding} y={padding} text={`Location: ${ci.location}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
                    {ci.dateTime && <Text x={padding} y={padding + 14} text={`Date: ${ci.dateTime}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
                    {ci.incident && <Text x={padding} y={padding + 28} text={`Incident: ${ci.incident}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
                    {ci.sketchBy && <Text x={padding} y={padding + 42} text={`Sketch by: ${ci.sketchBy}`} fontSize={9} fill="#94a3b8" fontFamily="JetBrains Mono, monospace" width={legendW - padding * 2} />}
                    <Line points={[padding, headerH - 8, legendW - padding, headerH - 8]} stroke="#475569" strokeWidth={0.5} />
                  </>
                )}
                {ev.length > 0 && (
                  <>
                    <Text x={padding} y={headerH + padding - 4} text="EVIDENCE KEY" fontSize={9} fill="#94a3b8" fontStyle="bold" letterSpacing={1} />
                    {ev.map((item: any, i: number) => (
                      <React.Fragment key={item.id}>
                        <Text x={padding} y={headerH + padding + 14 + i * lineHeight} text={`${item.letter} -`} fontSize={11} fill="#eab308" fontStyle="bold" fontFamily="JetBrains Mono, monospace" />
                        <Text x={padding + 28} y={headerH + padding + 14 + i * lineHeight} text={item.description} fontSize={10} fill="#e2e8f0" fontFamily="Inter, sans-serif" width={legendW - padding * 2 - 28} />
                      </React.Fragment>
                    ))}
                  </>
                )}
              </Group>
            );
          })()}
          {/* Night mode effects */}
          {sceneTime === 'night' && (
            <>
              <EvidenceGlowLayer objects={objects} />
              {/* Dark overlay */}
              <Rect x={-10000} y={-10000} width={30000} height={30000} fill="#0a1628" opacity={0.4} listening={false} />
              {/* Vignette effect — darker edges */}
              <Rect x={-10000} y={-10000} width={30000} height={30000}
                fillRadialGradientStartPoint={{ x: dims.width / zoom / 2, y: dims.height / zoom / 2 }}
                fillRadialGradientEndPoint={{ x: dims.width / zoom / 2, y: dims.height / zoom / 2 }}
                fillRadialGradientStartRadius={0}
                fillRadialGradientEndRadius={Math.max(dims.width, dims.height) / zoom}
                fillRadialGradientColorStops={[0, 'transparent', 0.6, 'transparent', 1, 'rgba(0,0,0,0.25)']}
                listening={false}
              />
            </>
          )}
        </Layer>
        {/* Night ambient light layer */}
        {sceneTime === 'night' && (
          <Layer listening={false}>
            <Rect x={-10000} y={-10000} width={30000} height={30000}
              fillLinearGradientStartPoint={{ x: 0, y: 0 }} fillLinearGradientEndPoint={{ x: 30000, y: 30000 }}
              fillLinearGradientColorStops={[0, 'rgba(59,130,246,0.06)', 0.3, 'transparent', 0.7, 'transparent', 1, 'rgba(99,102,241,0.05)']}
              listening={false} />
          </Layer>
        )}
      </Stage>

      {/* Minimap */}
      {(objects.length > 0 || walls.length > 0) && (
        <Minimap objects={objects} walls={walls} dims={dims} stagePos={stagePos} zoom={zoom} />
      )}

      {/* Compass rose overlay */}
      <div className="absolute bottom-10 right-3 w-14 h-14 flex items-center justify-center">
        <div className="relative w-12 h-12 bg-card/90 backdrop-blur-sm border border-border rounded-full flex items-center justify-center">
          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-destructive">N</span>
          <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[7px] font-mono text-muted-foreground">S</span>
          <span className="absolute top-1/2 -right-2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground">E</span>
          <span className="absolute top-1/2 -left-2 -translate-y-1/2 text-[7px] font-mono text-muted-foreground">W</span>
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-destructive">
            <polygon points="10,1 7,10 10,8 13,10" fill="currentColor" />
            <polygon points="10,19 7,10 10,12 13,10" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
      </div>

      {/* Scale bar overlay */}
      <div className="absolute bottom-10 left-3 bg-card/90 backdrop-blur-sm border border-border rounded-md px-2.5 py-1.5 flex flex-col items-center gap-0.5">
        <span className="text-[8px] font-mono text-muted-foreground">{scaleBarFeet} ft</span>
        <div className="flex items-center">
          <div className="w-px h-2 bg-foreground/60" />
          <div className="w-[60px] h-0.5 bg-foreground/60" />
          <div className="w-px h-2 bg-foreground/60" />
        </div>
      </div>

      {/* Enhanced Status bar */}
      <div className={`absolute bottom-0 left-0 right-0 h-7 backdrop-blur-sm border-t border-border flex items-center px-3 gap-3 text-[10px] font-mono transition-colors duration-500 ${sceneTime === 'night' ? 'bg-[#0a1628]/90 text-blue-300/70' : 'bg-card/90 text-muted-foreground'}`}>
        <span className="flex items-center gap-1">
          <span className={`w-1.5 h-1.5 rounded-full ${sceneTime === 'night' ? 'bg-indigo-400' : 'bg-emerald-400'}`} />
          {Math.round(zoom * 100)}%
        </span>
        <span className="h-3 w-px bg-border" />
        <span>({mousePos.x}, {mousePos.y})</span>
        <span className="h-3 w-px bg-border" />
        <span>{objects.length} obj · {walls.length} walls · {evidence.length} ev · {measurements.length} meas</span>
        <span className="flex-1" />
        <span className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 rounded ${showGrid ? 'bg-secondary text-foreground' : 'opacity-50'}`}>Grid</span>
          <span className={`px-1.5 py-0.5 rounded ${snapToGrid ? 'bg-secondary text-foreground' : 'opacity-50'}`}>Snap</span>
          <span className={`px-1.5 py-0.5 rounded flex items-center gap-1 ${sceneTime === 'night' ? 'bg-indigo-600/30 text-indigo-300' : 'bg-amber-500/20 text-amber-600'}`}>
            {sceneTime === 'night' ? '🌙' : '☀️'} {sceneTime === 'night' ? 'Night' : 'Day'}
          </span>
        </span>
      </div>

      {/* Selection action bar */}
      {selectedObjectId && (() => {
        const selObj = objects.find(o => o.id === selectedObjectId);
        if (!selObj) return null;
        // Position the bar above the selected object
        const barX = selObj.x * zoom + stagePos.x;
        const barY = selObj.y * zoom + stagePos.y - 48;
        const clampedX = Math.max(8, Math.min(barX, dims.width - 280));
        const clampedY = Math.max(8, barY);
        return (
          <div
            className="absolute z-40 flex items-center gap-1 bg-card border border-border rounded-lg shadow-xl px-2 py-1.5 animate-in fade-in-0 zoom-in-95"
            style={{ left: clampedX, top: clampedY }}
          >
            <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[80px] mr-1">{selObj.label}</span>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => handleDuplicate(selectedObjectId)}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Duplicate"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => updateObject(selectedObjectId, { locked: !selObj.locked })}
              className={`h-7 w-7 flex items-center justify-center rounded transition-colors ${selObj.locked ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
              title={selObj.locked ? 'Unlock' : 'Lock'}
            >
              {selObj.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => { bringToFront(selectedObjectId); }}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Bring to Front"
            >
              <ArrowUpToLine className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { sendToBack(selectedObjectId); }}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Send to Back"
            >
              <ArrowDownToLine className="h-3.5 w-3.5" />
            </button>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => { removeObject(selectedObjectId); }}
              className="h-7 w-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete (Del)"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => selectObject(null)}
              className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Deselect (Esc)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Wall selection action bar */}
      {selectedWallId && (() => {
        const selWall = walls.find(w => w.id === selectedWallId);
        if (!selWall) return null;
        const midX = ((selWall.x1 + selWall.x2) / 2) * zoom + stagePos.x;
        const midY = ((selWall.y1 + selWall.y2) / 2) * zoom + stagePos.y - 48;
        const clampedX = Math.max(8, Math.min(midX - 60, dims.width - 160));
        const clampedY = Math.max(8, midY);
        return (
          <div className="absolute z-40 flex items-center gap-1 bg-card border border-border rounded-lg shadow-xl px-2 py-1.5 animate-in fade-in-0 zoom-in-95" style={{ left: clampedX, top: clampedY }}>
            <span className="text-[10px] font-mono text-muted-foreground mr-1">Wall</span>
            <div className="h-4 w-px bg-border" />
            <button onClick={() => { removeWall(selectedWallId); selectWall(null); }} className="h-7 w-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors" title="Delete (Del)">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => selectWall(null)} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Deselect (Esc)">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Measurement selection action bar */}
      {selectedMeasurementId && (() => {
        const selMeas = measurements.find(m => m.id === selectedMeasurementId);
        if (!selMeas) return null;
        const midX = ((selMeas.x1 + selMeas.x2) / 2) * zoom + stagePos.x;
        const midY = ((selMeas.y1 + selMeas.y2) / 2) * zoom + stagePos.y - 48;
        const clampedX = Math.max(8, Math.min(midX - 60, dims.width - 180));
        const clampedY = Math.max(8, midY);
        return (
          <div className="absolute z-40 flex items-center gap-1 bg-card border border-border rounded-lg shadow-xl px-2 py-1.5 animate-in fade-in-0 zoom-in-95" style={{ left: clampedX, top: clampedY }}>
            <span className="text-[10px] font-mono text-muted-foreground mr-1">Measurement</span>
            <div className="h-4 w-px bg-border" />
            <button onClick={() => { removeMeasurement(selectedMeasurementId); selectMeasurement(null); }} className="h-7 w-7 flex items-center justify-center rounded text-destructive hover:bg-destructive/10 transition-colors" title="Delete (Del)">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => selectMeasurement(null)} className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Deselect (Esc)">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Context menu */}
      {contextMenu && (() => {
        const ctxObj = objects.find(o => o.id === contextMenu.objectId);
        if (!ctxObj) return null;
        const containerRect = containerRef.current?.getBoundingClientRect();
        const menuX = containerRect ? contextMenu.x - containerRect.left : contextMenu.x;
        const menuY = containerRect ? contextMenu.y - containerRect.top : contextMenu.y;
        return (
          <div
            className="absolute z-50 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[180px] animate-in fade-in-0 zoom-in-95"
            style={{ left: menuX, top: menuY }}
            onClick={e => e.stopPropagation()}
          >
            <div className="px-3 py-1.5 text-[10px] text-muted-foreground font-mono border-b border-border mb-1 truncate">
              {ctxObj.label} ({ctxObj.type})
            </div>
            <button onClick={() => handleDuplicate(contextMenu.objectId)}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
              <Copy className="h-3 w-3 text-muted-foreground" /> Duplicate
            </button>
            {!ctxObj.evidenceId && (
              <button onClick={() => { addEvidence(contextMenu.objectId, ctxObj.label); setContextMenu(null); }}
                className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
                <span className="text-muted-foreground text-[10px] w-3">🏷</span> Mark as Evidence
              </button>
            )}
            <div className="h-px bg-border my-1" />
            <button onClick={() => { updateObject(contextMenu.objectId, { locked: !ctxObj.locked }); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
              {ctxObj.locked ? <Unlock className="h-3 w-3 text-muted-foreground" /> : <Lock className="h-3 w-3 text-muted-foreground" />}
              {ctxObj.locked ? 'Unlock' : 'Lock'}
            </button>
            <button onClick={() => { bringToFront(contextMenu.objectId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
              <ArrowUpToLine className="h-3 w-3 text-muted-foreground" /> Bring to Front
            </button>
            <button onClick={() => { sendToBack(contextMenu.objectId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2">
              <ArrowDownToLine className="h-3 w-3 text-muted-foreground" /> Send to Back
            </button>
            <div className="h-px bg-border my-1" />
            <button onClick={() => { removeObject(contextMenu.objectId); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        );
      })()}

      {/* Tool hints */}
      {activeTool === 'measure' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#22d3ee]" />
          {measureStart ? 'Click second point to complete measurement' : 'Click to set first measurement point'}
          {measureStart && <button onClick={() => { setMeasureStart(null); setMeasurePreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Cancel</button>}
        </div>
      )}
      {activeTool === 'wall' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          {wallStart ? 'Click to place next wall point (walls chain automatically)' : 'Click to set wall start point'}
          {wallStart && <button onClick={() => { setWallStart(null); setWallPreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Finish</button>}
        </div>
      )}
      {activeTool === 'arrow' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          {arrowStart ? 'Click to set arrow endpoint' : 'Click to set arrow start point'}
          {arrowStart && <button onClick={() => { setArrowStart(null); setArrowPreview(null); }} className="ml-2 text-[10px] text-destructive hover:underline">Cancel</button>}
        </div>
      )}
      {activeTool === 'freehand' && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm border border-border rounded-md px-4 py-2 text-xs text-foreground flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground" />
          {isDrawing ? 'Drawing... release to finish' : 'Click and drag to draw freehand'}
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
