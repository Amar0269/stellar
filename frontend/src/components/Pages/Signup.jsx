import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import { handleError, handleSuccess } from "../../util";
import { signupUser } from "../../services/auth";

function Signup() {
  const ROLES = [
    { value: 'student',             label: 'Student' },
    { value: 'classRepresentative', label: 'Class Representative' },
    { value: 'supervisor',          label: 'Supervisor' },
    { value: 'warden',              label: 'Warden' },
    { value: 'chiefWarden',         label: 'Chief Warden' },
    { value: 'teacher',             label: 'Teacher' },
    { value: 'labAssistant',        label: 'Lab Assistant' },
    { value: 'director',            label: 'Director' },
    { value: 'technician',          label: 'Technician' },
  ];

  const [signupInfo, setSignupInfo] = useState({
    name: '', email: '', password: '', role: 'student',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSignupInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    const { name, email, password } = signupInfo;
    if (!name || !email || !password) {
      return handleError('Name, email and password are required.');
    }
    try {
      const result = await signupUser(signupInfo);
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => navigate('/login'), 1000);
      } else if (error) {
        const details = error?.details?.[0]?.message;
        handleError(details || message);
      } else {
        handleError(message);
      }
    } catch (err) {
      handleError('An unexpected error occurred.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Create an Account
        </h2>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-gray-600">Full Name</label>
            <input
              type="text"
              name="name"
              required
              onChange={handleChange}
              value={signupInfo.name}
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              required
              onChange={handleChange}
              value={signupInfo.email}
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-600">Password</label>
            <input
              type="password"
              name="password"
              required
              onChange={handleChange}
              value={signupInfo.password}
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Role */}
          <div>
            <label className="text-gray-600">Role</label>
            <select
              name="role"
              value={signupInfo.role}
              onChange={handleChange}
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              {ROLES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition"
          >
            Sign Up
          </button>
          <span>Already have an account?
            <Link to='/login' className="text-orange-600 ml-1">Login</Link>
          </span>
        </form>
        <ToastContainer />
      </div>
    </div>
  );
}

export default Signup;