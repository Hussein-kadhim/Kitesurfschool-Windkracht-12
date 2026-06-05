import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import packages from '../data/packages.json';

const MAANDEN = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
                 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

const TIJDSLOTEN = [
  { tijd: '09:00 - 11:30', status: 'beschikbaar' },
  { tijd: '12:30 - 15:00', status: 'beschikbaar' },
  { tijd: '15:30 - 18:00', status: 'beperkt', plekken: 2 },
  { tijd: '18:30 - 21:00', status: 'volgeboekt' },
];

const Reservation = ({ user, globalError }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const pkg = packages.find(p => p.id === parseInt(id));

  const [geselecteerdeDatum, setGeselecteerdeDatum] = useState(new Date());
  const [geselecteerdeTijd, setGeselecteerdeTijd] = useState(null);
  const [error, setError] = useState(globalError || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (!geselecteerdeTijd) {
      setError("Selecteer eerst een tijdslot.");
      return;
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
        }),
      });
      if (res.ok) {
        navigate('/success', {
          state: {
            lessonName: pkg.name,
            date: geselecteerdeDatum.toISOString(),
            time: geselecteerdeTijd,
            price: pkg.price
          }
        });
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

        <div className="mb-10">
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Selecteer Datum &amp; Tijd</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Links: Kalender + Tijdsloten */}
          <div className="flex-1 flex flex-col gap-6">

            {/* Kalender via react-calendar */}
            <div className={`bg-white border-2 border-gray-200 p-6 reservation-calendar ${error ? 'pointer-events-none opacity-50' : ''}`}>
              <Calendar
                onChange={setGeselecteerdeDatum}
                value={geselecteerdeDatum}
                locale="nl-NL"
                minDate={new Date()}
                next2Label={null}
                prev2Label={null}
              />
            </div>

            {/* Tijdsloten */}
            {geselecteerdeDatum && (
              <div className={`bg-white border-2 border-gray-200 p-6 ${error ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="flex items-center justify-between mb-5">
                  <span className="font-bold text-gray-900">{formatDatumKort()}</span>
                  <i className="fa-regular fa-sun text-gray-400"></i>
                </div>
                <div className="flex flex-col gap-3">
                  {TIJDSLOTEN.map((slot, i) => {
                    const isVol = slot.status === 'volgeboekt' || !!error;
                    const isSel = geselecteerdeTijd === slot.tijd;
                    return (
                      <button
                        key={i}
                        disabled={isVol}
                        onClick={() => !isVol && setGeselecteerdeTijd(slot.tijd)}
                        className={`flex items-center justify-between px-4 py-3 border-2 transition text-sm font-medium w-full
                          ${isVol ? 'border-gray-100 text-gray-300 cursor-default' : ''}
                          ${isSel ? 'bg-gray-900 border-gray-900 text-white' : ''}
                          ${!isVol && !isSel ? 'border-gray-200 text-gray-700 hover:border-gray-400' : ''}
                        `}
                      >
                        <span>{slot.tijd}</span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 uppercase tracking-wider
                          ${isSel ? 'border-gray-600 text-gray-400' : ''}
                          ${isVol ? 'border-gray-200 text-gray-300' : ''}
                          ${!isVol && !isSel ? 'border-gray-300 text-gray-500' : ''}
                        `}>
                          {isVol
                            ? 'Volgeboekt'
                            : isSel
                            ? 'Geselecteerd'
                            : slot.plekken
                            ? `${slot.plekken} Plekken Vrij`
                            : 'Beschikbaar'}
                        </span>
                      </button>
                    );
                  })}
                </div>
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

              {geselecteerdeDatum && geselecteerdeTijd && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Datum &amp; Tijd</p>
                  <p className="font-bold text-gray-900 text-sm">{formatDatumLang()}</p>
                  <p className="text-sm text-gray-500">{geselecteerdeTijd}</p>
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
                disabled={!geselecteerdeDatum || !geselecteerdeTijd || isSubmitting || !!error}
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
      </div>
    </div>
  );
};

export default Reservation;