import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

const Success = () => {
  const location = useLocation();
  const booking = location.state || {};

  const formatDatumLang = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${DAGEN_LANG[date.getDay()]}, ${date.getDate()} ${MAANDEN[date.getMonth()]} ${date.getFullYear()}`;
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center py-16 px-6">
      <div className="max-w-2xl w-full flex flex-col items-center">
        {/* Succes Icoon */}
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 shadow-sm">
          <i className="fa-solid fa-check text-white text-2xl"></i>
        </div>

        {/* Status melding */}
        <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-3 text-center">
          Reservering Geslaagd
        </h1>
        <p className="text-gray-600 text-center max-w-md mb-8">
          Je kitesurfles is bevestigd. Een gedetailleerde bon is naar je e-mail verzonden.
        </p>

        {/* Reserveringskaart */}
        <div className="bg-white border-2 border-gray-200 p-8 w-full max-w-xl mb-10 shadow-sm">
          <h2 className="text-lg font-bold font-montserrat text-gray-900 border-b border-gray-100 pb-4 mb-6">
            Reserveringsoverzicht
          </h2>

          <div className="space-y-6">
            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">LES TYPE</span>
              <span className="font-bold text-gray-900 text-right">{booking.lessonName || 'Kitesurfles'}</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">LOCATIE</span>
              <span className="font-medium text-gray-700 text-right">Noordzee Strand, Sector B</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">DATUM</span>
              <span className="font-medium text-gray-700 text-right">{formatDatumLang(booking.date)}</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">TIJD</span>
              <span className="font-medium text-gray-700 text-right">{booking.time || '09:00 - 11:30'}</span>
            </div>

            <div className="border-t border-gray-100 pt-6 flex justify-between items-center">
              <span className="font-bold text-gray-900">Totaal betaald</span>
              <span className="text-2xl font-bold font-montserrat text-gray-900">
                €{booking.price ? parseFloat(booking.price).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center">
          <Link
            to="/"
            className="text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-black hover:underline transition text-center px-4 py-2"
          >
            Terug naar home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Success;
