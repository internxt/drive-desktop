import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthGuard } from '.';

vi.mock('../WidgetSkeleton', () => ({
  WidgetSkeleton: () => <div data-testid="widget-skeleton">Widget Skeleton</div>,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockElectron = {
  onUserLoggedInChanged: vi.fn(),
  isUserLoggedIn: vi.fn(),
};

Object.defineProperty(window, 'electron', {
  value: mockElectron,
  writable: true,
});

const TestChildren = () => <div data-testid="test-children">Test Content</div>;

// Helper function to create AuthGuard JSX
const createAuthGuardJSX = (initialRoute = '/') => (
  <MemoryRouter
    initialEntries={[initialRoute]}
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}>
    <AuthGuard>
      <TestChildren />
    </AuthGuard>
  </MemoryRouter>
);

// Helper function to render AuthGuard with router
const renderAuthGuard = (initialRoute = '/') => {
  return render(createAuthGuardJSX(initialRoute));
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Authentication Loading State', () => {
    it('should show Widget skeleton during auth loading on root route', () => {
      // Given: User is on root route and auth is loading
      mockElectron.isUserLoggedIn.mockReturnValue(new Promise(() => {}));

      // When: AuthGuard renders
      renderAuthGuard('/');

      // Then: Widget skeleton should be visible
      expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
      expect(screen.queryByTestId('test-children')).not.toBeInTheDocument();
    });

    it('should show empty fragment during auth loading on non-root routes', () => {
      // Given: User is on settings route and auth is loading
      mockElectron.isUserLoggedIn.mockReturnValue(new Promise(() => {}));

      // When: AuthGuard renders
      renderAuthGuard('/settings');

      // Then: Neither skeleton nor content should be visible
      expect(screen.queryByTestId('widget-skeleton')).not.toBeInTheDocument();
      expect(screen.queryByTestId('test-children')).not.toBeInTheDocument();
    });

    it('should register auth change listener on mount', () => {
      // Given: AuthGuard is about to mount
      mockElectron.isUserLoggedIn.mockResolvedValue(true);

      // When: AuthGuard renders
      renderAuthGuard('/');

      // Then: Should register listener and check current auth state
      expect(mockElectron.onUserLoggedInChanged).toHaveBeenCalledWith(expect.any(Function));
      expect(mockElectron.isUserLoggedIn).toHaveBeenCalled();
    });
  });

  describe('User Not Authenticated', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Given: User is not logged in
      mockElectron.isUserLoggedIn.mockResolvedValue(false);

      // When: AuthGuard renders on protected route
      renderAuthGuard('/settings');

      // Then: Should redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should store intended route when redirecting to login', async () => {
      // Given: User is not logged in and tries to access settings
      mockElectron.isUserLoggedIn.mockResolvedValue(false);

      // When: AuthGuard renders on settings route
      renderAuthGuard('/settings');

      // Then: Should store the intended route and redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
      // Note: intendedRoute is stored in useRef, tested indirectly through navigation behavior
    });
  });

  describe('User Authenticated', () => {
    beforeEach(() => {
      mockElectron.isUserLoggedIn.mockResolvedValue(true);
    });

    it('should show content after 1000ms delay on root route', async () => {
      // When: AuthGuard renders and time passes
      renderAuthGuard('/');

      // Wait for auth to complete
      await waitFor(() => {
        expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
      });

      // Then: After 1000ms, content should be visible
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
      });
      expect(screen.queryByTestId('widget-skeleton')).not.toBeInTheDocument();
    });

    it('should show content immediately on non-root routes', async () => {
      // When: AuthGuard renders
      renderAuthGuard('/settings');

      // Then: Content should be visible immediately (no delay)
      await waitFor(() => {
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('widget-skeleton')).not.toBeInTheDocument();
    });
  });

  describe('Intended Route Restoration', () => {
    it('should navigate to intended route after successful login', async () => {
      // Given: User initially tries to access settings while not logged in
      mockElectron.isUserLoggedIn.mockResolvedValue(false);

      renderAuthGuard('/settings');

      // Wait for redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      // When: User logs in (simulate auth state change)
      mockElectron.isUserLoggedIn.mockResolvedValue(true);

      // Simulate the auth state change callback
      const authChangeCallback = mockElectron.onUserLoggedInChanged.mock.calls[0][0];
      authChangeCallback(true);

      // Then: Should navigate to intended route
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/settings');
      });
    });

    it('should clear intended route after navigation', async () => {
      // Given: User has an intended route stored
      mockElectron.isUserLoggedIn.mockResolvedValue(false);
      renderAuthGuard('/settings');
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      // When: User logs in and navigates to intended route
      const authChangeCallback = mockElectron.onUserLoggedInChanged.mock.calls[0][0];
      authChangeCallback(true);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/settings');
      });

      // Then: Subsequent auth changes should not trigger navigation
      mockNavigate.mockClear();
      authChangeCallback(true);
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Auth State Changes During Runtime', () => {
    it('should handle logout during app usage', async () => {
      // Given: User is logged in and using the app
      mockElectron.isUserLoggedIn.mockResolvedValue(true);
      renderAuthGuard('/');
      await waitFor(() => {
        expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
      });

      // When: User logs out (auth state changes)
      const authChangeCallback = mockElectron.onUserLoggedInChanged.mock.calls[0][0];
      authChangeCallback(false);

      // Then: Should redirect to login
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should handle login during app usage', async () => {
      // Given: User is on login page
      mockElectron.isUserLoggedIn.mockResolvedValue(false);
      renderAuthGuard('/login');
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });

      // When: User logs in (auth state changes)
      const authChangeCallback = mockElectron.onUserLoggedInChanged.mock.calls[0][0];
      authChangeCallback(true);

      // Then: Should show content (no redirect since no intended route)
      await waitFor(() => {
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
      });
    });
  });

  describe('Route-Specific Behavior', () => {
    const routes = ['/', '/settings', '/process-issues', '/onboarding', '/migration'];
    routes.forEach((path) => {
      it(`should handle ${path} route correctly`, async () => {
        // Given: User is logged in on specific route
        mockElectron.isUserLoggedIn.mockResolvedValue(true);

        // When: AuthGuard renders
        renderAuthGuard(path);

        if (path === '/') {
          // Then: Should show skeleton during delay
          await waitFor(() => {
            expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
          });
        } else {
          // Then: Should show content immediately
          await waitFor(() => {
            expect(screen.getByTestId('test-children')).toBeInTheDocument();
          });
          expect(screen.queryByTestId('widget-skeleton')).not.toBeInTheDocument();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle auth change callback with invalid state', () => {
      // Given: User is logged in initially
      mockElectron.isUserLoggedIn.mockResolvedValue(true);

      renderAuthGuard('/');

      // When: Auth callback is called with invalid state
      const authChangeCallback = mockElectron.onUserLoggedInChanged.mock.calls[0][0];

      // Then: Should handle undefined/null gracefully
      expect(() => authChangeCallback(undefined)).not.toThrow();
      expect(() => authChangeCallback(null)).not.toThrow();
    });
  });

  describe('Performance and Cleanup', () => {
    it('should register auth listener only once', () => {
      // Given: AuthGuard renders multiple times
      const { rerender } = renderAuthGuard('/');

      // Verify initial calls happened
      expect(mockElectron.onUserLoggedInChanged).toHaveBeenCalledTimes(1);
      expect(mockElectron.isUserLoggedIn).toHaveBeenCalledTimes(1);

      // When: Component re-renders
      rerender(createAuthGuardJSX('/'));

      // Then: Should not register listener again (useEffect dependency array is empty)
      expect(mockElectron.onUserLoggedInChanged).toHaveBeenCalledTimes(1);
      expect(mockElectron.isUserLoggedIn).toHaveBeenCalledTimes(1);
    });

    it('should maintain state during re-renders', async () => {
      // Given: User is logged in and content is showing
      mockElectron.isUserLoggedIn.mockResolvedValue(true);
      const { rerender } = renderAuthGuard('/');

      // Wait for initial render
      await waitFor(() => {
        expect(screen.getByTestId('widget-skeleton')).toBeInTheDocument();
      });
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByTestId('test-children')).toBeInTheDocument();
      });

      // When: Component re-renders
      rerender(createAuthGuardJSX('/'));

      // Then: Should maintain content visibility
      expect(screen.getByTestId('test-children')).toBeInTheDocument();
    });
  });
});
