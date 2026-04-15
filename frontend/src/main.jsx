import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate
} from 'react-router-dom'

import './index.css'
import Home from './components/Home/Home.jsx'
import Layout from './Layout.jsx'
import About from './components/About/About.jsx'
import Contact from './components/Contact/Contact.jsx'
import User from './components/User/User.jsx'
import Dashboard from './components/Pages/Dashboard.jsx'
import Login from './components/Pages/Login.jsx'
import Signup from './components/Pages/Signup.jsx'


function AppWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path='/' element={<Layout/>}>
        <Route path='' element={<Home/>}/>
        <Route path='about' element={<About/>}/>
        <Route path='contact' element={<Contact/>}/>
        <Route path='user/:userid' element={<User/>}/>

        <Route 
          path='dashboard' 
          element={
            isAuthenticated ? <Dashboard/> : <Navigate to="/login"/>
          } 
        />

        <Route 
          path='login' 
          element={<Login setIsAuthenticated={setIsAuthenticated} />} 
        />
        <Route path='signup' element={<Signup/>}/>
      </Route>
    )
  );

  return <RouterProvider router={router} />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AppWrapper />
  </StrictMode>,
);