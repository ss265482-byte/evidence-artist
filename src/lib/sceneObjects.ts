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
    { type: 'fingerprint', label: 'Fingerprint', icon: '🖐️', width: 20, height: 25, color: '#a3a3a3', category: 'Evidence' },
    { type: 'hair-fiber', label: 'Hair/Fiber', icon: '🧬', width: 15, height: 15, color: '#92400e', category: 'Evidence' },
    { type: 'clothing', label: 'Clothing', icon: '👕', width: 40, height: 40, color: '#6366f1', category: 'Evidence' },
    { type: 'document-evidence', label: 'Document', icon: '📄', width: 30, height: 40, color: '#f5f5f4', category: 'Evidence' },
    { type: 'drug-paraphernalia', label: 'Drugs/Para.', icon: '💊', width: 20, height: 20, color: '#f97316', category: 'Evidence' },
    { type: 'glass-fragment', label: 'Glass', icon: '💎', width: 25, height: 20, color: '#67e8f9', category: 'Evidence' },
    { type: 'shell-casing', label: 'Shell Casing', icon: '🔩', width: 12, height: 12, color: '#ca8a04', category: 'Evidence' },
    { type: 'dna-sample', label: 'DNA Sample', icon: '🧪', width: 15, height: 15, color: '#22c55e', category: 'Evidence' },
    { type: 'phone', label: 'Phone', icon: '📱', width: 20, height: 35, color: '#1e293b', category: 'Evidence' },
    { type: 'camera', label: 'Camera', icon: '📷', width: 30, height: 25, color: '#334155', category: 'Evidence' },
    { type: 'id-card', label: 'ID Card', icon: '🪪', width: 35, height: 22, color: '#e2e8f0', category: 'Evidence' },
    { type: 'bag', label: 'Bag', icon: '👜', width: 35, height: 30, color: '#78716c', category: 'Evidence' },
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
  'Outdoor': [
    { type: 'tree', label: 'Tree', icon: '🌳', width: 50, height: 50, color: '#16a34a', category: 'Outdoor' },
    { type: 'bush', label: 'Bush', icon: '🌿', width: 40, height: 30, color: '#22c55e', category: 'Outdoor' },
    { type: 'fence', label: 'Fence', icon: '🏗️', width: 120, height: 10, color: '#78716c', category: 'Outdoor' },
    { type: 'streetlight', label: 'Streetlight', icon: '🔦', width: 20, height: 20, color: '#facc15', category: 'Outdoor' },
    { type: 'fire-hydrant', label: 'Fire Hydrant', icon: '🧯', width: 20, height: 25, color: '#dc2626', category: 'Outdoor' },
    { type: 'dumpster', label: 'Dumpster', icon: '🗑️', width: 60, height: 40, color: '#4b5563', category: 'Outdoor' },
    { type: 'bench', label: 'Bench', icon: '🪑', width: 80, height: 25, color: '#92400e', category: 'Outdoor' },
    { type: 'sidewalk', label: 'Sidewalk', icon: '⬜', width: 120, height: 40, color: '#d1d5db', category: 'Outdoor' },
    { type: 'road', label: 'Road', icon: '🛣️', width: 150, height: 60, color: '#374151', category: 'Outdoor' },
    { type: 'mailbox', label: 'Mailbox', icon: '📮', width: 20, height: 25, color: '#2563eb', category: 'Outdoor' },
    { type: 'manhole', label: 'Manhole', icon: '⭕', width: 30, height: 30, color: '#6b7280', category: 'Outdoor' },
    { type: 'trash-can', label: 'Trash Can', icon: '🗑️', width: 25, height: 25, color: '#57534e', category: 'Outdoor' },
  ],
};
