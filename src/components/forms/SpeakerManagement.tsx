import React, { useState, useEffect, useRef } from 'react';
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
  MessageSquare,
  Image as ImageIcon,
  Upload
} from 'lucide-react';
import { Speaker, SpeakerRole, SPEAKER_ROLES } from '../../types/activities';
import { useTypography } from '../../utils/typography';

// Speaker role translations
const SPEAKER_ROLE_TRANSLATIONS = {
  'Keynote Speaker': { en: 'Keynote Speaker', th: 'วิทยากรหลัก' },
  'Panelist': { en: 'Panelist', th: 'ผู้ร่วมอภิปราย' },
  'Moderator': { en: 'Moderator', th: 'ผู้ดำเนินรายการ' },
  'Workshop Leader': { en: 'Workshop Leader', th: 'ผู้นำเวิร์กช็อป' },
  'Industry Expert': { en: 'Industry Expert', th: 'ผู้เชี่ยวชาญในอุตสาหกรรม' },
  'Director': { en: 'Director', th: 'ผู้กำกับ' },
  'Producer': { en: 'Producer', th: 'โปรดิวเซอร์' },
  'Actor': { en: 'Actor', th: 'นักแสดง' },
  'Screenwriter': { en: 'Screenwriter', th: 'นักเขียนบท' },
  'Cinematographer': { en: 'Cinematographer', th: 'ผู้กำกับภาพ' },
  'Film Critic': { en: 'Film Critic', th: 'นักวิจารณ์ภาพยนตร์' },
  'Academic': { en: 'Academic', th: 'นักวิชาการ' },
  'Other': { en: 'Other', th: 'อื่นๆ' }
};

interface SpeakerManagementProps {
  speakers: Speaker[];
  onChange: (speakers: Speaker[]) => void;
  disabled?: boolean;
}

interface SpeakerFormData {
  name: string;
  email: string;
  phone: string;
  role: SpeakerRole;
  otherRole: string;
  bio: string;
  image: File | null;
}

const SpeakerManagement: React.FC<SpeakerManagementProps> = ({
  speakers,
  onChange,
  disabled = false
}) => {
  const { t, i18n } = useTranslation();
  const { getClass } = useTypography();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentLanguage = i18n.language as 'en' | 'th';
  
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<SpeakerFormData>({
    name: '',
    email: '',
    phone: '',
    role: 'Keynote Speaker',
    otherRole: '',
    bio: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Initialize with one empty speaker if no speakers exist
  useEffect(() => {
    if (speakers.length === 0) {
      setShowAddForm(true);
    }
  }, [speakers.length]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Speaker name is required';
    }
    
    // At least email or phone should be provided
    if (!formData.email.trim() && !formData.phone.trim()) {
      newErrors.contact = 'Please provide either email or phone number';
    }
    
    // Validate email format if provided
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, image: 'File too large (max 5MB)' }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, image: 'Invalid file type. Only JPG, PNG, WebP allowed.' }));
      return;
    }

    setFormData(prev => ({ ...prev, image: file }));
    setErrors(prev => ({ ...prev, image: '' }));
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const handleAddSpeaker = () => {
    if (!validateForm()) return;
    
    const newSpeaker: Speaker = {
      id: `temp_${Date.now()}`, // Temporary ID for new speakers
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      otherRole: formData.role === 'Other' ? formData.otherRole.trim() : undefined,
      bio: formData.bio.trim() || undefined,
      image: imagePreview || undefined, // Store the image preview URL
    };
    
    onChange([...speakers, newSpeaker]);
    resetForm();
  };

  const handleEditSpeaker = (index: number) => {
    const speaker = speakers[index];
    setFormData({
      name: speaker.name,
      email: speaker.email || '',
      phone: speaker.phone || '',
      role: speaker.role,
      otherRole: speaker.otherRole || '',
      bio: speaker.bio || '',
      image: null // Can't edit existing image file
    });
    
    // Set image preview if speaker has an image
    if (speaker.image) {
      setImagePreview(speaker.image);
    }
    
    setEditingIndex(index);
    setErrors({});
  };

  const handleUpdateSpeaker = () => {
    if (!validateForm()) return;
    
    if (editingIndex === null) return;
    
    const updatedSpeakers = [...speakers];
    updatedSpeakers[editingIndex] = {
      ...updatedSpeakers[editingIndex],
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      role: formData.role,
      otherRole: formData.role === 'Other' ? formData.otherRole.trim() : undefined,
      bio: formData.bio.trim() || undefined,
      // Update image if new one is uploaded, otherwise keep existing
      image: imagePreview || updatedSpeakers[editingIndex].image,
    };
    
    onChange(updatedSpeakers);
    resetForm();
    setEditingIndex(null);
  };

  const handleDeleteSpeaker = (index: number) => {
    const updatedSpeakers = speakers.filter((_, i) => i !== index);
    onChange(updatedSpeakers);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      role: 'Keynote Speaker',
      otherRole: '',
      bio: '',
      image: null
    });
    setImagePreview(null);
    setShowAddForm(false);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    resetForm();
  };

  const handleInputChange = (field: keyof SpeakerFormData, value: string | File | null) => {
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
            Speakers
          </h3>
          {speakers.length > 0 && (
            <span className="px-2 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-sm font-medium">
              {speakers.length} {speakers.length === 1 ? 'Speaker' : 'Speakers'}
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
            <span>Add Speaker</span>
          </button>
        )}
      </div>

      {/* Speaker List */}
      {speakers.length > 0 && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="bg-white/10 px-6 py-3 border-b border-white/10">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white/90">
                <div className="col-span-2">Image</div>
                <div className="col-span-2">Name</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-1">Bio</div>
                <div className="col-span-1 text-center">Actions</div>
              </div>
            </div>
            
            {/* Table Body */}
            <div className="divide-y divide-white/10">
              {speakers.map((speaker, index) => (
                <div key={speaker.id || index} className="px-6 py-4">
                  {editingIndex === index ? (
                    // Edit Form
                    <div className="space-y-4">
                      {/* Image Upload */}
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          Speaker Image
                        </label>
                        <div className="flex items-center space-x-4">
                          {imagePreview ? (
                            <div className="relative">
                              <img 
                                src={imagePreview} 
                                alt="Preview" 
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                              <button
                                type="button"
                                onClick={removeImage}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-white/40" />
                            </div>
                          )}
                          <div className="flex-1">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center space-x-2 px-3 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload Image</span>
                            </button>
                            {errors.image && (
                              <p className="mt-1 text-sm text-red-400">{errors.image}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                            placeholder="Speaker name"
                          />
                          {errors.name && (
                            <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                          )}
                        </div>
                        
                        <div>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                            placeholder="Email address"
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                            placeholder="Phone number"
                          />
                          {errors.contact && (
                            <p className="mt-1 text-sm text-red-400">{errors.contact}</p>
                          )}
                        </div>
                        
                        <div>
                          <select
                            value={formData.role}
                            onChange={(e) => handleInputChange('role', e.target.value as SpeakerRole)}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                          >
                            {SPEAKER_ROLES.map(role => (
                              <option key={role} value={role} className="bg-[#1a1a2e] text-white">
                                {SPEAKER_ROLE_TRANSLATIONS[role][currentLanguage]}
                              </option>
                            ))}
                          </select>
                        </div>
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
                      
                      <div>
                        <textarea
                          value={formData.bio}
                          onChange={(e) => handleInputChange('bio', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                          placeholder="Speaker bio, expertise, achievements, etc."
                        />
                      </div>
                      
                      <div className="flex justify-between items-center">
                        {/* Delete button on the left */}
                        <button
                          type="button"
                          onClick={() => {
                            if (editingIndex !== null) {
                              if (window.confirm('Are you sure you want to delete this speaker?')) {
                                handleDeleteSpeaker(editingIndex);
                              }
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
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleUpdateSpeaker}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                          >
                            <Save className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2">
                        {speaker.image ? (
                          <img 
                            src={speaker.image} 
                            alt={speaker.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
                            <User className="w-6 h-6 text-white/40" />
                          </div>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium">{speaker.name}</span>
                        </div>
                      </div>
                      
                      <div className="col-span-2">
                        <span className="px-2 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-full text-xs font-medium">
                          {speaker.role === 'Other' && speaker.otherRole 
                            ? speaker.otherRole 
                            : SPEAKER_ROLE_TRANSLATIONS[speaker.role][currentLanguage]
                          }
                        </span>
                      </div>
                      
                      <div className="col-span-2">
                        {speaker.email ? (
                          <span className="text-white/80 text-sm">{speaker.email}</span>
                        ) : (
                          <span className="text-white/40 text-sm italic">No email</span>
                        )}
                      </div>
                      
                      <div className="col-span-2">
                        {speaker.phone ? (
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-white/60" />
                            <span className="text-white/80 text-sm">{speaker.phone}</span>
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm italic">No phone</span>
                        )}
                      </div>
                      
                      <div className="col-span-1">
                        {speaker.bio ? (
                          <div className="flex items-start space-x-2">
                            <MessageSquare className="w-4 h-4 text-white/60 mt-0.5 flex-shrink-0" />
                          </div>
                        ) : (
                          <span className="text-white/40 text-sm italic">-</span>
                        )}
                      </div>
                      
                      <div className="col-span-1 flex justify-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleEditSpeaker(index)}
                          disabled={disabled}
                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this speaker?')) {
                              handleDeleteSpeaker(index);
                            }
                          }}
                          disabled={disabled}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
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

      {/* Add Speaker Form */}
      {showAddForm && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center space-x-2 mb-4">
            <Plus className="w-4 h-4 text-[#FCB283]" />
            <h4 className="text-lg font-medium text-white">Add New Speaker</h4>
          </div>
          
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Speaker Image
              </label>
              <div className="flex items-center space-x-4">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-white/40" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Image</span>
                  </button>
                  <p className="text-xs text-white/60 mt-1">
                    Supports JPG, PNG, WebP (max 5MB)
                  </p>
                  {errors.image && (
                    <p className="mt-1 text-sm text-red-400">{errors.image}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Speaker Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder="Enter speaker name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Speaker Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as SpeakerRole)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:border-[#FCB283] focus:outline-none transition-colors"
                >
                  {SPEAKER_ROLES.map(role => (
                    <option key={role} value={role} className="bg-[#1a1a2e] text-white">
                      {SPEAKER_ROLE_TRANSLATIONS[role][currentLanguage]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors"
                  placeholder="Enter phone number"
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-400">{errors.contact}</p>
                )}
              </div>
            </div>

            {/* Other Role Input - Show only if role is 'Other' */}
            {formData.role === 'Other' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/90 mb-2">
                Bio / Notes
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none transition-colors resize-none"
                placeholder="Speaker bio, expertise, achievements, etc."
              />
            </div>
          
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSpeaker}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Speaker</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {speakers.length === 0 && !showAddForm && (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <p className="text-white/60 mb-4">No speakers added yet</p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            disabled={disabled}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FCB283] to-[#AA4626] text-white rounded-xl font-medium hover:shadow-lg transition-all mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Speaker</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SpeakerManagement;
