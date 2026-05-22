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

  const handleLogout = async () => {
    try {
      await axios.post('/api/auth/logout');
      localStorage.removeItem("token");
      setUser(null);
      setIsMenuOpen(false);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError("Je kan niet uitloggen door een foutmelding. Je blijft mogelijk ingelogd. Sluit handmatig de browser.");
    }
  };

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
            <Link to="#" className={getLinkClass('/planning')}>Planning</Link>
            {(!user || user.role === 'klant' || user.role === 'eigenaar') && (
              <Link to="/pakketten" className={getLinkClass('/pakketten')}>Reserveren</Link>
            )}
            {user?.role === 'eigenaar' && (
              <Link to="#" className='hover:text-primary flex items-center'>Admin <i className="fa-solid fa-chevron-down ml-1 text-xs"></i></Link>
            )}
            {(user?.role === 'eigenaar' || user?.role === 'instructeur') && (
              <Link to="#" className='hover:text-primary flex items-center'>Instructeur <i className="fa-solid fa-chevron-down ml-1 text-xs"></i></Link>
            )}
        </div>
        
        {/* Right: Authentication, Profile & Hamburger */}
        <div className='flex items-center justify-end space-x-4 lg:space-x-6 text-gray-600 font-medium'>
          {user ? (
            <>
              {(user.role === 'eigenaar' || user.role === 'instructeur') && (
                <Link to="#" className='hidden lg:block hover:text-primary'>Dashboard</Link>
              )}
              <Link to="#" className='hidden lg:block hover:text-primary'>Profiel</Link>
              
              {/* Uitloggen is zichtbaar buiten het hamburger menu */}
              <button className='bg-black text-white px-3 py-2 lg:px-4 text-[10px] lg:text-xs font-bold uppercase tracking-wide hover:bg-gray-800 transition' onClick={handleLogout}>
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

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white border-b border-gray-200 shadow-md z-30 flex flex-col p-6 space-y-4 text-gray-800 font-medium">
            <Link to="/" className={getLinkClass('/')} onClick={() => setIsMenuOpen(false)}>Home</Link>
            <Link to="#" className={getLinkClass('/planning')} onClick={() => setIsMenuOpen(false)}>Planning</Link>
            {(!user || user.role === 'klant' || user.role === 'eigenaar') && (
              <Link to="/pakketten" className={getLinkClass('/pakketten')} onClick={() => setIsMenuOpen(false)}>Reserveren</Link>
            )}
            {user?.role === 'eigenaar' && (
              <Link to="#" className='hover:text-primary flex items-center' onClick={() => setIsMenuOpen(false)}>Admin</Link>
            )}
            {(user?.role === 'eigenaar' || user?.role === 'instructeur') && (
              <Link to="#" className='hover:text-primary flex items-center' onClick={() => setIsMenuOpen(false)}>Instructeur</Link>
            )}
            
            {/* User Links on Mobile (Dashboard, Profiel, Login, Registreer) */}
            {user ? (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  {(user.role === 'eigenaar' || user.role === 'instructeur') && (
                      <Link to="#" className='hover:text-primary' onClick={() => setIsMenuOpen(false)}>Dashboard</Link>
                  )}
                  <Link to="#" className='hover:text-primary' onClick={() => setIsMenuOpen(false)}>Profiel</Link>
                </>
            ) : (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <Link to="/login" className='hover:text-primary' onClick={() => setIsMenuOpen(false)}>Login</Link>
                  <Link to="/register" className='hover:text-primary text-primary' onClick={() => setIsMenuOpen(false)}>Registreer</Link>
                </>
            )}
        </div>
      )}
    </div>
  )
}

export default Navbar