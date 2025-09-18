import React from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppProviders from './components/providers/AppProviders';
import { NotificationProvider } from './components/ui/NotificationContext';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute';
import { Navigation, Footer, UserZoneLayout, AdminZoneLayout } from './components/layout';
import { AnimatedBackground } from './components/ui';
import { UnifiedSubmissionForm } from './components/forms';
import AboutPage from './components/pages/AboutPage';
import CompetitionPage from './components/pages/CompetitionPage';
import OneHeroSection from './components/sections/OneHeroSection';
import OfficialSelectionShelf from './components/sections/OfficialSelectionShelf';
import QuickInfoSection from './components/sections/QuickInfoSection';
import ProgramsSection from './components/sections/ProgramsSection';
import EntertainmentExpoSection from './components/sections/EntertainmentExpoSection';
import CompetitionHighlight from './components/sections/CompetitionHighlight';
import WorkshopsSection from './components/sections/WorkshopsSection';
import CityRallySection from './components/sections/CityRallySection';
import NewsSection from './components/sections/NewsSection';
import PartnersSection from './components/sections/PartnersSection';
import CityRallyPage from './components/pages/CityRallyPage';
import SignUpPage from './components/auth/SignUpPage';
import SignInPage from './components/auth/SignInPage';
import VerifyEmailPage from './components/auth/VerifyEmailPage';
import SmartSignUpPage from './components/auth/SmartSignUpPage';
import SmartSignInPage from './components/auth/SmartSignInPage';
import ImprovedVerificationPage from './components/auth/ImprovedVerificationPage';
import ProfileSetupPage from './components/pages/ProfileSetupPage';
import ProfileEditPage from './components/pages/ProfileEditPage';
import MyApplicationsPage from './components/pages/MyApplicationsPage';
import ApplicationDetailPage from './components/pages/ApplicationDetailPage';
import ApplicationEditPage from './components/pages/ApplicationEditPage';
import ComingSoonPage from './components/pages/ComingSoonPage';
import ApplicationsDashboardPage from './components/pages/ApplicationsDashboardPage';
import AdminGalleryPage from './components/pages/AdminGalleryPage';
import YouthCompetitionPage from './components/pages/YouthCompetitionPage';
import FutureCompetitionPage from './components/pages/FutureCompetitionPage';
import WorldCompetitionPage from './components/pages/WorldCompetitionPage';
import AdminProfilePage from './components/pages/AdminProfilePage';
import AdminApplicationDetailPage from './components/pages/AdminApplicationDetailPage';
import PartnerManagementPage from './components/pages/PartnerManagementPage';
import RoleManagement from './components/admin/RoleManagement';
import ActivitiesRouter from './components/admin/ActivitiesRouter';
import SubmissionsRouter from './components/admin/SubmissionsRouter';
import UsersRouter from './components/admin/UsersRouter';
import TermsConditionsPage from './components/pages/TermsConditionsPage';
import PrivacyPolicyPage from './components/pages/PrivacyPolicyPage';
import ActivityDetailPage from './components/pages/ActivityDetailPage';
import PublicActivitiesPage from './components/pages/PublicActivitiesPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import FeatureFilmForm from './components/admin/FeatureFilmForm';
import FeatureFilmGalleryPage from './components/pages/FeatureFilmGalleryPage';
import FeatureFilmDetailPage from './components/pages/FeatureFilmDetailPage';
import PublicFeatureFilmsPage from './components/pages/PublicFeatureFilmsPage';
import PublicFeatureFilmDetailPage from './components/pages/PublicFeatureFilmDetailPage';
import SelectedShortFilmsPage from './components/pages/SelectedShortFilmsPage';
import ShortFilmProgramPage from './components/pages/ShortFilmProgramPage';
import PublicNewsPage from './components/pages/PublicNewsPage';
import PublicNewsDetailPage from './components/pages/PublicNewsDetailPage';
import AdminNewsGallery from './components/admin/AdminNewsGallery';
import AdminNewsForm from './components/admin/AdminNewsForm';
import QuillDropdownTestPage from './components/pages/QuillDropdownTestPage';
import FestivalSchedulePage from './components/pages/FestivalSchedulePage';
import FortuneCardsGalleryPage from './components/pages/FortuneCardsGalleryPage';
import FortuneCardDetailPage from './components/pages/FortuneCardDetailPage';
import FortuneCardsGallery from './components/admin/FortuneCardsGallery';
import { newsService } from './services/newsService';
import { NewsArticle } from './types/news.types';
import { useAuth } from './components/auth/AuthContext';
import { useNotificationHelpers } from './components/ui/NotificationContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { useScrollToTop } from './hooks/useScrollToTop';

// Component to handle HTML lang attribute
function LanguageHandler() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set the HTML lang attribute based on current language
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}

// Wrapper component for editing news articles that fetches the article data
function NewsEditWrapper({ articleId, onCancel }: { articleId: string; onCancel: () => void }) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        const fetchedArticle = await newsService.getArticleById(articleId);
        setArticle(fetchedArticle);
      } catch (err) {
        console.error('Error fetching article:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch article');
      } finally {
        setLoading(false);
      }
    };

    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  if (loading) {
    return (
      <div className="glass-container rounded-xl p-12 text-center">
        <div className="text-white/40 mb-4">
          <div className="animate-spin w-8 h-8 border-2 border-[#FCB283] border-t-transparent rounded-full mx-auto"></div>
        </div>
        <p className="text-white/70">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="glass-container rounded-xl p-12 text-center">
        <div className="text-red-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Article Not Found</h3>
        <p className="text-white/70 mb-6">{error || 'The requested article could not be found.'}</p>
        <button 
          onClick={onCancel}
          className="px-6 py-3 bg-gradient-to-r from-[#AA4626] to-[#FCB283] text-white rounded-lg hover:from-[#AA4626]/90 hover:to-[#FCB283]/90 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Back to News List
        </button>
      </div>
    );
  }

  return (
    <NewsFormWrapper 
      mode="edit"
      article={article}
      onCancel={onCancel}
    />
  );
}

// Wrapper component for AdminNewsForm that can access useAuth and notifications
function NewsFormWrapper({ mode, article, onCancel }: { mode: 'create' | 'edit'; article?: NewsArticle | null; onCancel: () => void }) {
  const { user } = useAuth();
  const { showSuccess, showError, showLoading, updateToSuccess, updateToError } = useNotificationHelpers();
  
  return (
    <AdminNewsForm 
      mode={mode}
      article={article}
      onSubmit={async (formData) => {
        let loadingId: string | null = null;
        
        try {
          if (!user?.uid) {
            throw new Error('User not authenticated');
          }
          
          // Show loading notification
          loadingId = showLoading(
            mode === 'create' ? 'Creating Article' : 'Updating Article', 
            mode === 'create' ? 'Please wait while we save your article...' : 'Please wait while we update your article...'
          );
          
          // Get user display name or email as author name
          const authorName = user.displayName || user.email || 'Unknown Author';
          
          let result;
          if (mode === 'create') {
            // Create the article
            result = await newsService.createArticle(formData, user.uid, authorName);
          } else {
            // Update the article
            if (!article?.id) {
              throw new Error('Article ID is required for editing');
            }
            result = await newsService.updateArticle(article.id, formData, user.uid);
          }
          
          // Update to success notification
          if (loadingId) {
            updateToSuccess(
              loadingId,
              mode === 'create' ? 'Article Created Successfully!' : 'Article Updated Successfully!',
              `"${result.title}" has been ${mode === 'create' ? 'saved to' : 'updated in'} the news collection.`
            );
          }
          
          // Navigate back to news list after a short delay
          setTimeout(() => {
            onCancel();
          }, 1500);
          
        } catch (error) {
          console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} article:`, error);
          
          // Update to error notification
          if (loadingId) {
            updateToError(
              loadingId,
              mode === 'create' ? 'Failed to Create Article' : 'Failed to Update Article',
              error instanceof Error ? error.message : `An unexpected error occurred while ${mode === 'create' ? 'saving' : 'updating'} the article.`
            );
          } else {
            // Show error notification if no loading notification was shown
            showError(
              mode === 'create' ? 'Failed to Create Article' : 'Failed to Update Article',
              error instanceof Error ? error.message : `An unexpected error occurred while ${mode === 'create' ? 'saving' : 'updating'} the article.`
            );
          }
          
          // Re-throw the error so the form can handle it
          throw error;
        }
      }}
      onCancel={onCancel}
    />
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  // Enable scroll to top on route changes
  useScrollToTop();

  // Listen for navigation clicks
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setCurrentPage(hash || 'home');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Set initial page

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Navigation helper function
  const handleNavigate = (route: string) => {
    window.location.hash = `#${route}`;
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <AboutPage />;
      case 'competition':
        return <CompetitionPage />;
      case 'submit-youth':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UnifiedSubmissionForm category="youth" />
          </ProtectedRoute>
        );
      case 'submit-future':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UnifiedSubmissionForm category="future" />
          </ProtectedRoute>
        );
      case 'submit-world':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UnifiedSubmissionForm category="world" />
          </ProtectedRoute>
        );
      case 'auth/signup':
        return <SmartSignUpPage />;
      case 'auth/signin':
        return <SmartSignInPage />;
      case 'auth/verify-email':
        return <ImprovedVerificationPage />;
      case 'profile/setup':
        return (
          <ProtectedRoute requireEmailVerification={true}>
            <ProfileSetupPage />
          </ProtectedRoute>
        );
      case 'profile/edit':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UserZoneLayout currentPage="profile/edit">
              <ProfileEditPage />
            </UserZoneLayout>
          </ProtectedRoute>
        );
      case 'my-applications':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UserZoneLayout currentPage="my-applications">
              <MyApplicationsPage />
            </UserZoneLayout>
          </ProtectedRoute>
        );
      case 'application-edit':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
            <UserZoneLayout currentPage="application-edit">
              <ApplicationEditPage applicationId="legacy" />
            </UserZoneLayout>
          </ProtectedRoute>
        );
      case 'terms-conditions':
        return <TermsConditionsPage />;
      case 'privacy-policy':
        return <PrivacyPolicyPage />;
      case 'coming-soon':
        return <ComingSoonPage />;
      case 'activities':
        return <PublicActivitiesPage />;
      case 'city-rally':
        return <CityRallyPage />;
      case 'city-rally-maps':
        return <ComingSoonPage />;
      case 'news':
        return <PublicNewsPage />;
      case 'quill-dropdown-test':
        return <QuillDropdownTestPage />;
      case 'festival-schedule':
        return <FestivalSchedulePage />;
      case 'public/feature-films':
        return (
          <PublicFeatureFilmsPage 
            onNavigateToDetail={(filmId) => {
              handleNavigate(`public/feature-films/detail/${filmId}`);
            }}
          />
        );
      case 'fortune-cards':
        return (
          <FortuneCardsGalleryPage 
            onNavigateToDetail={(filmId) => {
              handleNavigate(`fortune-cards/detail/${filmId}`);
            }}
          />
        );
      case 'selected-short-films':
        return <SelectedShortFilmsPage />;
      case 'short-film-programs':
        return <ShortFilmProgramPage />;
      case 'admin/dashboard':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/dashboard">
                <ApplicationsDashboardPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/gallery':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/gallery">
                <AdminGalleryPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/youth-competition':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/youth-competition">
                <YouthCompetitionPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/future-competition':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/future-competition">
                <FutureCompetitionPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/world-competition':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/world-competition">
                <WorldCompetitionPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/profile':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute>
              <AdminZoneLayout currentPage="admin/profile">
                <AdminProfilePage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/role-management':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canAssignRoles">
              <AdminZoneLayout currentPage="admin/role-management">
                <RoleManagement />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/partners':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManagePartners">
              <AdminZoneLayout currentPage="admin/partners">
                <PartnerManagementPage />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/feature-films':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/feature-films">
                <FeatureFilmGalleryPage 
                  onNavigateToForm={(mode, filmId) => {
                    if (mode === 'create') {
                      handleNavigate('admin/feature-films/new');
                    } else if (mode === 'edit' && filmId) {
                      handleNavigate(`admin/feature-films/edit/${filmId}`);
                    }
                  }}
                  onNavigateToDetail={(filmId) => {
                    handleNavigate(`admin/feature-films/detail/${filmId}`);
                  }}
                />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/feature-films/new':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/feature-films/new">
                <ErrorBoundary>
                  <FeatureFilmForm 
                    mode="create"
                    onSave={() => handleNavigate('admin/feature-films')}
                    onCancel={() => handleNavigate('admin/feature-films')}
                  />
                </ErrorBoundary>
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/news':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/news">
                <AdminNewsGallery 
                  onNavigate={handleNavigate}
                />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/news/create':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/news/create">
                <ErrorBoundary>
                  <NewsFormWrapper 
                    mode="create"
                    onCancel={() => handleNavigate('admin/news')}
                  />
                </ErrorBoundary>
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/fortune-cards':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/fortune-cards">
                <FortuneCardsGallery 
                  onNavigateToForm={(mode, filmId) => {
                    if (mode === 'create') {
                      handleNavigate('admin/fortune-cards/new');
                    } else if (mode === 'edit' && filmId) {
                      handleNavigate(`admin/fortune-cards/edit/${filmId}`);
                    }
                  }}
                  onNavigateToDetail={(filmId) => {
                    handleNavigate(`admin/fortune-cards/detail/${filmId}`);
                  }}
                />
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      case 'admin/fortune-cards/new':
        return (
          <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
            <AdminProtectedRoute requiredPermission="canManageContent">
              <AdminZoneLayout currentPage="admin/fortune-cards/new">
                <ErrorBoundary>
                  <FeatureFilmForm 
                    mode="create"
                    onSave={() => handleNavigate('admin/fortune-cards')}
                    onCancel={() => handleNavigate('admin/fortune-cards')}
                  />
                </ErrorBoundary>
              </AdminZoneLayout>
            </AdminProtectedRoute>
          </ProtectedRoute>
        );
      default:
        // Handle admin activities routes
        if (currentPage.startsWith('admin/activities')) {
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute>
                <AdminZoneLayout currentPage="admin/activities">
                  <ActivitiesRouter 
                    currentRoute={currentPage}
                    onNavigate={handleNavigate}
                  />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle admin submissions routes
        if (currentPage.startsWith('admin/submissions')) {
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canRateSubmissions">
                <AdminZoneLayout currentPage="admin/submissions">
                  <SubmissionsRouter 
                    currentRoute={currentPage}
                    onNavigate={handleNavigate}
                  />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle admin users routes
        if (currentPage.startsWith('admin/users')) {
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageUsers">
                <AdminZoneLayout currentPage="admin/users">
                  <UsersRouter 
                    currentRoute={currentPage}
                    onNavigate={handleNavigate}
                  />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        // Handle application detail page with dynamic ID
        if (currentPage.startsWith('application-detail/')) {
          const applicationId = currentPage.replace('application-detail/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
              <UserZoneLayout currentPage="application-detail">
                <ApplicationDetailPage applicationId={applicationId} />
              </UserZoneLayout>
            </ProtectedRoute>
          );
        }
        // Handle application edit page with dynamic ID
        if (currentPage.startsWith('application-edit/')) {
          const applicationId = currentPage.replace('application-edit/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={true}>
              <UserZoneLayout currentPage="application-edit">
                <ApplicationEditPage applicationId={applicationId} />
              </UserZoneLayout>
            </ProtectedRoute>
          );
        }
        // Handle admin application detail page with dynamic ID
        if (currentPage.startsWith('admin/application/')) {
          const applicationId = currentPage.replace('admin/application/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute>
                <AdminZoneLayout currentPage="admin/application">
                  <AdminApplicationDetailPage applicationId={applicationId} />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        // Handle admin application detail page with dynamic ID (new route pattern)
        if (currentPage.startsWith('admin/application-detail/')) {
          const applicationId = currentPage.replace('admin/application-detail/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute>
                <AdminZoneLayout currentPage="admin/application-detail">
                  <AdminApplicationDetailPage applicationId={applicationId} />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        // Handle admin feature film edit page with dynamic ID
        if (currentPage.startsWith('admin/feature-films/edit/')) {
          const filmId = currentPage.replace('admin/feature-films/edit/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageContent">
                <AdminZoneLayout currentPage="admin/feature-films/edit">
                  <ErrorBoundary>
                    <FeatureFilmForm 
                      mode="edit"
                      filmId={filmId}
                      onSave={() => handleNavigate('admin/feature-films')}
                      onCancel={() => handleNavigate('admin/feature-films')}
                    />
                  </ErrorBoundary>
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle admin feature film detail page with dynamic ID
        if (currentPage.startsWith('admin/feature-films/detail/')) {
          const filmId = currentPage.replace('admin/feature-films/detail/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageContent">
                <AdminZoneLayout currentPage="admin/feature-films/detail">
                  <FeatureFilmDetailPage 
                    filmId={filmId}
                    onNavigateBack={() => handleNavigate('admin/feature-films')}
                  />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle public feature film detail page with dynamic ID
        if (currentPage.startsWith('public/feature-films/detail/')) {
          const filmId = currentPage.replace('public/feature-films/detail/', '');
          return (
            <PublicFeatureFilmDetailPage 
              filmId={filmId}
              onNavigateBack={() => handleNavigate('public/feature-films')}
            />
          );
        }
        
        // Handle public news detail page with dynamic slug
        if (currentPage.startsWith('news/')) {
          const slug = currentPage.replace('news/', '');
          return (
            <PublicNewsDetailPage 
              slug={slug}
              onNavigateBack={() => handleNavigate('news')}
            />
          );
        }
        
        // Handle admin news edit page with dynamic ID
        if (currentPage.startsWith('admin/news/edit/')) {
          const articleId = currentPage.replace('admin/news/edit/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageContent">
                <AdminZoneLayout currentPage="admin/news/edit">
                  <ErrorBoundary>
                    <NewsEditWrapper 
                      articleId={articleId}
                      onCancel={() => handleNavigate('admin/news')}
                    />
                  </ErrorBoundary>
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle public activity detail page with dynamic ID
        if (currentPage.startsWith('activity/')) {
          const activityId = currentPage.replace('activity/', '');
          return <ActivityDetailPage activityId={activityId} />;
        }
        
        // Handle admin fortune card edit page with dynamic ID
        if (currentPage.startsWith('admin/fortune-cards/edit/')) {
          const filmId = currentPage.replace('admin/fortune-cards/edit/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageContent">
                <AdminZoneLayout currentPage="admin/fortune-cards/edit">
                  <ErrorBoundary>
                    <FeatureFilmForm 
                      mode="edit"
                      filmId={filmId}
                      onSave={() => handleNavigate('admin/fortune-cards')}
                      onCancel={() => handleNavigate('admin/fortune-cards')}
                    />
                  </ErrorBoundary>
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle admin fortune card detail page with dynamic ID
        if (currentPage.startsWith('admin/fortune-cards/detail/')) {
          const filmId = currentPage.replace('admin/fortune-cards/detail/', '');
          return (
            <ProtectedRoute requireEmailVerification={true} requireProfileComplete={false}>
              <AdminProtectedRoute requiredPermission="canManageContent">
                <AdminZoneLayout currentPage="admin/fortune-cards/detail">
                  <FeatureFilmDetailPage 
                    filmId={filmId}
                    onNavigateBack={() => handleNavigate('admin/fortune-cards')}
                  />
                </AdminZoneLayout>
              </AdminProtectedRoute>
            </ProtectedRoute>
          );
        }
        
        // Handle fortune card detail page with dynamic film ID
        if (currentPage.startsWith('fortune-cards/detail/')) {
          const filmId = currentPage.replace('fortune-cards/detail/', '');
          return (
            <FortuneCardDetailPage 
              filmId={filmId}
              onNavigateBack={() => handleNavigate('fortune-cards')}
            />
          );
        }
        return (
          <>
            <OneHeroSection />
            <ProgramsSection />
            <OfficialSelectionShelf />
            <CompetitionHighlight />
            <WorkshopsSection />
            <EntertainmentExpoSection />
            <NewsSection />
            <PartnersSection />
          </>
        );
    }
  };

  return (
    <AppProviders>
      <NotificationProvider>
        <LanguageHandler />
        <div className="min-h-screen bg-[#110D16] text-white overflow-x-hidden relative">
          <Navigation />
          {renderPage()}
          <Footer />
          
          {/* Animated Background Elements */}
          <AnimatedBackground />
        </div>
      </NotificationProvider>
    </AppProviders>
  );
}

export default App;
