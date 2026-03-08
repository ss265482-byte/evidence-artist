import Konva from 'konva';

// Shared mutable ref for the Konva stage, accessible outside React tree
export const stageStore: { current: Konva.Stage | null } = { current: null };
