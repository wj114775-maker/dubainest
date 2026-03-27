import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from '@/pages/Home';
import Shortlist from '@/pages/Shortlist';
import Compare from '@/pages/Compare';
import Guides from '@/pages/Guides';
import Account from '@/pages/Account';
import ListingDetail from '@/pages/ListingDetail';
import AreaDetail from '@/pages/AreaDetail';
import ProjectDetail from '@/pages/ProjectDetail';
import BuyerQuiz from '@/pages/BuyerQuiz';
import GoldenVisa from '@/pages/GoldenVisa';
import PartnerOverview from '@/pages/PartnerOverview';
import PartnerLeads from '@/pages/PartnerLeads';
import PartnerListings from '@/pages/PartnerListings';
import PartnerPayouts from '@/pages/PartnerPayouts';
import PartnerDisputes from '@/pages/PartnerDisputes';
import OpsDashboard from '@/pages/OpsDashboard';
import OpsLeads from '@/pages/OpsLeads';
import OpsLeadDetail from '@/pages/OpsLeadDetail';
import OpsCompliance from '@/pages/OpsCompliance';
import OpsRevenue from '@/pages/OpsRevenue';
import OpsContent from '@/pages/OpsContent';
import OpsAudit from '@/pages/OpsAudit';
import OpsSettings from '@/pages/OpsSettings';
import OpsAdminConsole from '@/pages/OpsAdminConsole';
import OpsUsers from '@/pages/OpsUsers';
import OpsUserDetail from '@/pages/OpsUserDetail';
import OpsRolesPermissions from '@/pages/OpsRolesPermissions';
import OpsPartnerAccess from '@/pages/OpsPartnerAccess';
import OpsSecurity from '@/pages/OpsSecurity';
import OpsLeadRules from '@/pages/OpsLeadRules';
import OpsCommissionRules from '@/pages/OpsCommissionRules';
import OpsComplianceRules from '@/pages/OpsComplianceRules';
import AppHeader from '@/components/layout/AppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import SideRail from '@/components/layout/SideRail';
import useAppConfig from '@/hooks/useAppConfig';
import useCurrentUserRole from '@/hooks/useCurrentUserRole';
import { navItems, roleGroups } from '@/lib/appShell';

const AppFrame = ({ children, mode = 'buyer', title }) => {
  const { data: appConfig } = useAppConfig();
  const items = navItems[mode];

  return (
    <div className="min-h-screen bg-background">
      <AppHeader appName={appConfig.app_name} tagline={appConfig.tagline} />
      <div className="mx-auto flex max-w-7xl">
        {mode !== 'buyer' ? <SideRail title={title} items={items} /> : null}
        <main className="min-h-screen flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
      {mode === 'buyer' ? <MobileBottomNav items={items} /> : null}
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const { data: current } = useCurrentUserRole();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError && authError.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  const role = current?.role || 'buyer';
  const permissions = current?.permissions || [];
  const isInternal = roleGroups.internal.includes(role) || permissions.length > 0;
  const isPartner = roleGroups.partner.includes(role) || permissions.includes('listings.read') || permissions.includes('leads.read');

  return (
    <Routes>
      <Route path="/" element={<AppFrame mode="buyer"><Home /></AppFrame>} />
      <Route path="/shortlist" element={<AppFrame mode="buyer"><Shortlist /></AppFrame>} />
      <Route path="/compare" element={<AppFrame mode="buyer"><Compare /></AppFrame>} />
      <Route path="/guides" element={<AppFrame mode="buyer"><Guides /></AppFrame>} />
      <Route path="/account" element={<AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/listing/:id" element={<AppFrame mode="buyer"><ListingDetail /></AppFrame>} />
      <Route path="/areas/:slug" element={<AppFrame mode="buyer"><AreaDetail /></AppFrame>} />
      <Route path="/projects/:slug" element={<AppFrame mode="buyer"><ProjectDetail /></AppFrame>} />
      <Route path="/quiz" element={<AppFrame mode="buyer"><BuyerQuiz /></AppFrame>} />
      <Route path="/golden-visa" element={<AppFrame mode="buyer"><GoldenVisa /></AppFrame>} />
      <Route path="/partner" element={isPartner ? <AppFrame mode="partner" title="Partner OS"><PartnerOverview /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/leads" element={isPartner ? <AppFrame mode="partner" title="Partner OS"><PartnerLeads /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/listings" element={isPartner ? <AppFrame mode="partner" title="Partner OS"><PartnerListings /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/payouts" element={isPartner ? <AppFrame mode="partner" title="Partner OS"><PartnerPayouts /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/disputes" element={isPartner ? <AppFrame mode="partner" title="Partner OS"><PartnerDisputes /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsDashboard /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/leads" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsLeads /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/leads/:id" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsLeadDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/admin" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsAdminConsole /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/users" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsUsers /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/users/:id" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsUserDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/roles-permissions" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsRolesPermissions /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/partner-access" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsPartnerAccess /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/security" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsSecurity /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/lead-rules" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsLeadRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/commission-rules" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsCommissionRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/compliance-rules" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsComplianceRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/compliance" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsCompliance /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/revenue" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsRevenue /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/content" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsContent /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/audit" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsAudit /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/settings" element={isInternal ? <AppFrame mode="internal" title="Internal OS"><OpsSettings /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App