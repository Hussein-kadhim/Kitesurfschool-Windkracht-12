import React from 'react';
import { Link } from 'react-router-dom';
import packages from '../data/packages.json';

const Packages = () => {
  return (
    <div className="min-h-screen bg-cream pb-24">
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
                pkg.isPopular
                  ? 'bg-black border-black text-white'
                  : 'bg-white border-gray-200'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute top-0 right-0 bg-white text-black w-10 h-10 flex items-center justify-center border-l-2 border-b-2 border-black">
                  <i className="fa-solid fa-star"></i>
                </div>
              )}

              <div className={`flex justify-between items-end border-b-2 pb-4 mb-6 ${pkg.isPopular ? 'border-gray-800' : 'border-gray-200'}`}>
                <h2 className="text-2xl font-bold font-montserrat">{pkg.name}</h2>
                <div className="text-right">
                  <span className="text-2xl font-bold font-montserrat">€{pkg.price}</span>
                  {pkg.priceSuffix && (
                    <span className={`text-sm ml-1 ${pkg.isPopular ? 'text-gray-400' : 'text-gray-500'}`}>
                      {pkg.priceSuffix}
                    </span>
                  )}
                </div>
              </div>

              <p className={`mb-8 flex-grow ${pkg.isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                {pkg.description}
              </p>

              <ul className="space-y-3 mb-8">
                {pkg.features && pkg.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <i className="fa-solid fa-check mt-1 mr-3 text-sm"></i>
                    <span className={`text-sm ${pkg.isPopular ? 'text-gray-300' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to={`/reservering/${pkg.id}`}
                className={`w-full block text-center py-3 font-bold uppercase tracking-wide text-sm transition border-2 ${
                  pkg.isPopular
                    ? 'bg-white text-black border-white hover:bg-gray-100'
                    : 'bg-transparent text-gray-900 border-gray-900 hover:bg-gray-50'
                }`}
              >
                Bestel Nu
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Packages;
