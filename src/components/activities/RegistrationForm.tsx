import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RegistrationFormData,
  RegistrationFormProps,
  RegistrationValidationErrors,
  REGISTRATION_VALIDATION_RULES,
  PARTICIPANT_CATEGORY_OPTIONS,
  ParticipantCategory
} from '../../types/registration.types';

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  activityId,
  activityName,
  maxParticipants,
  currentRegistrations,
  registrationDeadline,
  onSubmit,
  onCancel,
  isLoading = false,
  errors = {}
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<RegistrationFormData>({
    participantName: '',
    participantNameEn: '',
    email: '',
    phone: '',
    category: 'general_public',
    occupation: '',
    organization: '',
    additionalNotes: ''
  });
  const [localErrors, setLocalErrors] = useState<RegistrationValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate available spots
  const availableSpots = maxParticipants - currentRegistrations;
  const isActivityFull = availableSpots <= 0;

  // Check if registration deadline has passed
  const isRegistrationClosed = new Date() > new Date(registrationDeadline);

  // Format deadline for display
  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const locale = i18n.language === 'th' ? 'th-TH' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle input changes
  const handleInputChange = (field: keyof RegistrationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field error when user starts typing
    if (localErrors[field] || errors[field]) {
      setLocalErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  // Validate form data
  const validateForm = (): RegistrationValidationErrors => {
    const newErrors: RegistrationValidationErrors = {};

    // Participant name validation
    if (!formData.participantName.trim()) {
      newErrors.participantName = t('registration.errors.nameRequired');
    } else if (formData.participantName.trim().length < REGISTRATION_VALIDATION_RULES.participantName.minLength) {
      newErrors.participantName = t('registration.errors.nameTooShort');
    } else if (!REGISTRATION_VALIDATION_RULES.participantName.pattern.test(formData.participantName)) {
      newErrors.participantName = t('registration.errors.nameInvalidFormat');
    }

    // English name validation (optional)
    if (formData.participantNameEn && formData.participantNameEn.trim()) {
      if (formData.participantNameEn.trim().length < REGISTRATION_VALIDATION_RULES.participantNameEn.minLength!) {
        newErrors.participantNameEn = t('registration.errors.nameEnTooShort');
      } else if (!REGISTRATION_VALIDATION_RULES.participantNameEn.pattern!.test(formData.participantNameEn)) {
        newErrors.participantNameEn = t('registration.errors.nameEnInvalidFormat');
      }
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = t('registration.errors.emailRequired');
    } else if (!REGISTRATION_VALIDATION_RULES.email.pattern.test(formData.email)) {
      newErrors.email = t('registration.errors.emailInvalidFormat');
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = t('registration.errors.phoneRequired');
    } else if (formData.phone.trim().length < REGISTRATION_VALIDATION_RULES.phone.minLength) {
      newErrors.phone = t('registration.errors.phoneTooShort');
    } else if (!REGISTRATION_VALIDATION_RULES.phone.pattern.test(formData.phone)) {
      newErrors.phone = t('registration.errors.phoneInvalidFormat');
    }

    // Category validation
    if (!formData.category) {
      newErrors.category = t('registration.errors.categoryRequired');
    }

    // Optional field validations
    if (formData.occupation && formData.occupation.length > REGISTRATION_VALIDATION_RULES.occupation.maxLength!) {
      newErrors.occupation = t('registration.errors.occupationTooLong');
    }

    if (formData.organization && formData.organization.length > REGISTRATION_VALIDATION_RULES.organization.maxLength!) {
      newErrors.organization = t('registration.errors.organizationTooLong');
    }

    if (formData.additionalNotes && formData.additionalNotes.length > REGISTRATION_VALIDATION_RULES.additionalNotes.maxLength!) {
      newErrors.additionalNotes = t('registration.errors.notesTooLong');
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting || isLoading || isActivityFull || isRegistrationClosed) {
      return;
    }

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLocalErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Registration submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Combine local and prop errors
  const allErrors = { ...localErrors, ...errors };

  // Show registration status
  const showRegistrationStatus = () => {
    if (isRegistrationClosed) {
      return (
        <div className="glass-card rounded-lg p-4 mb-6 border border-red-400/30 bg-gradient-to-br from-red-500/10 to-red-600/10">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-400 header-en">
                {t('registration.status.closed')}
              </h3>
              <p className="mt-1 text-sm text-white/80 body-en">
                {t('registration.status.closedDescription', { 
                  deadline: formatDeadline(registrationDeadline) 
                })}
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (isActivityFull) {
      return (
        <div className="glass-card rounded-lg p-4 mb-6 border border-yellow-400/30 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-400 header-en">
                {t('registration.status.full')}
              </h3>
              <p className="mt-1 text-sm text-white/80 body-en">
                {t('registration.status.fullDescription')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card rounded-lg p-4 mb-6 border border-green-400/30 bg-gradient-to-br from-green-500/10 to-green-600/10">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-400 header-en">
              {t('registration.status.open')}
            </h3>
            <p className="mt-1 text-sm text-white/80 body-en">
              {t('registration.status.openDescription', { 
                available: availableSpots,
                total: maxParticipants,
                deadline: formatDeadline(registrationDeadline)
              })}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Activity Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2 header-en">
          {t('registration.title')}
        </h2>
        <p className="text-lg text-white/80 body-en">
          {activityName}
        </p>
      </div>

      {/* Registration Status */}
      {showRegistrationStatus()}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Participant Name (Thai) */}
          <div>
            <label htmlFor="participantName" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.participantName')} <span className="text-[#FCB283]">*</span>
            </label>
            <input
              type="text"
              id="participantName"
              value={formData.participantName}
              onChange={(e) => handleInputChange('participantName', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.participantName ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.participantNamePlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.participantName.maxLength}
            />
            {allErrors.participantName && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.participantName}</p>
            )}
          </div>

          {/* Participant Name (English) - Optional */}
          <div>
            <label htmlFor="participantNameEn" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.participantNameEn')}
            </label>
            <input
              type="text"
              id="participantNameEn"
              value={formData.participantNameEn}
              onChange={(e) => handleInputChange('participantNameEn', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.participantNameEn ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.participantNameEnPlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.participantNameEn.maxLength}
            />
            {allErrors.participantNameEn && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.participantNameEn}</p>
            )}
          </div>
        </div>

        {/* Contact Fields Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.email')} <span className="text-[#FCB283]">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.email ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.emailPlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.email.maxLength}
            />
            {allErrors.email && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.phone')} <span className="text-[#FCB283]">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.phone ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.phonePlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.phone.maxLength}
            />
            {allErrors.phone && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.phone}</p>
            )}
          </div>
        </div>

        {/* Category Field */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-white/90 mb-2 body-en">
            {t('registration.form.category')} <span className="text-[#FCB283]">*</span>
          </label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
              allErrors.category ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
            }`}
            disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
          >
            {PARTICIPANT_CATEGORY_OPTIONS.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                className="bg-gray-800 text-white"
              >
                {i18n.language === 'th' ? option.labelTh : option.label}
              </option>
            ))}
          </select>
          {allErrors.category && (
            <p className="mt-1 text-sm text-red-400 body-en">{allErrors.category}</p>
          )}
        </div>

        {/* Professional Fields Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Occupation - Optional */}
          <div>
            <label htmlFor="occupation" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.occupation')}
            </label>
            <input
              type="text"
              id="occupation"
              value={formData.occupation}
              onChange={(e) => handleInputChange('occupation', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.occupation ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.occupationPlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.occupation.maxLength}
            />
            {allErrors.occupation && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.occupation}</p>
            )}
          </div>

          {/* Organization - Optional */}
          <div>
            <label htmlFor="organization" className="block text-sm font-medium text-white/90 mb-2 body-en">
              {t('registration.form.organization')}
            </label>
            <input
              type="text"
              id="organization"
              value={formData.organization}
              onChange={(e) => handleInputChange('organization', e.target.value)}
              className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 body-en ${
                allErrors.organization ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
              }`}
              placeholder={t('registration.form.organizationPlaceholder')}
              disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
              maxLength={REGISTRATION_VALIDATION_RULES.organization.maxLength}
            />
            {allErrors.organization && (
              <p className="mt-1 text-sm text-red-400 body-en">{allErrors.organization}</p>
            )}
          </div>
        </div>

        {/* Additional Notes - Optional */}
        <div>
          <label htmlFor="additionalNotes" className="block text-sm font-medium text-white/90 mb-2 body-en">
            {t('registration.form.additionalNotes')}
          </label>
          <textarea
            id="additionalNotes"
            rows={4}
            value={formData.additionalNotes}
            onChange={(e) => handleInputChange('additionalNotes', e.target.value)}
            className={`w-full px-4 py-3 bg-white/10 border rounded-lg backdrop-blur-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FCB283] focus:border-[#FCB283] transition-all duration-200 resize-none body-en ${
              allErrors.additionalNotes ? 'border-red-400 bg-red-500/10' : 'border-white/20 hover:border-white/30'
            }`}
            placeholder={t('registration.form.additionalNotesPlaceholder')}
            disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
            maxLength={REGISTRATION_VALIDATION_RULES.additionalNotes.maxLength}
          />
          {allErrors.additionalNotes && (
            <p className="mt-1 text-sm text-red-400 body-en">{allErrors.additionalNotes}</p>
          )}
          <p className="mt-1 text-sm text-white/60 body-en">
            {(formData.additionalNotes || '').length}/{REGISTRATION_VALIDATION_RULES.additionalNotes.maxLength}
          </p>
        </div>

        {/* General Error */}
        {allErrors.general && (
          <div className="glass-card rounded-lg p-4 border border-red-400/30 bg-gradient-to-br from-red-500/10 to-red-600/10">
            <p className="text-sm text-red-400 body-en">{allErrors.general}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="submit"
            disabled={isLoading || isSubmitting || isActivityFull || isRegistrationClosed}
            className={`flex-1 px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 body-en ${
              isLoading || isSubmitting || isActivityFull || isRegistrationClosed
                ? 'glass-button bg-white/5 text-white/40 cursor-not-allowed border-white/10'
                : 'glass-button-primary hover:transform hover:translateY(-1px)'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('registration.form.submitting')}
              </div>
            ) : (
              t('registration.form.submit')
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading || isSubmitting}
            className="flex-1 px-6 py-3 glass-button-secondary rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FCB283] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:transform hover:translateY(-1px) body-en"
          >
            {t('registration.form.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
