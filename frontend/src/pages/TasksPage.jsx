import React, { useEffect, useState } from "react";
import VoiceRecorder from "../components/VoiceRecorder";
import TaskBoard from "../components/TaskBoard";
import CreateTaskModal from "../components/CreateTaskModal"; 
import { fetchTasks, createTask, updateTask, deleteTask } from "../api/api";

export default function TasksPage() {
  const [tasks, setTasks] = useState([]);
  const [parsed, setParsed] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const list = await fetchTasks();
      setTasks(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("load tasks", e);
      setTasks([]);
    }
  };

  const handleParsed = (parsedObj) => {
    setParsed(parsedObj);
    setModalOpen(true);
  };

  const handleTaskCreated = (created) => {
    setTasks(prev => [created, ...prev]);
  };

  const handleCreateFromModal = async (taskPayload) => {
    try {
      const created = await createTask(taskPayload);
      handleTaskCreated(created);
    } catch (err) {
      console.error("create failed", err);
      alert("Failed to create task");
    }
  };

  const handleMove = async (id, status) => {
    try {
      await updateTask(id, { status });
      setTasks(prev => prev.map(t => (String(t._id ?? t.id) === String(id) ? { ...t, status } : t)));
    } catch (e) {
      console.error("move failed", e);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      setTasks(prev => prev.filter(t => String(t._id ?? t.id) !== String(id)));
    } catch (e) {
      console.error("delete failed", e);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <VoiceRecorder onParsed={handleParsed} onTaskCreated={handleTaskCreated} onError={(e)=>console.error(e)} />

      <div style={{ marginTop: 20 }}>
        <TaskBoard tasks={tasks} onMove={handleMove} onDelete={handleDelete} />
      </div>

      <CreateTaskModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        initialValues={parsed || { title: "", description: "", priority: "Medium", status: "To Do", dueDate: "" }}
        onCreate={async (payload) => {
          await handleCreateFromModal(payload);
          setModalOpen(false);
        }}
      />
    </div>
  );
}
