import React from 'react';
import AdminUserForm from './AdminUserForm';

const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</span>
    <p className="font-medium mt-0.5">{value || '—'}</p>
  </div>
);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
};

const ROLE_CONFIG = {
  eigenaar:    { label: 'Eigenaar',    classes: 'bg-purple-100 text-purple-800 border border-purple-300' },
  instructeur: { label: 'Instructeur', classes: 'bg-blue-100  text-blue-800  border border-blue-300'   },
  klant:       { label: 'Klant',       classes: 'bg-gray-100  text-gray-700  border border-gray-300'   },
};

const AdminUserRow = ({
  user,
  currentUser,
  isEigenaar,
  isExpanded,
  isEditing,
  isDeleting,
  setExpandedId,
  setEditId,
  setDeleteId,
  openEdit,
  confirmDelete,
  deleteLoading,
  registerEdit,
  handleEditSubmit,
  onEditSubmit,
  editErrors,
  editRole,
  editLoading,
  editServerError,
}) => {
  const roleCfg = ROLE_CONFIG[user.role] || ROLE_CONFIG.klant;
  const isSelf  = currentUser?.id === user.id;

  return (
    <div className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-gray-600 uppercase">{(user.name || user.email || '?')[0]}</span>
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 text-sm">{user.name || <span className="italic text-gray-400">Geen naam</span>}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${roleCfg.classes}`}>{roleCfg.label}</span>
              {isSelf && <span className="text-[10px] font-bold px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-sm uppercase tracking-wider">Jij</span>}
            </div>
            <p className="text-xs text-gray-500">{user.email}</p>
            {user.city && <p className="text-xs text-gray-400">{user.city}</p>}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button onClick={() => setExpandedId(isExpanded ? null : user.id)}
            className="border border-gray-300 text-gray-700 hover:border-black hover:text-black transition px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            {isExpanded ? 'Sluiten' : 'Details'}
          </button>
          <button onClick={() => isEditing ? setEditId(null) : openEdit(user)}
            className="border border-gray-300 text-gray-700 hover:border-black hover:text-black transition px-3 py-1.5 text-xs font-semibold uppercase tracking-wider">
            {isEditing ? 'Annuleer' : 'Bewerken'}
          </button>
          {((isEigenaar && !isSelf && user.role !== 'eigenaar') || (currentUser?.role === 'instructeur' && user.role === 'klant')) && (
            <button onClick={() => setDeleteId(isDeleting ? null : user.id)}
              className={`border transition px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDeleting ? 'border-red-500 bg-red-50 text-red-700' : 'border-red-300 text-red-600 hover:bg-red-50'}`}>
              {isDeleting ? 'Annuleer' : 'Verwijder'}
            </button>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {isDeleting && (
        <div className="border-t border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-700 mb-3">
            Weet je zeker dat je <strong>{user.name || user.email}</strong> wil verwijderen?
            <span className="block text-xs font-normal text-red-500 mt-0.5">Dit verwijdert ook alle reserveringen van deze gebruiker.</span>
          </p>
          <div className="flex gap-3">
            <button disabled={deleteLoading} onClick={() => confirmDelete(user.id)}
              className="bg-red-600 text-white px-5 py-2 text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition disabled:opacity-50">
              {deleteLoading ? 'Bezig...' : 'Ja, verwijder'}
            </button>
            <button onClick={() => setDeleteId(null)}
              className="border border-gray-300 text-gray-600 px-5 py-2 text-xs font-semibold uppercase tracking-wider hover:border-black transition">
              Terug
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {isEditing && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Gegevens bewerken</p>
          <AdminUserForm 
            register={registerEdit}
            errors={editErrors}
            isEigenaar={isEigenaar}
            role={editRole}
            isEdit={true}
            onSubmit={handleEditSubmit(onEditSubmit)}
            onCancel={() => setEditId(null)}
            isLoading={editLoading}
            serverError={editServerError}
          />
        </div>
      )}

      {/* Details panel */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <DetailItem label="ID"            value={`#${String(user.id).padStart(4, '0')}`} />
            <DetailItem label="E-mailadres"   value={user.email} />
            <DetailItem label="Rol"           value={ROLE_CONFIG[user.role]?.label || user.role} />
            <DetailItem label="Telefoonnummer" value={user.phone} />
            <DetailItem label="Geboortedatum" value={formatDate(user.dateOfBirth)} />
            <DetailItem label="Adres"         value={user.address} />
            <DetailItem label="Woonplaats"    value={user.city} />
            {user.role !== 'klant' && <DetailItem label="BSN-nummer" value={user.bsn || '—'} />}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserRow;
