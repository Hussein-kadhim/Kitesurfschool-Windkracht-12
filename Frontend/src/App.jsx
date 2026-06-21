import { useState, useEffect } from "react"
import axios from "axios"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import Login from "./pages/Login"
import Register from "./pages/register"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Packages from "./pages/Packages"
import NotFound from "./components/NotFound"
import Footer from "./components/Footer"
import Reservation from "./pages/Reservation"
import Success from "./pages/Success"
import Locations from "./pages/Locations"
import Verify from "./pages/Verify"
import Profile from "./pages/Profile"
import Dashboard from "./pages/Dashboard"
import AdminUsers from "./pages/AdminUsers"
import AdminLessons from "./pages/AdminLessons"
    
axios.defaults.withCredentials = true

function App() {

  // Haal opgeslagen gebruiker op uit localStorage (blijft ingelogd als database uitvalt)
  const getCachedUser = () => {
    try {
      const cached = localStorage.getItem("cachedUser");
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  };

  const [user, setUser] = useState(getCachedUser())
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  // Wrapper: sla user op in localStorage bij elke wijziging
  const updateUser = (newUser) => {
    setUser(newUser);
    if (newUser) {
      localStorage.setItem("cachedUser", JSON.stringify(newUser));
    } else {
      localStorage.removeItem("cachedUser");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          timeout: 2000,
        });
        updateUser(res.data.user)
      } catch (err) {
        if (!err.response || err.response.status >= 500) {
          // Server/database onbereikbaar: behoud de opgeslagen gebruiker
          setError("De server is momenteel onbereikbaar. Onze excuses voor het ongemak.");
        } else {
          // Echte auth fout (401/403): gebruiker is niet meer geldig
          updateUser(null)
        }
        console.log(err)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])
 


  return (
    <Router>
      <Navbar user={user} setUser={updateUser}/>
   <Routes>
    <Route path="/" element={<Home user={user} error={error}/>} />
    <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={updateUser} />} />
    <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={updateUser} />} />
    <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
    <Route path="/reset-password" element={user ? <Navigate to="/" /> : <ResetPassword />} />
    <Route path="/pakketten" element={<Packages />} />
    <Route path="/locaties" element={<Locations />} />
    <Route path="/verify" element={<Verify setUser={updateUser} />} />
    <Route path="/bevestiging/:id" element={<Success />} />
    <Route path="/reservering/:id" element={(user || error || loading) ? <Reservation user={user} globalError={error} /> : <Navigate to="/login" />} />
    <Route path="/success" element={user ? <Success /> : <Navigate to="/login" />} />
    <Route path="/profile" element={user ? <Profile user={user} setUser={updateUser} /> : <Navigate to="/login" />} />
    <Route path="/dashboard" element={
      (user?.role === 'klant' || user?.role === 'eigenaar') ? <Dashboard user={user} setUser={updateUser} /> 
      : user?.role === 'instructeur' ? <Navigate to="/admin/lessons" />
      : <Navigate to="/login" />
    } />
    <Route path="/admin/users" element={(user?.role === 'eigenaar' || user?.role === 'instructeur') ? <AdminUsers user={user} /> : <Navigate to={user ? "/" : "/login"} />} />
    <Route path="/admin/lessons" element={(user?.role === 'eigenaar' || user?.role === 'instructeur') ? <AdminLessons user={user} /> : <Navigate to={user ? "/" : "/login"} />} />
    <Route path="*" element={<NotFound />}/>
   </Routes>
   <Footer />
  </Router>
  )
}

export default App