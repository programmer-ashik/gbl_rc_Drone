// src/pages/Auth/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../../constants";
import Icon from "../../components/common/Icon/Icon";
import Button from "../../components/common/Button/Button";
import { registerUser, selectAuthError, selectAuthLoading } from "../../store/slices/authSlice";

export const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
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
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    const result = await dispatch(
      registerUser({
        name: formData.fullName,
        email: formData.email,
        password: formData.password,
      }),
    );
    if (!result.error) {
      navigate(ROUTES.HOME);
    }
  };

  return (
    <div className='min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-background text-text'>
      <div className='w-full max-w-md bg-background-secondary border border-border p-8 rounded-3xl shadow-lg'>
        {/* Header Title */}
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center bg-warning/10 text-warning p-3 rounded-2xl mb-3 shadow-sm'>
            <Icon name='user-plus' size={6} />
          </div>
          <h1 className='page-title mb-2'>
            Create an Account
          </h1>
          <p className='text-[13px] text-text-muted'>
            Join Robotics & Drone Hub to track orders and save your favorite
            maker components.
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {authError && (
            <div className='rounded-xl border border-red-400/30 bg-red-500/10 text-red-400 text-xs p-3'>
              {authError}
            </div>
          )}
          {/* Full Name Input */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-semibold text-text'>Full Name</label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-text-muted'>
                <Icon name='user' size={4} />
              </span>
              <input
                type='text'
                name='fullName'
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder='John Doe'
                className='w-full bg-background border border-border text-text text-xs sm:text-sm rounded-xl pl-10 pr-4 py-3 outline-none focus:border-warning transition-colors'
              />
            </div>
          </div>

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

          {/* Confirm Password Input */}
          <div className='flex flex-col gap-1.5'>
            <label className='text-xs font-semibold text-text'>
              Confirm Password
            </label>
            <div className='relative flex items-center'>
              <span className='absolute left-3.5 text-text-muted'>
                <Icon name='lock' size={4} />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name='confirmPassword'
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder='••••••••'
                className='w-full bg-background border border-border text-text text-xs sm:text-sm rounded-xl pl-10 pr-10 py-3 outline-none focus:border-warning transition-colors'
              />
              <button
                type='button'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className='absolute right-3.5 text-text-muted hover:text-text transition-colors'
              >
                <Icon name={showConfirmPassword ? "eye-off" : "eye"} size={4} />
              </button>
            </div>
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className='flex items-start gap-2 text-xs my-1'>
            <input
              type='checkbox'
              name='agreeToTerms'
              required
              checked={formData.agreeToTerms}
              onChange={handleChange}
              className='rounded border-border accent-warning w-4 h-4 cursor-pointer mt-0.5'
            />
            <label className='text-text-muted cursor-pointer'>
              I agree to the{" "}
              <Link
                to={ROUTES.PRIVACY_POLICY || "#"}
                className='text-warning hover:underline font-medium'
              >
                Privacy Policy
              </Link>{" "}
              and Terms of Service.
            </label>
          </div>

          {/* Submit Button */}
          <Button
            variant='solid'
            size='lg'
            type='submit'
            className='mt-2 bg-warning text-white hover:bg-warning/90 font-medium py-3.5 px-6 rounded-xl shadow-lg shadow-warning/20 transition-all text-sm flex items-center justify-center gap-2'
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
            <Icon name='arrow-right' size={4} />
          </Button>
        </form>

        {/* Divider */}
        <div className='relative my-6 text-center border-t border-border'>
          <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background-secondary px-3 text-xs text-text-muted'>
            or register with
          </span>
        </div>

        {/* Social Register Buttons */}
        <div className='grid grid-cols-1 gap-3 mb-6 cursor-pointer'>
          <button
            type='button'
            className='flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:border-warning/50 cursor-pointer text-text text-xs font-semibold transition-all'
          >
            <Icon name='globe' size={4} />
            <span>Google</span>
          </button>
        </div>

        {/* Login Link Footer */}
        <p className='text-center text-xs text-text-muted'>
          Already have an account?{" "}
          <Link
            to={ROUTES.LOGIN || "/login"}
            className='text-warning font-bold hover:underline'
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
