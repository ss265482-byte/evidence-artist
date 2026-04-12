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
    { type: 'pickup-truck', label: 'Pickup Truck', icon: '🛻', width: 120, height: 55, color: '#78716c', category: 'Vehicles' },
    { type: 'suv', label: 'SUV', icon: '🚙', width: 110, height: 55, color: '#1e3a5f', category: 'Vehicles' },
    { type: 'van', label: 'Van', icon: '🚐', width: 120, height: 55, color: '#f5f5f4', category: 'Vehicles' },
    { type: 'bus', label: 'Bus', icon: '🚌', width: 180, height: 55, color: '#eab308', category: 'Vehicles' },
    { type: 'semi-truck', label: 'Semi Truck', icon: '🚛', width: 200, height: 60, color: '#dc2626', category: 'Vehicles' },
    { type: 'police-car', label: 'Police Car', icon: '🚓', width: 100, height: 50, color: '#1e293b', category: 'Vehicles' },
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
  'Kitchen & Bath': [
    { type: 'stove', label: 'Stove', icon: '🍳', width: 60, height: 60, color: '#d1d5db', category: 'Kitchen & Bath' },
    { type: 'fridge', label: 'Fridge', icon: '🧊', width: 60, height: 70, color: '#e2e8f0', category: 'Kitchen & Bath' },
    { type: 'sink', label: 'Sink', icon: '🚰', width: 50, height: 40, color: '#94a3b8', category: 'Kitchen & Bath' },
    { type: 'microwave', label: 'Microwave', icon: '📦', width: 40, height: 30, color: '#475569', category: 'Kitchen & Bath' },
    { type: 'dishwasher', label: 'Dishwasher', icon: '🫧', width: 60, height: 60, color: '#cbd5e1', category: 'Kitchen & Bath' },
    { type: 'counter', label: 'Counter', icon: '▬', width: 120, height: 40, color: '#a8a29e', category: 'Kitchen & Bath' },
    { type: 'bathtub', label: 'Bathtub', icon: '🛁', width: 80, height: 50, color: '#e2e8f0', category: 'Kitchen & Bath' },
    { type: 'toilet', label: 'Toilet', icon: '🚽', width: 40, height: 50, color: '#f5f5f4', category: 'Kitchen & Bath' },
    { type: 'shower', label: 'Shower', icon: '🚿', width: 60, height: 60, color: '#bfdbfe', category: 'Kitchen & Bath' },
    { type: 'washer-dryer', label: 'Washer/Dryer', icon: '🌀', width: 60, height: 60, color: '#e2e8f0', category: 'Kitchen & Bath' },
  ],
  'Office': [
    { type: 'desk', label: 'Desk', icon: '🪵', width: 100, height: 60, color: '#92400e', category: 'Office' },
    { type: 'office-chair', label: 'Office Chair', icon: '🪑', width: 40, height: 40, color: '#1e293b', category: 'Office' },
    { type: 'computer', label: 'Computer', icon: '💻', width: 40, height: 30, color: '#334155', category: 'Office' },
    { type: 'filing-cabinet', label: 'Filing Cabinet', icon: '🗄️', width: 40, height: 50, color: '#6b7280', category: 'Office' },
    { type: 'bookshelf', label: 'Bookshelf', icon: '📚', width: 80, height: 30, color: '#78716c', category: 'Office' },
    { type: 'printer', label: 'Printer', icon: '🖨️', width: 40, height: 35, color: '#d1d5db', category: 'Office' },
    { type: 'whiteboard', label: 'Whiteboard', icon: '📋', width: 100, height: 8, color: '#f5f5f4', category: 'Office' },
    { type: 'safe', label: 'Safe', icon: '🔒', width: 40, height: 40, color: '#374151', category: 'Office' },
    { type: 'lamp', label: 'Lamp', icon: '💡', width: 20, height: 20, color: '#fbbf24', category: 'Office' },
    { type: 'tv', label: 'TV/Monitor', icon: '🖥️', width: 60, height: 40, color: '#1e293b', category: 'Office' },
  ],
};
