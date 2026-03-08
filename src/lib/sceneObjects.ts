import { SceneObjectType } from '@/store/SceneContext';

export interface ObjectTemplate {
  type: SceneObjectType;
  label: string;
  icon: string;
  width: number;
  height: number;
  color: string;
  category: string;
}

export const objectLibrary: Record<string, ObjectTemplate[]> = {
  'Bodies': [
    { type: 'body-outline', label: 'Body Outline', icon: '🧍', width: 60, height: 120, color: '#ef4444', category: 'Bodies' },
    { type: 'body-standing', label: 'Standing', icon: '🧑', width: 40, height: 80, color: '#ef4444', category: 'Bodies' },
    { type: 'body-prone', label: 'Prone', icon: '🏊', width: 120, height: 40, color: '#ef4444', category: 'Bodies' },
  ],
  'Weapons': [
    { type: 'knife', label: 'Knife', icon: '🔪', width: 40, height: 15, color: '#94a3b8', category: 'Weapons' },
    { type: 'gun', label: 'Gun', icon: '🔫', width: 50, height: 30, color: '#475569', category: 'Weapons' },
    { type: 'bullet-casing', label: 'Casing', icon: '⊙', width: 10, height: 10, color: '#d97706', category: 'Weapons' },
    { type: 'bullet-hole', label: 'Bullet Hole', icon: '⊗', width: 12, height: 12, color: '#1e293b', category: 'Weapons' },
  ],
  'Evidence': [
    { type: 'evidence-marker', label: 'Marker', icon: '🔶', width: 30, height: 30, color: '#eab308', category: 'Evidence' },
    { type: 'blood-stain', label: 'Blood Stain', icon: '🩸', width: 40, height: 30, color: '#dc2626', category: 'Evidence' },
    { type: 'footprint', label: 'Footprint', icon: '👣', width: 25, height: 50, color: '#78716c', category: 'Evidence' },
    { type: 'tire-mark', label: 'Tire Mark', icon: '〰️', width: 120, height: 20, color: '#1c1917', category: 'Evidence' },
  ],
  'Furniture': [
    { type: 'bed', label: 'Bed', icon: '🛏️', width: 120, height: 80, color: '#7c3aed', category: 'Furniture' },
    { type: 'table', label: 'Table', icon: '🪑', width: 80, height: 60, color: '#92400e', category: 'Furniture' },
    { type: 'chair', label: 'Chair', icon: '💺', width: 40, height: 40, color: '#92400e', category: 'Furniture' },
    { type: 'sofa', label: 'Sofa', icon: '🛋️', width: 120, height: 50, color: '#6d28d9', category: 'Furniture' },
    { type: 'cabinet', label: 'Cabinet', icon: '🗄️', width: 60, height: 30, color: '#78716c', category: 'Furniture' },
  ],
  'Structures': [
    { type: 'door', label: 'Door', icon: '🚪', width: 60, height: 10, color: '#92400e', category: 'Structures' },
    { type: 'window', label: 'Window', icon: '🪟', width: 60, height: 8, color: '#38bdf8', category: 'Structures' },
    { type: 'wall', label: 'Wall', icon: '▬', width: 120, height: 10, color: '#334155', category: 'Structures' },
    { type: 'stairs', label: 'Stairs', icon: '🪜', width: 60, height: 80, color: '#78716c', category: 'Structures' },
  ],
  'Vehicles': [
    { type: 'car', label: 'Car', icon: '🚗', width: 100, height: 50, color: '#3b82f6', category: 'Vehicles' },
    { type: 'motorcycle', label: 'Motorcycle', icon: '🏍️', width: 60, height: 30, color: '#1e293b', category: 'Vehicles' },
    { type: 'bicycle', label: 'Bicycle', icon: '🚲', width: 50, height: 30, color: '#059669', category: 'Vehicles' },
  ],
};
