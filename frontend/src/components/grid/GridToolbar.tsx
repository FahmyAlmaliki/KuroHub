import { Pencil, Eye, Plus } from 'lucide-react';
import type { Device } from '../../types';

interface GridToolbarProps {
  device: Device | null;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onAddWidget: () => void;
}

export default function GridToolbar({ device, isEditMode, onToggleEditMode, onAddWidget }: GridToolbarProps) {
  const isOnline = device?.status === 'online';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700/50">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-lg font-semibold text-white truncate">
          {device?.name || 'Dashboard'}
        </h2>
        <div className="flex items-center gap-1.5 shrink-0">
          <div
            className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}
          />
          <span className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isEditMode && (
          <button
            onClick={onAddWidget}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Widget
          </button>
        )}
        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            isEditMode
              ? 'bg-green-600 hover:bg-green-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          {isEditMode ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          {isEditMode ? 'View' : 'Edit'}
        </button>
      </div>
    </div>
  );
}
