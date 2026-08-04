// Shared drag state for library -> canvas drags.
// HTML5 DnD forbids reading dataTransfer payloads during `dragover`,
// so the in-flight template is mirrored here for live canvas previews.

export interface DragTemplate {
  type: string;
  label: string;
  color: string;
  icon?: string;
  width: number;
  height: number;
  category?: string;
}

let current: DragTemplate | null = null;

export function setDragTemplate(t: DragTemplate | null) {
  current = t;
}

export function getDragTemplate(): DragTemplate | null {
  return current;
}
