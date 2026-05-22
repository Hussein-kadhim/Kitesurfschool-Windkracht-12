import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Packages = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await axios.get('/api/packages');
        setPackages(res.data);
        setError(false);
      } catch (err) {
        console.error("Fout bij laden van pakketten:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-neutral flex justify-center items-center">Laden...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral flex flex-col items-center justify-center p-6">
        <div className="bg-white border-t-4 border-red-500 shadow-sm p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-bold font-montserrat text-gray-900 mb-4">Fout bij laden</h2>
          <p className="text-gray-600 mb-6">Geen pakketten gevonden.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary hover:opacity-90 text-white px-6 py-2 font-bold uppercase tracking-wide transition text-sm"
          >
            Verversen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral pb-24">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-12 border-l-4 border-gray-900 pl-4">
          <h1 className="text-4xl font-bold font-montserrat text-gray-900 mb-4">Onze Lespakketten</h1>
          <p className="text-gray-600 max-w-2xl">
            Kies het pakket dat bij jou past. Van individuele begeleiding tot intensieve meerdaagse cursussen. 
            Wij bieden flexibele opties voor elk niveau.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`border-2 p-8 flex flex-col relative ${
                pkg.is_popular 
                  ? 'bg-black border-black text-white' 
                  : 'bg-white border-gray-200'
              }`}
            >
              {pkg.is_popular && (
                <div className="absolute top-0 right-0 bg-white text-black w-10 h-10 flex items-center justify-center border-l-2 border-b-2 border-black">
                  <i className="fa-solid fa-star"></i>
                </div>
              )}
              
              <div className={`flex justify-between items-end border-b-2 pb-4 mb-6 ${pkg.is_popular ? 'border-gray-800' : 'border-gray-200'}`}>
                <h2 className="text-2xl font-bold font-montserrat">{pkg.name}</h2>
                <div className="text-right">
                  <span className="text-2xl font-bold font-montserrat">€{pkg.price}</span>
                  {pkg.price_suffix && (
                    <span className={`text-sm ml-1 ${pkg.is_popular ? 'text-gray-400' : 'text-gray-500'}`}>
                      {pkg.price_suffix}
                    </span>
                  )}
                </div>
              </div>

              <p className={`mb-8 flex-grow ${pkg.is_popular ? 'text-gray-300' : 'text-gray-600'}`}>
                {pkg.description}
              </p>

              <ul className="space-y-3 mb-8">
                {pkg.features && pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <i className="fa-solid fa-check mt-1 mr-3 text-sm"></i>
                    <span className={`text-sm ${pkg.is_popular ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 font-bold uppercase tracking-wide text-sm transition border-2 ${
                  pkg.is_popular 
                    ? 'bg-white text-black border-white hover:bg-gray-100' 
                    : 'bg-transparent text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                Bekijk Details
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Packages;
