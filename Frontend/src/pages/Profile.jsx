import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ user, setUser }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    address: user?.address || '',
    city: user?.city || '',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    phone: user?.phone || '',
    bsn: user?.bsn || ''
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        address: user.address || '',
        city: user.city || '',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        phone: user.phone || '',
        bsn: user.bsn || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.put('/api/auth/profile', formData);
      setUser(res.data.user);
      setMessage('Je profielgegevens zijn succesvol bijgewerkt!');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Er is iets misgegaan bij het bijwerken van je gegevens.');
    } finally {
      setLoading(false);
    }
  };

  const isStaff = user?.role === 'eigenaar' || user?.role === 'instructeur';

  return (
    <div className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-xl mx-auto bg-white border-2 border-gray-200 p-8 shadow-sm">
        <h1 className="text-2xl font-bold font-montserrat text-gray-900 mb-6">Mijn Profiel</h1>

        <div className="mb-4 bg-gray-50 border border-gray-100 p-4 rounded text-xs text-gray-500">
          <p>Je bent ingelogd als: <span className="font-bold text-gray-800">{user?.email}</span></p>
          <p>Gebruikersrol: <span className="font-bold text-gray-800 uppercase">{user?.role}</span></p>
        </div>

        {message && (
          <div className="mb-6 p-4 border border-green-200 bg-green-50 text-green-700 text-sm font-bold rounded">
            <i className="fa-solid fa-circle-check mr-2"></i>
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 border border-red-200 bg-red-50 text-red-700 text-sm font-bold rounded">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Volledige Naam</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition text-sm font-medium"
              placeholder="Bijv. Terence Olieslager"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Adres</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition text-sm font-medium"
              placeholder="Straat en huisnummer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Woonplaats</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition text-sm font-medium"
              placeholder="Bijv. Utrecht"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Geboortedatum</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Mobiel nummer</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition text-sm font-medium"
                placeholder="Bijv. 0612345678"
              />
            </div>
          </div>

          {isStaff && (
            <div className="bg-yellow-50/50 border border-yellow-100 p-5 space-y-2">
              <label className="block text-xs font-bold text-yellow-800 uppercase tracking-wider">
                BSN-nummer <span className="text-[10px] text-yellow-600">(Alleen voor medewerkers/eigenaren)</span>
              </label>
              <input
                type="text"
                name="bsn"
                value={formData.bsn}
                onChange={handleChange}
                className="w-full px-4 py-3 border-2 border-yellow-200 focus:border-yellow-900 outline-none bg-white transition text-sm font-medium"
                placeholder="Negencijferig Burgerservicenummer"
                maxLength={9}
              />
            </div>
          )}

          <div className="pt-4 flex flex-col md:flex-row gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 text-white py-3 font-bold uppercase tracking-wide text-sm hover:bg-black transition disabled:opacity-50"
            >
              {loading ? 'Bijwerken...' : 'Opslaan'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold uppercase tracking-wide text-sm hover:bg-gray-50 transition"
            >
              Terug
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
