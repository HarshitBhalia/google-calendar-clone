import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Calendar, User, Loader2 } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const registerMutation = useRegister();

  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    registerMutation.mutate({
      email: email.trim(),
      password,
      name: name.trim(),
    });
  };

  return (
    <div className="min-h-screen bg-gc-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gc-gray-200 p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gc-blue rounded-lg flex items-center justify-center">
                <Calendar size={22} className="text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-google-sans font-medium text-gc-gray-900">
              Google Calendar
            </h1>
            <p className="text-sm text-gc-gray-600 mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gc-gray-400"
                />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.name
                      ? 'border-gc-red focus:ring-gc-red/20'
                      : 'border-gc-gray-200 focus:ring-gc-blue/20 focus:border-gc-blue'
                  }`}
                  autoComplete="name"
                />
              </div>
              {errors.name && (
                <p className="text-xs text-gc-red mt-1 ml-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gc-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Email address"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.email
                      ? 'border-gc-red focus:ring-gc-red/20'
                      : 'border-gc-gray-200 focus:ring-gc-blue/20 focus:border-gc-blue'
                  }`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-gc-red mt-1 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gc-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Password"
                  className={`w-full pl-10 pr-10 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.password
                      ? 'border-gc-red focus:ring-gc-red/20'
                      : 'border-gc-gray-200 focus:ring-gc-blue/20 focus:border-gc-blue'
                  }`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gc-gray-400 hover:text-gc-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-gc-red mt-1 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gc-gray-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword)
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="Confirm password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
                    errors.confirmPassword
                      ? 'border-gc-red focus:ring-gc-red/20'
                      : 'border-gc-gray-200 focus:ring-gc-blue/20 focus:border-gc-blue'
                  }`}
                  autoComplete="new-password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-gc-red mt-1 ml-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full bg-gc-blue text-white py-3 rounded-lg font-medium text-sm hover:bg-[#1765cc] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {registerMutation.isPending && <Loader2 size={16} className="animate-spin" />}
              Create account
            </button>
          </form>

          {/* Switch to login */}
          <p className="text-center text-sm text-gc-gray-600 mt-6">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-gc-blue font-medium hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
