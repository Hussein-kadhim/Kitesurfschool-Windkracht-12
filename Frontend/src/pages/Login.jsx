import React, {useState} from 'react'
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';


function Login({setUser}) {
const [form, setForm] = useState({
    email: "",
    password: "",
})
const [error, setError] = useState("")
const [fieldErrors, setFieldErrors] = useState({});
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();

  const newErrors = {};
  if (!form.email) {
      newErrors.email = "E-mailadres is verplicht";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Voer een geldig e-mailadres in";
  }

  if (!form.password) newErrors.password = "Wachtwoord is verplicht";

  if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError("");
      return;
  }
  setFieldErrors({});

  try {
    const res = await axios.post('/api/auth/login', form);
    setUser(res.data.user);
    navigate('/');
  } catch (err) {
    if (!err.response || err.response.status >= 500) {
      setError("Kan momenteel geen verbinding maken met de server. Probeer het later opnieuw.");
    } else {
      setError("Fout bij inloggen: wachtwoord of e-mailadres klopt niet.");
    }
  }
};
  return (
    <div className="flex items-center justify-center h-screen">
<form className='bg-white p-8 rounded shadow-md w-full max-w-sm' onSubmit={handleSubmit} noValidate>
    <h2 className='text-2xl font-bold mb-6 text-center font-montserrat'>Login</h2>
    {error && <div className='text-red-500 mb-4 text-center text-sm font-medium'>{error}</div>}
    
    <div className="mb-4">
        <input 
            type="email" 
            placeholder='E-mailadres' 
            className={`border p-2 w-full focus:outline-none ${fieldErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
            value={form.email} 
            onChange={(e) => { setForm({...form, email: e.target.value}); setFieldErrors({...fieldErrors, email: ''}); }}
        />
        {fieldErrors.email && <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.email}</p>}
    </div>

    <div className="mb-6">
        <input 
            type="password" 
            placeholder='Wachtwoord' 
            className={`border p-2 w-full focus:outline-none ${fieldErrors.password ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
            value={form.password} 
            onChange={(e) => { setForm({...form, password: e.target.value}); setFieldErrors({...fieldErrors, password: ''}); }}
        /> 
        {fieldErrors.password && <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.password}</p>}
    </div>

    <button className='bg-primary text-white p-2 w-full mb-4 hover:opacity-90 transition font-bold'>Inloggen</button>
    <div className='text-center'>
        <Link to="/forgot-password" className='text-primary hover:underline text-sm'>Wachtwoord vergeten?</Link>
    </div>
</form>
</div>
  )
}

export default Login