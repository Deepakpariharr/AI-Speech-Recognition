import React, { useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import TaskCard from "./TaskCard";

const statuses = ["To Do", "In Progress", "Done"];

export default function TaskBoard({ tasks = [], onMove, onDelete }) {
  const groups = useMemo(() => {
    const g = {};
    statuses.forEach(s => (g[s] = []));
    (tasks || []).forEach(t => {
      const key = t.status || "To Do";
      if (!g[key]) g[key] = [];
      g[key].push(t);
    });
    return g;
  }, [tasks]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const { draggableId, destination, source } = result;
    if (!onMove) return;
    if (destination.droppableId !== source.droppableId) {
      onMove(draggableId, destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        {statuses.map((s) => (
          <Droppable droppableId={s} key={s}>
            {(providedDroppable, droppableSnapshot) => (
              <div
                ref={providedDroppable.innerRef}
                {...providedDroppable.droppableProps}
                style={{
                  minWidth: 320,
                  padding: 12,
                  borderRadius: 8,
                  background: droppableSnapshot.isDraggingOver ? "#f8fafc" : "#f8f9fb",
                  transition: "background-color 120ms ease",
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 12 }}>{s}</div>

                {groups[s].map((task, index) => {
                  const id = String(task._id ?? task.id ?? `task-${index}`);
                  return (
                    <Draggable draggableId={id} index={index} key={id}>
                      {(providedDraggable, dragSnapshot) => {
                        const providedStyle = {
                          ...providedDraggable.draggableProps.style,
                          marginBottom: 12,
                        };

                        return (
                          <div
                            ref={providedDraggable.innerRef}
                            {...providedDraggable.draggableProps}
                            {...providedDraggable.dragHandleProps}
                            style={providedStyle}
                          >
                            <TaskCard
                              task={task}
                              providedStyle={{}}
                              isDragging={dragSnapshot.isDragging}
                              onDelete={onDelete}
                            />
                          </div>
                        );
                      }}
                    </Draggable>
                  );
                })}

                {providedDroppable.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}
