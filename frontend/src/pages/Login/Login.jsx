// src/pages/Auth/Login.jsx
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Icon from "../../components/common/Icon/Icon"
import Button from "../../components/common/Button/Button"
import { ROUTES } from "../../constants"
import { loginUser, selectAuthError, selectAuthLoading } from "../../store/slices/authSlice";


export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(
      loginUser({ email: formData.email, password: formData.password }),
    );
    if (!result.error) {
      const redirectTo = location.state?.from || ROUTES.HOME;
      navigate(redirectTo, { replace: true });
    }
  };

  return (
    <div className='min-h-[80vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-background text-text'>
      <div className='w-full max-w-md bg-background-secondary border border-border p-8 rounded-3xl shadow-lg'>
        {/* Header Title */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center bg-warning/10 text-warning p-3 rounded-2xl mb-3 shadow-sm'>
            <Icon name='lock' size={6} />
          </div>
          <h1 className='page-title mb-2'>
            Welcome Back
          </h1>
          <p className='text-[13px] text-text-muted'>
            Sign in to access your orders, wishlist, and dashboard.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {authError && (
            <div className='rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-xs p-3'>
              {authError}
            </div>
          )}
          {/* Email Input */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-semibold text-text'>
              Email Address
            </label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-text-muted'>
                <Icon name='mail' size={4} />
              </span>
              <input
                type='email'
                name='email'
                required
                value={formData.email}
                onChange={handleChange}
                placeholder='john@example.com'
                className='w-full bg-background border border-border text-text text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-warning transition-colors'
              />
            </div>
          </div>

          {/* Password Input */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-semibold text-text'>Password</label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-text-muted'>
                <Icon name='lock' size={4} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name='password'
                required
                value={formData.password}
                onChange={handleChange}
                placeholder='••••••••'
                className='w-full bg-background border border-border text-text text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none focus:border-warning transition-colors'
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                className='absolute right-3.5 text-text-muted hover:text-text transition-colors'
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={4} />
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className='flex items-center justify-between text-xs my-1'>
            <label className='flex items-center gap-2 cursor-pointer text-text-muted hover:text-text'>
              <input
                type='checkbox'
                name='rememberMe'
                checked={formData.rememberMe}
                onChange={handleChange}
                className='rounded border-border accent-warning w-4 h-4 cursor-pointer'
              />
              <span>Remember me</span>
            </label>
            <Link
              to={ROUTES.FORGOT_PASSWORD || "#"}
              className='text-warning hover:underline font-medium'
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            variant='solid'
            size='lg'
            type='submit'
            className='mt-2 bg-warning text-white hover:bg-warning/90 font-medium py-3.5 px-6 rounded-xl shadow-lg shadow-warning/20 transition-all text-sm flex items-center justify-center gap-2'
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
            <Icon name='arrow-right' size={4} />
          </Button>
        </form>

        {/* Divider */}
        <div className='relative my-6 text-center border-t border-border'>
          <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-secondary px-3 text-xs text-text-muted'>
            or continue with
          </span>
        </div>

        {/* Social Login Buttons */}
        <div className='grid grid-cols-2 gap-3 mb-6'>
          <button
            type='button'
            className='flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:border-warning/50 text-text text-xs font-semibold transition-all'
          >
            <Icon name='github' size={4} />
            <span>GitHub</span>
          </button>
          <button
            type='button'
            className='flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:border-warning/50 text-text text-xs font-semibold transition-all'
          >
            <Icon name='globe' size={4} />
            <span>Google</span>
          </button>
        </div>

        {/* Sign Up Link Footer */}
        <p className='text-center text-xs text-text-muted'>
          Don't have an account?{" "}
          <Link
            to={ROUTES.REGISTER || "#"}
            className='text-warning font-bold hover:underline'
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
