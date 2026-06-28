import { useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { Widget } from '../../types';
import WidgetWrapper from '../widgets/base/WidgetWrapper';

interface DashboardGridProps {
  widgets: Widget[];
  isEditMode: boolean;
  onLayoutChange: (layout: { i: string; x: number; y: number; w: number; h: number }[]) => void;
  onDeleteWidget: (id: string) => void;
  onEditWidget: (id: string) => void;
}

const minSizes: Record<string, { w: number; h: number }> = {
  value_display: { w: 2, h: 2 },
  led: { w: 1, h: 2 },
  line_chart: { w: 4, h: 3 },
  area_chart: { w: 4, h: 3 },
  gauge: { w: 3, h: 3 },
  button: { w: 2, h: 2 },
  toggle: { w: 2, h: 2 },
  slider: { w: 3, h: 2 },
};

export default function DashboardGrid({
  widgets,
  isEditMode,
  onLayoutChange,
  onDeleteWidget,
  onEditWidget,
}: DashboardGridProps) {
  const layout = widgets.map((w) => {
    const min = minSizes[w.type] ?? { w: 2, h: 2 };
    return {
      i: w.id,
      x: w.layout.x,
      y: w.layout.y,
      w: Math.max(w.layout.w, min.w),
      h: Math.max(w.layout.h, min.h),
      minW: min.w,
      minH: min.h,
    };
  });

  const handleLayoutChange = useCallback(
    (newLayout: { i: string; x: number; y: number; w: number; h: number }[]) => {
      onLayoutChange(newLayout);
    },
    [onLayoutChange],
  );

  return (
    <GridLayout
      className="layout"
      layout={layout}
      cols={12}
      rowHeight={80}
      margin={[12, 12]}
      isDraggable={isEditMode}
      isResizable={isEditMode}
      draggableHandle=".widget-drag-handle"
      resizeHandles={['se']}
      onLayoutChange={handleLayoutChange}
      compactType="vertical"
      preventCollision={false}
    >
      {widgets.map((w) => (
        <div key={w.id} className="overflow-hidden">
          <WidgetWrapper
            widget={w}
            isEditMode={isEditMode}
            onDelete={onDeleteWidget}
            onEdit={onEditWidget}
          />
        </div>
      ))}
    </GridLayout>
  );
}
