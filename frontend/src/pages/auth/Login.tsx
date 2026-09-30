import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'citizen';
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(`demo.${role}@jansetu.ai`);
  const [password, setPassword] = useState(`${role}123`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);
      
      const res = await axios.post('http://localhost:8000/api/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      localStorage.setItem('token', res.data.access_token);
      
      // Fetch user profile
      const userRes = await axios.get('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` }
      });
      
      localStorage.setItem('user', JSON.stringify(userRes.data));
      
      if (userRes.data.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/citizen');
      }
    } catch (err) {
      setError('Invalid credentials or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-block mb-4 hover:scale-105 transition-transform" title="Back to Home">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 inline-flex items-center justify-center">
            <img 
              src="/assets/jansetu-logo.png" 
              alt="JanSetu AI" 
              className="h-16 w-auto object-contain"
            />
          </div>
        </Link>
        <h2 className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Continuing as <span className="font-bold uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{role}</span>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-brand-teal focus:border-brand-teal sm:text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-brand-navy hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-50 transition-colors"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
            
            <div className="text-center mt-4 text-xs text-gray-500">
              Demo Credentials prepopulated.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
