import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const LESSON_LABELS = {
  PRIVE_LES: 'Privéles',
  LOSSE_DUO_LES: 'Losse Duo Kiteles',
  DUO_PAKKET_3: 'Duo Lespakket 3 Lessen',
  DUO_PAKKET_5: 'Duo Lespakket 5 Lessen',
};

const STATUS_CONFIG = {
  VOORLOPIG:   { label: 'Voorlopig',   classes: 'bg-yellow-100 text-yellow-800 border border-yellow-300' },
  DEFINITIEF:  { label: 'Definitief',  classes: 'bg-green-100 text-green-800 border border-green-300' },
  GEANNULEERD: { label: 'Geannuleerd', classes: 'bg-red-100 text-red-800 border border-red-300' },
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const Dashboard = ({ user }) => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [expanded, setExpanded]         = useState(null);
  const [actiefId, setActiefId]         = useState(null);
  const [wijzigId, setWijzigId]         = useState(null);
  const [nieuweDatum, setNieuweDatum]   = useState(null);
  const [confirmId, setConfirmId]       = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const res = await axios.get('/api/reservations', { timeout: 5000 });
        setReservations(res.data);
      } catch {
        setError('Kon reserveringen niet ophalen. Probeer het later opnieuw.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReservations();
  }, [user]);

  // Annuleer (verwijder) 
  const handleAnnuleer = async (id) => {
    setActiefId(id);
    try {
      await axios.delete(`/api/reservations/${id}`);
      setReservations(prev => prev.filter(r => r.id !== id));
      setExpanded(null);
      setConfirmId(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Annuleren mislukt. Probeer het opnieuw.');
    } finally {
      setActiefId(null);
    }
  };

  // Wijzig datum 
  const openWijzig = (id, huidigeDatum) => {
    setWijzigId(id);
    setNieuweDatum(new Date(huidigeDatum));
    setExpanded(null);
  };

  const annuleerWijziging = () => {
    setWijzigId(null);
    setNieuweDatum(null);
  };

  const bevestigWijziging = async (id) => {
    if (!nieuweDatum) return;
    setActiefId(id);
    try {
      const res = await axios.put(`/api/reservations/${id}`, {
        bookingDate: nieuweDatum.toISOString(),
      });
      setReservations(prev => prev.map(r => r.id === id ? res.data : r));
      setWijzigId(null);
      setNieuweDatum(null);
    } catch (err) {
      alert(err.response?.data?.message || 'Wijzigen mislukt. Probeer het opnieuw.');
    } finally {
      setActiefId(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Mijn Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welkom terug, <span className="font-semibold text-gray-700">{user?.name}</span>.
          </p>
        </div>

        {/* Reserveringen */}
        <div>
          <h2 className="text-xl font-bold font-montserrat text-gray-900 mb-4 pb-2 border-b border-gray-200">
            Mijn Reserveringen
          </h2>

          {loading && (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 border border-gray-200 h-24 rounded" />
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 px-6 bg-white border border-gray-200 shadow-sm rounded text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <i className="fa-solid fa-link-slash text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold font-montserrat text-gray-900 mb-2">Verbinding Mislukt</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                We konden je reserveringen niet ophalen. De server is tijdelijk onbereikbaar. Probeer het later opnieuw.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition"
              >
                <i className="fa-solid fa-rotate-right"></i> Probeer opnieuw
              </button>
            </div>
          )}

          {/* UNHAPPY */}
          {!loading && !error && reservations.length === 0 && (
            <div className="py-4">
              <p className="text-gray-600 text-sm mb-3">Je hebt nog geen reserveringen.</p>
              <Link to="/pakketten" className="text-sm font-semibold text-gray-900 underline underline-offset-2 hover:text-primary transition">
                Bekijk onze pakketten →
              </Link>
            </div>
          )}

          {/* HAPPY */}
          {!loading && !error && reservations.length > 0 && (
            <div className="space-y-4">
              {reservations.map((res) => {
                const statusCfg   = STATUS_CONFIG[res.status] || STATUS_CONFIG.VOORLOPIG;
                const lessonLabel = LESSON_LABELS[res.lesson] || res.lesson;
                const isOpen      = expanded === res.id;
                const isWijzig    = wijzigId === res.id;
                const bezig       = actiefId === res.id;
                const geannuleerd = res.status === 'GEANNULEERD';

                return (
                  <div key={res.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">

                    {/* Kaart header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${statusCfg.classes}`}>
                            {statusCfg.label}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            #{String(res.id).padStart(4, '0')}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-gray-900 font-montserrat">{lessonLabel}</h3>

                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <i className="fa-regular fa-calendar text-gray-400"></i>
                            {formatDate(res.bookingDate)}
                          </span>
                          {res.location && (
                            <span className="flex items-center gap-1.5">
                              <i className="fa-solid fa-location-dot text-gray-400"></i>
                              {res.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <i className="fa-solid fa-euro-sign text-gray-400"></i>
                            {res.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Actieknoppen */}
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <button
                          onClick={() => { setExpanded(isOpen ? null : res.id); setWijzigId(null); }}
                          className="border border-gray-300 text-gray-700 hover:border-black hover:text-black transition px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                        >
                          {isOpen ? 'Sluiten' : 'Details'}
                        </button>

                        {!geannuleerd && (
                          <button
                            onClick={() => isWijzig ? annuleerWijziging() : openWijzig(res.id, res.bookingDate)}
                            className="border border-gray-300 text-gray-700 hover:border-black hover:text-black transition px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                          >
                            {isWijzig ? 'Annuleer' : 'Wijzig datum'}
                          </button>
                        )}

                        {!geannuleerd && confirmId !== res.id && (
                          <button
                            onClick={() => setConfirmId(res.id)}
                            className="border border-red-300 text-red-600 hover:bg-red-50 transition px-4 py-2 text-xs font-semibold uppercase tracking-wider"
                          >
                            Annuleer les
                          </button>
                        )}

                        {!geannuleerd && confirmId === res.id && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Weet je het zeker?</span>
                            <button
                              disabled={bezig}
                              onClick={() => handleAnnuleer(res.id)}
                              className="bg-red-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition disabled:opacity-50"
                            >
                              {bezig ? '...' : 'Ja'}
                            </button>
                            <button
                              onClick={() => setConfirmId(null)}
                              className="border border-gray-300 text-gray-600 px-4 py-2 text-xs font-semibold uppercase tracking-wider hover:border-black transition"
                            >
                              Nee
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Datum wijzigen — inline kalender */}
                    {isWijzig && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Selecteer een nieuwe datum</p>
                        <div className="reservation-calendar">
                          <Calendar
                            onChange={setNieuweDatum}
                            value={nieuweDatum}
                            locale="nl-NL"
                            minDate={new Date()}
                            tileDisabled={({ date }) => date.getDay() === 1}
                          />
                        </div>
                        {nieuweDatum && (
                          <div className="mt-4 flex items-center gap-3">
                            <p className="text-sm text-gray-700">
                              Nieuwe datum: <span className="font-semibold">{formatDate(nieuweDatum)}</span>
                            </p>
                            <button
                              disabled={bezig}
                              onClick={() => bevestigWijziging(res.id)}
                              className="bg-black text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition disabled:opacity-50"
                            >
                              {bezig ? 'Opslaan...' : 'Bevestig'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Details uitklap */}
                    {isOpen && (
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-4 text-sm text-gray-700">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pakket</span>
                            <p className="font-medium mt-0.5">{lessonLabel}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Datum</span>
                            <p className="font-medium mt-0.5">{formatDate(res.bookingDate)}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Prijs</span>
                            <p className="font-medium mt-0.5">€ {res.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Status</span>
                            <p className="font-medium mt-0.5">{statusCfg.label}</p>
                          </div>
                          {res.location && (
                            <div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Locatie</span>
                              <p className="font-medium mt-0.5">{res.location}</p>
                            </div>
                          )}
                          {res.duoName && (
                            <div>
                              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Duo partner</span>
                              <p className="font-medium mt-0.5">{res.duoName}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Betaald</span>
                            <p className={`font-medium mt-0.5 flex items-center gap-1 ${res.hasPaid ? 'text-green-700' : 'text-red-600'}`}>
                              {res.hasPaid ? (
                                <>Ja <i className="fa-solid fa-check"></i></>
                              ) : (
                                'Nee, nog niet betaald'
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
