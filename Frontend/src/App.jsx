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

axios.defaults.withCredentials = true

function App() {

  const [user, setUser] = useState(null)
  const [error, setError] = useState("")
const [loading, setLoading] = useState(true)

useEffect(() => {
      const fetchUser = async () => {
        try {
          const res = await axios.get('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            
          });
            setUser(res.data.user)
            } catch (err) {
              setUser(null)
              if (!err.response || err.response.status >= 500) {
                 setError("De server is momenteel onbereikbaar. Onze excuses voor het ongemak.");
              }
              console.log(err)
            }finally{
              setLoading(false)
            }
          }
          fetchUser()
      }, [])
 
      if (loading){
        return <div>Loading...</div>
      }

  return (
    <Router>
      <Navbar user={user} setUser={setUser}/>
   <Routes>
    <Route path="/" element={<Home user={user} error={error}/>} />
    <Route path="/login" element={user ? <Navigate to="/" /> : <Login setUser={setUser} />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register setUser={setUser} />} />
      <Route path="/forgot-password" element={user ? <Navigate to="/" /> : <ForgotPassword />} />
      <Route path="/reset-password" element={user ? <Navigate to="/" /> : <ResetPassword />} />
      <Route path="/pakketten" element={<Packages />} />
      <Route path="*" element={<NotFound />}/>
      </Routes>
      <Footer />
    </Router>
  )
}

export default App