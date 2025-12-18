import { useAuth } from '@/providers/auth-provider';
import { AuthLoadingScreen } from './AuthLoadingScreen';

interface AuthLoadingWrapperProps {
  children: React.ReactNode;
}

export function AuthLoadingWrapper({ children }: AuthLoadingWrapperProps) {
  const { isLoading, loadingState, loadingMessage, authError, retryAuth } = useAuth();

  // Show loading screen when:
  // 1. Initial loading is in progress
  // 2. There's an auth error that needs user action
  const shouldShowLoading = isLoading || loadingState === 'error';

  return (
    <>
      {children}
      {shouldShowLoading && (
        <AuthLoadingScreen
          loadingState={loadingState}
          loadingMessage={loadingMessage}
          error={authError}
          onRetry={retryAuth}
        />
      )}
    </>
  );
}
