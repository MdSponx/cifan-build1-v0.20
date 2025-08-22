import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTypography } from '../../utils/typography';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import VideoSection from './VideoSection';
import DetailsSection from './DetailsSection';
import AnimatedButton from '../ui/AnimatedButton';
import SubmissionConfirm from './SubmissionConfirm';
import DraftSuccessDialog from '../dialogs/DraftSuccessDialog';
import DeleteConfirmationModal from '../ui/DeleteConfirmationModal';
import ProcessingOverlay, { ProcessingStep } from '../ui/ProcessingOverlay';
import { ApplicationService, FilmApplication, SubmissionProgress } from '../../services/applicationService';

interface ApplicationData {
  id: string;
  userId: string;
  applicationId: string;
  competitionCategory: 'youth' | 'future' | 'world';
  status: 'draft' | 'submitted';
  filmTitle: string;
  filmTitleTh?: string;
  filmLanguage?: string;
  genres: string[];
  format: string;
  duration: number;
  synopsis: string;
  chiangmaiConnection?: string;
  // Submitter/Director data
  submitterName?: string;
  submitterNameTh?: string;
  submitterAge?: number;
  submitterPhone?: string;
  submitterEmail?: string;
  submitterRole?: string;
  submitterCustomRole?: string;
  // Education data
  schoolName?: string;
  studentId?: string;
  universityName?: string;
  faculty?: string;
  universityId?: string;
  // Crew members
  crewMembers?: any[];
  files: {
    filmFile: {
      url: string;
      name: string;
      size: number;
    };
    posterFile: {
      url: string;
      name: string;
      size: number;
    };
    proofFile?: {
      url: string;
      name: string;
      size: number;
    };
  };
  submittedAt: any;
  createdAt: any;
  lastModified: any;
}

interface ApplicationLayoutProps {
  application: ApplicationData;
}

const ApplicationLayout: React.FC<ApplicationLayoutProps> = ({ application }) => {
  const { i18n } = useTranslation();
  const { getClass } = useTypography();
  const currentLanguage = i18n.language as 'en' | 'th';

  const [isEditMode, setIsEditMode] = useState(false);
  const [showSubmissionConfirm, setShowSubmissionConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Draft Success Dialog state
  const [showDraftSuccessDialog, setShowDraftSuccessDialog] = useState(false);
  const [savedApplicationId, setSavedApplicationId] = useState<string>('');

  // Delete Confirmation Modal state
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  
  // Processing Overlay state
  const [showProcessingOverlay, setShowProcessingOverlay] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);

  // Determine if application can be edited (only drafts can be edited)
  const canEdit = application.status === 'draft';

  const handleEditToggle = () => {
    if (canEdit) {
      setIsEditMode(!isEditMode);
    }
  };

  const handleSave = async (updatedData: Partial<ApplicationData>) => {
    // TODO: Implement save functionality
    console.log('Saving updated data:', updatedData);
    setIsEditMode(false);
  };

  const handleSaveDraft = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    try {
      // Update the application's lastModified timestamp
      const docRef = doc(db, 'submissions', application.id);
      await updateDoc(docRef, {
        lastModified: serverTimestamp()
      });

      // Show draft success dialog instead of alert
      setSavedApplicationId(application.id);
      setShowDraftSuccessDialog(true);

    } catch (error) {
      console.error('Error saving draft:', error);
      alert(error instanceof Error ? error.message : 'Failed to save draft');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitApplication = () => {
    setShowSubmissionConfirm(true);
  };

  const handleDeleteApplication = () => {
    if (isProcessing) return;
    // Show delete confirmation modal instead of browser confirm
    setShowDeleteConfirmModal(true);
  };

  const handleConfirmDelete = async () => {
    setIsProcessing(true);
    setShowDeleteConfirmModal(false);
    
    // Initialize processing steps
    const initialSteps: ProcessingStep[] = [
      {
        id: 'validate',
        label: currentLanguage === 'th' ? 'ตรวจสอบใบสมัคร...' : 'Validating application...',
        status: 'pending'
      },
      {
        id: 'delete-film',
        label: currentLanguage === 'th' ? 'ลบไฟล์ภาพยนตร์...' : 'Deleting film file...',
        status: 'pending'
      },
      {
        id: 'delete-poster',
        label: currentLanguage === 'th' ? 'ลบไฟล์โปสเตอร์...' : 'Deleting poster file...',
        status: 'pending'
      },
      {
        id: 'delete-proof',
        label: currentLanguage === 'th' ? 'ลบไฟล์เอกสาร...' : 'Deleting proof file...',
        status: 'pending',
        skip: !application.files.proofFile
      },
      {
        id: 'delete-record',
        label: currentLanguage === 'th' ? 'ลบข้อมูลใบสมัคร...' : 'Removing application record...',
        status: 'pending'
      }
    ];
    
    setProcessingSteps(initialSteps);
    setShowProcessingOverlay(true);

    try {
      // Create application service with progress callback
      const applicationService = new ApplicationService((progress: SubmissionProgress) => {
        setProcessingSteps(prevSteps => {
          const newSteps = [...prevSteps];
          
          // Update steps based on progress
          if (progress.stage === 'validating') {
            newSteps[0] = { ...newSteps[0], status: 'processing', progress: progress.progress };
          } else if (progress.stage === 'updating') {
            // Mark validation as complete
            newSteps[0] = { ...newSteps[0], status: 'completed', progress: 100 };
            
            // Update file deletion steps based on progress percentage
            if (progress.progress <= 40) {
              // Deleting film file (20-40%)
              newSteps[1] = { ...newSteps[1], status: 'processing', progress: ((progress.progress - 20) / 20) * 100 };
            } else if (progress.progress <= 60) {
              // Film file complete, deleting poster (40-60%)
              newSteps[1] = { ...newSteps[1], status: 'completed', progress: 100 };
              newSteps[2] = { ...newSteps[2], status: 'processing', progress: ((progress.progress - 40) / 20) * 100 };
            } else if (progress.progress <= 80) {
              // Poster complete, deleting proof if exists (60-80%)
              newSteps[1] = { ...newSteps[1], status: 'completed', progress: 100 };
              newSteps[2] = { ...newSteps[2], status: 'completed', progress: 100 };
              if (!newSteps[3].skip) {
                newSteps[3] = { ...newSteps[3], status: 'processing', progress: ((progress.progress - 60) / 20) * 100 };
              }
            } else if (progress.progress <= 90) {
              // Files complete, deleting record (80-90%)
              newSteps[1] = { ...newSteps[1], status: 'completed', progress: 100 };
              newSteps[2] = { ...newSteps[2], status: 'completed', progress: 100 };
              if (!newSteps[3].skip) {
                newSteps[3] = { ...newSteps[3], status: 'completed', progress: 100 };
              }
              newSteps[4] = { ...newSteps[4], status: 'processing', progress: ((progress.progress - 80) / 10) * 100 };
            }
          } else if (progress.stage === 'complete') {
            // Mark all as completed
            newSteps.forEach((step, index) => {
              if (!step.skip) {
                newSteps[index] = { ...step, status: 'completed', progress: 100 };
              }
            });
          } else if (progress.stage === 'error') {
            // Mark current step as error
            const currentStepIndex = newSteps.findIndex(step => step.status === 'processing');
            if (currentStepIndex !== -1) {
              newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'error' };
            }
          }
          
          return newSteps;
        });
      });
      
      await applicationService.deleteApplication(application.id);
      
      // Wait a moment to show completion
      setTimeout(() => {
        setShowProcessingOverlay(false);
        window.location.hash = '#my-applications';
      }, 1500);
      
    } catch (error) {
      console.error('Error deleting application:', error);
      
      // Update steps to show error
      setProcessingSteps(prevSteps => {
        const newSteps = [...prevSteps];
        const currentStepIndex = newSteps.findIndex(step => step.status === 'processing');
        if (currentStepIndex !== -1) {
          newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'error' };
        }
        return newSteps;
      });
      
      // Show error and close overlay after delay
      setTimeout(() => {
        setShowProcessingOverlay(false);
        alert(error instanceof Error ? error.message : 'Failed to delete application');
      }, 2000);
      
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isProcessing) {
      setShowDeleteConfirmModal(false);
    }
  };

  const handleSubmissionComplete = () => {
    // Refresh the page or redirect
    window.location.reload();
  };

  // Draft Success Dialog handlers
  const handleSubmitNow = async () => {
    setShowDraftSuccessDialog(false);
    // Open submission confirmation modal
    setShowSubmissionConfirm(true);
  };

  const handleReviewLater = () => {
    setShowDraftSuccessDialog(false);
    // Navigate to applications list
    window.location.hash = '#my-applications';
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleCloseDraftDialog = () => {
    setShowDraftSuccessDialog(false);
    // Stay on current page
  };

  const getCategoryLogo = (category: string) => {
    const logos = {
      youth: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%202.png?alt=media&token=e8be419f-f0b2-4f64-8d7f-c3e8532e2689",
      future: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%203.png?alt=media&token=b66cd708-0dc3-4c05-bc56-b2f99a384287",
      world: "https://firebasestorage.googleapis.com/v0/b/cifan-c41c6.firebasestorage.app/o/site_files%2Ffest_logos%2FGroup%204.png?alt=media&token=84ad0256-2322-4999-8e9f-d2f30c7afa67"
    };
    return logos[category as keyof typeof logos];
  };

  const getCategoryTitle = (category: string) => {
    const titles = {
      youth: {
        th: 'รางวัลหนังสั้นแฟนตาสติกเยาวชน',
        en: 'Youth Fantastic Short Film Award'
      },
      future: {
        th: 'รางวัลหนังสั้นแฟนตาสติกอนาคต',
        en: 'Future Fantastic Short Film Award'
      },
      world: {
        th: 'รางวัลหนังสั้นแฟนตาสติกโลก',
        en: 'World Fantastic Short Film Award'
      }
    };
    return titles[category as keyof typeof titles]?.[currentLanguage] || category;
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      
      {/* Section 1: Film Info Container */}
      <div className="glass-container rounded-2xl p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Poster - Left Side (1/3) */}
          <div className="lg:col-span-1">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 max-w-sm mx-auto lg:mx-0">
              {application.files.posterFile.url ? (
                <img
                  src={application.files.posterFile.url}
                  alt={`${application.filmTitle} Poster`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center text-white/60">
                          <div class="text-4xl mb-2">🖼️</div>
                          <div class="text-sm text-center px-4">
                            ${currentLanguage === 'th' ? 'ไม่สามารถโหลดโปสเตอร์ได้' : 'Poster not available'}
                          </div>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-sm text-center px-4">
                    {currentLanguage === 'th' ? 'ไม่มีโปสเตอร์' : 'No poster available'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Film Info - Right Side (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Film Title and Competition Logo - Same Row */}
            <div className="flex justify-between items-start gap-6">
              {/* Film Title - Left Side */}
              <div className="flex-1">
                <h1 className={`text-2xl sm:text-3xl md:text-4xl ${getClass('header')} mb-2 text-white leading-tight`}>
                  {currentLanguage === 'th' && application.filmTitleTh 
                    ? application.filmTitleTh 
                    : application.filmTitle}
                </h1>
                {((currentLanguage === 'th' && application.filmTitleTh) || (currentLanguage === 'en' && application.filmTitleTh)) && (
                  <h2 className={`text-lg sm:text-xl ${getClass('subtitle')} text-[#FCB283] opacity-80`}>
                    {currentLanguage === 'th' ? application.filmTitle : application.filmTitleTh}
                  </h2>
                )}
              </div>
              
              {/* Competition Logo - Right Side */}
              <div className="text-right flex-shrink-0">
                <img
                  src={getCategoryLogo(application.competitionCategory)}
                  alt={`${application.competitionCategory} competition logo`}
                  className="h-10 sm:h-12 w-auto object-contain ml-auto mb-2"
                />
                <p className={`text-sm ${getClass('subtitle')} text-[#FCB283]`}>
                  {getCategoryTitle(application.competitionCategory)}
                </p>
              </div>
            </div>

            {/* Compact Film Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Format & Duration */}
              <div className="glass-card p-4 rounded-xl">
                <h4 className={`text-sm ${getClass('subtitle')} text-white/80 mb-3`}>
                  {currentLanguage === 'th' ? 'รูปแบบและความยาว' : 'Format & Duration'}
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">
                      {application.format === 'live-action' ? '🎬' : '🎨'}
                    </span>
                    <span className={`${getClass('body')} text-[#FCB283] capitalize`}>
                      {application.format.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">⏱️</span>
                    <span className={`${getClass('body')} text-white`}>
                      {application.duration} {currentLanguage === 'th' ? 'นาที' : 'minutes'}
                    </span>
                  </div>
                  {application.filmLanguage && (
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">🗣️</span>
                      <span className={`${getClass('body')} text-white`}>
                        {application.filmLanguage || 'Thai'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Genres */}
              <div className="glass-card p-4 rounded-xl">
                <h4 className={`text-sm ${getClass('subtitle')} text-white/80 mb-3`}>
                  {currentLanguage === 'th' ? 'แนวภาพยนตร์' : 'Genres'}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {application.genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-[#FCB283]/20 text-[#FCB283] rounded-lg text-xs border border-[#FCB283]/30"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Synopsis */}
            <div>
              <h4 className={`text-lg ${getClass('subtitle')} text-white mb-3`}>
                {currentLanguage === 'th' ? 'เรื่องย่อ' : 'Synopsis'}
              </h4>
              <p className={`${getClass('body')} text-white/90 leading-relaxed`}>
                {application.synopsis}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection to Chiang Mai */}
      {(application as any).chiangmaiConnection && (
        <div className="glass-container rounded-2xl p-6 sm:p-8">
          <h3 className={`text-xl ${getClass('header')} text-white mb-6`}>
            🏔️ {currentLanguage === 'th' ? 'ความเกี่ยวข้องกับเชียงใหม่' : 'Connection to Chiang Mai'}
          </h3>
          <div className="glass-card p-6 rounded-xl">
            <p className={`${getClass('body')} text-white/90 leading-relaxed whitespace-pre-wrap`}>
              {(application as any).chiangmaiConnection}
            </p>
          </div>
        </div>
      )}

      {/* Section 2: Video Only */}
      <VideoSection 
        application={application}
        isEditMode={isEditMode}
        canEdit={canEdit}
      />

      {/* Crew Section */}
      <div className="glass-container rounded-2xl p-6 sm:p-8 overflow-hidden">
        <h3 className={`text-xl ${getClass('header')} text-white mb-6`}>
          👥 {currentLanguage === 'th' ? 'ทีมงาน' : 'Crew'}
        </h3>
        
        {/* Submitter as Head with Contact Information */}
        <div className="mb-6">
          <h4 className={`text-lg ${getClass('subtitle')} text-[#FCB283] mb-4`}>
            {currentLanguage === 'th' ? 'ผู้ส่งผลงาน (หัวหน้าทีม)' : 'Submitter (Team Lead)'}
          </h4>
          <div className="glass-card p-4 rounded-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Personal Information */}
              <div>
                <span className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentLanguage === 'th' ? 'ชื่อ:' : 'Name:'}
                </span>
                <p className={`${getClass('body')} text-white`}>
                  {currentLanguage === 'th' && ((application as any).submitterNameTh || (application as any).directorNameTh)
                    ? ((application as any).submitterNameTh || (application as any).directorNameTh)
                    : ((application as any).submitterName || (application as any).directorName)
                  }
                </p>
                {((application as any).submitterNameTh || (application as any).directorNameTh) && currentLanguage === 'en' && (
                  <p className={`${getClass('body')} text-white/60 text-xs`}>
                    {(application as any).submitterNameTh || (application as any).directorNameTh}
                  </p>
                )}
              </div>
              
              {/* Contact Information */}
              <div>
                <span className={`text-sm ${getClass('body')} text-white/60`}>
                  {currentLanguage === 'th' ? 'ติดต่อ:' : 'Contact:'}
                </span>
                <div className="space-y-1">
                  <p className={`${getClass('body')} text-white text-sm break-all`}>
                    📧 {(application as any).submitterEmail || (application as any).directorEmail}
                  </p>
                  <p className={`${getClass('body')} text-white text-sm`}>
                    📱 {(application as any).submitterPhone || (application as any).directorPhone}
                  </p>
                </div>
              </div>
              
              {/* Role and Details */}
              <div>
                <div className="space-y-2">
                  <div>
                    <span className={`text-sm ${getClass('body')} text-white/60`}>
                      {currentLanguage === 'th' ? 'บทบาท:' : 'Role:'}
                    </span>
                    <p className={`${getClass('body')} text-white`}>
                      {(application as any).submitterRole === 'Other'
                        ? (application as any).submitterCustomRole
                        : (application as any).submitterRole
                      }
                    </p>
                  </div>
                  <div>
                    <span className={`text-sm ${getClass('body')} text-white/60`}>
                      {currentLanguage === 'th' ? 'อายุ:' : 'Age:'}
                    </span>
                    <p className={`${getClass('body')} text-white`}>
                      {(application as any).submitterAge} {currentLanguage === 'th' ? 'ปี' : 'years'}
                    </p>
                  </div>
                  {/* Educational Information */}
                  {((application as any).schoolName || (application as any).universityName) && (
                    <div>
                      <span className={`text-sm ${getClass('body')} text-white/60`}>
                        {application.competitionCategory === 'youth' 
                          ? (currentLanguage === 'th' ? 'โรงเรียน:' : 'School:')
                          : (currentLanguage === 'th' ? 'มหาวิทยาลัย:' : 'University:')
                        }
                      </span>
                      <p className={`${getClass('body')} text-white text-sm`}>
                        {(application as any).schoolName || (application as any).universityName}
                      </p>
                      {(application as any).faculty && (
                        <p className={`${getClass('body')} text-white/60 text-xs`}>
                          {(application as any).faculty}
                        </p>
                      )}
                      <p className={`${getClass('body')} text-white/60 text-xs font-mono`}>
                        ID: {(application as any).studentId || (application as any).universityId}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Members Table */}
        {(application as any).crewMembers && (application as any).crewMembers.length > 0 ? (
          <div>
            <h4 className={`text-lg ${getClass('subtitle')} text-white mb-4`}>
              {currentLanguage === 'th' ? 'สมาชิกทีมงาน' : 'Crew Members'}
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full glass-card rounded-xl border border-white/10 min-w-[600px]">
                <thead>
                  <tr className="bg-gradient-to-r from-[#AA4626] to-[#FCB283]">
                    <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                      {currentLanguage === 'th' ? 'ชื่อ' : 'Name'}
                    </th>
                    <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                      {currentLanguage === 'th' ? 'บทบาท' : 'Role'}
                    </th>
                    <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                      {currentLanguage === 'th' ? 'อายุ' : 'Age'}
                    </th>
                    <th className={`px-4 py-3 text-left ${getClass('subtitle')} text-white text-sm`}>
                      {currentLanguage === 'th' ? 'ติดต่อ' : 'Contact'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(application as any).crewMembers.map((member: any, index: number) => (
                    <tr key={index} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                      <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                        <div>
                          <div>{member.fullName}</div>
                          {member.fullNameTh && (
                            <div className="text-xs text-white/60">{member.fullNameTh}</div>
                          )}
                        </div>
                      </td>
                      <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                        {member.role === 'Other' ? member.customRole : member.role}
                      </td>
                      <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                        {member.age} {currentLanguage === 'th' ? 'ปี' : 'years'}
                      </td>
                      <td className={`px-4 py-3 ${getClass('body')} text-white/90 text-sm`}>
                        <div className="space-y-1">
                          {member.phone && (
                            <div className="text-xs">📱 {member.phone}</div>
                          )}
                          {member.email && (
                            <div className="text-xs">📧 {member.email}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 rounded-xl text-center">
            <p className={`${getClass('body')} text-white/60`}>
              {currentLanguage === 'th' ? 'ไม่มีสมาชิกทีมงานเพิ่มเติม' : 'No additional crew members'}
            </p>
          </div>
        )}
      </div>

      {/* Section 4: Action Buttons */}
      <div className="flex justify-between items-center">
        
        {/* Delete Button - Bottom Left */}
        {canEdit && (
          <AnimatedButton
            variant="outline"
            size="small"
            icon="🗑️"
            onClick={handleDeleteApplication}
            className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {currentLanguage === 'th' ? 'ลบ' : 'Delete'}
          </AnimatedButton>
        )}

        {/* Spacer for non-editable applications */}
        {!canEdit && <div></div>}

        {/* Submit + Save Draft Buttons - Bottom Right */}
        {canEdit && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <AnimatedButton
              variant="secondary"
              size="small"
              icon="💾"
              onClick={handleSaveDraft}
              className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {currentLanguage === 'th' ? 'บันทึกร่าง' : 'Save Draft'}
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              size="small"
              icon="📤"
              onClick={handleSubmitApplication}
              className={isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            >
              {currentLanguage === 'th' ? 'ส่งใบสมัคร' : 'Submit'}
            </AnimatedButton>
          </div>
        )}
      </div>

      {/* Submission Confirmation Modal */}
      <SubmissionConfirm
        application={application as unknown as FilmApplication}
        isOpen={showSubmissionConfirm}
        onClose={() => setShowSubmissionConfirm(false)}
        onSubmitted={handleSubmissionComplete}
      />

      {/* Draft Success Dialog */}
      <DraftSuccessDialog
        isOpen={showDraftSuccessDialog}
        onClose={handleCloseDraftDialog}
        onSubmitNow={handleSubmitNow}
        onReviewLater={handleReviewLater}
        applicationId={savedApplicationId}
        isDraft={true}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isProcessing={isProcessing}
        itemName={application.filmTitle}
      />

      {/* Processing Overlay */}
      <ProcessingOverlay
        isVisible={showProcessingOverlay}
        steps={processingSteps}
      />
    </div>
  );
};

export default ApplicationLayout;
