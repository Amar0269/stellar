import { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {ToastContainer} from 'react-toastify';
import { handleError, handleSuccess } from "../../util";

function Login() {
  const [loginInfo,setLoginInfo]=useState({
    email:'',
    password:''
  })
  const navigate=useNavigate();
  const handleChange=async(e)=>{
      const{name,value}=e.target;
      console.log(name,value);
      const copyLoginInfo={...loginInfo};
      copyLoginInfo[name]=value;
      setLoginInfo(copyLoginInfo);
  }

  const handleLogin=async(e)=>{
    e.preventDefault();
    const {email,password}=loginInfo;
    if(!email||!password){
      return handleError('email and password are required...');
    }
    try{
      const url="http://localhost:8080/auth/login";
      const response=await fetch(url,{
        method:"POST",
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify(loginInfo)
      })
      const result= await response.json();
      const {success,message,jwtToken,name,role,error}=result;
      if(success){
        handleSuccess(message);
        localStorage.setItem('token',jwtToken);
        localStorage.setItem('loggedInUser',name);
        localStorage.setItem('role',role);
        setTimeout(()=>{
          navigate('/dashboard')
        },1000)
      }else if(error){
        const details=error?.details[0].message;
        handleError(details);
      }else if(!success){
        handleError(message);
      }
    }catch(err){
      handleError(err);
    }
  }
   
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">

      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">

        <h2 className="text-2xl font-bold text-center text-gray-800">
          Login to your account
        </h2>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="text-gray-600">Email</label>
            <input
              type="email"
              name="email"
              required
              onChange={handleChange}
              value={loginInfo.email}
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
              value={loginInfo.password}
              className="w-full mt-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

        

          {/* Button */}
          <button
            type="submit"
            className="w-full bg-orange-600 text-white py-3 rounded-lg hover:bg-orange-700 transition"
          >
            Login
          </button>
          <span>Don't have an account?
               <Link to='/signup' className="text-orange-600 ml-1">
                  Signup
               </Link>
          </span>

        </form>
        <ToastContainer/>
       

      </div>
    </div>
  );
}

export default Login;