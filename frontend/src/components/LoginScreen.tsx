import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Shield, TrendingUp, FileText } from 'lucide-react';

export default function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
              <span className="text-3xl font-bold text-primary-foreground">CB</span>
            </div>
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Customer Balance Manager</h1>
          <p className="text-lg text-muted-foreground">
            Manage outstanding balances and track payments efficiently
          </p>
        </div>

        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in to access your customer balance dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={login}
              disabled={isLoggingIn}
              size="lg"
              className="w-full gap-2 text-base"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Sign In
                </>
              )}
            </Button>

            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-3 text-sm">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Secure Authentication</p>
                  <p className="text-muted-foreground">Protected by Internet Identity</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <TrendingUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Track Balances</p>
                  <p className="text-muted-foreground">Monitor outstanding payments in real-time</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <div>
                  <p className="font-medium">Excel Import</p>
                  <p className="text-muted-foreground">Bulk upload customer data from spreadsheets</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
