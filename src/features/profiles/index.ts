/**
 * Feature module: profiles
 * 
 * Matrimonial profile viewing, searching, and editing components.
 */

// Components
export { ProfileEditForm } from './components/profile-edit-form'
export { PartnerPreferencesForm } from './components/partner-preferences-form'
export { ProfilePhotoUploader } from './components/profile-photo-uploader'
export { PrivacyControls } from './components/privacy-controls'
export { OnboardingWizard } from './components/onboarding-wizard'

// Validators
export {
  profileEditSchema,
  partnerPreferencesSchema,
  privacyControlsSchema,
  type ProfileEditInput,
  type PartnerPreferencesInput,
  type PrivacyControlsInput
} from './validators/profile-validators'

// Actions
export {
  updateProfile,
  updatePartnerPreferences,
  updatePrivacySettings,
  uploadPhotoAction,
  deletePhotoAction
} from './actions/profile-actions'
