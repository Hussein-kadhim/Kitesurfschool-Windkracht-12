import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AdminUserForm from '../components/AdminUserForm';
import AdminUserRow from '../components/AdminUserRow';

const addSchema = z.object({
  name:        z.string().min(1, 'Naam is verplicht'),
  email:       z.string().min(1, 'E-mailadres is verplicht').email('Vul een geldig e-mailadres in'),
  password:    z.string().regex(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={\[\]|\\:;"'<>,.?/-]).{12,}$/, 'Wachtwoord moet minstens 12 tekens lang zijn en een hoofdletter, cijfer en leesteken bevatten.'),
  role:        z.enum(['klant', 'instructeur', 'eigenaar']),
  phone:       z.string().optional(),
  dateOfBirth: z.string().optional(),
  address:     z.string().optional(),
  city:        z.string().optional(),
  bsn:         z.string().optional(),
});

const editSchema = z.object({
  name:        z.string().min(1, 'Naam is verplicht'),
  email:       z.string().min(1, 'E-mailadres is verplicht').email('Vul een geldig e-mailadres in'),
  role:        z.enum(['klant', 'instructeur', 'eigenaar']),
  phone:       z.string().optional(),
  dateOfBirth: z.string().optional(),
  address:     z.string().optional(),
  city:        z.string().optional(),
  bsn:         z.string().optional(),
});

const ROLE_CONFIG = {
  eigenaar:    { label: 'Eigenaar' },
  instructeur: { label: 'Instructeur' },
  klant:       { label: 'Klant' },
};

const AdminUsers = ({ user }) => {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('alle');
  
  const [expandedId, setExpandedId] = useState(null);
  const [editId, setEditId]         = useState(null);
  const [editLoading, setEditLoading]   = useState(false);
  const [editServerError, setEditServerError] = useState('');
  
  const [deleteId, setDeleteId]     = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [addLoading, setAddLoading]   = useState(false);
  const [addServerError, setAddServerError] = useState('');
  
  const [successMsg, setSuccessMsg]   = useState('');

  const location = useLocation();
  const viewAsInstructeur = location.state?.view === 'instructeur';
  const isEigenaar = user?.role === 'eigenaar' && !viewAsInstructeur;

  const { register: registerAdd, handleSubmit: handleAddSubmit, reset: resetAdd, watch: watchAdd, formState: { errors: addErrors } } = useForm({ resolver: zodResolver(addSchema), defaultValues: { role: 'klant' } });
  const addRole = watchAdd('role');

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, watch: watchEdit, formState: { errors: editErrors } } = useForm({ resolver: zodResolver(editSchema) });
  const editRole = watchEdit('role');

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true); setFetchError('');
    try {
      const res = await axios.get('/api/gebruikers');
      setUsers(res.data);
    } catch { setFetchError('Kon gebruikers niet ophalen. Controleer je verbinding.'); } 
    finally { setLoading(false); }
  };

  const filtered = users.filter((u) => {
    // Als de eigenaar de view 'Mijn Klanten' gebruikt, of het is een echte instructeur,
    // filter dan alle andere rollen eruit (zodat ze alleen klanten zien)
    if ((viewAsInstructeur || user?.role === 'instructeur') && u.role !== 'klant') {
      return false;
    }
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'alle' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openEdit = (u) => {
    setEditId(u.id); setEditServerError(''); setExpandedId(null); setDeleteId(null);
    resetEdit({
      name:        u.name || '', email: u.email || '', role: u.role || 'klant',
      phone:       u.phone || '', dateOfBirth: u.dateOfBirth ? u.dateOfBirth.split('T')[0] : '',
      address:     u.address || '', city: u.city || '', bsn: u.bsn || '',
    });
  };

  const onEditSubmit = async (data) => {
    setEditLoading(true); setEditServerError('');
    try {
      const res = await axios.put(`/api/gebruikers/${editId}`, data);
      setUsers((prev) => prev.map((x) => (x.id === editId ? res.data : x)));
      setEditId(null); showSuccess('Gebruiker succesvol bijgewerkt.');
    } catch (err) { setEditServerError(err.response?.data?.message || 'Bijwerken mislukt.'); } 
    finally { setEditLoading(false); }
  };

  const onAddSubmit = async (data) => {
    setAddLoading(true); setAddServerError('');
    try {
      const res = await axios.post('/api/gebruikers', { ...data, isVerified: true });
      setUsers((prev) => [...prev, res.data]);
      resetAdd({ role: 'klant' }); setShowAddForm(false); showSuccess(`Gebruiker ${res.data.name || res.data.email} aangemaakt.`);
    } catch (err) { setAddServerError(err.response?.data?.message || 'Aanmaken mislukt.'); } 
    finally { setAddLoading(false); }
  };

  const [errorMessage, setErrorMessage] = useState('');
  const showError = (msg) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(''), 5000);
  };

  const confirmDelete = async (id) => {
    setDeleteLoading(true);
    try {
      await axios.delete(`/api/gebruikers/${id}`);
      setUsers((prev) => prev.filter((x) => x.id !== id));
      setDeleteId(null); showSuccess('Gebruiker verwijderd.');
    } catch (err) { showError(err.response?.data?.message || 'Verwijderen mislukt.'); } 
    finally { setDeleteLoading(false); }
  };

  const handlePromote = async (id, currentRole) => {
    if (currentRole === 'instructeur') {
      showError("Rol al aangepast");
      return;
    }
    try {
      const res = await axios.put(`/api/gebruikers/${id}`, { role: 'instructeur' });
      setUsers((prev) => prev.map((x) => (x.id === id ? res.data : x)));
      showSuccess('Gebruiker is gepromoveerd tot instructeur!');
    } catch (err) { 
      showError(err.response?.data?.message || 'Promoveren mislukt.'); 
    }
  };

  const handleBlock = async (id, isBlocked) => {
    try {
      const res = await axios.put(`/api/gebruikers/${id}`, { isBlocked: !isBlocked });
      setUsers((prev) => prev.map((x) => (x.id === id ? res.data : x)));
      showSuccess(`Gebruiker is succesvol ${!isBlocked ? 'geblokkeerd' : 'gedeblokkeerd'}.`);
    } catch (err) {
      showError(err.response?.data?.message || 'Actie mislukt. Zorg dat je de database geüpdatet hebt.');
    }
  };

  const roleCounts = {
    alle:        users.length,
    klant:       users.filter((u) => u.role === 'klant').length,
    instructeur: users.filter((u) => u.role === 'instructeur').length,
    eigenaar:    users.filter((u) => u.role === 'eigenaar').length,
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-montserrat text-gray-900">
              {isEigenaar ? 'Gebruikersbeheer' : 'Mijn Klanten'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isEigenaar ? 'Beheer alle gebruikers, rollen en persoonsgegevens.' : 'Beheer al je klanten en hun persoonsgegevens.'}
            </p>
          </div>
          {(isEigenaar || user?.role === 'instructeur') && (
            <button onClick={() => { setShowAddForm((v) => !v); setAddServerError(''); resetAdd({ role: 'klant' }); }}
              className="flex items-center gap-2 bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition shrink-0">
              <i className="fa-solid fa-plus" /> Nieuwe klant
            </button>
          )}
        </div>

        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
            <i className="fa-solid fa-circle-check text-green-500" /> {successMsg}
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm font-medium">
            <i className="fa-solid fa-triangle-exclamation text-red-500" /> {errorMessage}
          </div>
        )}

        {showAddForm && (isEigenaar || user?.role === 'instructeur') && (
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold font-montserrat text-gray-900 mb-5">
              {isEigenaar ? 'Nieuwe gebruiker aanmaken' : 'Nieuwe klant aanmaken'}
            </h2>
            <AdminUserForm 
              register={registerAdd} errors={addErrors} isEigenaar={isEigenaar} role={addRole} isEdit={false}
              onSubmit={handleAddSubmit(onAddSubmit)} onCancel={() => setShowAddForm(false)}
              isLoading={addLoading} serverError={addServerError}
            />
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input type="text" placeholder="Zoek op naam of e-mailadres..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-black" />
          </div>
          {isEigenaar && (
            <div className="flex border border-gray-200 divide-x divide-gray-200 shrink-0">
              {['alle', 'klant', 'instructeur', 'eigenaar'].map((r) => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${roleFilter === r ? 'bg-black text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {r === 'alle' ? 'Alle' : ROLE_CONFIG[r]?.label}
                  <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${roleFilter === r ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {roleCounts[r]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-gray-100 border border-gray-200 h-20 rounded" />)}</div>}

        {!loading && fetchError && (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-gray-200 shadow-sm text-center">
            <h3 className="text-xl font-bold font-montserrat text-gray-900 mb-2">Verbinding mislukt</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">{fetchError}</p>
            <button onClick={fetchUsers} className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition">
              <i className="fa-solid fa-rotate-right" /> Probeer opnieuw
            </button>
          </div>
        )}

        {!loading && !fetchError && filtered.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm bg-white border border-gray-200 shadow-sm">
            Geen gebruikers gevonden{search ? ` voor "${search}"` : ''}.
          </div>
        )}

        {!loading && !fetchError && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((u) => (
              <AdminUserRow 
                key={u.id} user={u} currentUser={user} isEigenaar={isEigenaar}
                isExpanded={expandedId === u.id} isEditing={editId === u.id} isDeleting={deleteId === u.id}
                setExpandedId={setExpandedId} setEditId={setEditId} setDeleteId={setDeleteId}
                openEdit={openEdit} confirmDelete={confirmDelete} deleteLoading={deleteLoading}
                registerEdit={registerEdit} handleEditSubmit={handleEditSubmit} onEditSubmit={onEditSubmit}
                editErrors={editErrors} editRole={editRole} editLoading={editLoading} editServerError={editServerError}
                handlePromote={handlePromote} handleBlock={handleBlock}
              />
            ))}
          </div>
        )}

        {!loading && !fetchError && <p className="text-xs text-gray-400 text-center">{filtered.length} van {users.length} gebruiker(s) weergegeven</p>}
      </div>
    </div>
  );
};

export default AdminUsers;
