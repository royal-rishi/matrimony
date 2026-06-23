/**
 * Feature module: auth
 * 
 * Exports all auth-related components, hooks, actions, and validators.
 * Only import from this index to keep boundaries clean.
 */

// Components
export { LoginForm } from './components/login-form'
export { RegisterForm } from './components/register-form'
export { ForgotPasswordForm } from './components/forgot-password-form'
export { ResetPasswordForm } from './components/reset-password-form'

// Actions (Server Actions)
export { 
  signInAction, 
  signUpAction, 
  signOutAction, 
  forgotPasswordAction, 
  resetPasswordAction,
  adminSignInAction,
  associateSignInAction,
  associateSignUpAction
} from './actions/auth-actions'

// Validators
export { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema, associateRegisterSchema } from './validators/auth-validators'
export type { LoginInput, RegisterInput, ForgotPasswordInput, ResetPasswordInput, AssociateRegisterInput } from './validators/auth-validators'
