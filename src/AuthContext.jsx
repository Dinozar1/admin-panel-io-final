import { createContext, useState, useContext, useLayoutEffect, useRef } from 'react';
import axios from 'axios';

// Tworzymy własną instancję Axios
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Wymagane dla ciasteczek HttpOnly
});

// Pomocnicza funkcja do dekodowania JWT i sprawdzania jego ważności
const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const decoded = JSON.parse(decodedJson);
    
    // JWT exp jest w sekundach, mnożymy przez 1000. Dodajemy bufor 10 sekund.
    const expTime = decoded.exp * 1000;
    return Date.now() >= expTime - 10000;
  } catch (e) {
    return true;
  }
};

// Zmienna trzymająca Promise odświeżania - zapobiega wysyłaniu wielu zapytań naraz
let refreshPromise = null;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  
  // Używamy useRef, aby interceptory zawsze widziały najnowszy stan tokena
  const tokenRef = useRef(token);
  useLayoutEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Bezpieczna funkcja wylogowania
  const logout = async () => {
    try {
      // Uderzamy w endpoint backendu, aby usunął ciastko 'laf' (musi obsługiwać tę ścieżkę!)
      await api.post('/logout'); 
    } catch (err) {
      console.error("Błąd podczas wylogowywania na backendzie:", err);
    } finally {
      // Niezależnie od backendu, usuwamy token z frontu
      setToken(null);
    }
  };

  useLayoutEffect(() => {
    // 1. Interceptor żądań (PROAKTYWNY)
    const requestInterceptor = api.interceptors.request.use(async (config) => {
      // Przepuszczamy bez modyfikacji logowanie, wylogowanie i odświeżanie
      if (config.url === '/refreshToken' || config.url === '/loginAuth' || config.url === '/logout') {
        return config;
      }

      let currentToken = tokenRef.current;

      // Sprawdzamy czy token istnieje i czy jego czas życia (wraz z buforem) minął
      if (currentToken && isTokenExpired(currentToken)) {
        
        if (!refreshPromise) {
          refreshPromise = api.get('/refreshToken').then(res => res.data).catch(err => {
            setToken(null);
            throw err;
          }).finally(() => {
            refreshPromise = null;
          });
        }

        try {
          // Czekamy na nowy token
          const data = await refreshPromise;
          if (data && data.success) {
            currentToken = data.accessToken;
            setToken(currentToken);
            tokenRef.current = currentToken;
          }
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Dołącz token do nagłówka
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      
      return config;
    });

    // 2. Interceptor odpowiedzi (REAKTYWNY / SAFETY NET)
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Błąd 401, to nie była ponowna próba i to nie jest błąd endpointu odświeżającego
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/refreshToken') {
          originalRequest._retry = true;
          
          if (!refreshPromise) {
            refreshPromise = api.get('/refreshToken').then(res => res.data).catch(err => {
              setToken(null);
              throw err;
            }).finally(() => {
              refreshPromise = null;
            });
          }
          
          try {
            const data = await refreshPromise;
            if (data && data.success) {
              setToken(data.accessToken);
              tokenRef.current = data.accessToken;
              
              originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            setToken(null);
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );

    // Czyszczenie interceptorów przy odmontowaniu (wykona się tylko przy unmount kontekstu)
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, setToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);