import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Mock the auth and organisation contexts
const mockUseAuth = vi.fn();
const mockUseOrganisation = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('@/contexts/OrganisationContext', () => ({
  useOrganisation: () => mockUseOrganisation(),
}));

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('shows loading spinner when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      userRoles: [],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [],
      isLoading: false,
      isDemoMode: false,
    });

    const { container } = renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    );

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userRoles: ['ADMIN'],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [{ org_id: '1', name: 'Test' }],
      isLoading: false,
      isDemoMode: false,
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  it('redirects unauthenticated users to /welcome', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      userRoles: [],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [],
      isLoading: false,
      isDemoMode: false,
    });

    renderWithRouter(
      <ProtectedRoute><div>Protected content</div></ProtectedRoute>
    );

    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('blocks users without required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userRoles: ['TELLER'],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [{ org_id: '1', name: 'Test' }],
      isLoading: false,
      isDemoMode: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}><div>Admin content</div></ProtectedRoute>
    );

    expect(screen.queryByText('Admin content')).not.toBeInTheDocument();
  });

  it('allows users with required role', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      userRoles: ['ADMIN', 'MANAGER'],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [{ org_id: '1', name: 'Test' }],
      isLoading: false,
      isDemoMode: false,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}><div>Admin content</div></ProtectedRoute>
    );

    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('bypasses RBAC in demo mode', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      userRoles: [],
    });
    mockUseOrganisation.mockReturnValue({
      organisations: [{ org_id: '1', name: 'Demo' }],
      isLoading: false,
      isDemoMode: true,
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['ADMIN']}><div>Demo content</div></ProtectedRoute>
    );

    expect(screen.getByText('Demo content')).toBeInTheDocument();
  });
});
