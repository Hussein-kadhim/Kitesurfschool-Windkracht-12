import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Haal token uit de URL: ?token=...
        const searchParams = new URLSearchParams(location.search);
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setError("Geen geldige reset token gevonden in de URL.");
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError("Wachtwoorden komen niet overeen");
            return;
        }

        try {
            const res = await axios.post('/api/auth/reset-password', { token, newPassword });
            setMessage(res.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Er is een fout opgetreden');
        }
    };

    return (
        <div className='flex items-center justify-center min-h-[calc(100vh-80px)]'>
            <div className='w-full max-w-md p-8 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold mb-6 text-center font-montserrat'>Nieuw Wachtwoord Instellen</h2>
                {error && <p className='text-red-500 mb-4 text-center'>{error}</p>}
                {message && <p className='text-green-500 mb-4 text-center'>{message} Je wordt doorgestuurd...</p>}
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label className='block text-gray-700 mb-2 font-medium'>Nieuw Wachtwoord</label>
                        <input
                            type='password'
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className='mb-6'>
                        <label className='block text-gray-700 mb-2 font-medium'>Bevestig Wachtwoord</label>
                        <input
                            type='password'
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type='submit' className='w-full bg-primary text-white py-2 rounded font-bold hover:opacity-90 transition mb-4' disabled={!token}>
                        Wachtwoord Wijzigen
                    </button>
                    <div className='text-center'>
                        <Link to="/login" className='text-primary hover:underline'>Terug naar inloggen</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
