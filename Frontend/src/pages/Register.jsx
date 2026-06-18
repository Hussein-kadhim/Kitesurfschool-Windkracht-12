import React, {useState} from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
 
function Register({setUser}) {
const [form, setForm] = useState({
    email: "",
})
const [error, setError] = useState("")
const [successMsg, setSuccessMsg] = useState("");
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

  if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      setError("");
      return;
  }
  setFieldErrors({});

  try {
    const res = await axios.post('/api/auth/register', form);
    setSuccessMsg(res.data.message);
    setError("");
  } catch (err) {
    if (err.response && err.response.data && err.response.data.message) {
      setError(err.response.data.message);
    } else {
      setError("Fout bij aanmelden, probeer het later opnieuw");
    }
    setSuccessMsg("");
  }
};
  return (
    <div className="flex items-center justify-center h-screen">
<form className='bg-white p-8 rounded shadow-md w-full max-w-sm' onSubmit={handleSubmit} noValidate>
    <h2 className='text-2xl font-bold mb-6 text-center font-montserrat'>Registreer</h2>
    {error && <div className='text-red-500 mb-4 text-center text-sm font-medium'>{error}</div>}
    {successMsg && <div className='text-green-500 mb-4 text-center text-sm font-medium'>{successMsg}</div>}
    
    <div className="mb-6">
        <input 
            type="email" 
            placeholder='E-mailadres' 
            className={`border p-2 w-full focus:outline-none ${fieldErrors.email ? 'border-red-500' : 'border-gray-300 focus:border-primary'}`} 
            value={form.email} 
            onChange={(e) => { setForm({email: e.target.value}); setFieldErrors({...fieldErrors, email: ''}); }}
        />
        {fieldErrors.email && <p className="text-red-500 text-xs mt-1 text-left">{fieldErrors.email}</p>}
    </div>

    <button className='bg-primary text-white p-2 w-full font-bold hover:opacity-90 transition'>Registreer</button>
</form>
</div>
  )
}

export default Register