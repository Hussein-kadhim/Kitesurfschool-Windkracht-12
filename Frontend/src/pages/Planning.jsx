import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const TIJDSLOTEN = [
  { tijd: '09:00 – 11:30', plekken: 4 },
  { tijd: '12:30 – 15:00', plekken: 4 },
  { tijd: '15:30 – 18:00', plekken: 2 },
];

const isBeschikbaar = (datum) => {
  const dag = datum.getDay(); // 0=zo, 1=ma
  const vandaag = new Date();
  vandaag.setHours(0, 0, 0, 0);
  return dag !== 1 && datum >= vandaag; // maandag gesloten
};

const formatDatumLang = (datum) =>
  datum.toLocaleDateString('nl-NL', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

const Planning = () => {
  const navigate = useNavigate();
  const [geselecteerdeDatum, setGeselecteerdeDatum] = useState(null);

  const handleDagKlik = (datum) => {
    if (isBeschikbaar(datum)) {
      setGeselecteerdeDatum(datum);
    }
  };

  return (
    <div className="min-h-screen bg-cream py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-montserrat text-gray-900">Planning</h1>
          <p className="text-gray-500 text-sm mt-1">
            Bekijk beschikbare lesdagen en reserveer direct jouw kitesurfles.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          {/* Kalender via react-calendar */}
          <div className="flex-1 bg-white border border-gray-200 shadow-sm p-6 reservation-calendar">
            <Calendar
              onChange={handleDagKlik}
              value={geselecteerdeDatum}
              locale="nl-NL"
              minDate={new Date()}
              tileDisabled={({ date }) => date.getDay() === 1}
              tileClassName={({ date }) => {
                if (date.getDay() === 1) return 'text-gray-300 cursor-not-allowed';
                return null;
              }}
            />

            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-gray-200 inline-block rounded-sm"></span>
                Niet beschikbaar (maandag)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-black inline-block rounded-sm"></span>
                Geselecteerde dag
              </span>
            </div>
          </div>

          {/* Tijdsloten paneel */}
          <div className="lg:w-72">
            {!geselecteerdeDatum ? (
              <div className="bg-white border border-gray-200 shadow-sm p-6 h-full flex items-center justify-center min-h-[200px]">
                <p className="text-gray-400 text-sm text-center">
                  Selecteer een dag in de kalender om beschikbare tijdsloten te zien.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 shadow-sm p-6 space-y-4">
                <div>
                  <h3 className="text-base font-bold text-gray-900 font-montserrat mb-0.5">
                    Beschikbare tijden
                  </h3>
                  <p className="text-xs text-gray-500 capitalize">
                    {formatDatumLang(geselecteerdeDatum)}
                  </p>
                </div>

                <div className="space-y-2">
                  {TIJDSLOTEN.map((slot) => (
                    <div
                      key={slot.tijd}
                      className="flex items-center justify-between border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{slot.tijd}</p>
                        <p className="text-xs text-gray-400">{slot.plekken} plekken beschikbaar</p>
                      </div>
                      <i className="fa-regular fa-circle-check text-green-500 text-lg"></i>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/pakketten')}
                  className="w-full bg-black text-white py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition"
                >
                  Reserveer een les
                </button>

                <p className="text-xs text-gray-400 text-center">
                  Na het kiezen van een pakket selecteer je de exacte datum en tijd.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Planning;
