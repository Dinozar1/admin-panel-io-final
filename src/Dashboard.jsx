import { useState, useEffect } from 'react';
import { api, useAuth } from './AuthContext';
import ConfigDetails from './ConfigDetails';

export default function Dashboard() {
  // Zamiast setToken, używamy teraz naszej nowej funkcji logout
  const { logout } = useAuth(); 
  
  // Stan nawigacji: null = lista, 'string' = id wybranego configu
  const [selectedConfigId, setSelectedConfigId] = useState(null);

  // Stany danych
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Stany dla Modali
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); 
  const [showSettings, setShowSettings] = useState(false);

  // Formularze
  const [newConfig, setNewConfig] = useState({ configName: '', currency: 'PLN' });
  const [terminalData, setTerminalData] = useState({ newLogin: '', newPassword: '' });

  // Pobieranie listy konfiguracji
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/getConfigs');
      setConfigs(data);
    } catch (err) {
      console.error("Błąd pobierania list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchConfigs(); 
  }, []);

  // Obsługa dodawania nowej konfiguracji
  const handleAddConfig = async (e) => {
    e.preventDefault();
    try {
      await api.post('/addNewConfig', newConfig);
      setShowAddModal(false);
      setNewConfig({ configName: '', currency: 'PLN' });
      fetchConfigs();
    } catch (err) { 
      alert("Błąd podczas dodawania konfiguracji."); 
    }
  };

  // Obsługa usuwania konfiguracji
  const handleDelete = async () => {
    try {
      await api.delete('/deleteConfig', { 
        data: { configId: showDeleteModal.configname } 
      });
      setShowDeleteModal(null);
      fetchConfigs();
    } catch (err) { 
      alert("Błąd podczas usuwania."); 
    }
  };

  // Obsługa ustawień terminala
  const updateTerminal = async (type) => {
    try {
      if (type === 'login') {
        await api.post('/changeTerminalLogin', { newLogin: terminalData.newLogin });
        alert("Login terminala zmieniony pomyślnie.");
      } else {
        await api.post('/changeTerminalPassword', { newPassword: terminalData.newPassword });
        alert("Hasło terminala zmienione pomyślnie.");
      }
    } catch (err) { 
      alert("Błąd aktualizacji ustawień terminala."); 
    }
  };

  // --- RENDEROWANIE WIDOKU SZCZEGÓŁÓW ---
  if (selectedConfigId) {
    return (
      <ConfigDetails 
        configId={selectedConfigId} 
        onBack={() => {
          setSelectedConfigId(null);
          fetchConfigs(); // Odśwież listę po powrocie
        }} 
      />
    );
  }

  // --- RENDEROWANIE LISTY GŁÓWNEJ ---
  return (
    <div className="min-h-screen bg-admin-light p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-admin-text">Twoje Konfiguracje</h1>
          <p className="text-admin-dark">Zarządzaj swoimi punktami sprzedaży i portfelami</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-white border border-admin-DEFAULT rounded-full hover:bg-admin-light transition-all shadow-sm text-xl"
            title="Ustawienia terminala"
          >
            ⚙️
          </button>
          <button 
            onClick={logout}
            className="px-4 py-2 text-sm font-bold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
          >
            Wyloguj się
          </button>
        </div>
      </div>

      {/* Grid Konfiguracji */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Karta: Dodaj Nowy */}
        <button 
          onClick={() => setShowAddModal(true)}
          className="border-2 border-dashed border-admin-DEFAULT rounded-3xl p-8 flex flex-col items-center justify-center bg-white/50 hover:bg-white hover:border-admin-dark transition-all group shadow-sm min-h-[200px]"
        >
          <div className="w-12 h-12 bg-admin-light rounded-full flex items-center justify-center text-admin-dark text-3xl group-hover:scale-110 transition-transform">
            +
          </div>
          <span className="mt-4 font-bold text-admin-text">Nowa Konfiguracja</span>
        </button>

        {/* Lista Sklepów */}
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin inline-block text-4xl mb-4">⏳</div>
            <p className="text-admin-dark font-medium">Pobieranie konfiguracji...</p>
          </div>
        ) : configs.map((config, idx) => (
          <div 
            key={idx} 
            className="bg-white rounded-3xl p-6 shadow-md border border-admin-DEFAULT relative overflow-hidden group hover:shadow-xl transition-all"
          >
            {/* Akcja Usuwania */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowDeleteModal(config);
              }}
              className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors p-2"
              title="Usuń konfigurację"
            >
              ✕
            </button>

            {/* Treść Karty */}
            <div 
              className="cursor-pointer" 
              onClick={() => setSelectedConfigId(config.configname)}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-admin-light rounded-2xl flex items-center justify-center text-2xl shadow-inner">
                  🏪
                </div>
                <div>
                  <h3 className="font-bold text-admin-text text-xl group-hover:text-admin-dark transition-colors">
                    {config.configname}
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 bg-admin-light rounded-md text-admin-dark uppercase tracking-wider">
                    {config.currency_shortname}
                  </span>
                </div>
              </div>

              <div className="space-y-3 border-t border-admin-light pt-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-admin-dark">Status:</span>
                  <span className="flex items-center gap-1.5 text-green-600 font-bold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Aktywny
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-admin-dark">Data utworzenia:</span>
                  <span className="text-admin-text font-medium">
                    {new Date(config.creationtimestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Przycisk wejścia */}
              <div className="mt-6 w-full py-2 bg-admin-light/50 group-hover:bg-admin-dark group-hover:text-white text-admin-text text-center rounded-xl text-sm font-bold transition-all">
                Zarządzaj portfelami →
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODALE --- */}

      {/* MODAL: DODAWANIE */}
      {showAddModal && (
        <div className="fixed inset-0 bg-admin-text/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-in-center border border-admin-DEFAULT">
            <h2 className="text-2xl font-bold text-admin-text mb-2">Nowa Konfiguracja</h2>
            <p className="text-admin-dark text-sm mb-6">Stwórz nową przestrzeń dla swojego punktu sprzedaży.</p>
            
            <form onSubmit={handleAddConfig} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-admin-dark mb-2 ml-1">Nazwa Sklepu</label>
                <input 
                  required
                  placeholder="np. Sklep Główny"
                  className="w-full p-4 bg-admin-light/30 border border-admin-DEFAULT rounded-2xl focus:ring-2 focus:ring-admin-dark outline-none transition-all"
                  value={newConfig.configName}
                  onChange={e => setNewConfig({...newConfig, configName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-admin-dark mb-2 ml-1">Waluta Rozliczeniowa</label>
                <select 
                  className="w-full p-4 bg-admin-light/30 border border-admin-DEFAULT rounded-2xl outline-none focus:ring-2 focus:ring-admin-dark cursor-pointer transition-all"
                  value={newConfig.currency}
                  onChange={e => setNewConfig({...newConfig, currency: e.target.value})}
                >
                  <option value="PLN">PLN - Złoty polski</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - Dolar amerykański</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 text-admin-dark font-bold hover:bg-admin-light rounded-2xl transition-colors">Anuluj</button>
                <button type="submit" className="flex-1 py-4 bg-admin-dark text-white rounded-2xl font-bold hover:bg-admin-text shadow-lg transition-all">Utwórz Sklep</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POTWIERDZENIE USUNIĘCIA */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-admin-text/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              ⚠️
            </div>
            <h2 className="text-2xl font-bold text-admin-text mb-2">Czy na pewno?</h2>
            <p className="text-admin-dark mb-8">
              Usunięcie konfiguracji <span className="font-black text-red-500">{showDeleteModal.configname}</span> spowoduje odłączenie wszystkich portfeli.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-3 font-bold text-admin-dark hover:bg-admin-light rounded-2xl transition-colors">Wróć</button>
              <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all">Usuń Sklep</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: USTAWIENIA TERMINALA */}
      {showSettings && (
        <div className="fixed inset-0 bg-admin-text/40 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-admin-DEFAULT">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-admin-text">Bezpieczeństwo Terminala</h2>
              <button onClick={() => setShowSettings(false)} className="text-admin-dark hover:rotate-90 transition-transform p-2 text-xl">✕</button>
            </div>
            
            <div className="space-y-6">
              <div className="p-5 bg-admin-light/30 rounded-2xl border border-admin-DEFAULT">
                <label className="block text-xs font-bold uppercase tracking-widest text-admin-dark mb-3">Login Terminala (Wspólny)</label>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 p-3 bg-white border border-admin-DEFAULT rounded-xl outline-none focus:ring-2 focus:ring-admin-dark"
                    placeholder="np. Sklep_Centrala"
                    onChange={e => setTerminalData({...terminalData, newLogin: e.target.value})}
                  />
                  <button onClick={() => updateTerminal('login')} className="bg-admin-dark text-white px-5 rounded-xl font-bold hover:bg-admin-text transition-all text-sm shadow-md">Zapisz</button>
                </div>
              </div>

              <div className="p-5 bg-admin-light/30 rounded-2xl border border-admin-DEFAULT">
                <label className="block text-xs font-bold uppercase tracking-widest text-admin-dark mb-3">Hasło Terminala (Wspólne)</label>
                <div className="flex gap-2">
                  <input 
                    type="password"
                    className="flex-1 p-3 bg-white border border-admin-DEFAULT rounded-xl outline-none focus:ring-2 focus:ring-admin-dark"
                    placeholder="••••••••"
                    onChange={e => setTerminalData({...terminalData, newPassword: e.target.value})}
                  />
                  <button onClick={() => updateTerminal('password')} className="bg-admin-dark text-white px-5 rounded-xl font-bold hover:bg-admin-text transition-all text-sm shadow-md">Zmień</button>
                </div>
              </div>
            </div>
            
            <p className="mt-6 text-[10px] text-center text-admin-dark/60 uppercase tracking-widest">
              Zmiany wpłyną na wszystkie fizyczne urządzenia terminalowe
            </p>
          </div>
        </div>
      )}
    </div>
  );
}