import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import packages from '../data/packages.json';

const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];



const Reservation = ({ user, globalError }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pkg = packages.find(p => p.id === parseInt(id));

  const [geselecteerdeDatum, setGeselecteerdeDatum] = useState(null);
  const [geselecteerdeTijd, setGeselecteerdeTijd] = useState(null);
  const [geselecteerdeSlot, setGeselecteerdeSlot] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const res = await fetch('/api/schedule', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setSchedules(data.schedules);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSchedules(false);
      }
    };
    fetchSchedules();
  }, []);

  const availableSlots = geselecteerdeDatum ? schedules.filter(s => {
    const sDate = new Date(s.date);
    return sDate.getFullYear() === geselecteerdeDatum.getFullYear() &&
           sDate.getMonth() === geselecteerdeDatum.getMonth() &&
           sDate.getDate() === geselecteerdeDatum.getDate();
  }) : [];
  
  const LOCATIES = [
    "Zandvoort",
    "Muiderberg",
    "IJmuiden",
    "Wijk aan Zee",
    "Scheveningen",
    "Hoek van Holland"
  ];
  
  const [geselecteerdeLocatie, setGeselecteerdeLocatie] = useState("");
  const [duoName, setDuoName] = useState("");
  const [duoAddress, setDuoAddress] = useState("");
  const [duoCity, setDuoCity] = useState("");
  const [duoPhone, setDuoPhone] = useState("");
  const [error, setError] = useState(globalError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isDuo = pkg.value !== 'PRIVE_LES';

  if (!pkg) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <p className="text-gray-600 font-medium">Pakket niet gevonden.</p>
      </div>
    );
  }

  const formatDatumKort = () => {
    if (!geselecteerdeDatum) return null;
    return `${DAGEN_LANG[geselecteerdeDatum.getDay()]}, ${geselecteerdeDatum.getDate()} ${MAANDEN[geselecteerdeDatum.getMonth()]}`;
  };

  const formatDatumLang = () => {
    if (!geselecteerdeDatum) return null;
    return `${DAGEN_LANG[geselecteerdeDatum.getDay()]}, ${geselecteerdeDatum.getDate()} ${MAANDEN[geselecteerdeDatum.getMonth()]} ${geselecteerdeDatum.getFullYear()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!geselecteerdeLocatie) {
      setError("Selecteer eerst een locatie.");
      return;
    }

    if (!geselecteerdeTijd) {
      setError("Selecteer eerst een tijdslot.");
      return;
    }

    if (isDuo) {
      if (!duoName.trim() || !duoAddress.trim() || !duoCity.trim() || !duoPhone.trim()) {
        setError("Vul alle gegevens van je duo-partner in.");
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch('/api/reservations', {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lesson: pkg.value,
          userId: user?.id,
          price: pkg.price,
          bookingDate: geselecteerdeDatum.toISOString(),
          bookingTime: geselecteerdeTijd,
          instructorId: geselecteerdeSlot?.instructorId,
          location: geselecteerdeLocatie,
          duoName: isDuo ? duoName.trim() : null,
          duoAddress: isDuo ? duoAddress.trim() : null,
          duoCity: isDuo ? duoCity.trim() : null,
          duoPhone: isDuo ? duoPhone.trim() : null,
        }),
      });
      if (res.ok) {
        setIsSuccess(true);
        window.scrollTo(0, 0);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || "Er is wat mis gegaan. De server is onbereikbaar.");
      }
    } catch (err) {
      setError("Er is wat mis gegaan. Kan geen verbinding maken met de server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-6 shadow-sm">
              <i className="fa-solid fa-envelope text-white text-3xl"></i>
            </div>
            <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-4 text-center">
              Aanvraag succesvol ontvangen!
            </h1>
            <p className="text-gray-600 text-center max-w-lg mb-8 text-lg">
              We hebben een bevestigingsmail gestuurd naar jouw e-mailadres. Klik op de link in deze mail om je reservering definitief te maken.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gray-900 text-white px-8 py-3 font-bold uppercase tracking-wider text-sm hover:bg-black transition"
            >
              Terug naar Home
            </button>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <h1 className="text-3xl font-bold font-montserrat text-gray-900">Selecteer Datum &amp; Tijd</h1>
            </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Links: Kalender + Tijdsloten */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Kalender via react-calendar */}
            <div className="bg-white border-2 border-gray-200 p-6 reservation-calendar">
              <Calendar
                onChange={(date) => { setGeselecteerdeDatum(date); setError(""); setGeselecteerdeTijd(null); }}
                value={geselecteerdeDatum}
                locale="nl-NL"
                minDate={new Date()}
                next2Label={null}
                prev2Label={null}
                tileDisabled={({ date }) => {
                  return !schedules.some(s => {
                    const sDate = new Date(s.date);
                    return sDate.getFullYear() === date.getFullYear() &&
                           sDate.getMonth() === date.getMonth() &&
                           sDate.getDate() === date.getDate();
                  });
                }}
              />
            </div>

            {/* Locatie Dropdown */}
            <div className="bg-white border-2 border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-gray-900">Kies een Locatie</span>
                <i className="fa-solid fa-location-dot text-gray-400"></i>
              </div>
              <div className="relative">
                <select 
                  className="w-full appearance-none border-2 border-gray-200 p-3 bg-gray-50 text-gray-900 font-bold focus:border-black focus:bg-white focus:outline-none transition cursor-pointer hover:border-gray-300"
                  value={geselecteerdeLocatie}
                  onChange={(e) => { setGeselecteerdeLocatie(e.target.value); setError(""); }}
                >
                  <option value="" disabled className="font-normal text-gray-500">Selecteer een locatie...</option>
                  {LOCATIES.map((loc, idx) => (
                    <option key={idx} value={loc} className="font-bold">{loc}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                  <i className="fa-solid fa-chevron-down text-sm"></i>
                </div>
              </div>
            </div>

            {/* Gegevens Duo-partner */}
            {isDuo && (
              <div className="bg-white border-2 border-gray-200 p-6 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <span className="font-bold text-gray-900">Gegevens Duo-partner</span>
                  <i className="fa-solid fa-users text-gray-400"></i>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Naam</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 p-3 bg-gray-50 focus:border-black focus:bg-white focus:outline-none transition font-medium text-sm"
                      placeholder="Naam duo-partner"
                      value={duoName}
                      onChange={(e) => setDuoName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Telefoonnummer (Mobiel)</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 p-3 bg-gray-50 focus:border-black focus:bg-white focus:outline-none transition font-medium text-sm"
                      placeholder="Telefoonnummer"
                      value={duoPhone}
                      onChange={(e) => setDuoPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Adres</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 p-3 bg-gray-50 focus:border-black focus:bg-white focus:outline-none transition font-medium text-sm"
                      placeholder="Straat en huisnummer"
                      value={duoAddress}
                      onChange={(e) => setDuoAddress(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Woonplaats</label>
                    <input
                      type="text"
                      className="w-full border-2 border-gray-200 p-3 bg-gray-50 focus:border-black focus:bg-white focus:outline-none transition font-medium text-sm"
                      placeholder="Woonplaats"
                      value={duoCity}
                      onChange={(e) => setDuoCity(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {geselecteerdeDatum && (
              <div className="bg-white border-2 border-gray-200 p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="font-bold text-gray-900">{formatDatumKort()}</span>
                  <i className="fa-regular fa-sun text-gray-400"></i>
                </div>
                {loadingSchedules ? (
                  <p className="text-sm text-gray-500">Laden...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-red-500 font-medium">Op deze dag zijn geen lessen ingepland door de eigenaar.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {availableSlots.map((slot) => {
                      let isVol = false;
                      if (slot.hasPrive) {
                        isVol = true; // Als er een privéles in dit slot zit, is het helemaal vol
                      } else if (slot.bookedCount >= slot.maxPersons) {
                        isVol = true; // Maximale capaciteit bereikt
                      } else if (!isDuo && slot.bookedCount > 0) {
                        isVol = true; // Wil een privéles boeken, maar er zit al iemand in de groep
                      } else if (isDuo && (slot.maxPersons - slot.bookedCount < 2)) {
                        isVol = true; // Wil een duoles (2 personen) boeken, maar er is maar 1 plek over
                      }

                      const isSel = geselecteerdeTijd === slot.time;
                      return (
                        <button
                          key={slot.id}
                          disabled={isVol}
                          onClick={() => {
                            if (!isVol) {
                              setGeselecteerdeTijd(slot.time);
                              setGeselecteerdeSlot(slot);
                              setError("");
                            }
                          }}
                          className={`flex items-center justify-between px-4 py-3 border-2 transition text-sm font-medium w-full
                            ${isVol ? 'border-gray-100 text-gray-300 cursor-default' : ''}
                            ${isSel ? 'bg-gray-900 border-gray-900 text-white' : ''}
                            ${!isVol && !isSel ? 'border-gray-200 text-gray-700 hover:border-gray-400' : ''}
                          `}
                        >
                          <div className="flex flex-col items-start">
                            <span>{slot.time}</span>
                            <span className="text-xs text-gray-500 font-normal mt-0.5">
                              Instructeur: {slot.instructor?.name || 'Onbekend'}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold border px-2 py-0.5 uppercase tracking-wider
                            ${isSel ? 'border-gray-600 text-gray-400' : ''}
                            ${isVol ? 'border-gray-200 text-gray-300' : ''}
                            ${!isVol && !isSel ? 'border-gray-300 text-green-600 bg-green-50' : ''}
                          `}>
                            {isVol ? 'Volgeboekt' : isSel ? 'Geselecteerd' : `Beschikbaar`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rechts: Reserveringsoverzicht */}
          <div className="lg:w-72 w-full">
            <div className="bg-white border-2 border-gray-200 p-6 flex flex-col gap-5">
              <h2 className="text-lg font-bold font-montserrat text-gray-900">Reserveringsoverzicht</h2>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Les</p>
                <p className="font-bold text-gray-900">{pkg.name}</p>
                <p className="text-sm text-gray-500">{pkg.priceSuffix}</p>
              </div>

              {geselecteerdeDatum && geselecteerdeTijd && geselecteerdeLocatie && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Datum, Tijd &amp; Locatie</p>
                  <p className="font-bold text-gray-900 text-sm">{formatDatumLang()}</p>
                  <p className="text-sm text-gray-500">{geselecteerdeTijd}</p>
                  <p className="text-sm text-gray-500 mt-1"><i className="fa-solid fa-location-dot mr-1"></i>{geselecteerdeLocatie}</p>
                  {geselecteerdeSlot && (
                    <p className="text-sm text-gray-500 mt-1"><i className="fa-solid fa-user mr-1"></i>{geselecteerdeSlot.instructor?.name || 'Instructeur'}</p>
                  )}
                </div>
              )}

              <div className="border-t-2 border-gray-100 pt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">Totaal</span>
                <span className="text-xl font-bold font-montserrat text-gray-900">€{pkg.price}</span>
              </div>
              {error && (
                <div className="text-red-500 text-xs font-bold border border-red-200 bg-red-50 p-3 rounded">
                  <i className="fa-solid fa-circle-exclamation mr-2"></i>
                  {error}
                </div>
              )}
              <form action="" method="post" onSubmit={handleSubmit}>
              <button
                disabled={!geselecteerdeDatum || !geselecteerdeTijd || !geselecteerdeLocatie || isSubmitting}
                className="w-full bg-gray-900 text-white py-3 font-bold uppercase tracking-wide text-sm hover:bg-black transition disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Bezig met reserveren..." : "Volgende Stap"}
              </button>
              </form>
              <button
                onClick={() => navigate(-1)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 font-bold uppercase tracking-wide text-sm hover:bg-gray-50 transition"
              >
                Terug
              </button>
            </div>
          </div>

        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Reservation;