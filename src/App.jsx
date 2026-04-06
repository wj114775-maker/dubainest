import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from '@/pages/Home';
import Properties from '@/pages/Properties';
import Developers from '@/pages/Developers';
import DeveloperDetail from '@/pages/DeveloperDetail';
import Areas from '@/pages/Areas';
import Projects from '@/pages/Projects';
import Shortlist from '@/pages/Shortlist';
import Compare from '@/pages/Compare';
import Guides from '@/pages/Guides';
import GuideDetail from '@/pages/GuideDetail';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import Account from '@/pages/Account';
import ListingDetail from '@/pages/ListingDetail';
import AreaDetail from '@/pages/AreaDetail';
import ProjectDetail from '@/pages/ProjectDetail';
import BuyerQuiz from '@/pages/BuyerQuiz';
import GoldenVisa from '@/pages/GoldenVisa';
import Privacy from '@/pages/Privacy';
import SiteMap from '@/pages/SiteMap';
import Terms from '@/pages/Terms';
import PartnerOverview from '@/pages/PartnerOverview';
import PartnerLeads from '@/pages/PartnerLeads';
import PartnerListings from '@/pages/PartnerListings';
import PartnerConcierge from '@/pages/PartnerConcierge';
import PartnerPayouts from '@/pages/PartnerPayouts';
import PartnerDisputes from '@/pages/PartnerDisputes';
import OpsDashboard from '@/pages/OpsDashboard';
import OpsLeads from '@/pages/OpsLeads';
import OpsLeadDetail from '@/pages/OpsLeadDetail';
import OpsCompliance from '@/pages/OpsCompliance';
import OpsListings from '@/pages/OpsListings';
import OpsProjects from '@/pages/OpsProjects';
import OpsDevelopers from '@/pages/OpsDevelopers';
import OpsListingDetail from '@/pages/OpsListingDetail';
import OpsConcierge from '@/pages/OpsConcierge';
import OpsConciergeDetail from '@/pages/OpsConciergeDetail';
import OpsRevenue from '@/pages/OpsRevenue';
import OpsRevenueDetail from '@/pages/OpsRevenueDetail';
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
import Notifications from '@/pages/Notifications';
import AppHeader from '@/components/layout/AppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import SideRail from '@/components/layout/SideRail';
import SiteFooter from '@/components/layout/SiteFooter';
import SeoMeta from '@/components/seo/SeoMeta';
import useAppConfig from '@/hooks/useAppConfig';
import useCurrentUserRole from '@/hooks/useCurrentUserRole';
import { navItems, roleGroups } from '@/lib/appShell';

const AppFrame = ({ children, mode = 'buyer', title, showInternalAccess = false, headerSticky = true }) => {
  const { data: appConfig } = useAppConfig();
  const location = useLocation();
  const items = mode === "buyer" && showInternalAccess
    ? navItems.buyer.map((item) => item.path === "/account" ? { label: "Workspace", path: "/workspace" } : item)
    : navItems[mode];
  const displayRailTitle = mode === "internal" ? "Back Office" : title;
  const homePath = mode === "internal" ? "/ops" : mode === "partner" ? "/partner" : "/";

  return (
    <div className="min-h-screen bg-background">
      {mode !== 'buyer' ? (
        <SeoMeta
          title={mode === "internal" ? `${appConfig.app_name} Internal Workspace` : `${appConfig.app_name} Partner Workspace`}
          description={mode === "internal" ? "Internal operations workspace." : "Partner workspace."}
          canonicalPath={location.pathname}
          robots="noindex,nofollow"
        />
      ) : null}
      <AppHeader
        appName={appConfig.app_name}
        tagline={appConfig.tagline}
        internalItems={navItems.internal}
        buyerItems={navItems.buyer}
        showInternalAccess={showInternalAccess}
        homePath={homePath}
        mode={mode}
        sticky={headerSticky}
      />
      <div className="mx-auto flex max-w-7xl">
        {mode !== 'buyer' ? <SideRail title={displayRailTitle} items={items} /> : null}
        <main className="min-h-screen flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
      {mode === 'buyer' ? <SiteFooter appName={appConfig.app_name} /> : null}
      {mode === 'buyer' ? <MobileBottomNav items={items} /> : null}
    </div>
  );
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError } = useAuth();
  const { data: current, isLoading: isLoadingRole } = useCurrentUserRole();

  if (isLoadingPublicSettings || isLoadingAuth || isLoadingRole || !current) {
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
  const isInternal = Boolean(current?.isInternal || current?.hasFullAccess || roleGroups.internal.includes(role));
  const isPartner = Boolean(current?.isPartner || roleGroups.partner.includes(role));
  const headerInternalAccess = isInternal;
  const workspaceTarget = isInternal ? "/ops" : isPartner ? "/partner" : "/account";

  return (
    <Routes>
      <Route path="/" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Home /></AppFrame>} />
      <Route path="/properties" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess} headerSticky={false}><Properties /></AppFrame>} />
      <Route path="/developers" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Developers /></AppFrame>} />
      <Route path="/developers/:slug" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><DeveloperDetail /></AppFrame>} />
      <Route path="/areas" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Areas /></AppFrame>} />
      <Route path="/projects" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Projects /></AppFrame>} />
      <Route path="/shortlist" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Shortlist /></AppFrame>} />
      <Route path="/compare" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Compare /></AppFrame>} />
      <Route path="/guides" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Guides /></AppFrame>} />
      <Route path="/guides/:slug" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><GuideDetail /></AppFrame>} />
      <Route path="/about" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><About /></AppFrame>} />
      <Route path="/contact" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Contact /></AppFrame>} />
      <Route path="/account" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Account /></AppFrame>} />
      <Route path="/notifications" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Notifications /></AppFrame>} />
      <Route path="/privacy" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Privacy /></AppFrame>} />
      <Route path="/sitemap" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><SiteMap /></AppFrame>} />
      <Route path="/terms" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><Terms /></AppFrame>} />
      <Route path="/workspace" element={<Navigate to={workspaceTarget} replace />} />
      <Route path="/listing/:id" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><ListingDetail /></AppFrame>} />
      <Route path="/properties/:listingSlugId" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><ListingDetail /></AppFrame>} />
      <Route path="/areas/:slug" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><AreaDetail /></AppFrame>} />
      <Route path="/projects/:slug" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><ProjectDetail /></AppFrame>} />
      <Route path="/quiz" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><BuyerQuiz /></AppFrame>} />
      <Route path="/golden-visa" element={<AppFrame mode="buyer" showInternalAccess={headerInternalAccess}><GoldenVisa /></AppFrame>} />
      <Route path="/partner" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerOverview /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/leads" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerLeads /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/listings" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerListings /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/concierge" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerConcierge /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/payouts" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerPayouts /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/partner/disputes" element={isPartner ? <AppFrame mode="partner" title="Partner Workspace"><PartnerDisputes /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsDashboard /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/leads" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsLeads /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/leads/:id" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsLeadDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/admin" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsAdminConsole /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/users" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsUsers /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/users/:id" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsUserDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/roles-permissions" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsRolesPermissions /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/partner-access" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsPartnerAccess /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/security" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsSecurity /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/lead-rules" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsLeadRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/commission-rules" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsCommissionRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/compliance-rules" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsComplianceRules /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/compliance" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsCompliance /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/listings" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsListings /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/projects" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsProjects /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/developers" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsDevelopers /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/listings/:id" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsListingDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/concierge" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsConcierge /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/concierge/:id" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsConciergeDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/revenue" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsRevenue /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/revenue/:id" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsRevenueDetail /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/content" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsContent /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/audit" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsAudit /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
      <Route path="/ops/settings" element={isInternal ? <AppFrame mode="internal" title="Back Office"><OpsSettings /></AppFrame> : <AppFrame mode="buyer"><Account /></AppFrame>} />
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
