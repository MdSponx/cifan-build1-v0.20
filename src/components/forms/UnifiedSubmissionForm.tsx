import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { useAuth } from '../auth/AuthContext';
import { SubmissionService, SubmissionProgress, SubmissionResult } from '../../services/submissionService';
import { YouthFormData, FutureFormData, WorldFormData, FormErrors, CrewMember } from '../../types/form.types';
import { validateEmail, validateAge, getValidationMessages } from '../../utils/formValidation';
import { FILM_ROLES, GENRE_OPTIONS } from '../../utils/formConstants';
import { uploadFile } from '../../utils/fileUpload';
import { generateFilePath } from '../../services/fileUploadService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import FormSection from './FormSection';
import GenreSelector from './GenreSelector';
import FormatSelector from './FormatSelector';
import UnifiedFileUpload from './UnifiedFileUpload';
import FilmSubmissionSelector, { FilmSubmissionType } from './FilmSubmissionSelector';
import CrewManagement from './CrewManagement';
import AgreementCheckboxes from './AgreementCheckboxes';
import NationalitySelector from '../ui/NationalitySelector';
import DraftSuccessDialog from '../dialogs/DraftSuccessDialog';
import AnimatedButton from '../ui/AnimatedButton';
import SubmissionProgressComponent from '../ui/SubmissionProgress';
import ProcessingOverlay, { ProcessingStep } from '../ui/ProcessingOverlay';
import ErrorMessage from './ErrorMessage';
import { VideoMetadata } from '../../services/videoUrlService';

interface UnifiedSubmissionFormProps {
  category: 'youth' | 'future' | 'world';
}

const UnifiedSubmissionForm: React.FC<UnifiedSubmissionFormProps> = ({ category }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const { user, userProfile } = useAuth();
  const currentLanguage = i18n.language as 'en' | 'th';
  const validationMessages = getValidationMessages(currentLanguage);

  // Dialog state
  const [showDraftSuccessDialog, setShowDraftSuccessDialog] = useState(false);
  const [savedApplicationId, setSavedApplicationId] = useState<string>('');

  // Form state
  const [formData, setFormData] = useState<YouthFormData | FutureFormData | WorldFormData>(() => {
    const baseData = {
      userId: user?.uid || '',
      applicationId: `${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      filmTitle: '',
      filmTitleTh: '',
      filmLanguages: ['Thai'],
      genres: [],
      format: '' as 'live-action' | 'animation' | '',
      duration: '',
      synopsis: '',
      chiangmaiConnection: '',
      crewMembers: [],
      // Film submission fields
      filmSubmissionType: 'file' as 'file' | 'youtube' | 'vimeo',
      filmFile: null,
      filmUrl: null,
      filmUrlMetadata: undefined,
      // Other files
      posterFile: null,
      proofFile: null,
      agreement1: false,
      agreement2: false,
      agreement3: false,
      agreement4: false,
      status: 'draft' as const,
      createdAt: new Date(),
      lastModified: new Date()
    };

    if (category === 'youth') {
      return {
        ...baseData,
        nationality: 'Thailand',
        filmLanguages: ['Thai'],
        submitterName: '',
        submitterNameTh: '',
        submitterAge: '',
        submitterPhone: '',
        submitterEmail: user?.email || '',
        submitterRole: '',
        submitterCustomRole: '',
        schoolName: '',
        studentId: ''
      } as YouthFormData;
    } else if (category === 'future') {
      return {
        ...baseData,
        nationality: 'Thailand',
        filmLanguages: ['Thai'],
        submitterName: '',
        submitterNameTh: '',
        submitterAge: '',
        submitterPhone: '',
        submitterEmail: user?.email || '',
        submitterRole: '',
        submitterCustomRole: '',
        universityName: '',
        faculty: '',
        universityId: ''
      } as FutureFormData;
    } else {
      return {
        ...baseData,
        filmLanguages: ['Thai'],
        submitterName: '',
        submitterNameTh: '',
        submitterAge: '',
        submitterPhone: '',
        submitterEmail: user?.email || '',
        submitterRole: '',
        submitterCustomRole: ''
      } as WorldFormData;
    }
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  // New sequential processing state management
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressSteps, setProgressSteps] = useState<ProcessingStep[]>([]);
  const [error, setError] = useState<string>('');
  
  // Legacy state for compatibility (kept but not used in new flow)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<SubmissionProgress | undefined>();
  const [saveResult, setSaveResult] = useState<SubmissionResult | undefined>();

  // Handle successful draft save with useEffect to ensure proper state transitions
  useEffect(() => {
    if (saveResult?.success && saveResult?.isDraft) {
      // Don't clear states here - just set the dialog data and show dialog
      setSavedApplicationId(saveResult.submissionId || '');
      setShowDraftSuccessDialog(true);
    }
  }, [saveResult]);

  // Fetch user profile data and populate form
  useEffect(() => {
    if (userProfile) {
      // Pre-populate submitter/director information from user profile
      const profileData = {
        submitterName: userProfile.fullNameEN || '',
        submitterNameTh: userProfile.fullNameTH || '',
        submitterAge: userProfile.age ? userProfile.age.toString() : '',
        submitterPhone: userProfile.phoneNumber || '',
        submitterEmail: userProfile.email || user?.email || '',
      };
      
      setFormData(prev => ({ ...prev, ...profileData }));
    }
  }, [user, userProfile]);
  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const content = {
    th: {
      pageTitle: {
        youth: "สมัครประกวดภาพยนตร์สั้นแฟนตาสติกเยาวชน",
        future: "สมัครประกวดภาพยนตร์สั้นแฟนตาสติกอนาคต",
        world: "สมัครประกวดภาพยนตร์สั้นแฟนตาสติกโลก"
      },
      
      // Section titles
      filmInfoTitle: "ข้อมูลภาพยนตร์",
      submitterInfoTitle: "ข้อมูลผู้ส่งผลงาน",
      crewTitle: "ข้อมูลทีมงาน",
      filesTitle: "ไฟล์ที่แนบ",
      agreementsTitle: "ข้อตกลงและเงื่อนไข",
      
      // Form fields
      filmTitle: "ชื่อภาพยนตร์ (ภาษาอังกฤษ)",
      filmTitleTh: "ชื่อภาพยนตร์ (ภาษาไทย)",
      duration: "ความยาว (นาที)",
      synopsis: "เรื่องย่อ",
      chiangmaiConnection: "ความเกี่ยวข้องกับเชียงใหม่",
      
      submitterName: "ชื่อ-นามสกุล",
      submitterNameTh: "ชื่อ-นามสกุล (ภาษาไทย)",
      age: "อายุ",
      phone: "เบอร์โทรศัพท์",
      email: "อีเมล",
      roleInFilm: "บทบาทในภาพยนตร์",
      schoolName: "ชื่อโรงเรียน",
      studentId: "รหัสนักเรียน",
      universityName: "ชื่อมหาวิทยาลัย",
      faculty: "คณะ/สาขา",
      universityId: "รหัสนักศึกษา",
      
      selectRole: "เลือกบทบาท",
      specifyRole: "ระบุบทบาท",
      
      filmFile: "ไฟล์ภาพยนตร์",
      posterFile: "โปสเตอร์ภาพยนตร์",
      proofFile: "หลักฐาน",
      
      saveDraft: "บันทึกร่าง",
      saving: "กำลังบันทึก...",
      
      draftExplanation: "ใบสมัครจะยังไม่ถูกส่งจนกว่าคุณจะตรวจสอบและส่งใบสมัครอย่างเป็นทางการ คุณสามารถแก้ไขร่างได้ตลอดเวลา",
      draftNote: "หมายเหตุ: การบันทึกร่างจะไม่ส่งใบสมัครของคุณเข้าประกวด"
    },
    en: {
      pageTitle: {
        youth: "Youth Fantastic Short Film Award Application",
        future: "Future Fantastic Short Film Award Application",
        world: "World Fantastic Short Film Award Application"
      },
      
      // Section titles
      filmInfoTitle: "Film Information",
      submitterInfoTitle: "Submitter Information",
      crewTitle: "Crew Information",
      filesTitle: "Attached Files",
      agreementsTitle: "Terms & Conditions",
      
      // Form fields
      filmTitle: "Film Title (English)",
      filmTitleTh: "Film Title (Thai)",
      duration: "Duration (minutes)",
      synopsis: "Synopsis",
      chiangmaiConnection: "Connection to Chiang Mai",
      
      submitterName: "Full Name",
      submitterNameTh: "Full Name (Thai)",
      age: "Age",
      phone: "Phone Number",
      email: "Email",
      roleInFilm: "Role in Film",
      schoolName: "School Name",
      studentId: "Student ID",
      universityName: "University Name",
      faculty: "Faculty/Department",
      universityId: "Student ID",
      
      selectRole: "Select Role",
      specifyRole: "Specify Role",
      
      filmFile: "Film File",
      posterFile: "Film Poster",
      proofFile: "Proof Document",
      
      saveDraft: "Save Draft",
      saving: "Saving...",
      
      draftExplanation: "Your application will not be submitted until you review and officially submit your draft. You can edit your draft at any time.",
      draftNote: "Note: Saving as draft will not submit your application to the competition"
    }
  };

  const currentContent = content[currentLanguage];

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};

    // Film Information
    if (!formData.filmTitle.trim()) errors.filmTitle = validationMessages.required;
    // Thai Film Title is now optional for all nationalities (no validation required)
    if (!formData.genres || formData.genres.length === 0) errors.genres = validationMessages.required;
    if (!formData.format) errors.format = validationMessages.formatRequired;
    if (!formData.duration || parseInt(formData.duration) <= 0) errors.duration = validationMessages.required;
    if (!formData.synopsis.trim()) errors.synopsis = validationMessages.required;

    // Submitter/Director Information
    const isWorldCategory = category === 'world';
    const nameField = isWorldCategory ? 'directorName' : 'submitterName';
    const nameThField = isWorldCategory ? 'directorNameTh' : 'submitterNameTh';
    const ageField = isWorldCategory ? 'directorAge' : 'submitterAge';
    const phoneField = isWorldCategory ? 'directorPhone' : 'submitterPhone';
    const emailField = isWorldCategory ? 'directorEmail' : 'submitterEmail';
    const roleField = isWorldCategory ? 'directorRole' : 'submitterRole';

    const name = (formData as YouthFormData | FutureFormData | WorldFormData).submitterName;
    const nameTh = (formData as YouthFormData | FutureFormData | WorldFormData).submitterNameTh;
    const age = (formData as YouthFormData | FutureFormData | WorldFormData).submitterAge;
    const phone = (formData as YouthFormData | FutureFormData | WorldFormData).submitterPhone;
    const email = (formData as YouthFormData | FutureFormData | WorldFormData).submitterEmail;
    const role = (formData as YouthFormData | FutureFormData | WorldFormData).submitterRole;

    if (!name?.trim()) errors[nameField] = validationMessages.required;
    if (isThaiNationality && !nameTh?.trim()) errors[nameThField] = validationMessages.required;
    if (!age) errors[ageField] = validationMessages.required;
    else {
      const ageNum = parseInt(age.toString());
      // Age validation based on category
      if (category === 'youth' && (ageNum < 12 || ageNum > 18)) {
        errors[ageField] = currentLanguage === 'th' ? 'อายุต้องอยู่ระหว่าง 12-18 ปี' : 'Age must be between 12-18 years';
      } else if (category === 'future' && (ageNum < 18 || ageNum > 25)) {
        errors[ageField] = currentLanguage === 'th' ? 'อายุต้องไม่เกิน 25 ปี' : 'Age must not exceed 25 years';
      }
      else if (category === 'world' && ageNum < 20) {
        errors[ageField] = currentLanguage === 'th' ? 'อายุต้องไม่น้อยกว่า 20 ปี' : 'Age must be at least 20 years';
      }
    }
    if (!phone?.trim()) errors[phoneField] = validationMessages.required;
    if (!email?.trim()) {
      errors[emailField] = validationMessages.required;
    } else if (!validateEmail(email)) {
      errors[emailField] = validationMessages.invalidEmail;
    }
    if (!role) errors[roleField] = validationMessages.required;

    // Education fields (not required for world category)
    if (category === 'youth') {
      const youthData = formData as YouthFormData;
      if (!youthData.schoolName?.trim()) errors.schoolName = validationMessages.required;
      if (!youthData.studentId?.trim()) errors.studentId = validationMessages.required;
    } else if (category === 'future') {
      const futureData = formData as FutureFormData;
      if (!futureData.universityName?.trim()) errors.universityName = validationMessages.required;
      if (!futureData.faculty?.trim()) errors.faculty = validationMessages.required;
      if (!futureData.universityId?.trim()) errors.universityId = validationMessages.required;
    }

    // Agreements - not required for draft
    // if (!formData.agreement1 || !formData.agreement2 || !formData.agreement3 || !formData.agreement4) {
    //   errors.agreements = validationMessages.allAgreementsRequired;
    // }

    return errors;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleGenreChange = (genres: string[]) => {
    handleInputChange('genres', genres);
  };

  const handleFormatChange = (format: 'live-action' | 'animation') => {
    handleInputChange('format', format);
  };

  const handleFileChange = (fileType: string, file: File | null) => {
    handleInputChange(fileType, file);
  };

  const handleCrewMembersChange = (crewMembers: CrewMember[]) => {
    handleInputChange('crewMembers', crewMembers);
  };

  const handleAgreementChange = (name: string, checked: boolean) => {
    handleInputChange(name, checked);
  };

  const handleNationalityChange = (nationality: string) => {
    handleInputChange('nationality', nationality);
  };

  const handleFilmLanguageChange = (language: string) => {
    handleInputChange('filmLanguage', language);
  };

  const handleFilmLanguagesChange = (languages: string[]) => {
    handleInputChange('filmLanguages', languages);
  };

  // Film submission handlers
  const handleSubmissionTypeChange = (type: FilmSubmissionType) => {
    handleInputChange('filmSubmissionType', type);
    // Clear the other submission method when switching
    if (type === 'file') {
      handleInputChange('filmUrl', null);
      handleInputChange('filmUrlMetadata', undefined);
    } else {
      handleInputChange('filmFile', null);
    }
  };

  const handleUrlChange = (url: string) => {
    handleInputChange('filmUrl', url);
  };

  const handleMetadataExtracted = (metadata: VideoMetadata | null) => {
    handleInputChange('filmUrlMetadata', metadata);
  };
  // Compute Thai nationality status for validation and rendering
  const isThaiNationality = (category === 'youth' || category === 'future') && 
    (formData as YouthFormData | FutureFormData).nationality === 'Thailand';


  // Helper functions for sequential processing
  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const updateStepProgress = (stepId: string, progress: number) => {
    setProgressSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, progress } : step
    ));
  };

  // Helper function for single file upload
  const uploadSingleFile = async (draftId: string, fieldName: string, file: File, onProgress: (progress: number) => void) => {
    // Map fieldName to the correct type expected by generateFilePath
    const fileType = fieldName === 'filmFile' ? 'film' : fieldName === 'posterFile' ? 'poster' : 'proof';
    const fileMetadata = await uploadFile(file, generateFilePath(draftId, fileType, file.name), onProgress);
    
    // Update the specific file field in Firestore
    await updateDoc(doc(db, 'submissions', draftId), {
      [`files.${fieldName}`]: {
        ...fileMetadata,
        uploadedAt: serverTimestamp()
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Scroll to top when submission starts
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // For draft saving, we don't need strict validation
    const errors = validateForm();
    
    // Only check critical errors for draft (not files or agreements)
    const criticalErrors = Object.keys(errors).filter(key => 
      !['filmFile', 'posterFile', 'proofFile', 'agreements'].includes(key)
    );
    
    if (criticalErrors.length > 0) {
      const filteredErrors: FormErrors = {};
      criticalErrors.forEach(key => {
        filteredErrors[key] = errors[key];
      });
      setFormErrors(filteredErrors);
      
      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-field');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Show processing overlay immediately
    setIsProcessing(true);
    setError('');
    setProgressSteps([
      { id: 'create', label: currentLanguage === 'th' ? 'สร้างใบสมัคร...' : 'Creating application...', status: 'pending' },
      { id: 'film', label: currentLanguage === 'th' ? 'อัปโหลดไฟล์ภาพยนตร์...' : 'Uploading film...', status: 'pending', skip: !formData.filmFile },
      { id: 'poster', label: currentLanguage === 'th' ? 'อัปโหลดโปสเตอร์...' : 'Uploading poster...', status: 'pending', skip: !formData.posterFile },
      { id: 'proof', label: currentLanguage === 'th' ? 'อัปโหลดเอกสาร...' : 'Uploading document...', status: 'pending', skip: !formData.proofFile },
      { id: 'finalize', label: currentLanguage === 'th' ? 'สรุปผล...' : 'Finalizing...', status: 'pending' }
    ]);

    try {
      // STEP 1: Create application without files
      updateStepStatus('create', 'processing');
      const basicData = { ...formData, filmFile: null, posterFile: null, proofFile: null };
      
      const submissionService = new SubmissionService();
      let draftResult: SubmissionResult;

      if (category === 'youth') {
        draftResult = await submissionService.saveDraftYouthForm(basicData as YouthFormData);
      } else if (category === 'future') {
        draftResult = await submissionService.saveDraftFutureForm(basicData as FutureFormData);
      } else {
        draftResult = await submissionService.saveDraftWorldForm(basicData as WorldFormData);
      }

      if (!draftResult.success) {
        throw new Error(draftResult.error || 'Failed to create application');
      }

      updateStepStatus('create', 'completed');
      const draftId = draftResult.submissionId!;
      
      // STEP 2: Upload film file (SEQUENTIAL - not concurrent)
      if (formData.filmFile) {
        updateStepStatus('film', 'processing');
        await uploadSingleFile(draftId, 'filmFile', formData.filmFile, (progress) => {
          updateStepProgress('film', progress);
        });
        updateStepStatus('film', 'completed');
      }
      
      // STEP 3: Upload poster file (AFTER film is done)
      if (formData.posterFile) {
        updateStepStatus('poster', 'processing');
        await uploadSingleFile(draftId, 'posterFile', formData.posterFile, (progress) => {
          updateStepProgress('poster', progress);
        });
        updateStepStatus('poster', 'completed');
      }
      
      // STEP 4: Upload proof file (AFTER poster is done)
      if (formData.proofFile) {
        updateStepStatus('proof', 'processing');
        await uploadSingleFile(draftId, 'proofFile', formData.proofFile, (progress) => {
          updateStepProgress('proof', progress);
        });
        updateStepStatus('proof', 'completed');
      }
      
      // STEP 5: Finalize
      updateStepStatus('finalize', 'processing');
      // Any final updates needed
      updateStepStatus('finalize', 'completed');
      
      // Success!
      setIsProcessing(false);
      setSavedApplicationId(draftId);
      setShowDraftSuccessDialog(true);
      
    } catch (error) {
      console.error('Sequential upload error:', error);
      setIsProcessing(false);
      setError(error instanceof Error ? error.message : 'Failed to save draft');
    }
  };

  const getCategoryLogo = () => {
    const logos = {
      youth: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689",
      future: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287",
      world: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67"
    };
    return logos[category];
  };

  const handleSubmitNow = () => {
    if (savedApplicationId) {
      // Add a small delay to ensure dialog state is properly managed
      setShowDraftSuccessDialog(false);
      setTimeout(() => {
        window.location.hash = `#application-detail/${savedApplicationId}`;
        // Ensure scroll happens after route change
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 200);
      }, 100);
    }
  };

  const handleReviewLater = () => {
    setShowDraftSuccessDialog(false);
    setTimeout(() => {
      window.location.hash = '#my-applications';
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    }, 100);
  };

  const handleCloseDraftDialog = () => {
    setShowDraftSuccessDialog(false);
    // Default to applications list if user closes dialog
    setTimeout(() => {
      window.location.hash = '#my-applications';
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 200);
    }, 300);
  };

  // Show submission progress
  if (uploadProgress) {
    return (
      <div className="min-h-screen bg-[#110D16] pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <SubmissionProgressComponent 
            progress={uploadProgress}
          />
        </div>
      </div>
    );
  }

  // Show error screen only for failed submissions
  if (saveResult && !saveResult.success) {
    return (
      <div className="min-h-screen bg-[#110D16] pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-container rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">❌</div>
            <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
              {currentLanguage === 'th' ? 'เกิดข้อผิดพลาด' : 'Error Occurred'}
            </h2>
            <p className={`text-white/80 ${getClass('body')} mb-6`}>
              {saveResult.error}
            </p>
            <AnimatedButton
              variant="primary"
              size="medium"
              onClick={() => {
                setIsSubmitting(false);
                setSaveResult(undefined);
                setUploadProgress(undefined);
              }}
            >
              {currentLanguage === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  // Show error screen for sequential processing errors
  if (error) {
    return (
      <div className="min-h-screen bg-[#110D16] pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-container rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="text-6xl mb-6">❌</div>
            <h2 className={`text-2xl ${getClass('header')} mb-4 text-white`}>
              {currentLanguage === 'th' ? 'เกิดข้อผิดพลาด' : 'Error Occurred'}
            </h2>
            <p className={`text-white/80 ${getClass('body')} mb-6`}>
              {error}
            </p>
            <AnimatedButton
              variant="primary"
              size="medium"
              onClick={() => {
                setError('');
                setIsProcessing(false);
                setProgressSteps([]);
              }}
            >
              {currentLanguage === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110D16] pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img 
              src={getCategoryLogo()}
              alt={`${category} Competition Logo`}
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
          <h1 className={`text-2xl sm:text-3xl ${getClass('header')} mb-4 text-white`}>
            {currentContent.pageTitle[category]}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Nationality Selector (for all categories) */}
          <div className="overflow-visible relative z-10">
            <NationalitySelector
              onNationalityChange={handleNationalityChange}
              onNationalityTypeChange={() => {}} // No longer needed but kept for compatibility
              onFilmLanguagesChange={handleFilmLanguagesChange}
              filmLanguages={formData.filmLanguages}
            />
          </div>


          {/* Section 2: Film Information */}
          <FormSection title={currentContent.filmInfoTitle} icon="🎬" className="overflow-visible relative">
            <div className="space-y-6">
              {/* Film Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.filmTitle} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.filmTitle}
                    onChange={(e) => handleInputChange('filmTitle', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.filmTitle ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                  />
                  <ErrorMessage error={formErrors.filmTitle} />
                </div>
                
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.filmTitleTh} <span className="text-white/60">({currentLanguage === 'th' ? 'ไม่บังคับ' : 'Optional'})</span>
                  </label>
                  <input
                    type="text"
                    value={formData.filmTitleTh || ''}
                    onChange={(e) => handleInputChange('filmTitleTh', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.filmTitleTh ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    placeholder={currentLanguage === 'th' ? 'ชื่อภาพยนตร์ภาษาไทย (ไม่บังคับ)' : 'Film title in Thai (optional)'}
                  />
                  <ErrorMessage error={formErrors.filmTitleTh} />
                </div>
              </div>
              
              {/* Genre Selector */}
              <GenreSelector
                value={formData.genres}
                onChange={handleGenreChange}
                error={formErrors.genres}
                required
                label={currentLanguage === 'th' ? 'แนวภาพยนตร์' : 'Genre'}
              />
              
              {/* Format Selector */}
              <FormatSelector
                value={formData.format}
                onChange={handleFormatChange}
                error={formErrors.format}
                required
                label={currentLanguage === 'th' ? 'รูปแบบภาพยนตร์' : 'Film Format'}
              />
              
              {/* Duration */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.duration} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  min="1"
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.duration ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={formErrors.duration} />
              </div>
            
              {/* Synopsis */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.synopsis} <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.synopsis}
                  onChange={(e) => handleInputChange('synopsis', e.target.value)}
                  rows={4}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.synopsis ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical`}
                />
                <ErrorMessage error={formErrors.synopsis} />
              </div>
            
              {/* Chiang Mai Connection */}
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.chiangmaiConnection}
                </label>
                <textarea
                  value={formData.chiangmaiConnection}
                  onChange={(e) => handleInputChange('chiangmaiConnection', e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none resize-vertical"
                />
              </div>
            </div>
          </FormSection>

          {/* Section 3: Submitter/Director Information (Pre-filled from Profile) */}
          <FormSection title={currentContent.submitterInfoTitle} icon="👤" className="overflow-visible relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible">
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.submitterName} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterName}
                  onChange={(e) => handleInputChange('submitterName', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={formErrors.submitterName} />
              </div>
              
              {((category === 'youth' || category === 'future') && (formData as YouthFormData | FutureFormData).nationality === 'Thailand') && (
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.submitterNameTh} <span className="text-white/60">({currentLanguage === 'th' ? 'ไม่บังคับ' : 'Optional'})</span>
                  </label>
                  <input
                    type="text"
                    value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterNameTh || ''}
                    onChange={(e) => handleInputChange('submitterNameTh', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterNameTh ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    placeholder={currentLanguage === 'th' ? 'ชื่อ-นามสกุลภาษาไทย (ไม่บังคับ)' : 'Full name in Thai (optional)'}
                  />
                  <ErrorMessage error={formErrors.submitterNameTh} />
                </div>
              )}
              
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.age} <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterAge}
                  onChange={(e) => handleInputChange('submitterAge', e.target.value)}
                  min={category === 'youth' ? "12" : category === 'future' ? "18" : "1"}
                  max={category === 'youth' ? "18" : category === 'future' ? "25" : "120"}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterAge ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                {/* Age restriction warning */}
                <p className={`text-xs ${getClass('body')} text-white/60 mt-1`}>
                  {category === 'youth' && (currentLanguage === 'th' ? 'อายุ 12-18 ปี (นักเรียนมัธยมศึกษา)' : 'Age 12-18 years (High school students)')}
                  {category === 'future' && (currentLanguage === 'th' ? 'อายุไม่เกิน 25 ปี (นักศึกษาอุดมศึกษา)' : 'Age up to 25 years (University students)')}
                  {category === 'world' && (currentLanguage === 'th' ? 'อายุไม่น้อยกว่า 20 ปี (ประชาชนทั่วไป)' : 'Age 20+ years (General public)')}
                </p>
                <ErrorMessage error={formErrors.submitterAge} />
              </div>
              
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.phone} <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterPhone}
                  onChange={(e) => handleInputChange('submitterPhone', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterPhone ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={formErrors.submitterPhone} />
              </div>
              
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.email} <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterEmail}
                  onChange={(e) => handleInputChange('submitterEmail', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterEmail ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                />
                <ErrorMessage error={formErrors.submitterEmail} />
              </div>
              
              <div>
                <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                  {currentContent.roleInFilm} <span className="text-red-400">*</span>
                </label>
                <select
                  value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterRole}
                  onChange={(e) => handleInputChange('submitterRole', e.target.value)}
                  className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterRole ? 'border-red-400 error-field' : 'border-white/20'} text-white focus:border-[#FCB283] focus:outline-none`}
                >
                  <option value="" className="bg-[#110D16]">{currentContent.selectRole}</option>
                  {FILM_ROLES.map(role => (
                    <option key={role} value={role} className="bg-[#110D16]">
                      {role}
                    </option>
                  ))}
                </select>
                <ErrorMessage error={formErrors.submitterRole} />
              </div>
              
              {(formData as YouthFormData | FutureFormData | WorldFormData).submitterRole === 'Other' && (
                <div>
                  <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                    {currentContent.specifyRole} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={(formData as YouthFormData | FutureFormData | WorldFormData).submitterCustomRole || ''}
                    onChange={(e) => handleInputChange('submitterCustomRole', e.target.value)}
                    className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.submitterCustomRole ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    placeholder={currentLanguage === 'th' ? 'ระบุบทบาทของคุณ' : 'Specify your role'}
                  />
                  <ErrorMessage error={formErrors.submitterCustomRole} />
                </div>
              )}
              
              {/* Education Fields */}
              {category === 'youth' && (
                <>
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.schoolName} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as YouthFormData).schoolName}
                      onChange={(e) => handleInputChange('schoolName', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.schoolName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.schoolName} />
                  </div>
                  
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.studentId} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as YouthFormData).studentId}
                      onChange={(e) => handleInputChange('studentId', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.studentId ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.studentId} />
                  </div>
                </>
              )}
              
              {category === 'future' && (
                <>
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.universityName} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as FutureFormData).universityName}
                      onChange={(e) => handleInputChange('universityName', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.universityName ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.universityName} />
                  </div>
                  
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.faculty} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as FutureFormData).faculty}
                      onChange={(e) => handleInputChange('faculty', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.faculty ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.faculty} />
                  </div>
                  
                  <div>
                    <label className={`block text-white/90 ${getClass('body')} mb-2`}>
                      {currentContent.universityId} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={(formData as FutureFormData).universityId}
                      onChange={(e) => handleInputChange('universityId', e.target.value)}
                      className={`w-full p-3 rounded-lg bg-white/10 border ${formErrors.universityId ? 'border-red-400 error-field' : 'border-white/20'} text-white placeholder-white/50 focus:border-[#FCB283] focus:outline-none`}
                    />
                    <ErrorMessage error={formErrors.universityId} />
                  </div>
                </>
              )}
            </div>
          </FormSection>

          {/* Section 4: Crew Information */}
          <CrewManagement
            crewMembers={formData.crewMembers}
            onCrewMembersChange={handleCrewMembersChange}
            isThaiNationality={(category === 'youth' || category === 'future') && (formData as YouthFormData | FutureFormData).nationality === 'Thailand'}
            submitterSchoolName={category === 'youth' ? (formData as YouthFormData).schoolName : undefined}
            submitterUniversityName={category === 'future' ? (formData as FutureFormData).universityName : undefined}
            error={formErrors.crewMembers}
            isWorldForm={category === 'world'}
          />

          {/* Section 5: Film Submission */}
          <FormSection title={currentLanguage === 'th' ? 'การส่งภาพยนตร์' : 'Film Submission'} icon="🎬">
            <FilmSubmissionSelector
              submissionType={formData.filmSubmissionType}
              onSubmissionTypeChange={handleSubmissionTypeChange}
              filmFile={formData.filmFile}
              onFileChange={(file) => handleFileChange('filmFile', file)}
              filmUrl={formData.filmUrl || ''}
              onUrlChange={handleUrlChange}
              onMetadataExtracted={handleMetadataExtracted}
              error={formErrors.filmFile || formErrors.filmUrl}
            />
          </FormSection>

          {/* Section 6: Other Files */}
          <FormSection title={currentContent.filesTitle} icon="📁">
            <div className="space-y-6">
              <UnifiedFileUpload
                mode="upload"
                name="posterFile"
                label={currentContent.posterFile}
                accept=".jpg,.jpeg,.png"
                fileType="IMAGE"
                onFileChange={(file) => handleFileChange('posterFile', file)}
                currentFile={formData.posterFile}
                error={formErrors.posterFile}
              />
              
              <UnifiedFileUpload
                mode="upload"
                name="proofFile"
                label={currentContent.proofFile}
                accept={category === 'youth' ? ".pdf,.jpg,.jpeg,.png" : "image/*,.pdf"}
                fileType="DOCUMENT"
                onFileChange={(file) => handleFileChange('proofFile', file)}
                currentFile={formData.proofFile}
                error={formErrors.proofFile}
              />
            </div>
          </FormSection>

          {/* Section 7: Agreements */}
          <AgreementCheckboxes
            agreements={{
              agreement1: formData.agreement1,
              agreement2: formData.agreement2,
              agreement3: formData.agreement3,
              agreement4: formData.agreement4
            }}
            onChange={handleAgreementChange}
            error={formErrors.agreements}
          />

          {/* Draft Explanation */}
          <div className="glass-container rounded-xl p-6 border-l-4 border-blue-400">
            <div className="flex items-start space-x-3">
              <span className="text-blue-400 text-xl flex-shrink-0">💡</span>
              <div>
                <h4 className={`${getClass('subtitle')} text-blue-400 mb-2`}>
                  {currentLanguage === 'th' ? 'เกี่ยวกับการบันทึกร่าง' : 'About Saving Draft'}
                </h4>
                <p className={`text-sm ${getClass('body')} text-white/80 mb-3 leading-relaxed`}>
                  {currentContent.draftExplanation}
                </p>
                <p className={`text-xs ${getClass('body')} text-white/60 italic`}>
                  {currentContent.draftNote}
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-8">
            <AnimatedButton
              variant="primary"
              size="large"
              icon="💾"
              className={`${getClass('menu')} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={(e) => {
                e?.preventDefault();
                handleSubmit(e as any);
              }}
            >
              {isSubmitting ? currentContent.saving : currentContent.saveDraft}
            </AnimatedButton>
          </div>
        </form>
      </div>

      {/* Draft Success Dialog */}
      <DraftSuccessDialog
        isOpen={showDraftSuccessDialog}
        onClose={handleCloseDraftDialog}
        onSubmitNow={handleSubmitNow}
        onReviewLater={handleReviewLater}
        applicationId={savedApplicationId}
      />

      {/* Processing Overlay */}
      <ProcessingOverlay
        isVisible={isProcessing}
        steps={progressSteps}
      />
    </div>
  );
};

export default UnifiedSubmissionForm;
