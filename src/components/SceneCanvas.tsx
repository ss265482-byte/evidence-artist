import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Line, Circle, Group, Transformer } from 'react-konva';
import { useScene, SceneObject } from '@/store/SceneContext';
import Konva from 'konva';

const GRID_SIZE = 20;

function GridLayer({ width, height, zoom }: { width: number; height: number; zoom: number }) {
  const lines: React.ReactElement[] = [];
  const step = GRID_SIZE;
  const w = width / zoom + step;
  const h = height / zoom + step;

  for (let i = 0; i <= w / step; i++) {
    lines.push(
      <Line key={`v-${i}`} points={[i * step, 0, i * step, h]} stroke="hsl(220, 15%, 82%)" strokeWidth={0.5} opacity={0.4} />
    );
  }
  for (let i = 0; i <= h / step; i++) {
    lines.push(
      <Line key={`h-${i}`} points={[0, i * step, w, i * step]} stroke="hsl(220, 15%, 82%)" strokeWidth={0.5} opacity={0.4} />
    );
  }
  return <>{lines}</>;
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
    updateObject(obj.id, {
      x: snapPos(e.target.x()),
      y: snapPos(e.target.y()),
    });
  };

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    node.scaleX(1);
    node.scaleY(1);
    updateObject(obj.id, {
      x: snapPos(node.x()),
      y: snapPos(node.y()),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    });
  };

  const getShapeColor = () => obj.color || '#3b82f6';

  const renderShape = () => {
    const c = getShapeColor();
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
          <Group x={obj.width - 15} y={-15}>
            <Circle radius={10} fill="#eab308" />
            <Text text={obj.evidenceId.replace('EV-', '')} x={-8} y={-6} fontSize={10} fontStyle="bold" fill="#000" width={16} align="center" />
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
  const { objects, selectedObjectId, selectObject, activeTool, showGrid, zoom, setZoom, addObject, snapToGrid } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

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
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setZoom(clampedScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    });
  }, [zoom, stagePos, setZoom]);

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      selectObject(null);
    }
    if (activeTool === 'text') {
      const stage = stageRef.current;
      if (!stage) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      const x = (pos.x - stagePos.x) / zoom;
      const y = (pos.y - stagePos.y) / zoom;
      const snapPos = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
      addObject({
        type: 'text-label',
        x: snapPos(x),
        y: snapPos(y),
        width: 100,
        height: 24,
        rotation: 0,
        label: 'Label',
        color: '#94a3b8',
        category: 'Annotation',
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const data = e.dataTransfer.getData('application/scene-object');
    if (!data) return;
    const template = JSON.parse(data);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - stagePos.x) / zoom;
    const y = (e.clientY - rect.top - stagePos.y) / zoom;
    const snapPos = (v: number) => snapToGrid ? Math.round(v / GRID_SIZE) * GRID_SIZE : v;
    addObject({
      type: template.type,
      x: snapPos(x - template.width / 2),
      y: snapPos(y - template.height / 2),
      width: template.width,
      height: template.height,
      rotation: 0,
      label: template.label,
      color: template.color,
      category: template.category,
    });
  }, [addObject, zoom, stagePos, snapToGrid]);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-canvas-bg relative overflow-hidden cursor-crosshair"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
        onDragEnd={(e) => {
          if (activeTool === 'pan') {
            setStagePos({ x: e.target.x(), y: e.target.y() });
          }
        }}
      >
        <Layer>
          {showGrid && <GridLayer width={dims.width} height={dims.height} zoom={zoom} />}
          {objects.map(obj => (
            <SceneObjectShape
              key={obj.id}
              obj={obj}
              isSelected={selectedObjectId === obj.id}
              onSelect={() => selectObject(obj.id)}
            />
          ))}
        </Layer>
      </Stage>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 bg-card/80 backdrop-blur-sm border border-border rounded-md px-3 py-1.5 font-mono text-xs text-muted-foreground">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
