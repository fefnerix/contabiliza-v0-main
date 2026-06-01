
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";
import { SupabaseInitializer } from "@/components/common/SupabaseInitializer";
import { ProtectedRoute, GuestRoute, OnboardingRoute } from "@/components/ProtectedRoute";
import HomeRoute from "./pages/HomeRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegisterWithPlanPage from "./pages/RegisterWithPlanPage";
import OnboardingPage from "./pages/OnboardingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import TransactionsPage from "./pages/TransactionsPage";
import ExpensesPage from "./pages/ExpensesPage";
import GoalsPage from "./pages/GoalsPage";
import ReportsPage from "./pages/ReportsPage";
import SchedulePage from "./pages/SchedulePage";
import SettingsPage from "./pages/SettingsPage";
import CategoriesPage from "./pages/CategoriesPage";
import PlansPage from "./pages/PlansPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ThankYouPage from "./pages/ThankYouPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCheckoutsPage from "./pages/admin/AdminCheckoutsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminPlansPage from "./pages/admin/AdminPlansPage";
import AdminCommunicationsPage from "./pages/admin/AdminCommunicationsPage";
import AdminContentPage from "./pages/admin/AdminContentPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminLogsPage from "./pages/admin/AdminLogsPage";
import AdminAuditPage from "./pages/admin/AdminAuditPage";
import AdminLayout from "./components/admin/AdminLayout";
import AchievementsPage from "./pages/AchievementsPage";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

function App() {
  return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="contabiliza-ui-theme">
          <TooltipProvider>
            <BrandingProvider>
              <PreferencesProvider>
                <SubscriptionProvider>
                  <AppProvider>
                    <SupabaseInitializer>
                      <BrowserRouter>
                        <Routes>
                          <Route path="/" element={<HomeRoute />} />
                          <Route path="/landing" element={<LandingPage />} />
                          <Route
                            path="/login"
                            element={
                              <GuestRoute>
                                <LoginPage />
                              </GuestRoute>
                            }
                          />
                          <Route
                            path="/register"
                            element={
                              <GuestRoute>
                                <RegisterPage />
                              </GuestRoute>
                            }
                          />
                          <Route
                            path="/register/:planType"
                            element={
                              <GuestRoute>
                                <RegisterWithPlanPage />
                              </GuestRoute>
                            }
                          />
                          <Route
                            path="/onboarding"
                            element={
                              <OnboardingRoute>
                                <OnboardingPage />
                              </OnboardingRoute>
                            }
                          />
                          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                          <Route path="/reset-password" element={<ResetPasswordPage />} />
                          <Route
                            path="/dashboard"
                            element={
                              <ProtectedRoute>
                                <Index />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/profile"
                            element={
                              <ProtectedRoute>
                                <ProfilePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/transactions"
                            element={
                              <ProtectedRoute>
                                <TransactionsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/expenses"
                            element={
                              <ProtectedRoute>
                                <ExpensesPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/goals"
                            element={
                              <ProtectedRoute>
                                <GoalsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/reports"
                            element={
                              <ProtectedRoute>
                                <ReportsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/schedule"
                            element={
                              <ProtectedRoute>
                                <SchedulePage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/settings"
                            element={
                              <ProtectedRoute>
                                <SettingsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/categories"
                            element={
                              <ProtectedRoute>
                                <CategoriesPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route path="/plans" element={<PlansPage />} />
                          <Route path="/checkout/:planType" element={<CheckoutPage />} />
                          <Route path="/payment-success" element={<PaymentSuccessPage />} />
                          <Route path="/thank-you" element={<ThankYouPage />} />
                          <Route
                            path="/achievements"
                            element={
                              <ProtectedRoute>
                                <AchievementsPage />
                              </ProtectedRoute>
                            }
                          />
                          <Route
                            path="/admin"
                            element={
                              <AdminRoute>
                                <AdminLayout />
                              </AdminRoute>
                            }
                          >
                            <Route index element={<Navigate to="/admin/dashboard" replace />} />
                            <Route path="dashboard" element={<AdminDashboardPage />} />
                            <Route path="customers" element={<AdminCustomersPage />} />
                            <Route path="analytics" element={<AdminAnalyticsPage />} />
                            <Route path="plans" element={<AdminPlansPage />} />
                            <Route path="checkouts" element={<AdminCheckoutsPage />} />
                            <Route path="communications" element={<AdminCommunicationsPage />} />
                            <Route path="content" element={<AdminContentPage />} />
                            <Route path="settings" element={<AdminSettingsPage />} />
                            <Route path="logs" element={<AdminLogsPage />} />
                            <Route path="audit" element={<AdminAuditPage />} />
                          </Route>
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </BrowserRouter>
                      <Toaster />
                      <Sonner />
                    </SupabaseInitializer>
                  </AppProvider>
                </SubscriptionProvider>
              </PreferencesProvider>
            </BrandingProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
  );
}

export default App;
