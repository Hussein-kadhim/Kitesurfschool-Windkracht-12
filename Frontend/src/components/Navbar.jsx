import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

const Navbar = ({user, setUser}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getLinkClass = (path) => {
    return location.pathname === path 
      ? 'text-gray-900 font-bold border-b-2 border-gray-900' 
      : 'hover:text-primary';
  };
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [adminDropdown, setAdminDropdown] = useState(false);
  const [instructeurDropdown, setInstructeurDropdown] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);
  const [mobileInstructeurOpen, setMobileInstructeurOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error("Backend logout failed, but we will clear local session anyway:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsMenuOpen(false);
      setLogoutError(""); 
      navigate('/login');
    }
  };

  React.useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Click outside handling for dropdowns
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.admin-dropdown-container')) {
        setAdminDropdown(false);
      }
      if (!event.target.closest('.instructeur-dropdown-container')) {
        setInstructeurDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {logoutError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg text-center max-w-md text-black">
            <h2 className="text-xl font-bold text-red-600 mb-4">Fout bij uitloggen</h2>
            <p className="mb-6">{logoutError}</p>
            <button 
              className="bg-primary text-white px-4 py-2 rounded hover:opacity-90"
              onClick={() => setLogoutError("")}
            >
              Begrepen
            </button>
          </div>
        </div>
      )}
      <nav className='bg-white border-b border-gray-200 py-4 px-6 lg:px-12 flex justify-between lg:grid lg:grid-cols-3 items-center relative z-40 text-sm'>
        {/* Left: Logo */}
        <div className='flex items-center'>
          <Link to="/" className='flex items-center font-montserrat font-bold text-lg text-gray-900'>
             <i className="fa-solid fa-water text-primary text-2xl mr-2"></i>
             Windkracht-12
          </Link>
        </div>

        {/* Center: Navigation Links (Desktop) */}
        <div className='hidden lg:flex justify-center space-x-6 text-gray-600 font-medium'>
            <Link to="/" className={getLinkClass('/')}>Home</Link>
            <Link to="/locaties" className={getLinkClass('/locaties')}>Locaties</Link>
            <Link to="/pakketten" className={getLinkClass('/pakketten')}>Pakketten</Link>
            {user?.role === 'eigenaar' && (
              <div className="relative admin-dropdown-container">
                <button
                  className={`hover:text-primary flex items-center ${adminDropdown ? 'text-gray-900 font-bold' : ''}`}
                  onClick={() => {
                    setAdminDropdown(!adminDropdown);
                    setInstructeurDropdown(false);
                  }}
                >
                  Admin <i className={`fa-solid fa-chevron-down ml-1 text-[10px] transition-transform ${adminDropdown ? 'rotate-180' : ''}`}></i>
                </button>
                {adminDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 shadow-lg py-2 z-50">
                    <Link to="/admin/users" onClick={() => setAdminDropdown(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">Gebruikersbeheer</Link>
                    <Link to="/dashboard" onClick={() => setAdminDropdown(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">Alle Reserveringen</Link>
                    <Link to="/admin/lessons" onClick={() => setAdminDropdown(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">Agenda & Rooster</Link>
                  </div>
                )}
              </div>
            )}
            {(user?.role === 'eigenaar' || user?.role === 'instructeur') && (
              <div className="relative instructeur-dropdown-container">
                <button
                  className={`hover:text-primary flex items-center ${instructeurDropdown ? 'text-gray-900 font-bold' : ''}`}
                  onClick={() => {
                    setInstructeurDropdown(!instructeurDropdown);
                    setAdminDropdown(false);
                  }}
                >
                  Instructeur <i className={`fa-solid fa-chevron-down ml-1 text-[10px] transition-transform ${instructeurDropdown ? 'rotate-180' : ''}`}></i>
                </button>
                {instructeurDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-52 bg-white border border-gray-200 shadow-lg py-2 z-50">
                    <Link to="/admin/lessons" onClick={() => setInstructeurDropdown(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">Mijn Rooster</Link>
                    <Link to="/admin/users" state={{ view: 'instructeur' }} onClick={() => setInstructeurDropdown(false)} className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition">Mijn Klanten</Link>
                  </div>
                )}
              </div>
            )}
        </div>
        
        {/* Right: Authentication, Profile & Hamburger */}
        <div className='flex items-center justify-end space-x-4 lg:space-x-6 text-gray-600 font-medium'>
          {user ? (
            <>
              {/* Toon wie is ingelogd en rol (Eis uit de PDF) */}
              <div className="hidden lg:flex flex-col text-right mr-2 border-r border-gray-200 pr-4">
                <span className="text-[11px] font-bold text-gray-900">{user.email}</span>
                <span className="text-[9px] uppercase tracking-wider text-gray-500">Rol: {user.role}</span>
              </div>

              {user.role === 'klant' && (
                <Link to="/dashboard" className='hidden lg:block hover:text-primary'>Dashboard</Link>
              )}
              <Link to="/profile" className='hidden lg:block hover:text-primary'>Profiel</Link>
              
              {/* Uitloggen is zichtbaar buiten het hamburger menu, alleen op desktop */}
              <button className='hidden lg:block bg-black text-white px-3 py-2 lg:px-4 text-[10px] lg:text-xs font-bold uppercase tracking-wide hover:bg-gray-800 transition' onClick={handleLogout}>
                Uitloggen
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className='hidden lg:block hover:text-primary'>Login</Link>
              <Link to="/register" className='hidden lg:block bg-primary text-white px-4 py-2 rounded text-xs font-bold uppercase hover:opacity-90 transition'>Registreer</Link>
            </>
          )}

          {/* Hamburger Icon */}
          <button className='lg:hidden text-2xl text-gray-900 focus:outline-none ml-2' onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Menu Drawer (Right to Left) */}
      <div 
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-64 bg-white z-50 shadow-lg overflow-y-auto transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex justify-end p-4 border-b border-gray-100">
          <button 
            className="text-gray-500 hover:text-gray-900 text-2xl focus:outline-none" 
            onClick={() => setIsMenuOpen(false)}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Drawer Links */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-gray-800 font-medium">
          <Link 
            to="/" 
            className="block py-2 hover:text-primary transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </Link>

          <Link 
            to="/locaties" 
            className="block py-2 hover:text-primary transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Locaties
          </Link>

          <Link 
            to="/pakketten" 
            className="block py-2 hover:text-primary transition"
            onClick={() => setIsMenuOpen(false)}
          >
            Pakketten
          </Link>

          {user?.role === 'eigenaar' && (
            <div>
              <button
                className="flex items-center justify-between w-full py-2 hover:text-primary transition"
                onClick={() => setMobileAdminOpen(!mobileAdminOpen)}
              >
                Admin
                <i className={`fa-solid fa-chevron-down text-xs transition-transform ${mobileAdminOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {mobileAdminOpen && (
                <div className="pl-4 border-l-2 border-gray-100 space-y-2 pb-2">
                  <Link to="/admin/users" onClick={() => setIsMenuOpen(false)} className="block py-1.5 text-sm text-gray-500 hover:text-primary transition">Gebruikersbeheer</Link>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block py-1.5 text-sm text-gray-500 hover:text-primary transition">Alle Reserveringen</Link>
                  <Link to="/admin/lessons" onClick={() => setIsMenuOpen(false)} className="block py-1.5 text-sm text-gray-500 hover:text-primary transition">Agenda & Rooster</Link>
                </div>
              )}
            </div>
          )}

          {(user?.role === 'eigenaar' || user?.role === 'instructeur') && (
            <div>
              <button
                className="flex items-center justify-between w-full py-2 hover:text-primary transition"
                onClick={() => setMobileInstructeurOpen(!mobileInstructeurOpen)}
              >
                Instructeur
                <i className={`fa-solid fa-chevron-down text-xs transition-transform ${mobileInstructeurOpen ? 'rotate-180' : ''}`}></i>
              </button>
              {mobileInstructeurOpen && (
                <div className="pl-4 border-l-2 border-gray-100 space-y-2 pb-2">
                  <Link to="/admin/lessons" onClick={() => setIsMenuOpen(false)} className="block py-1.5 text-sm text-gray-500 hover:text-primary transition">Mijn Rooster</Link>
                  <Link to="/admin/users" state={{ view: 'instructeur' }} onClick={() => setIsMenuOpen(false)} className="block py-1.5 text-sm text-gray-500 hover:text-primary transition">Mijn Klanten</Link>
                </div>
              )}
            </div>
          )}

          {/* User Section */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            {user ? (
              <>
                {user.role === 'klant' && (
                  <Link 
                    to="/dashboard" 
                    className="block py-2 hover:text-primary transition"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                
                <Link 
                  to="/profile" 
                  className="block py-2 hover:text-primary transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profiel
                </Link>
                
                <button 
                  className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition"
                  onClick={handleLogout}
                >
                  Uitloggen
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block py-2 hover:text-primary transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                
                <Link 
                  to="/register" 
                  className="block py-2 text-primary font-bold transition"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Registreer
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar