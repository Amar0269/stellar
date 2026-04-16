import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
  useLocation
} from 'react-router-dom'
import './index.css'
import Home from './components/Home/Home.jsx'
import Layout from './Layout.jsx'
import About from './components/About/About.jsx'
import Contact from './components/Contact/Contact.jsx'
import User from './components/User/User.jsx'
import DashboardLayout from './components/Dashboard/DashboardLayout.jsx';
import Dashboard from './components/Pages/Dashboard.jsx';
import Temperature from './components/Pages/Temperature.jsx';
import Gas from './components/Pages/Gas.jsx';
import Light from './components/Pages/Light.jsx';
import Garbage from './components/Pages/Garbage.jsx';
import Login from './components/Pages/Login.jsx';
import Signup from './components/Pages/Signup.jsx';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();

  return token ? children : <Navigate to="/login" replace state={{ from: location }} />;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<Layout />}>
      <Route path='' element={<Home />} />
      <Route path='about' element={<About />} />
      <Route path='contact' element={<Contact />} />
      <Route path='user/:userid' element={<User />} />
      <Route
        path='dashboard'
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path='temperature' element={<Temperature />} />
        <Route path='gas' element={<Gas />} />
        <Route path='light' element={<Light />} />
        <Route path='garbage' element={<Garbage />} />
      </Route>
      <Route path='login' element={<Login />} />
      <Route path='signup' element={<Signup />} />
    </Route>
  )
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);