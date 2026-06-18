import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';

const MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni',
                 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
const DAGEN_LANG = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

const LESSON_LABELS = {
  PRIVE_LES: 'Privéles',
  LOSSE_DUO_LES: 'Losse Duo Kiteles',
  DUO_PAKKET_3: 'Duo Lespakket 3 Lessen',
  DUO_PAKKET_5: 'Duo Lespakket 5 Lessen',
};

const Success = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        if (!id) {
          setError("Geen reserverings-ID gevonden.");
          setLoading(false);
          return;
        }

        // Haal de reservering op
        const getRes = await axios.get(`/api/reservations/${id}`);
        const reservationData = getRes.data;

        // Als hij nog niet betaald is, zet op betaald
        if (!reservationData.hasPaid) {
          await axios.put(`/api/reservations/${id}`, { hasPaid: true });
          reservationData.hasPaid = true;
        }

        setBooking(reservationData);
      } catch (err) {
        setError("Kan de reservering niet ophalen of verwerken. Ben je wel ingelogd?");
      } finally {
        setLoading(false);
      }
    };

    processConfirmation();
  }, [id]);

  const formatDatumLang = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${DAGEN_LANG[date.getDay()]}, ${date.getDate()} ${MAANDEN[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center py-16 px-6">
        <p className="text-gray-600 font-bold font-montserrat">Reservering bevestigen en ophalen...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center py-16 px-6">
        <div className="bg-white p-8 border border-red-200 text-center max-w-md w-full shadow-sm">
          <i className="fa-solid fa-circle-exclamation text-red-500 text-4xl mb-4"></i>
          <h2 className="text-xl font-bold font-montserrat mb-2">Fout opgetreden</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link to="/" className="bg-black text-white px-6 py-2 font-bold uppercase tracking-wider text-sm hover:bg-gray-800 transition w-full inline-block">
            Terug naar home
          </Link>
        </div>
      </div>
    );
  }

  const lesNaam = LESSON_LABELS[booking.lesson] || booking.lesson;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center py-16 px-6">
      <div className="max-w-2xl w-full flex flex-col items-center">
        {/* Succes Icoon */}
        <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 shadow-sm">
          <i className="fa-solid fa-check text-white text-2xl"></i>
        </div>

        {/* Status melding */}
        <h1 className="text-3xl font-bold font-montserrat text-gray-900 mb-3 text-center">
          Reservering & Betaling Geslaagd
        </h1>
        <p className="text-gray-600 text-center max-w-md mb-8">
          Je kitesurfles is definitief bevestigd en betaald. Een gedetailleerde bon is naar je e-mail verzonden.
        </p>

        {/* Reserveringskaart */}
        <div className="bg-white border-2 border-gray-200 p-8 w-full max-w-xl mb-10 shadow-sm">
          <h2 className="text-lg font-bold font-montserrat text-gray-900 border-b border-gray-100 pb-4 mb-6">
            Reserveringsoverzicht
          </h2>

          <div className="space-y-6">
            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">LES TYPE</span>
              <span className="font-bold text-gray-900 text-right">{lesNaam}</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">LOCATIE</span>
              <span className="font-medium text-gray-700 text-right">Noordzee Strand, Sector B</span>
            </div>

            <div className="flex justify-between items-start text-sm">
              <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">DATUM</span>
              <span className="font-medium text-gray-700 text-right">{formatDatumLang(booking.bookingDate)}</span>
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
