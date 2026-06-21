import React from 'react';
import { Link } from 'react-router-dom';

const LOCATIES = [
  { naam: "Zandvoort", beschrijving: "Perfect voor alle niveaus met brede stranden en een gezellige sfeer.", image: "/images/locaties/zandvoort.jpg" },
  { naam: "Muiderberg", beschrijving: "Rustiger binnenwater spot aan het IJmeer, ideaal voor beginners door vlak water en stabiele wind.", image: "/images/locaties/muiderberg.jpg" },
  { naam: "IJmuiden", beschrijving: "Ideaal voor de meer ervaren kitesurfers met een robuuste kustlijn.", image: "/images/locaties/ijmuiden.jpg" },
  { naam: "Wijk aan Zee", beschrijving: "Een van de beste spots in Nederland met geweldige golven en wind.", image: "/images/locaties/wijk-aan-zee.jpg" },
  { naam: "Scheveningen", beschrijving: "Druk, gezellig en ideaal om na het kitesurfen te genieten op het terras.", image: "/images/locaties/scheveningen.jpeg" },
  { naam: "Hoek van Holland", beschrijving: "Ruim strand en vaak betrouwbare windcondities voor een top sessie.", image: "/images/locaties/hoek-van-holland.jpeg" }
];

const Locations = () => {
  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h1 className="text-4xl font-black font-montserrat text-gray-900 mb-4 uppercase tracking-tight">
            Onze <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Locaties</span>
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Wij geven les op de beste kitesurfspots van Nederland. Of je nu beginner bent en vlak water zoekt, of ervaren bent en de golven in wilt: wij hebben de perfecte locatie voor jouw les!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {LOCATIES.map((loc, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-200 transition duration-300 group flex flex-col overflow-hidden shadow-sm">
              <div className="w-full h-48 overflow-hidden relative bg-gray-100 flex items-center justify-center">
                <img 
                  src={loc.image} 
                  alt={loc.naam} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 text-center flex flex-col items-center flex-1">
                <h3 className="text-xl font-bold font-montserrat text-gray-900 mb-3 uppercase tracking-wide">
                  {loc.naam}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {loc.beschrijving}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link to="/pakketten" className="inline-block bg-black text-white font-bold uppercase tracking-wider px-8 py-4 hover:bg-gray-800 transition">
            Boek nu je les op één van deze locaties
          </Link>
        </div>
        
      </div>
    </div>
  );
};

export default Locations;
