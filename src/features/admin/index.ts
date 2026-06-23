/**
 * Feature module: admin
 * 
 * Exports all admin panel-related components, hooks, and actions.
 */

// Components
export { AdminSidebar } from './components/layout/admin-sidebar'
export { AdminHeader } from './components/layout/admin-header'
export { DashboardOverview } from './components/dashboard/dashboard-overview'
export { UsersDatatable } from './components/users/users-datatable'
export { AssociateNetworkManager } from './components/associates/associate-network-manager'
export { VerificationQueue } from './components/verifications/verification-queue'
export { CaseOpsBoard } from './components/cases/case-ops-board'
export { FinanceDashboard } from './components/payments/finance-dashboard'
export { PayoutApprovals } from './components/commissions/payout-approvals'
export { DisputeResolutionPanel } from './components/disputes/dispute-resolution-panel'
export { FraudAlertFeed } from './components/fraud/fraud-alert-feed'
export { SuccessStoryCurator } from './components/marriages/success-story-curator'
export { CMSEditor } from './components/content/cms-editor'
export { BroadcastSender } from './components/notifications/broadcast-sender'
export { AuditLogsViewer } from './components/audit-logs/audit-logs-viewer'
export { AnalyticsDashboard } from './components/dashboard/analytics-dashboard'
export { FeatureFlagsManager } from './components/settings/feature-flags-manager'

// Actions
export { getDashboardKPIs } from './actions/dashboard-actions'
export { searchUsers, banUser, mergeDuplicateAccounts } from './actions/user-actions'
export { getAssociates, approveAssociate, suspendAssociate, assignTerritory } from './actions/associate-actions'
export { getVerificationQueue, verifyUserKYC } from './actions/verification-actions'
export { getAdminCases, assignAssociateToCase, closeCase } from './actions/case-actions'
export { searchPayments, approveRefund } from './actions/payment-actions'
export { getWithdrawalRequests, processWithdrawalRequest, applyCommissionAdjustment } from './actions/commission-actions'
export { getAdminDisputes, resolveDispute } from './actions/dispute-actions'
export { getFraudAlerts, updateFraudAlertStatus, runFraudIndicatorsScan } from './actions/fraud-actions'
export { getAdminMarriages, verifyMarriageSuccess } from './actions/marriage-actions'
export { getCMSPages, saveCMSPage, getCMSBlogs, saveCMSBlog, getCMSMedia, getCMSTemplates, saveCMSTemplate, getCMSAnnouncements } from './actions/cms-actions'
export { sendBroadcastNotification } from './actions/notification-actions'
export { getAuditLogs } from './actions/audit-actions'
export { getAdminSession } from './actions/helper'
export { impersonateUserAction, stopImpersonatingAction } from './actions/impersonate-actions'
export { getFeatureFlags, updateFeatureFlag } from './actions/settings-actions'
