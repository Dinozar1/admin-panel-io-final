import { useState, useEffect } from 'react';
import { api } from './AuthContext';

export default function ConfigDetails({ configId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [configData, setConfigData] = useState(null);
  const [stats, setStats] = useState(null);

  // Stan dla Salda
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [isBalanceVisible, setIsBalanceVisible] = useState(false);

  // Modale
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null); // Przechowuje CAŁY obiekt portfela do usunięcia

  // Formularz dodawania
  const [cryptoList, setCryptoList] = useState([]);
  const [networkList, setNetworkList] = useState([]);
  const [newSetting, setNewSetting] = useState({ cryptoId: '', networkname: '', publicKey: '' });

  // 1. Pobieranie podstawowych danych na start
  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const encodedId = encodeURIComponent(configId);
      const [configRes, statsRes] = await Promise.all([
        api.get(`/getConfigData/${encodedId}`),
        api.get(`/dataForAdminPanel/${encodedId}`)
      ]);
      
      setConfigData(configRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Błąd pobierania szczegółów:", err);
      alert("Nie udało się pobrać danych konfiguracji.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [configId]);

  // 2. Obsługa salda (ukryte/widoczne)
  const handleToggleBalance = async () => {
    if (isBalanceVisible) {
      setIsBalanceVisible(false);
      return;
    }

    if (!balance) {
      setBalanceLoading(true);
      try {
        const { data } = await api.get(`/getTotalWalletBalance/${encodeURIComponent(configId)}`);
        setBalance(data);
        setIsBalanceVisible(true);
      } catch (err) {
        alert("Błąd podczas pobierania salda z blockchaina.");
      } finally {
        setBalanceLoading(false);
      }
    } else {
      setIsBalanceVisible(true);
    }
  };

  // 3. Pobieranie list do formularza (Krypto i Sieci)
  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const { data } = await api.get('/getCryptoList');
      setCryptoList(data);
      if (data.length > 0) {
        setNewSetting({ ...newSetting, cryptoId: data[0].shortcryptocurrencyname });
        fetchNetworks(data[0].shortcryptocurrencyname);
      }
    } catch (err) { console.error("Błąd pobierania kryptowalut"); }
  };

  const fetchNetworks = async (cryptoId) => {
    try {
      const { data } = await api.get(`/getNetworkList/${encodeURIComponent(cryptoId)}`);
      setNetworkList(data);
      if (data.length > 0) {
        setNewSetting(prev => ({ ...prev, cryptoId, networkname: data[0].networkname }));
      } else {
        setNewSetting(prev => ({ ...prev, cryptoId, networkname: '' }));
      }
    } catch (err) { console.error("Błąd pobierania sieci"); }
  };

  const handleAddSetting = async (e) => {
    e.preventDefault();
    try {
      // 1. Znajdujemy pełną nazwę na podstawie wybranego skrótu
      const selectedCrypto = cryptoList.find(
        (c) => c.shortcryptocurrencyname === newSetting.cryptoId
      );
      const fullCryptoName = selectedCrypto ? selectedCrypto.cryptocurrencyname : newSetting.cryptoId;

      // 2. Wysyłamy żądanie z PEŁNĄ nazwą
      await api.post('/postNewSetting', {
        cryptoId: fullCryptoName, // <-- Tutaj poleci np. "Bitcoin" zamiast "BTC"
        networkId: newSetting.networkname,
        publicKey: newSetting.publicKey,
        configId: configId
      });
      
      setShowAddModal(false);
      setNewSetting({ cryptoId: '', networkname: '', publicKey: '' });
      fetchInitialData(); // Odśwież widok
    } catch (err) {
      alert("Błąd podczas dodawania portfela.");
    }
  };

  // POPRAWIONA FUNKCJA USUWANIA
  const handleDeleteSetting = async () => {
    try {
      await api.delete('/deleteSetting', { 
        data: { 
          publicKey: showDeleteModal.publickey,
          cryptoId: showDeleteModal.cryptocurrencyname, // Pełna nazwa krypto
          networkId: showDeleteModal.networkname,       // Nazwa sieci
          configId: configId                            // Nazwa sklepu
        } 
      });
      setShowDeleteModal(null);
      fetchInitialData(); // Odśwież widok po usunięciu
    } catch (err) {
      alert("Błąd podczas usuwania portfela.");
    }
  };

  if (loading || !configData || !stats) {
    return (
      <div className="min-h-screen bg-admin-light flex items-center justify-center">
        <div className="animate-spin text-4xl text-admin-dark">⏳</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-light p-4 md:p-8 animate-in fade-in duration-300">
      {/* Header & Nawigacja */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 bg-white rounded-xl shadow-sm border border-admin-DEFAULT hover:bg-admin-light transition-colors text-admin-text font-bold"
        >
          ← Wróć
        </button>
        <div>
          <h1 className="text-3xl font-bold text-admin-text">{configData.config.configname}</h1>
          <p className="text-admin-dark">Waluta bazowa: {configData.config.currency_shortname}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Sekcja Statystyk i Salda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Statystyki Panelu */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-admin-DEFAULT">
            <h2 className="text-xl font-bold text-admin-text mb-4">Statystyki Sklepu</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-admin-light/50 p-4 rounded-xl border border-admin-DEFAULT/50">
                <p className="text-sm text-admin-dark">Operacje</p>
                <p className="text-2xl font-bold text-admin-text">{stats.totalOperations}</p>
              </div>
              <div className="bg-admin-light/50 p-4 rounded-xl border border-admin-DEFAULT/50">
                <p className="text-sm text-admin-dark">Klienci</p>
                <p className="text-2xl font-bold text-admin-text">{stats.uniqueClients}</p>
              </div>
              <div className="bg-admin-light/50 p-4 rounded-xl border border-admin-DEFAULT/50">
                <p className="text-sm text-admin-dark">Top Krypto</p>
                <p className="text-xl font-bold text-admin-text">{stats.topCrypto}</p>
              </div>
              <div className="bg-admin-light/50 p-4 rounded-xl border border-admin-DEFAULT/50">
                <p className="text-sm text-admin-dark">Obrót ({stats.fiatCurrency})</p>
                <p className="text-xl font-bold text-green-600">{stats.totalVolumeFiat.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Saldo Portfela */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-admin-DEFAULT flex flex-col justify-center">
            <h2 className="text-xl font-bold text-admin-text mb-2">Całkowite Saldo</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-4xl font-black text-admin-text">
                {isBalanceVisible && balance ? (
                  `${balance.totalBalanceFiat.toFixed(2)} ${balance.fiatCurrency}`
                ) : (
                  `***** ${configData.config.currency_shortname}`
                )}
              </div>
              <button 
                onClick={handleToggleBalance}
                disabled={balanceLoading}
                className="p-3 bg-admin-light rounded-xl hover:bg-admin-DEFAULT/50 transition-colors text-xl disabled:opacity-50"
                title={isBalanceVisible ? "Ukryj saldo" : "Pokaż saldo"}
              >
                {balanceLoading ? '⏳' : isBalanceVisible ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            
            {/* Rozbicie salda na krypto */}
            {isBalanceVisible && balance?.breakdown && (
              <div className="space-y-2 mt-2">
                {balance.breakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm bg-admin-light/30 p-2 rounded">
                    <span className="font-medium text-admin-dark">{item.cryptoName}</span>
                    <span className="text-admin-text">{item.amount} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sekcja Aktywnych Portfeli (Config Entries) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-admin-DEFAULT">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-admin-text">Podpięte Portfele (Nasłuch)</h2>
            <button 
              onClick={openAddModal}
              className="bg-admin-dark hover:bg-admin-text text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-sm"
            >
              + Dodaj Portfel
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-admin-light text-admin-dark">
                  <th className="p-3">Sieć</th>
                  <th className="p-3">Krypto</th>
                  <th className="p-3">Klucz Publiczny</th>
                  <th className="p-3 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {configData.entries.map((entry, idx) => (
                  <tr key={idx} className="border-b border-admin-light hover:bg-admin-light/30 transition-colors">
                    <td className="p-3 font-medium text-admin-text">{entry.networkname}</td>
                    <td className="p-3 font-bold text-admin-dark">{entry.shortcryptocurrencyname}</td>
                    <td className="p-3 font-mono text-sm text-gray-600 break-all">{entry.publickey}</td>
                    <td className="p-3 text-right">
                      {/* ZMIANA TUTAJ: przekazujemy CAŁY obiekt "entry" zamiast "entry.publickey" */}
                      <button 
                        onClick={() => setShowDeleteModal(entry)}
                        className="text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded-lg"
                      >
                        Usuń
                      </button>
                    </td>
                  </tr>
                ))}
                {configData.entries.length === 0 && (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-admin-dark">Brak podpiętych portfeli.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL: DODAWANIE PORTFELA */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-admin-text mb-6">Dodaj Portfel do nasłuchu</h2>
            <form onSubmit={handleAddSetting} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium mb-1 text-admin-dark">Kryptowaluta</label>
                <select 
                  className="w-full p-3 bg-admin-light/50 border border-admin-DEFAULT rounded-xl outline-none"
                  value={newSetting.cryptoId}
                  onChange={(e) => fetchNetworks(e.target.value)}
                >
                  {cryptoList.map(crypto => (
                    <option key={crypto.shortcryptocurrencyname} value={crypto.shortcryptocurrencyname}>
                      {crypto.cryptocurrencyname} ({crypto.shortcryptocurrencyname})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-admin-dark">Sieć (Blockchain)</label>
                <select 
                  required
                  className="w-full p-3 bg-admin-light/50 border border-admin-DEFAULT rounded-xl outline-none"
                  value={newSetting.networkname}
                  onChange={(e) => setNewSetting({...newSetting, networkname: e.target.value})}
                  disabled={networkList.length === 0}
                >
                  {networkList.map(net => (
                    <option key={net.networkname} value={net.networkname}>
                      {net.networkname} ({net.shortnetworkname})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-admin-dark">Klucz Publiczny (Adres)</label>
                <input 
                  required
                  placeholder="0x..."
                  className="w-full p-3 bg-admin-light/50 border border-admin-DEFAULT rounded-xl focus:ring-2 focus:ring-admin-dark outline-none font-mono text-sm"
                  value={newSetting.publicKey}
                  onChange={e => setNewSetting({...newSetting, publicKey: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-admin-dark font-medium">Anuluj</button>
                <button type="submit" className="flex-1 py-3 bg-admin-dark text-white rounded-xl font-bold hover:bg-admin-text transition-colors">Dodaj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: POTWIERDZENIE USUNIĘCIA */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-admin-text mb-2">Usunąć portfel?</h2>
            <p className="text-admin-dark mb-4 text-sm">Adres przestanie być nasłuchiwany w systemie Moralis.</p>
            {/* ZMIANA TUTAJ: Wyświetlanie danych z obiektu */}
            <p className="font-mono text-xs bg-admin-light p-2 rounded mb-6 break-all">
              <span className="font-bold text-admin-dark">{showDeleteModal.shortcryptocurrencyname}</span> na {showDeleteModal.networkname}<br/><br/>
              {showDeleteModal.publickey}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(null)} className="flex-1 py-2 font-medium">Anuluj</button>
              <button onClick={handleDeleteSetting} className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors">Tak, usuń</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}