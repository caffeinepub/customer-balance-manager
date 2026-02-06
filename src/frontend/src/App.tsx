import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import Header from './components/Header';
import Footer from './components/Footer';
import LoginScreen from './components/LoginScreen';
import ProfileSetupModal from './components/ProfileSetupModal';
import CustomerDashboard from './components/CustomerDashboard';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { AppRefreshProvider } from './context/AppRefreshContext';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  if (isInitializing) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Initializing...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <LoginScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppRefreshProvider>
        <div className="flex min-h-screen flex-col bg-background">
          <Header userName={userProfile?.name} />
          <main className="flex-1">
            {showProfileSetup ? <ProfileSetupModal /> : <CustomerDashboard />}
          </main>
          <Footer />
          <Toaster />
        </div>
      </AppRefreshProvider>
    </ThemeProvider>
  );
}
