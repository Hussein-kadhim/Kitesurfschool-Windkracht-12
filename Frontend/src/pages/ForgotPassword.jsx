import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setPreviewUrl('');
        setLoading(true);
        try {
            const res = await axios.post('/api/auth/forgot-password', { email });
            setMessage(res.data.message);
            if (res.data.url) {
                setPreviewUrl(res.data.url);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Er is een fout opgetreden');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex items-center justify-center min-h-[calc(100vh-80px)]'>
            <div className='w-full max-w-md p-8 bg-white rounded shadow-md'>
                <h2 className='text-2xl font-bold mb-6 text-center font-montserrat'>Wachtwoord Vergeten</h2>
                {error && <p className='text-red-500 mb-4 text-center'>{error}</p>}
                {message && <p className='text-green-500 mb-4 text-center'>{message}</p>}
                
                {previewUrl && (
                    <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4 text-center'>
                        <span className='block sm:inline'>Er is een e-mail verzonden met instructies.</span>
                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className='block mt-2 underline text-green-800 font-bold'>
                            Open e-mail
                        </a>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className='mb-6'>
                        <label className='block text-gray-700 mb-2 font-medium'>E-mailadres</label>
                        <input
                            type='email'
                            className='w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <button type='submit' className='w-full bg-primary text-white py-2 rounded font-bold hover:opacity-90 transition mb-4' disabled={loading}>
                        {loading ? 'Bezig met verzenden...' : 'Stuur Reset Link'}
                    </button>
                    <div className='text-center'>
                        <Link to="/login" className='text-primary hover:underline'>Terug naar inloggen</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
