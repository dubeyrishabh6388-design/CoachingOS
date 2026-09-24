'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, Branch, User } from '../types';
import { SEED_ORGANIZATIONS, SEED_BRANCHES, SEED_USERS } from '../db/initial-seed';
import { db } from '../db/store';


interface AppContextType {
  isAuthenticated: boolean;
  currentOrg: Organization;
  currentBranch: Branch;
  currentUser: User;
  allOrgs: Organization[];
  allBranches: Branch[];
  allUsers: User[];
  switchOrg: (orgId: string) => void;
  switchBranch: (branchId: string) => void;
  switchUser: (userId: string) => void;
  login: (user: User, org?: Organization, branch?: Branch) => void;
  logout: () => void;
  addUser: (user: User) => void;
  updateUserPassword: (userId: string, newPassword: string) => Promise<boolean>;
  registerInstitute: (instituteData: {
    instituteName: string;
    legalName?: string;
    directorName: string;
    email: string;
    phone: string;
    password?: string;
    city: string;
    state?: string;
    studentTier?: string;
  }) => Promise<{ success: boolean; message?: string }>;
  toastMessage: string | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapse: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [allOrgs, setAllOrgs] = useState<Organization[]>(SEED_ORGANIZATIONS);
  const [allBranchesList, setAllBranchesList] = useState<Branch[]>(SEED_BRANCHES);
  const [allUsersList, setAllUsersList] = useState<User[]>(SEED_USERS);

  const [currentOrg, setCurrentOrg] = useState<Organization>(SEED_ORGANIZATIONS[0]);
  const [currentBranch, setCurrentBranch] = useState<Branch>(SEED_BRANCHES[0]);
  const [currentUser, setCurrentUser] = useState<User>(SEED_USERS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(prev => !prev);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const toggleSidebarCollapse = () => setIsSidebarCollapsed(prev => !prev);

  // Dynamic Bootstrap: Fetch live organizations, branches and users from MySQL
  useEffect(() => {
    const BUILTIN_ORGS = ['org-kota-001', 'org-pune-002', 'org-blr-003', 'org-hyd-004', 'org-del-005'];

    async function loadDatabaseBootstrap() {
      try {
        const res = await fetch('http://localhost:4000/api/v1/auth/bootstrap');
        const json = await res.json();
        if (res.ok && json?.data) {
          const { organizations = [], branches = [], users = [] } = json.data;

          // ── ALWAYS keep SEED orgs/branches/users in the list ─────────────────
          // Backend may only return the registered user's org. We still need
          // org-kota-001 etc. so demo persona login works correctly.
          const mergedOrgs: Organization[] = [
            ...SEED_ORGANIZATIONS,
            ...organizations.filter((o: Organization) => !SEED_ORGANIZATIONS.some(s => s.id === o.id)),
          ];
          const mergedBranches: Branch[] = [
            ...SEED_BRANCHES,
            ...branches.filter((b: Branch) => !SEED_BRANCHES.some(s => s.id === b.id)),
          ];
          const mergedUsers: User[] = [
            ...SEED_USERS,
            ...users.filter((u: User) => !SEED_USERS.some(s => s.id === u.id)),
          ];

          setAllOrgs(mergedOrgs);
          setAllBranchesList(mergedBranches);
          setAllUsersList(mergedUsers);

          // Restore the org the user last chose (could be 'org-kota-001' if they
          // clicked a demo persona, or their real org if they used credentials).
          const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('coachingos_org_id') : null;
          const targetOrg = mergedOrgs.find((o) => o.id === savedOrgId) || mergedOrgs[0];
          setCurrentOrg(targetOrg);

          let restoredBranch: Branch | undefined;
          const orgBranches = mergedBranches.filter((b) => b.organizationId === targetOrg.id);
          restoredBranch = orgBranches[0];
          if (restoredBranch) setCurrentBranch(restoredBranch);

          // Restore user from localStorage
          let restoredUser: User | undefined;
          const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('coachingos_user') : null;
          if (savedUserStr) {
            try {
              const parsedUser = JSON.parse(savedUserStr);
              const matched = mergedUsers.find((u) => u.id === parsedUser.id) || parsedUser;
              setCurrentUser(matched);
              restoredUser = matched;
            } catch (_) {}
          }

          // 🌱 Seed demo data for any non-built-in org so dashboard is never empty
          const targetOrgId = targetOrg.id;
          if (!BUILTIN_ORGS.includes(targetOrgId) && restoredBranch && restoredUser) {
            db.seedDemoDataForOrg({
              orgId: targetOrgId,
              branchId: restoredBranch.id,
              ownerUserId: restoredUser.id,
              ownerName: restoredUser.fullName,
              orgName: (targetOrg as any).tradeName || (targetOrg as any).legalName || 'My Institute',
            });
          }
        }
      } catch (err) {
        console.warn('Could not sync bootstrap from MySQL backend:', err);
        // 🌱 Even if backend is down, seed from localStorage
        const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('coachingos_org_id') : null;
        const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('coachingos_user') : null;
        const savedBranchId = typeof window !== 'undefined' ? localStorage.getItem('coachingos_branch_id') : null;
        if (savedOrgId && savedUserStr && !BUILTIN_ORGS.includes(savedOrgId)) {
          try {
            const restoredUser: User = JSON.parse(savedUserStr);
            db.seedDemoDataForOrg({
              orgId: savedOrgId,
              branchId: savedBranchId || `br-${savedOrgId}`,
              ownerUserId: restoredUser.id,
              ownerName: restoredUser.fullName,
              orgName: 'My Institute',
            });
          } catch (_) {}
        }
      }
    }

    loadDatabaseBootstrap();
  }, []);





  // Keyboard shortcut: Cmd+B or Ctrl+B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string, _type?: 'success' | 'error' | 'info' | 'warning') => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const switchOrg = (orgId: string) => {
    const org = allOrgs.find(o => o.id === orgId);
    if (!org) return;
    setCurrentOrg(org);
    if (typeof window !== 'undefined') {
      localStorage.setItem('coachingos_org_id', orgId);
    }
    const branch = allBranchesList.find(b => b.organizationId === orgId) || allBranchesList[0];
    if (branch) {
      setCurrentBranch(branch);
      if (typeof window !== 'undefined') {
        localStorage.setItem('coachingos_branch_id', branch.id);
      }
    }
    showToast(`Switched Institute to ${org.tradeName}`);
  };

  const switchBranch = (branchId: string) => {
    const branch = allBranchesList.find(b => b.id === branchId);
    if (!branch) return;
    setCurrentBranch(branch);
    if (typeof window !== 'undefined') {
      localStorage.setItem('coachingos_branch_id', branchId);
    }
    showToast(`Switched Branch to ${branch.name}`);
  };

  const switchUser = (userId: string) => {
    const user = activeUsers.find(u => u.id === userId) || allUsersList.find(u => u.id === userId && u.organizationId === currentOrg.id);
    if (!user) return;
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('coachingos_user', JSON.stringify(user));
    }
    showToast(`Switched Persona to ${user.fullName} (${user.role})`);
  };

  const login = (user: User, org?: Organization, branch?: Branch) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    const targetOrg = org || currentOrg;
    const targetBranch = branch || currentBranch;
    if (org) {
      setCurrentOrg(org);
      if (typeof window !== 'undefined') {
        localStorage.setItem('coachingos_org_id', org.id);
      }
    }
    if (branch) {
      setCurrentBranch(branch);
      if (typeof window !== 'undefined') {
        localStorage.setItem('coachingos_branch_id', branch.id);
      }
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('coachingos_user', JSON.stringify(user));
    }
    // 🌱 Auto-seed demo data for any non-built-in org so dashboard is never empty
    const BUILTIN_ORGS = ['org-kota-001', 'org-pune-002', 'org-blr-003', 'org-hyd-004', 'org-del-005'];
    if (!BUILTIN_ORGS.includes(targetOrg.id)) {
      db.seedDemoDataForOrg({
        orgId: targetOrg.id,
        branchId: targetBranch.id,
        ownerUserId: user.id,
        ownerName: user.fullName,
        orgName: (targetOrg as any).tradeName || (targetOrg as any).legalName || 'My Institute',
      });
    }
    showToast(`Signed in as ${user.fullName} (${user.role})`, 'success');
  };


  const logout = () => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coachingos_user');
      localStorage.removeItem('coachingos_org_id');
      localStorage.removeItem('coachingos_branch_id');
    }
    showToast('Signed out of CoachingOS session', 'info');
  };

  const addUser = (newUser: User) => {
    setAllUsersList(prev => {
      const idx = prev.findIndex(u => u.id === newUser.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newUser;
        return copy;
      }
      return [...prev, newUser];
    });
    db.addUser(newUser);
  };

  const updateUserPassword = async (userId: string, newPass: string): Promise<boolean> => {
    // 1. Update in local singleton store
    db.updateUserPassword(userId, newPass);

    // 2. Update currentUser if matching
    if (currentUser.id === userId) {
      const updatedUser = { ...currentUser, password: newPass };
      setCurrentUser(updatedUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('coachingos_user', JSON.stringify(updatedUser));
      }
    }

    // 3. Update in allUsersList
    setAllUsersList(prev => prev.map(u => u.id === userId ? { ...u, password: newPass } : u));

    // 4. Try updating in backend API if available
    try {
      await fetch('http://localhost:4000/api/v1/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, newPassword: newPass }),
      });
    } catch (_) {}

    showToast('Password updated successfully!', 'success');
    return true;
  };

  const registerInstitute = async (instituteData: {
    instituteName: string;
    legalName?: string;
    directorName: string;
    email: string;
    phone: string;
    password?: string;
    city: string;
    state?: string;
    studentTier?: string;
  }) => {
    try {
      // Direct call to MySQL Backend Registration API
      const res = await fetch('http://localhost:4000/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(instituteData),
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        const { user, organization, branch } = data.data;
        setAllOrgs(prev => [organization, ...prev.filter(o => o.id !== organization.id)]);
        setAllBranchesList(prev => [branch, ...prev.filter(b => b.id !== branch.id)]);
        setAllUsersList(prev => [user, ...prev.filter(u => u.id !== user.id)]);
        setCurrentOrg(organization);
        setCurrentBranch(branch);
        setCurrentUser(user);
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem('coachingos_org_id', organization.id);
          localStorage.setItem('coachingos_branch_id', branch.id);
          localStorage.setItem('coachingos_user', JSON.stringify(user));
        }
        // 🌱 Seed rich demo data so new institute sees a fully populated dashboard
        db.seedDemoDataForOrg({
          orgId: organization.id,
          branchId: branch.id,
          ownerUserId: user.id,
          ownerName: user.fullName,
          orgName: organization.tradeName || organization.legalName,
        });
        showToast(`Welcome! ${organization.tradeName} successfully registered and saved to database.`, 'success');
        return { success: true };

      } else if (data?.error?.message) {
        throw new Error(data.error.message);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      showToast(err.message || 'Registration failed', 'error');
      throw err;
    }

    return { success: false };
  };

  // Strictly isolate branches and users to CURRENT institute
  const filteredBranches = allBranchesList.filter(b => b.organizationId === currentOrg.id);
  const activeBranches = filteredBranches.length > 0 ? filteredBranches : allBranchesList;

  const filteredUsers = allUsersList.filter(u => u.organizationId === currentOrg.id);
  const activeUsers = filteredUsers.length > 0
    ? filteredUsers
    : (currentUser && currentUser.organizationId === currentOrg.id ? [currentUser] : []);

  // Always expose ALL built-in demo orgs + the user's registered org.
  // This ensures the demo persona login can always switch to org-kota-001
  // even when the user has their own registered institute active.
  const BUILTIN_ORG_IDS = ['org-kota-001', 'org-pune-002', 'org-blr-003', 'org-del-005', 'org-hyd-004'];
  const accessibleOrgs = allOrgs.filter(o =>
    BUILTIN_ORG_IDS.includes(o.id) || o.id === currentOrg.id
  );


  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentOrg,
        currentBranch,
        currentUser,
        allOrgs: accessibleOrgs.length > 0 ? accessibleOrgs : [currentOrg],
        allBranches: activeBranches,
        allUsers: activeUsers,
        switchOrg,
        switchBranch,
        switchUser,
        login,
        logout,
        addUser,
        updateUserPassword,
        registerInstitute,
        toastMessage,
        showToast,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        toggleMobileMenu,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapse,
      }}
    >
      {children}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#450a0a] text-white px-4 py-3 rounded-lg shadow-xl border border-[#7f1d1d] animate-slide-up text-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
