import React from 'react';

const Field = React.forwardRef(({ label, error, required = false, type = 'text', placeholder = '', ...rest }, ref) => (
  <div className="flex flex-col gap-1 w-full">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm focus:outline-none bg-white transition ${
        error ? 'border-2 border-red-400 focus:border-red-500' : 'border border-gray-300 focus:border-black'
      }`}
      {...rest}
    />
    {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
  </div>
));

Field.displayName = 'Field';

const AdminUserForm = ({ 
  register, 
  errors, 
  isEigenaar, 
  role, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  isLoading, 
  serverError 
}) => {
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <Field label="Naam" required error={errors.name?.message} {...register('name')} placeholder="Volledige naam" />
      <Field label="E-mailadres" type="email" required error={errors.email?.message} {...register('email')} placeholder="naam@voorbeeld.nl" />
      
      {!isEdit && (
        <Field label="Wachtwoord" type="password" required error={errors.password?.message} {...register('password')} placeholder="Minimaal 12 tekens, 1 hoofdletter, 1 cijfer en 1 leesteken" />
      )}

      {isEigenaar && (
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rol</label>
          <select className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black bg-white" {...register('role')}>
            <option value="klant">Klant</option>
            <option value="instructeur">Instructeur</option>
            <option value="eigenaar">Eigenaar</option>
          </select>
        </div>
      )}

      <Field label="Telefoonnummer" {...register('phone')} placeholder="06-12345678" />
      <Field label="Geboortedatum" type="date" {...register('dateOfBirth')} />
      <Field label="Adres" {...register('address')} placeholder="Straat + huisnummer" />
      <Field label="Woonplaats" {...register('city')} placeholder="Amsterdam" />
      
      {role !== 'klant' && (
        <Field label="BSN-nummer" {...register('bsn')} placeholder="9 cijfers" />
      )}

      {serverError && <p className="col-span-1 md:col-span-2 text-red-600 text-xs font-medium">{serverError}</p>}

      <div className="col-span-1 md:col-span-2 flex gap-3 pt-2">
        <button type="submit" disabled={isLoading} className="bg-black text-white px-6 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-gray-800 transition disabled:opacity-50">
          {isLoading ? 'Bezig...' : isEdit ? 'Opslaan' : 'Aanmaken'}
        </button>
        <button type="button" onClick={onCancel} className="border border-gray-300 text-gray-600 px-6 py-2.5 text-xs font-semibold uppercase tracking-wider hover:border-black transition">
          Annuleer
        </button>
      </div>
    </form>
  );
};

export default AdminUserForm;
