import { AuthProvider, useAuth } from './AuthContext';
import Login from './Login';
import Dashboard from './Dashboard'; // Importujemy nowy plik

function AppContent() {
  const { token } = useAuth();

  // Jeśli nie ma tokena, pokazujemy logowanie. Jeśli jest, Dashboard.
  return token ? <Dashboard /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}