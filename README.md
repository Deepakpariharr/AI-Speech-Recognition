# AI Speech Recognition Task Manager

A full-stack voice-enabled task tracking application that converts spoken input into structured tasks using speech recognition and OpenAI. The extracted tasks are displayed on a drag-and-drop Kanban board with full CRUD support.

## Overview
This application allows users to:
1. Record voice input using the Web Speech API.
2. Convert speech to text in real time.
3. Send the transcript to the backend for processing.
4. Parse and extract task information using OpenAI.
5. Display tasks on a Kanban board with the ability to create, edit, delete, and drag tasks between statuses.

## Features

### Speech Recognition
- Continuous speech-to-text using Web Speech API.
- Live interim transcript and final transcript display.
- Reliable audio handling and visual recording indicator.

### AI Parsing (OpenAI)
- Backend sends transcript to OpenAI for structured extraction.
- Extracted info includes: title, description, priority, status, due date.
- Understands natural language such as: “tomorrow”, “next Monday”, “high priority”, etc.

### Kanban Board
- Three task columns: To Do, In Progress, Done.
- Smooth drag-and-drop using react-beautiful-dnd.
- Backend updates when task status changes.
- Delete button for each task.

### Task Management
- Manual task creation.
- Voice-based creation with automatic parsing.
- Edit parsed results before saving task.
- Clean, modern responsive UI.

## Tech Stack

### Frontend
- React  
- React Beautiful DnD  
- Web Speech API  
- Custom CSS (Glass UI)

### Backend
- Node.js  
- Express  
- OpenAI API  
- In-memory storage (database-ready structure)

## Project Structure
/frontend  
 └── src  
     ├── components  
     │    ├── VoiceRecorder.jsx  
     │    ├── TaskCard.jsx  
     │    ├── TaskBoard.jsx  
     │    └── ParseModal.jsx  
     ├── api/api.js  
     ├── styles.css  
     └── App.jsx  

/backend  
 ├── server.js  
 ├── parseHandler.js  
 └── routes.js  

README.md  
.gitignore  

## API Endpoints

### POST /tasks/parse/transcript
Request:
{
  "transcript": "Create a high priority task to submit the report tomorrow"
}

Response:
{
  "parsed": {
    "title": "Submit the report",
    "description": "Submit the report tomorrow",
    "priority": "High",
    "status": "To Do",
    "dueDate": "2025-01-12"
  }
}

### POST /tasks
Creates a new task.

### GET /tasks
Returns all tasks.

### PUT /tasks/:id
Updates a task.

### DELETE /tasks/:id
Deletes a task.

## Setup Instructions

### Backend Setup
cd backend  
npm install  
npm run dev  

Create `.env` with:
OPENAI_API_KEY=your_openai_key_here

### Frontend Setup
cd frontend  
npm install  
npm start  

Create `.env` with:
REACT_APP_BACKEND_URL=http://localhost:5000/api

## Voice Examples to Try

### Simple Commands
- Create a task to buy groceries tomorrow.  
- Add a task to call the client today.

### Priority-Based Commands
- Create a high-priority task to finalize documentation by tomorrow.  
- Add a low-priority task to clean the desktop this week.

### Status-Based Commands
- Add a task to test the login API. Mark it as in progress. Due next Monday.

### Description-Based Commands
- Create a task called prepare presentation. Description: include charts and animations. Due Friday morning.

## System Workflow
1. User records audio.  
2. Web Speech API generates a transcript.  
3. Transcript sent to backend.  
4. Backend calls OpenAI to extract structured task fields.  
5. Parsed task returned to the frontend.  
6. User creates or reviews a task.  
7. Task appears on the Kanban board.  
8. The user can drag, edit, or delete the task.

## Notes
- Node modules are intentionally ignored.
- Backend structure is ready for database integration.
- OpenAI prompt design ensures consistent extraction of fields.

## Conclusion
This project implements all requirements from the Voice-Enabled Task Tracker assignment. It demonstrates complete integration of speech recognition, AI-based parsing, task management UI, drag-and-drop functionality, and backend services.

