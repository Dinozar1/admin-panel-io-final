import { useState } from 'react';
import { useAuth, api } from './AuthContext';

export default function Login() {
  const { setToken } = useAuth();
  const [formData, setFormData] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Używamy naszej skonfigurowanej instancji api
      const response = await api.post('/loginAuth', formData);
      
      if (response.data.success) {
        // Zapisujemy token do globalnego stanu
        setToken(response.data.accessToken);
        // Tutaj docelowo dodasz przekierowanie do dashboardu np. za pomocą react-router-dom
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Wystąpił błąd podczas logowania.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-light p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-admin-DEFAULT">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-admin-text mb-2">Panel Admina</h1>
          <p className="text-admin-dark text-sm">Zaloguj się, aby zarządzać systemem</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-admin-text mb-1" htmlFor="login">
              Adres E-mail
            </label>
            <input
              id="login"
              name="login"
              type="email"
              required
              value={formData.login}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-admin-light/30 border border-admin-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-dark text-admin-text transition-colors"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-admin-text mb-1" htmlFor="password">
              Hasło
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-admin-light/30 border border-admin-DEFAULT rounded-lg focus:outline-none focus:ring-2 focus:ring-admin-dark text-admin-text transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-admin-dark hover:bg-admin-text text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </div>
    </div>
  );
}