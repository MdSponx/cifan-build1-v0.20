import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Users,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Guest, GuestRole, GUEST_ROLES } from '../../types/featureFilm.types';
import { useTypography } from '../../utils/typography';

interface GuestManagementProps {
  guests: Guest[];
  onChange: (guests: Guest[]) => void;
  disabled?: boolean;
}

interface GuestFormData {
  name: string;
  contact: string;
  role: GuestRole;
  otherRole: string;
  remarks: string;
}

const GuestManagement: React.FC<GuestManagementProps> = ({
  guests,
  onChange,
  disabled = false
}) => {
  const { t } = useTranslation();
  const { getClass } = useTypography();
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>({
    name: '',
    contact: '',
    role: 'Director',
    otherRole: '',
    remarks: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize with one empty guest if no guests exist
  useEffect(() => {
    if (guests.length === 0) {
      setShowAddForm(true);
    }
  }, [guests.length]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('featureFilm.errors.guestNameRequired');
    }
    
    if (!formData.contact.trim()) {
      newErrors.contact = t('featureFilm.errors.guestContactRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddGuest = () => {
    if (!validateForm()) return;
    
    const newGuest: Guest = {
      id: `temp_${Date.now()}`, // Temporary ID for new guests
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      role: formData.role,
      otherRole: formData.role === 'Other' ? formData.otherRole.trim() : undefined,
      remarks: formData.remarks.trim() || undefined
    };
    
    onChange([...guests, newGuest]);
    setFormData({ 
      name: '', 
      contact: '', 
      role: 'Director',
      otherRole: '',
      remarks: '' 
    });
    setShowAddForm(false);
    setErrors({});
  };

  const handleEditGuest = (index: number) => {
    const guest = guests[index];
    setFormData({
      name: guest.name,
      contact: guest.contact,
      role: guest.role,
      otherRole: guest.otherRole || '',
      remarks: guest.remarks || ''
    });
    setEditingIndex(index);
    setErrors({});
  };

  const handleUpdateGuest = () => {
    if (!validateForm()) return;
    
    if (editingIndex === null) return;
    
    const updatedGuests = [...guests];
    updatedGuests[editingIndex] = {
      ...updatedGuests[editingIndex],
      name: formData.name.trim(),
      contact: formData.contact.trim(),
      role: formData.role,
      otherRole: formData.role === 'Other' ? formData.otherRole.trim() : undefined,
      remarks: formData.remarks.trim() || undefined
    };
    
    onChange(updatedGuests);
    setEditingIndex(null);
    setFormData({ 
      name: '', 
      contact: '', 
      role: 'Director',
      otherRole: '',
      remarks: '' 
    });
    setErrors({});
  };

  const handleDeleteGuest = (index: number) => {
    const updatedGuests = guests.filter((_, i) => i !== index);
    onChange(updatedGuests);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setShowAddForm(false);
    setFormData({ 
      name: '', 
      contact: '', 
      role: 'Director',
      otherRole: '',
      remarks: '' 
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof GuestFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="w-5 h-5 text-[#FCB283]" />
          <h3 className={`text-lg font-semibold text-white ${getClass('header')}`}>
            {t('featureFilm.labels.guestList')}
          </h3>
          {guests.length > 0 && (
            <span className="px-2 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm font-medium">
              {guests.length} {guests.length === 1 ? t('featureFilm.labels.guest') : t('featureFilm.labels.guests')}
            </span>
          )}
        </div>
        
        {!showAddForm && editingIndex === null && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{t('featureFilm.actions.addGuest')}</span>
          </button>
        )}
      </div>

      {/* Guest List */}
      {guests.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-white/10 px-6 py-3 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white/90">
                <div className="col-span-4">{t('featureFilm.fields.guestName')}</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">{t('featureFilm.fields.guestContact')}</div>
                <div className="col-span-2">{t('featureFilm.fields.guestRemarks')}</div>
                <div className="col-span-2 text-center">{t('common.actions')}</div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-white/10">
              {guests.map((guest, index) => (
                <div key={guest.id || index} className="px-6 py-4">
                  {editingIndex === index ? (
                    // Edit Form
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                            placeholder={t('featureFilm.placeholders.guestName')}
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            value={formData.contact}
                            onChange={(e) => handleInputChange('contact', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                            placeholder={t('featureFilm.placeholders.guestContact')}
                          />
                          {errors.contact && (
                            <p className="mt-1 text-sm text-red-400">{errors.contact}</p>
                          )}
                        </div>
                      </div>

                      {/* Role Selection for Edit Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <select
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value as GuestRole)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                          >
                            {GUEST_ROLES.map(role => (
                              <option key={role} value={role} className="bg-[#1a1a2e] text-white">
                                {role}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Other Role Input - Show only if role is 'Other' */}
                        {formData.role === 'Other' && (
                          <div>
                            <input
                              type="text"
                              value={formData.otherRole}
                              onChange={(e) => handleInputChange('otherRole', e.target.value)}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                              placeholder="Enter specific role"
                            />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <textarea
                          value={formData.remarks}
                          onChange={(e) => handleInputChange('remarks', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                          placeholder={t('featureFilm.placeholders.guestRemarks')}
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        {/* Delete button on the left */}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingIndex !== null) {
                              handleDeleteGuest(editingIndex);
                            }
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>

                        {/* Save and Cancel buttons on the right */}
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            <span>{t('common.cancel')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateGuest}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            <span>{t('common.save')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-[#FCB283]" />
                          <span className="text-white font-medium">{guest.name}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="px-2 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-xs font-medium">
                          {guest.role === 'Other' && guest.otherRole ? guest.otherRole : guest.role}
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-white/60" />
                          <span className="text-white/80">{guest.contact}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        {guest.remarks ? (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                            <span className="text-white/70 text-sm">{guest.remarks}</span>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm italic">{t('common.noRemarks')}</span>
                        )}
                      </div>
                      
                      <div className="col-span-2 flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditGuest(index)}
                          disabled={disabled}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('common.edit')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGuest(index)}
                          disabled={disabled}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Guest Form */}
      {showAddForm && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center space-x-2 mb-4">
            <Plus className="w-4 h-4 text-[#FCB283]" />
            <h4 className="text-lg font-medium text-white">{t('featureFilm.actions.addNewGuest')}</h4>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.guestName')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.guestName')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.guestContact')} *
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder={t('featureFilm.placeholders.guestContact')}
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-400">{errors.contact}</p>
                )}
              </div>
            </div>

            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  {t('featureFilm.fields.guestRole')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as GuestRole)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  {GUEST_ROLES.map(role => (
                    <option key={role} value={role} className="bg-[#1a1a2e] text-white">
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Other Role Input - Show only if role is 'Other' */}
              {formData.role === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Specify Role *
                  </label>
                  <input
                    type="text"
                    value={formData.otherRole}
                    onChange={(e) => handleInputChange('otherRole', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                    placeholder="Enter specific role"
                  />
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                {t('featureFilm.fields.guestRemarks')}
              </label>
              <textarea
                value={formData.remarks}
                onChange={(e) => handleInputChange('remarks', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                placeholder={t('featureFilm.placeholders.guestRemarks')}
              />
            </div>
            
            <div className="flex justify-between items-center">
              {/* Delete button on the left */}
              <button
                type="button"
                onClick={() => {
                  // Reset form and close
                  setFormData({ 
                    name: '', 
                    contact: '', 
                    role: 'Director',
                    otherRole: '',
                    remarks: '' 
                  });
                  setShowAddForm(false);
                  setErrors({});
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              {/* Save and Cancel buttons on the right */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleAddGuest}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t('featureFilm.actions.addGuest')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {guests.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-4">{t('featureFilm.messages.noGuestsAdded')}</p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>{t('featureFilm.actions.addFirstGuest')}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default GuestManagement;
