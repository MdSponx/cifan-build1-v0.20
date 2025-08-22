import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import UnifiedSubmissionForm from '../components/forms/UnifiedSubmissionForm';
import { useAuth } from '../components/auth/AuthContext';
import { SubmissionService } from '../services/submissionService';

// Mock dependencies
vi.mock('../components/auth/AuthContext');
vi.mock('../services/submissionService');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' }
  })
}));
vi.mock('../utils/typography', () => ({
  useTypography: () => ({
    getClass: (type: string) => `mock-${type}`
  })
}));

// Mock all form components
vi.mock('../components/forms/FormSection', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="form-section" data-title={title}>
      {children}
    </div>
  )
}));

vi.mock('../components/forms/GenreSelector', () => ({
  default: ({ onChange, error }: any) => (
    <div data-testid="genre-selector">
      <button onClick={() => onChange(['Action'])}>Select Genre</button>
      {error && <span data-testid="genre-error">{error}</span>}
    </div>
  )
}));

vi.mock('../components/forms/FormatSelector', () => ({
  default: ({ onChange, error }: any) => (
    <div data-testid="format-selector">
      <button onClick={() => onChange('live-action')}>Select Format</button>
      {error && <span data-testid="format-error">{error}</span>}
    </div>
  )
}));

vi.mock('../components/forms/UnifiedFileUpload', () => ({
  default: ({ onFileChange, name, error }: any) => (
    <div data-testid={`file-upload-${name}`}>
      <input
        type="file"
        onChange={(e) => onFileChange(e.target.files?.[0] || null)}
        data-testid={`file-input-${name}`}
      />
      {error && <span data-testid={`file-error-${name}`}>{error}</span>}
    </div>
  )
}));

vi.mock('../components/forms/CrewManagement', () => ({
  default: ({ onCrewMembersChange }: any) => (
    <div data-testid="crew-management">
      <button onClick={() => onCrewMembersChange([])}>Manage Crew</button>
    </div>
  )
}));

vi.mock('../components/forms/AgreementCheckboxes', () => ({
  default: ({ onChange }: any) => (
    <div data-testid="agreement-checkboxes">
      <input
        type="checkbox"
        onChange={(e) => onChange('agreement1', e.target.checked)}
        data-testid="agreement1"
      />
    </div>
  )
}));

vi.mock('../components/ui/NationalitySelector', () => ({
  default: ({ onNationalityChange, onFilmLanguagesChange }: any) => (
    <div data-testid="nationality-selector">
      <button onClick={() => onNationalityChange('Thailand')}>Select Thailand</button>
      <button onClick={() => onFilmLanguagesChange(['Thai'])}>Select Thai</button>
    </div>
  )
}));

vi.mock('../components/dialogs/DraftSuccessDialog', () => ({
  default: ({ isOpen, onSubmitNow, onReviewLater, onClose }: any) => (
    isOpen ? (
      <div data-testid="draft-success-dialog">
        <button onClick={onSubmitNow} data-testid="submit-now">Submit Now</button>
        <button onClick={onReviewLater} data-testid="review-later">Review Later</button>
        <button onClick={onClose} data-testid="close-dialog">Close</button>
      </div>
    ) : null
  )
}));

vi.mock('../components/ui/AnimatedButton', () => ({
  default: ({ children, onClick, className }: any) => (
    <button onClick={onClick} className={className} data-testid="animated-button">
      {children}
    </button>
  )
}));

vi.mock('../components/ui/SubmissionProgress', () => ({
  default: ({ progress }: any) => (
    <div data-testid="submission-progress">
      <div data-testid="progress-stage">{progress.stage}</div>
      <div data-testid="progress-percent">{progress.progress}%</div>
      <div data-testid="progress-message">{progress.message}</div>
    </div>
  )
}));

vi.mock('../components/forms/ErrorMessage', () => ({
  default: ({ error }: any) => error ? <span data-testid="error-message">{error}</span> : null
}));

describe('UnifiedSubmissionForm - White Screen Fix Tests', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com'
  };

  const mockUserProfile = {
    fullNameEN: 'Test User',
    fullNameTH: 'ผู้ใช้ทดสอบ',
    age: 20,
    phoneNumber: '0123456789',
    email: 'test@example.com'
  };

  const mockUseAuth = useAuth as any;
  const mockSubmissionService = SubmissionService as any;

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      userProfile: mockUserProfile
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('State Management Fix', () => {
    it('should handle draft save without files without white screen', async () => {
      // Mock successful draft save without files
      const mockSaveDraftYouthForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'draft-123',
        isDraft: true
      });

      mockSubmissionService.mockImplementation((progressCallback: any) => ({
        saveDraftYouthForm: mockSaveDraftYouthForm
      }));

      render(<UnifiedSubmissionForm category="youth" />);

      // Fill required fields
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '10' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'Test synopsis' } });

      // Select genre and format
      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      // Fill submitter info (should be pre-filled from profile)
      const nameInput = screen.getByDisplayValue('Test User');
      expect(nameInput).toBeInTheDocument();

      const ageInput = screen.getByDisplayValue('20');
      expect(ageInput).toBeInTheDocument();

      const phoneInput = screen.getByDisplayValue('0123456789');
      expect(phoneInput).toBeInTheDocument();

      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeInTheDocument();

      // Fill role
      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      // Fill education fields for youth category
      const schoolInput = screen.getByLabelText(/school name/i);
      fireEvent.change(schoolInput, { target: { value: 'Test School' } });

      const studentIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(studentIdInput, { target: { value: '12345' } });

      // Submit form
      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockSaveDraftYouthForm).toHaveBeenCalled();
      });

      // Should show success dialog, not white screen
      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });

      // Should not show progress or error screens
      expect(screen.queryByTestId('submission-progress')).not.toBeInTheDocument();
      expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
    });

    it('should handle draft save with files without white screen', async () => {
      // Mock successful draft save with files
      const mockSaveDraftYouthForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'draft-with-files-123',
        isDraft: true
      });

      let progressCallback: any;
      mockSubmissionService.mockImplementation((callback: any) => {
        progressCallback = callback;
        return {
          saveDraftYouthForm: mockSaveDraftYouthForm
        };
      });

      render(<UnifiedSubmissionForm category="youth" />);

      // Fill required fields (same as above)
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'Test Film with Files' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '15' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'Test synopsis with files' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      const schoolInput = screen.getByLabelText(/school name/i);
      fireEvent.change(schoolInput, { target: { value: 'Test School' } });

      const studentIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(studentIdInput, { target: { value: '12345' } });

      // Add files
      const filmFileInput = screen.getByTestId('file-input-filmFile');
      const mockFilmFile = new File(['film content'], 'test-film.mp4', { type: 'video/mp4' });
      fireEvent.change(filmFileInput, { target: { files: [mockFilmFile] } });

      const posterFileInput = screen.getByTestId('file-input-posterFile');
      const mockPosterFile = new File(['poster content'], 'test-poster.jpg', { type: 'image/jpeg' });
      fireEvent.change(posterFileInput, { target: { files: [mockPosterFile] } });

      // Submit form
      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      // Simulate progress updates during file upload
      if (progressCallback) {
        progressCallback({
          stage: 'uploading',
          progress: 25,
          message: 'Uploading files...',
          fileProgress: { film: 50, poster: 25 }
        });
      }

      // Should show progress screen during upload
      await waitFor(() => {
        expect(screen.getByTestId('submission-progress')).toBeInTheDocument();
        expect(screen.getByTestId('progress-stage')).toHaveTextContent('uploading');
        expect(screen.getByTestId('progress-percent')).toHaveTextContent('25%');
      });

      // Simulate completion
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress: 100,
          message: 'Draft saved successfully!'
        });
      }

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockSaveDraftYouthForm).toHaveBeenCalled();
      });

      // Should show success dialog, not white screen
      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });

      // Progress should be cleared
      expect(screen.queryByTestId('submission-progress')).not.toBeInTheDocument();
    });

    it('should handle errors without white screen', async () => {
      // Mock failed draft save
      const mockSaveDraftYouthForm = vi.fn().mockRejectedValue(
        new Error('Network error during save')
      );

      mockSubmissionService.mockImplementation(() => ({
        saveDraftYouthForm: mockSaveDraftYouthForm
      }));

      render(<UnifiedSubmissionForm category="youth" />);

      // Fill minimal required fields
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '10' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'Test synopsis' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      const schoolInput = screen.getByLabelText(/school name/i);
      fireEvent.change(schoolInput, { target: { value: 'Test School' } });

      const studentIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(studentIdInput, { target: { value: '12345' } });

      // Submit form
      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      // Wait for error to be handled
      await waitFor(() => {
        expect(mockSaveDraftYouthForm).toHaveBeenCalled();
      });

      // Should show error screen, not white screen
      await waitFor(() => {
        expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
        expect(screen.getByText(/network error during save/i)).toBeInTheDocument();
      });

      // Should have try again button
      const tryAgainButton = screen.getByText(/try again/i);
      expect(tryAgainButton).toBeInTheDocument();

      // Click try again should clear error state
      fireEvent.click(tryAgainButton);

      await waitFor(() => {
        expect(screen.queryByText(/error occurred/i)).not.toBeInTheDocument();
      });
    });

    it('should handle dialog navigation correctly', async () => {
      // Mock successful draft save
      const mockSaveDraftYouthForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'draft-nav-123',
        isDraft: true
      });

      mockSubmissionService.mockImplementation(() => ({
        saveDraftYouthForm: mockSaveDraftYouthForm
      }));

      // Mock window.location.hash
      Object.defineProperty(window, 'location', {
        value: { hash: '' },
        writable: true
      });

      render(<UnifiedSubmissionForm category="youth" />);

      // Fill and submit form (abbreviated)
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '10' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'Test synopsis' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      const schoolInput = screen.getByLabelText(/school name/i);
      fireEvent.change(schoolInput, { target: { value: 'Test School' } });

      const studentIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(studentIdInput, { target: { value: '12345' } });

      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      // Wait for success dialog
      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });

      // Test "Submit Now" navigation
      const submitNowButton = screen.getByTestId('submit-now');
      fireEvent.click(submitNowButton);

      // Should close dialog and navigate
      await waitFor(() => {
        expect(screen.queryByTestId('draft-success-dialog')).not.toBeInTheDocument();
      });

      // Reset for "Review Later" test
      fireEvent.click(submitButton);
      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });

      const reviewLaterButton = screen.getByTestId('review-later');
      fireEvent.click(reviewLaterButton);

      await waitFor(() => {
        expect(screen.queryByTestId('draft-success-dialog')).not.toBeInTheDocument();
      });
    });

    it('should maintain separate state for progress and result', async () => {
      // This test verifies that progress and result states don't interfere with each other
      const mockSaveDraftYouthForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'state-test-123',
        isDraft: true
      });

      let progressCallback: any;
      mockSubmissionService.mockImplementation((callback: any) => {
        progressCallback = callback;
        return {
          saveDraftYouthForm: mockSaveDraftYouthForm
        };
      });

      render(<UnifiedSubmissionForm category="youth" />);

      // Fill minimal form
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'State Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '10' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'State test synopsis' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      const schoolInput = screen.getByLabelText(/school name/i);
      fireEvent.change(schoolInput, { target: { value: 'Test School' } });

      const studentIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(studentIdInput, { target: { value: '12345' } });

      // Submit form
      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      // Simulate multiple progress updates
      if (progressCallback) {
        progressCallback({
          stage: 'validating',
          progress: 10,
          message: 'Validating form...'
        });

        progressCallback({
          stage: 'uploading',
          progress: 50,
          message: 'Uploading files...'
        });

        progressCallback({
          stage: 'saving',
          progress: 80,
          message: 'Saving draft...'
        });
      }

      // Should show progress during each stage
      await waitFor(() => {
        expect(screen.getByTestId('submission-progress')).toBeInTheDocument();
      });

      // Complete the process
      if (progressCallback) {
        progressCallback({
          stage: 'complete',
          progress: 100,
          message: 'Draft saved successfully!'
        });
      }

      await waitFor(() => {
        expect(mockSaveDraftYouthForm).toHaveBeenCalled();
      });

      // Should transition to success dialog without white screen
      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });

      // Progress should be cleared but dialog should remain
      expect(screen.queryByTestId('submission-progress')).not.toBeInTheDocument();
      expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
    });
  });

  describe('Different Categories', () => {
    it('should work correctly for future category', async () => {
      const mockSaveDraftFutureForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'future-draft-123',
        isDraft: true
      });

      mockSubmissionService.mockImplementation(() => ({
        saveDraftFutureForm: mockSaveDraftFutureForm
      }));

      render(<UnifiedSubmissionForm category="future" />);

      // Fill required fields for future category
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'Future Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '12' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'Future test synopsis' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      // Future category has university fields
      const universityInput = screen.getByLabelText(/university name/i);
      fireEvent.change(universityInput, { target: { value: 'Test University' } });

      const facultyInput = screen.getByLabelText(/faculty/i);
      fireEvent.change(facultyInput, { target: { value: 'Film Studies' } });

      const universityIdInput = screen.getByLabelText(/student id/i);
      fireEvent.change(universityIdInput, { target: { value: 'U12345' } });

      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSaveDraftFutureForm).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });
    });

    it('should work correctly for world category', async () => {
      const mockSaveDraftWorldForm = vi.fn().mockResolvedValue({
        success: true,
        submissionId: 'world-draft-123',
        isDraft: true
      });

      mockSubmissionService.mockImplementation(() => ({
        saveDraftWorldForm: mockSaveDraftWorldForm
      }));

      render(<UnifiedSubmissionForm category="world" />);

      // Fill required fields for world category
      const filmTitleInput = screen.getByLabelText(/film title/i);
      fireEvent.change(filmTitleInput, { target: { value: 'World Test Film' } });

      const durationInput = screen.getByLabelText(/duration/i);
      fireEvent.change(durationInput, { target: { value: '20' } });

      const synopsisInput = screen.getByLabelText(/synopsis/i);
      fireEvent.change(synopsisInput, { target: { value: 'World test synopsis' } });

      fireEvent.click(screen.getByText('Select Genre'));
      fireEvent.click(screen.getByText('Select Format'));

      const roleSelect = screen.getByLabelText(/role in film/i);
      fireEvent.change(roleSelect, { target: { value: 'Director' } });

      // World category doesn't have education fields
      const submitButton = screen.getByTestId('animated-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSaveDraftWorldForm).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('draft-success-dialog')).toBeInTheDocument();
      });
    });
  });
});
