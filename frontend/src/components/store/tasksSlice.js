import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../api';

export const fetchTasks = createAsyncThunk('tasks/fetch', async () => {
  const res = await API.get('/tasks');
  return res.data;
});

export const createTask = createAsyncThunk('tasks/create', async (payload) => {
  const res = await API.post('/tasks', payload);
  return res.data;
});

export const updateTask = createAsyncThunk('tasks/update', async ({ id, payload }) => {
  const res = await API.put(`/tasks/${id}`, payload);
  return res.data;
});

export const deleteTask = createAsyncThunk('tasks/delete', async (id) => {
  await API.delete(`/tasks/${id}`);
  return id;
});

const tasksSlice = createSlice({
  name: 'tasks',
  initialState: { items: [], status: 'idle' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.fulfilled, (state, action) => { state.items = action.payload; })
      .addCase(createTask.fulfilled, (state, action) => { state.items.push(action.payload); })
      .addCase(updateTask.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t._id === action.payload._id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t._id !== action.payload);
      })
  }
});

export default tasksSlice.reducer;