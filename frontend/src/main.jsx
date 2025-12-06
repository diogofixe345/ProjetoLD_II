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
      </Routes>
    </Router>
  </React.StrictMode>
);
