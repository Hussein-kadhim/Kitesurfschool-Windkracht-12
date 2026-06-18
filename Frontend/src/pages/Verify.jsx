import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function Verify({ setUser }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Geen geldige activatietoken gevonden in de URL.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setError('');
    const newErrors = {};

    if (!name) {
      newErrors.name = 'Volledige naam is verplicht';
    }

    if (!password) {
      newErrors.password = 'Wachtwoord is verplicht';
    } else if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={\[\]|\\:;"'<>,.?/-]).{12,}$/.test(password)) {
      newErrors.password = 'Wachtwoord moet minstens 12 tekens lang zijn en een hoofdletter, cijfer en leesteken bevatten.';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Wachtwoorden komen niet overeen';
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/auth/verify', { token, name, password });
      setSuccessMsg('Account succesvol geactiveerd en wachtwoord ingesteld!');
      setUser(res.data.user);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Activatie mislukt. Neem contact op met de administratie of probeer het opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-cream">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center font-montserrat">Account Activeren</h2>
        
        {error && <div className="text-red-500 mb-4 text-center text-sm font-medium">{error}</div>}
        {successMsg && <div className="text-green-500 mb-4 text-center text-sm font-medium">{successMsg} Je wordt doorgestuurd...</div>}
        
        {token ? (
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm text-left">Volledige naam</label>
              <input 
                type="text" 
                placeholder="Bijv. Jan de Vries" 
                className={`border p-2 w-full focus:outline-none ${fieldErrors.name ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
                value={name} 
                onChange={(e) => { setName(e.target.value); setFieldErrors({...fieldErrors, name: ''}); }}
                disabled={isSubmitting || successMsg}
              />
              {fieldErrors.name && <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.name}</p>}
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium text-sm text-left">Kies een wachtwoord</label>
              <input 
                type="password" 
                placeholder="Wachtwoord" 
                className={`border p-2 w-full focus:outline-none ${fieldErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setFieldErrors({...fieldErrors, password: ''}); }}
                disabled={isSubmitting || successMsg}
              />
              {fieldErrors.password ? (
                <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.password}</p>
              ) : (
                <p className="text-gray-400 text-[10px] mt-1 text-left">
                  Minimaal 12 tekens, 1 hoofdletter, 1 getal en 1 leesteken (@, #, etc.)
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium text-sm text-left">Bevestig wachtwoord</label>
              <input 
                type="password" 
                placeholder="Wachtwoord bevestigen" 
                className={`border p-2 w-full focus:outline-none ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
                value={confirmPassword} 
                onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors({...fieldErrors, confirmPassword: ''}); }}
                disabled={isSubmitting || successMsg}
              />
              {fieldErrors.confirmPassword && <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.confirmPassword}</p>}
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || successMsg}
              className="bg-primary text-white p-2 w-full font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Bezig met activeren...' : 'Wachtwoord & Naam Opslaan'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-gray-600 mb-6">Er is geen geldige activatietoken opgegeven. Controleer de link in de e-mail.</p>
            <button 
              onClick={() => navigate('/login')}
              className="bg-primary text-white px-6 py-2 rounded font-bold hover:opacity-90 transition w-full"
            >
              Naar Inloggen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Verify;
