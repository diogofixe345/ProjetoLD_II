import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './pages/App';
import Login from './pages/Login'
import Register from './pages/Register';
import Navbar from './pages/Navbar';
import Conta from './pages/Conta';
import Tasks from './pages/Tasks';
import TaskForm from './pages/TaskForm';
import EditTask from './pages/EditTask';
import ManageTeam from './pages/ManageTeam';
import CompletedTasks from './pages/CompletedTasks';
import ManagerHistory from './pages/ManagerHistory';
import ManagerActiveTasks from './pages/ManagerActiveTasks';
import ManagerForecast from './pages/ManagerForecast';
import ManageTaskTypes from './pages/ManageTaskTypes';
import './index.css'

const root = document.getElementById('root');

const rootElement = ReactDOM.createRoot(root);

rootElement.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} /> 
        <Route path="/login" element={<Login />} />
        <Route path='/register' element={<Register/>}/>
        <Route path='/navbar' element={<Navbar/>}/>
        <Route path='/conta' element={<Conta/>}/>
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/taskform" element={<TaskForm />} />
        <Route path="/edittask/:id" element={<EditTask />} />
        <Route path="/equipa" element={<ManageTeam />} />
        <Route path="/task/:id" element={<TaskForm />} />
        <Route path='/history' element={<CompletedTasks/>}></Route>
        <Route path="/manager-history" element={<ManagerHistory />} />
        <Route path="/manager-active-tasks" element={<ManagerActiveTasks />} />
        <Route path="/manager-forecast" element={<ManagerForecast />} />
        <Route path="/manage-types" element={<ManageTaskTypes />} />

      </Routes>
    </Router>
  </React.StrictMode>
);
