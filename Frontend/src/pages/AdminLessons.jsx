import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useForm } from 'react-hook-form';

const TIJDSLOTEN = [
  '09:00 – 11:30',
  '12:30 – 15:00',
  '15:30 – 18:00',
];

const AdminLessons = ({ user }) => {
  const isEigenaar = user?.role === 'eigenaar';
  const [instructors, setInstructors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [filterInstructorId, setFilterInstructorId] = useState('ALL');
  const [viewType, setViewType] = useState('ALL');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { maxPersons: 2 }
  });

  const fetchData = async () => {
    try {
      const schedRes = await axios.get('/api/schedule');
      setSchedules(schedRes.data.schedules);
    } catch (err) {
      console.error("Fout bij ophalen agenda:", err);
      setServerError("Fout bij ophalen van het lesrooster. Bestaat de database tabel wel?");
    }

    if (isEigenaar) {
      try {
        const usersRes = await axios.get('/api/gebruikers');
        const insts = usersRes.data.filter(u => u.role === 'instructeur');
        setInstructors(insts);
      } catch (err) {
        console.error("Fout bij ophalen instructeurs:", err);
        setServerError("Kon de lijst met instructeurs niet ophalen.");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [isEigenaar]);

  const onSubmit = async (data) => {
    setLoading(true);
    setServerError('');
    setSuccessMsg('');

    const dateObj = new Date(data.date);
    dateObj.setHours(0,0,0,0);

    const payload = {
      date: dateObj,
      time: data.time,
      instructorId: parseInt(data.instructorId),
      maxPersons: parseInt(data.maxPersons) || 2
    };

    try {
      if (editingId) {
        await axios.put(`/api/schedule/${editingId}`, payload);
        setSuccessMsg('Les succesvol bijgewerkt!');
      } else {
        await axios.post('/api/schedule', payload);
        setSuccessMsg('Les succesvol in de agenda geplaatst!');
      }
      reset({ maxPersons: 2 });
      setEditingId(null);
      fetchData(); // ververs lijst
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setServerError(err.response?.data?.message || 'Er is een fout opgetreden.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.id);
    reset({
      date: new Date(s.date).toISOString().split('T')[0],
      time: s.time,
      instructorId: s.instructorId,
      maxPersons: s.maxPersons || 2
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, reason) => {
    try {
      await axios.delete(`/api/schedule/${id}?reason=${reason}`);
      setDeleteConfirmId(null);
      fetchData(); // ververs lijst
    } catch (err) {
      alert(err.response?.data?.message || 'Fout bij verwijderen/annuleren.');
    }
  };

  const handleAccepteerBetaling = async (resId) => {
    try {
      await axios.put(`/api/reservations/${resId}`, {
        status: 'DEFINITIEF',
        hasPaid: true
      });
      fetchData(); // Herlaad de agenda en reserveringen om de nieuwe status te tonen
    } catch (err) {
      alert(err.response?.data?.message || 'Fout bij accepteren van betaling.');
    }
  };


  const nu = new Date();
  nu.setHours(0,0,0,0);
  const endOfDay = new Date(nu); endOfDay.setDate(endOfDay.getDate() + 1);
  const endOfWeek = new Date(nu); endOfWeek.setDate(endOfWeek.getDate() + 7);
  const endOfMonth = new Date(nu); endOfMonth.setMonth(endOfMonth.getMonth() + 1);

  const filteredSchedules = schedules.filter(s => {
    const sDate = new Date(s.date);
    if (filterInstructorId !== 'ALL' && s.instructorId !== parseInt(filterInstructorId)) return false;
    if (viewType === 'DAG' && sDate >= endOfDay) return false;
    if (viewType === 'WEEK' && sDate >= endOfWeek) return false;
    if (viewType === 'MAAND' && sDate >= endOfMonth) return false;
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Agenda & Lessen</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEigenaar ? 'Beheer de agenda en plan nieuwe lessen in voor je instructeurs.' : 'Bekijk jouw ingeplande lessen.'}
          </p>
        </div>

        {isEigenaar && !editingId && (
          <div className="bg-white border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold font-montserrat text-gray-900 mb-5">
              Nieuwe les inplannen
            </h2>
            
            {successMsg && (
              <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm font-medium">
                <i className="fa-solid fa-circle-check text-green-500" /> {successMsg}
              </div>
            )}
            
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="flex flex-col gap-1 relative pb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Datum</label>
                <input type="date" {...register('date', { required: 'Selecteer een datum' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.date ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`} />
                {errors.date && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.date.message}</p>}
              </div>
              <div className="flex flex-col gap-1 relative pb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tijdslot</label>
                <select {...register('time', { required: 'Selecteer een tijdslot' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.time ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}>
                  <option value="">Selecteer tijd</option>
                  {TIJDSLOTEN.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.time && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.time.message}</p>}
              </div>
              <div className="flex flex-col gap-1 relative pb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Instructeur</label>
                <select {...register('instructorId', { required: 'Kies een instructeur' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.instructorId ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}>
                  <option value="">Kies instructeur</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name || i.email}</option>)}
                </select>
                {errors.instructorId && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.instructorId.message}</p>}
              </div>
              <div className="flex flex-col gap-1 relative pb-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Capaciteit</label>
                <input type="number" min="1" max="10" {...register('maxPersons', { required: 'Vul capaciteit in', min: { value: 1, message: 'Min 1' } })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.maxPersons ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`} />
                {errors.maxPersons && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.maxPersons.message}</p>}
              </div>
              
              {serverError && <p className="md:col-span-4 text-red-600 text-xs font-medium">{serverError}</p>}
              
              <div className="md:col-span-4 mt-2">
                <button type="submit" disabled={loading} className="bg-black text-white px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition disabled:opacity-50">
                  {loading ? 'Bezig...' : 'Inplannen'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white border border-gray-200 shadow-sm mt-8">
          <div className="border-b border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-base font-bold font-montserrat text-gray-900 uppercase tracking-wider">
              Ingeplande Lessen
            </h2>
            <div className="flex flex-col sm:flex-row gap-3">
              {isEigenaar && (
                <select 
                  value={filterInstructorId} 
                  onChange={(e) => setFilterInstructorId(e.target.value)}
                  className="border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white focus:outline-none"
                >
                  <option value="ALL">Alle Instructeurs</option>
                  {instructors.map(i => <option key={i.id} value={i.id}>{i.name || i.email}</option>)}
                </select>
              )}
              <div className="flex bg-gray-100 p-1 rounded-sm">
                {['ALL', 'DAG', 'WEEK', 'MAAND'].map(type => (
                  <button
                    key={type}
                    onClick={() => setViewType(type)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition ${viewType === type ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {type === 'ALL' ? 'Alles' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredSchedules.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm font-medium">
                Geen lessen ingepland voor deze selectie.
              </div>
            ) : (
              filteredSchedules.map((s) => (
                <div key={s.id} className="flex flex-col bg-white">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-semibold text-gray-900 capitalize">{formatDate(s.date)}</p>
                      <p className="text-sm text-gray-500">{s.time}</p>
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                        <i className="fa-solid fa-users text-gray-400"></i>
                        <span className={s.bookedCount === 0 ? 'text-gray-400' : s.bookedCount >= (s.maxPersons || 2) ? 'text-red-500' : 'text-green-600'}>
                          {s.bookedCount || 0} / {s.maxPersons || 2} personen geboekt {s.bookedCount >= (s.maxPersons || 2) ? '(Vol)' : ''}
                        </span>
                      </div>
                      
                      {/* Toon wie er geboekt heeft (Klantenlijst) */}
                      {s.reservations && s.reservations.length > 0 && (
                        <div className="mt-3 pl-3 border-l-2 border-gray-200">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Geboekt door:</p>
                          <ul className="space-y-1.5">
                            {s.reservations.map(res => (
                              <li key={res.id} className="text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                <span className="font-semibold">{res.user?.name || res.user?.email}</span>
                                {res.duoName && <span className="text-gray-500">(+ {res.duoName})</span>}
                                <span className="flex items-center gap-2 mt-1 sm:mt-0 ml-auto">
                                  <span className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${res.status === 'DEFINITIEF' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {res.status}
                                  </span>
                                  <span className={`px-1.5 py-0.5 text-[9px] rounded-sm uppercase tracking-widest font-bold ${res.hasPaid ? (res.status === 'DEFINITIEF' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700') : 'bg-gray-100 text-gray-500'}`}>
                                    {res.hasPaid ? (res.status === 'DEFINITIEF' ? 'BETAALD' : 'KLAARGEZET (CONTROLE)') : 'NIET BETAALD'}
                                  </span>
                                  {isEigenaar && res.status !== 'DEFINITIEF' && res.status !== 'GEANNULEERD' && (
                                    <button 
                                      onClick={() => handleAccepteerBetaling(res.id)}
                                      className="ml-2 bg-green-600 hover:bg-green-700 text-white px-2 py-0.5 rounded-sm text-[9px] uppercase tracking-wider font-bold transition"
                                    >
                                      {res.hasPaid ? 'Verifieer & Maak Definitief' : 'Accepteer Betaling'}
                                    </button>
                                  )}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {/* De knoppen voor bewerken en annuleren tonen we nu voor BEIDE rollen */}
                    <div className="mt-2 sm:mt-0 text-left sm:text-right flex flex-col items-start sm:items-end gap-3 sm:justify-end">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Instructeur</p>
                        <p className="text-sm font-medium text-gray-900">{s.instructor?.name || s.instructor?.email}</p>
                      </div>
                      
                      <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 justify-end">
                          {isEigenaar && (
                            <button 
                              onClick={() => {
                                if (editingId === s.id) {
                                  setEditingId(null);
                                } else {
                                  handleEdit(s);
                                }
                                setDeleteConfirmId(null);
                              }}
                              className={`border transition px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                                editingId === s.id
                                  ? 'border-gray-500 bg-gray-100 text-black'
                                  : 'border-gray-300 text-gray-700 hover:border-black hover:text-black'
                              }`}
                            >
                              {editingId === s.id ? 'Sluiten' : 'Bewerken'}
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setDeleteConfirmId(deleteConfirmId === s.id ? null : s.id);
                              setEditingId(null);
                            }}
                            className={`border transition px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                              deleteConfirmId === s.id
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-red-300 text-red-600 hover:bg-red-50'
                            }`}
                          >
                            {deleteConfirmId === s.id ? 'Sluiten' : 'Annuleren'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {editingId === s.id && (
                    <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Tijdslot Wijzigen</p>
                      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <div className="flex flex-col gap-1 relative pb-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Datum</label>
                          <input type="date" {...register('date', { required: 'Selecteer een datum' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.date ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`} />
                          {errors.date && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.date.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1 relative pb-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tijdslot</label>
                          <select {...register('time', { required: 'Kies tijd' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.time ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}>
                            <option value="">Selecteer tijd</option>
                            {TIJDSLOTEN.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          {errors.time && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.time.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1 relative pb-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Instructeur</label>
                          <select {...register('instructorId', { required: 'Kies instructeur' })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.instructorId ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`}>
                            <option value="">Kies instructeur</option>
                            {instructors.map(i => <option key={i.id} value={i.id}>{i.name || i.email}</option>)}
                          </select>
                          {errors.instructorId && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.instructorId.message}</p>}
                        </div>
                        <div className="flex flex-col gap-1 relative pb-4">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Max Personen</label>
                          <input type="number" min="1" max="10" {...register('maxPersons', { required: 'Verplicht', min: 1 })} className={`border px-3 py-2 text-sm focus:outline-none bg-white ${errors.maxPersons ? 'border-red-400 focus:border-red-500' : 'border-gray-300 focus:border-black'}`} />
                          {errors.maxPersons && <p className="text-red-500 text-[10px] font-bold absolute bottom-0 left-0">{errors.maxPersons.message || 'Verplicht'}</p>}
                        </div>
                        {serverError && <p className="md:col-span-4 text-red-600 text-xs font-medium">{serverError}</p>}
                        <div className="md:col-span-4 flex gap-3 mt-1">
                          <button type="submit" disabled={loading} className="bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition disabled:opacity-50">
                            {loading ? 'Opslaan...' : 'Opslaan'}
                          </button>
                          <button type="button" onClick={() => { setEditingId(null); reset(); }} className="border border-gray-300 text-gray-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:border-black transition">
                            Annuleren
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Inline Delete Confirmation */}
                  {deleteConfirmId === s.id && (
                    <div className="border-t border-red-100 bg-red-50 px-5 py-5">
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3">Les Annuleren & Verwijderen</p>
                      <p className="text-sm text-gray-800 mb-4">Klanten die deze les geboekt hebben krijgen automatisch een annuleringsmail.</p>
                      <div className="flex flex-wrap gap-3 mt-1">
                        <button
                          onClick={() => handleDelete(s.id, 'ziekte')}
                          className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
                        >
                          Wegens Ziekte
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, 'weer')}
                          className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition"
                        >
                          Wegens Weer (Wind &gt; 10)
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="border border-gray-300 text-gray-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:border-black transition"
                        >
                          Terug
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLessons;
