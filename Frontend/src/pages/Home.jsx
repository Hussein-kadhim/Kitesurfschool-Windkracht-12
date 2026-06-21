import React from 'react';
import { Link } from 'react-router-dom';
import packages from '../data/packages.json';

const Home = ({ user, error }) => {
  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-6">
        <div className="bg-white border-t-4 border-red-500 shadow-lg p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-server text-red-500 text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold font-montserrat text-gray-900 mb-2">Fout bij laden</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-3 font-bold uppercase tracking-wide transition"
          >
            Opnieuw proberen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-16">
      {/* Messages */}
      {user && <p className='text-primary text-center py-2 bg-blue-100 font-bold'>Welkom terug, {user.name}!</p>}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-20 flex flex-col-reverse md:flex-row items-center gap-12">
        <div className="w-full md:w-1/2 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-montserrat font-bold text-gray-900 leading-tight mb-6">
            Ontdek de Vrijheid van Kitesurfen in Nederland
          </h1>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            Leer de wind te bedwingen met professionele instructeurs op de beste locaties van het land. Veilig, leuk en puur opwindend.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/pakketten" className="bg-black text-white text-center font-bold px-8 py-3 uppercase tracking-wider hover:bg-gray-800 transition border-2 border-black">
              Boek een Les
            </Link>
            <Link to="/locaties" className="bg-transparent text-gray-900 text-center font-bold px-8 py-3 uppercase tracking-wider border-2 border-gray-900 hover:bg-gray-100 transition">
              Onze Locaties
            </Link>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-[400px] border-2 border-gray-300 relative overflow-hidden">
             <img src="/images/hero.png" alt="Kitesurfer in actie" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-tr from-gray-900/10 to-transparent"></div>
        </div>
      </section>

      {/* About Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="bg-white border-2 border-gray-200 flex flex-col md:flex-row shadow-sm">
          <div className="w-full md:w-1/2 min-h-[350px] bg-gray-200 border-b-2 md:border-b-0 md:border-r-2 border-gray-200 overflow-hidden">
             <img src="/images/instructor.png" alt="Kitesurf instructeur" className="w-full h-full object-cover" />
          </div>
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
            <h2 className="text-3xl font-montserrat font-bold text-gray-900 mb-6">Over Windkracht-12</h2>
            <div className="w-full h-px bg-gray-300 mb-6"></div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-center text-gray-700 font-medium">
                <i className="fa-solid fa-clock-rotate-left text-gray-900 text-xl w-8"></i>
                8 Jaar Ervaring
              </li>
              <li className="flex items-center text-gray-700 font-medium">
                <i className="fa-solid fa-user-group text-gray-900 text-xl w-8"></i>
                5 Gecertificeerde Instructeurs
              </li>
              <li className="flex items-center text-gray-700 font-medium">
                <i className="fa-solid fa-shield-halved text-gray-900 text-xl w-8"></i>
                Focus op veiligheid en progressie
              </li>
            </ul>

            <p className="text-gray-600 leading-relaxed">
              Wij richten ons op veiligheid, progressie en het maximaliseren van jouw tijd op het water. Ons team is toegewijd om jou onafhankelijk en met vertrouwen te laten varen.
            </p>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-montserrat font-bold text-gray-900 mb-6">Onze Pakketten</h2>
        <div className="w-full h-px bg-gray-300 mb-10"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`bg-white p-6 flex flex-col justify-between hover:shadow-lg transition relative ${
                pkg.isPopular
                  ? 'border-2 border-gray-900 shadow-md'
                  : 'border-2 border-gray-200'
              }`}
            >
              {pkg.isPopular && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider">
                  Meest Gekozen
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold font-montserrat mb-6">{pkg.name}</h3>
                <ul className="space-y-2 text-sm text-gray-700 font-medium mb-8">
                  <li className="flex justify-between border-b border-gray-100 pb-2">
                    <span>Prijs:</span>
                    <span>€{pkg.price} {pkg.priceSuffix}</span>
                  </li>
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <i className="fa-solid fa-check text-gray-500 text-xs"></i>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <Link
                to={`/reservering/${pkg.id}`}
                className={`w-full block text-center font-bold py-2 uppercase text-sm transition border-2 ${
                  pkg.isPopular
                    ? 'bg-black text-white border-black hover:bg-gray-800'
                    : 'bg-transparent border-gray-900 hover:bg-gray-100'
                }`}
              >
                Kies
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-montserrat font-bold text-gray-900 mb-12 text-center">Hoe Het Werkt</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white border-2 border-gray-200 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 border-2 border-gray-900 flex items-center justify-center text-2xl mb-6">
              <i className="fa-regular fa-user"></i>
            </div>
            <h3 className="text-xl font-bold font-montserrat mb-4">1. Registreer</h3>
            <p className="text-gray-600 text-sm">Maak een account aan om je voortgang bij te houden en boekingen te beheren.</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white border-2 border-gray-200 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 border-2 border-gray-900 flex items-center justify-center text-2xl mb-6">
              <i className="fa-regular fa-calendar-check"></i>
            </div>
            <h3 className="text-xl font-bold font-montserrat mb-4">2. Boek</h3>
            <p className="text-gray-600 text-sm">Selecteer je gewenste pakket, datum en locatie in onze planning.</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white border-2 border-gray-200 p-8 flex flex-col items-center text-center">
            <div className="w-16 h-16 border-2 border-gray-900 flex items-center justify-center text-2xl mb-6">
              <i className="fa-solid fa-water"></i>
            </div>
            <h3 className="text-xl font-bold font-montserrat mb-4">3. Ride</h3>
            <p className="text-gray-600 text-sm">Kom naar de plek, trek je gear aan en ga met ons het water op.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;