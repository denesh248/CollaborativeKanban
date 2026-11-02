// client/src/hooks/useKanbanDrag.js
// Custom hook to manage dnd-kit drag-and-drop state, collision detection, and position calculations

import { useState, useRef } from 'react';
import {
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';

// Calculate new integer position between neighboring tasks for drag-and-drop ordering
export const calculateNewPosition = (tasks, targetIndex) => {
  if (!tasks || tasks.length <= 1) return 1000;
  if (targetIndex === 0) {
    const nextPos = tasks[1]?.position || 1000;
    return Math.max(1, Math.round(nextPos / 2));
  }
  if (targetIndex >= tasks.length - 1) {
    const prevPos = tasks[tasks.length - 2]?.position || 1000;
    return prevPos + 1000;
  }
  const prevPos = tasks[targetIndex - 1]?.position || 1000;
  const nextPos = tasks[targetIndex + 1]?.position || prevPos + 1000;
  return Math.round((prevPos + nextPos) / 2);
};

export function useKanbanDrag({ columns = [], onColumnsChange, onMoveCommit }) {
  const [activeDragTask, setActiveDragTask] = useState(null);
  const dragStartRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = ({ active }) => {
    if (!columns) return;
    for (const col of columns) {
      const task = col.tasks?.find((t) => t.id === active.id);
      if (task) {
        setActiveDragTask(task);
        dragStartRef.current = {
          taskId: task.id,
          columnId: col.id,
          position: task.position,
          version: task.version,
        };
        break;
      }
    }
  };

  const handleDragOver = ({ active, over }) => {
    if (!over || !columns) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const sourceCol = columns.find((c) => c.tasks?.some((t) => t.id === activeId));
    let destCol =
      columns.find((c) => c.id === overId) ||
      columns.find((c) => c.tasks?.some((t) => t.id === overId));
    if (!sourceCol || !destCol) return;

    if (sourceCol.id !== destCol.id) {
      const activeTask = sourceCol.tasks.find((t) => t.id === activeId);
      if (!activeTask) return;

      const overIndex = destCol.tasks.findIndex((t) => t.id === overId);
      const newDestTasks = [...destCol.tasks];
      const taskWithNewCol = { ...activeTask, columnId: destCol.id };

      if (overIndex >= 0) newDestTasks.splice(overIndex, 0, taskWithNewCol);
      else newDestTasks.push(taskWithNewCol);

      const nextColumns = columns.map((col) => {
        if (col.id === sourceCol.id) {
          return { ...col, tasks: col.tasks.filter((t) => t.id !== activeId) };
        }
        if (col.id === destCol.id) {
          return { ...col, tasks: newDestTasks };
        }
        return col;
      });

      onColumnsChange?.(nextColumns);
    } else {
      const oldIndex = sourceCol.tasks.findIndex((t) => t.id === activeId);
      const newIndex = sourceCol.tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const nextColumns = columns.map((col) =>
          col.id === sourceCol.id
            ? { ...col, tasks: arrayMove(sourceCol.tasks, oldIndex, newIndex) }
            : col
        );
        onColumnsChange?.(nextColumns);
      }
    }
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveDragTask(null);
    if (!over || !columns) return;

    const activeId = active.id;
    const overId = over.id;

    let destCol =
      columns.find((c) => c.id === overId) ||
      columns.find((c) => c.tasks?.some((t) => t.id === overId)) ||
      columns.find((c) => c.tasks?.some((t) => t.id === activeId));
    if (!destCol) return;

    const taskIndex = destCol.tasks.findIndex((t) => t.id === activeId);
    if (taskIndex === -1) return;

    const task = destCol.tasks[taskIndex];
    const original = dragStartRef.current;
    const newPosition = calculateNewPosition(destCol.tasks, taskIndex);

    // If task didn't actually change column or position, no API call needed
    if (
      original &&
      original.columnId === destCol.id &&
      Math.abs(original.position - newPosition) <= 1
    ) {
      return;
    }

    onMoveCommit?.({
      task,
      destinationColumnId: destCol.id,
      newPosition,
      expectedVersion: original ? original.version : task.version,
    });
  };

  const handleDragCancel = () => {
    setActiveDragTask(null);
    dragStartRef.current = null;
  };

  return {
    sensors,
    activeDragTask,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
