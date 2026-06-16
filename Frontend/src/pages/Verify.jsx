import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [message, setMessage] = useState('Even geduld, je account wordt geverifieerd...');

  useEffect(() => {
    if (!token) {
      setMessage('Geen activatiecode gevonden in de URL.');
      return;
    }

    const verifyAccount = async () => {
      try {
        await axios.post('/api/auth/verify', { token });
        setMessage('Account succesvol geactiveerd! Je kunt nu inloggen.');
      } catch (err) {
        setMessage('Activatie mislukt. Misschien is je account al geactiveerd?');
      }
    };

    verifyAccount();
  }, [token]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4 font-montserrat">Account Activatie</h2>
        
        <p className="text-gray-800 mb-6">{message}</p>
        
        <button 
          onClick={() => navigate('/login')}
          className="bg-primary text-white px-6 py-2 rounded font-bold hover:opacity-90 transition w-full"
        >
          Naar Inloggen
        </button>
      </div>
    </div>
  );
}

export default Verify;
