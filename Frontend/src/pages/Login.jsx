import React, {useState} from 'react'
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';


function Login({setUser}) {
const [form, setForm] = useState({
    email: "",
    password: "",
})
const [error, setError] = useState("")
const navigate = useNavigate();

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post('/api/auth/login', form);
    setUser(res.data.user);
    navigate('/');
  } catch (err) {
    setError("Fout bij inloggen wachtwoord of email klopt niet");
  }
};
  return (
    <div className="flex items-center justify-center h-screen">
<form className='bg-white p-8 rounded shadow-md w-full max-w-sm' onSubmit={handleSubmit}>
    <h2 className='text-2xl font-bold mb-6 text-center font-montserrat'>Login</h2>
    {error && <div className='text-red-500 mb-4 text-center'>{error}</div>}
    <input type="email" placeholder='E-mailadres' className='border border-gray-300 p-2 w-full mb-4 focus:outline-none focus:border-primary' value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}/>
    <input type="password" placeholder='Wachtwoord' className='border border-gray-300 p-2 w-full mb-6 focus:outline-none focus:border-primary' value={form.password} onChange={(e) => setForm({...form, password: e.target.value})}/> 
    <button className='bg-primary text-white p-2 w-full mb-4 hover:opacity-90 transition font-bold'>Inloggen</button>
    <div className='text-center'>
        <Link to="/forgot-password" className='text-primary hover:underline text-sm'>Wachtwoord vergeten?</Link>
    </div>
</form>
</div>
  )
}

export default Login