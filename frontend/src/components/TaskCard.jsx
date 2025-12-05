import React from "react";
import PropTypes from "prop-types";

function TaskCardInner({ task, onDelete, providedStyle = {}, isDragging = false }) {
  const id = task?._id ?? task?.id ?? null;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!id) {
      console.warn("TaskCard: missing id for task", task);
      return;
    }
    if (typeof onDelete === "function") {
      onDelete(id);
    } else {
      console.warn("TaskCard: onDelete prop is not provided or not a function");
    }
  };

  const due = task?.dueDate ? (() => {
    const d = new Date(task.dueDate);
    return isNaN(d) ? task.dueDate : d.toLocaleDateString();
  })() : null;

  const localStyle = {
    ...providedStyle,
    padding: 16,
    borderRadius: 12,
    background: "linear-gradient(180deg, #ffffff, #fbfdff)",
    boxShadow: isDragging ? "0 18px 40px rgba(2,6,23,0.12)" : "0 6px 18px rgba(2,6,23,0.04)",
    transition: "transform .15s ease, box-shadow .15s ease",
    cursor: "grab",
    position: "relative",
  };

  const deleteBtnStyle = {
    position: "absolute",
    right: 10,
    top: 10,
    border: "none",
    background: "transparent",
    color: "var(--danger)",
    fontSize: 18,
    lineHeight: 1,
    cursor: "pointer",
    padding: 4,
  };

  return (
    <div className="task-card" style={localStyle} role="article" aria-label={task.title || "task"}>
      <button
        onClick={handleDelete}
        aria-label="Delete task"
        title="Delete task"
        style={deleteBtnStyle}
      >
        ×
      </button>

      <div className="task-title">{task.title || "Untitled task"}</div>

      {task.description ? (
        <div className="task-desc">{task.description}</div>
      ) : null}

      <div className="task-meta">
        <span className={`prio ${String((task.priority || "Medium")).toLowerCase()}`}>
          {task.priority || "Medium"}
        </span>

        {due && <span className="due">{due}</span>}
      </div>
    </div>
  );
}

const TaskCard = React.memo(TaskCardInner);

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
  providedStyle: PropTypes.object,
  isDragging: PropTypes.bool,
};

export default TaskCard;
