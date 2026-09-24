import { Router, Request, Response } from 'express';
import { db } from '../db/store.js';
import { SEED_USERS, SEED_ORGANIZATIONS, SEED_BRANCHES } from '../db/initial-seed.js';

export const authRouter = Router();

// Demo users with roles for quick evaluation
const DEMO_PERSONAS = [
  {
    id: 'usr-rajesh-owner',
    fullName: 'Dr. Rajesh Sharma',
    email: 'rajesh.sharma@aarohan.edu.in',
    phone: '+919829012345',
    role: 'OWNER',
    designation: 'Managing Director & Founder',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Director / Management',
    color: 'bg-red-900 text-white',
  },
  {
    id: 'usr-alok-teacher',
    fullName: 'Prof. Alok Mukherjee',
    email: 'alok.mukherjee@aarohan.edu.in',
    phone: '+919829023456',
    role: 'TEACHER',
    designation: 'Head of Physics Faculty',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Faculty Head',
    color: 'bg-rose-800 text-white',
  },
  {
    id: 'usr-pooja-counsellor',
    fullName: 'Pooja Verma',
    email: 'pooja.verma@aarohan.edu.in',
    phone: '+919829056789',
    role: 'COUNSELLOR',
    designation: 'Senior Admission Counsellor',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Admissions & Front Desk',
    color: 'bg-amber-800 text-white',
  },
  {
    id: 'usr-suresh-accountant',
    fullName: 'Suresh Nair',
    email: 'suresh.nair@aarohan.edu.in',
    phone: '+919829045678',
    role: 'ACCOUNTANT',
    designation: 'Senior Fee Accountant',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Accounts & Fees',
    color: 'bg-emerald-800 text-white',
  },
  {
    id: 'usr-ishita-student',
    fullName: 'Ishita Mehra',
    email: 'ishita.mehra@student.aarohan.edu.in',
    phone: '+919414011111',
    role: 'STUDENT',
    designation: 'JEE 2027 Aspirant',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Student / Aspirant',
    color: 'bg-blue-800 text-white',
  },
  {
    id: 'usr-mehra-parent',
    fullName: 'Dr. Vikram Mehra',
    email: 'vikram.mehra@example.com',
    phone: '+919810123400',
    role: 'PARENT',
    designation: 'Parent & Guardian of Ishita',
    organizationId: 'org-kota-001',
    instituteName: 'Aarohan JEE Academy',
    badge: 'Parent / Guardian',
    color: 'bg-emerald-800 text-white',
  },
];

// GET /api/v1/auth/bootstrap
authRouter.get('/bootstrap', async (_req: Request, res: Response) => {
  try {
    const organizations = await db.getOrganizations();
    const branches = await db.getAllBranches();
    const users = await db.getAllUsers();
    res.json({
      data: {
        organizations,
        branches,
        users,
      },
      message: 'Bootstrap entities loaded from database',
    });
  } catch (error: any) {
    res.status(500).json({
      data: null,
      error: { message: error.message || 'Failed to load bootstrap entities' },
    });
  }
});

// GET /api/v1/auth/organizations
authRouter.get('/organizations', async (_req: Request, res: Response) => {
  try {
    const organizations = await db.getOrganizations();
    res.json({
      data: organizations,
      message: 'Organizations loaded from database',
    });
  } catch (error: any) {
    res.status(500).json({
      data: null,
      error: { message: error.message || 'Failed to load organizations' },
    });
  }
});

// GET /api/v1/auth/demo-users
authRouter.get('/demo-users', (_req: Request, res: Response) => {
  res.json({
    data: DEMO_PERSONAS,
    message: 'Demo credentials and personas loaded successfully',
  });
});

// POST /api/v1/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password, role } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({
        data: null,
        error: { message: 'Email or Mobile Number is required' },
      });
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();

    // 1. Primary: Search MySQL Database for registered user
    const dbUser = await db.getUserByEmailOrPhone(cleanInput);
    if (dbUser) {
      // If user has a stored password, check if it matches (or allow if not set)
      if (dbUser.password && password && dbUser.password !== password) {
        return res.status(401).json({
          data: null,
          error: { message: 'Invalid password. Please check your credentials.' },
        });
      }

      const org = (await db.getOrganizationById(dbUser.organizationId)) || {
        id: dbUser.organizationId,
        legalName: 'Registered Coaching Institute',
        tradeName: 'Registered Coaching Institute',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        tier: 'GROWTH',
        status: 'ACTIVE',
      };

      const branches = await db.getBranches(dbUser.organizationId);
      const branch = branches.find((b) => b.id === dbUser.primaryBranchId) || branches[0] || {
        id: `br-${dbUser.organizationId}-main`,
        organizationId: dbUser.organizationId,
        branchCode: 'MAIN_01',
        name: 'Main Campus',
        address: '101, Education Hub',
        city: 'Kota',
        state: 'Rajasthan',
        pincode: '324005',
        phone: dbUser.phone,
        status: 'ACTIVE',
      };

      const token = `cos_jwt_${dbUser.id}_${Date.now()}`;

      return res.json({
        data: {
          token,
          user: {
            id: dbUser.id,
            fullName: dbUser.fullName,
            email: dbUser.email,
            phone: dbUser.phone,
            role: dbUser.role,
            designation: dbUser.designation,
            organizationId: org.id,
            primaryBranchId: branch.id,
          },
          organization: org,
          branch: branch,
        },
        message: `Welcome back, ${dbUser.fullName}! Successfully authenticated from database.`,
      });
    }

    // 2. Secondary: Check demo personas
    let matchedUser = DEMO_PERSONAS.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.phone.replace(/[^0-9]/g, '').includes(cleanInput.replace(/[^0-9]/g, ''))
    );

    if (!matchedUser) {
      const seedUser = SEED_USERS.find(
        (u) =>
          (u.email && u.email.toLowerCase() === cleanInput) ||
          u.phone.replace(/[^0-9]/g, '').includes(cleanInput.replace(/[^0-9]/g, ''))
      );

      if (seedUser) {
        matchedUser = {
          id: seedUser.id,
          fullName: seedUser.fullName,
          email: seedUser.email || '',
          phone: seedUser.phone,
          role: seedUser.role,
          designation: seedUser.designation || 'Staff Member',
          organizationId: seedUser.organizationId,
          instituteName: 'Aarohan JEE Academy',
          badge: seedUser.role,
          color: 'bg-red-900 text-white',
        };
      }
    }

    // 3. Fallback for custom director login if not found
    if (!matchedUser) {
      matchedUser = {
        id: `usr-custom-${Date.now()}`,
        fullName: cleanInput.includes('@') ? cleanInput.split('@')[0].toUpperCase() : 'Institute Director',
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput}@institute.edu.in`,
        phone: cleanInput.includes('@') ? '+919800000000' : cleanInput,
        role: (role as any) || 'OWNER',
        designation: 'Managing Director',
        organizationId: 'org-kota-001',
        instituteName: 'Aarohan JEE Academy',
        badge: 'Director / Management',
        color: 'bg-red-900 text-white',
      };
    }

    // Find organization and branch
    const org =
      (await db.getOrganizationById(matchedUser.organizationId)) ||
      SEED_ORGANIZATIONS.find((o) => o.id === matchedUser?.organizationId) ||
      SEED_ORGANIZATIONS[0];

    const branches = await db.getBranches(org.id);
    const branch =
      branches.find((b) => b.organizationId === org.id) ||
      SEED_BRANCHES.find((b) => b.organizationId === org.id) ||
      SEED_BRANCHES[0];

    const token = `cos_jwt_${matchedUser.id}_${Date.now()}`;

    res.json({
      data: {
        token,
        user: {
          id: matchedUser.id,
          fullName: matchedUser.fullName,
          email: matchedUser.email,
          phone: matchedUser.phone,
          role: matchedUser.role,
          designation: matchedUser.designation,
          organizationId: org.id,
          primaryBranchId: branch.id,
        },
        organization: org,
        branch: branch,
      },
      message: `Welcome back, ${matchedUser.fullName}! Successfully authenticated.`,
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    res.status(500).json({
      data: null,
      error: { message: error.message || 'Authentication failed' },
    });
  }
});

// POST /api/v1/auth/register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const {
      instituteName,
      legalName,
      directorName,
      email,
      phone,
      password,
      city,
      state,
      studentTier,
      targetExam,
    } = req.body;

    if (!instituteName || !directorName || !email || !phone) {
      return res.status(400).json({
        data: null,
        error: {
          message: 'Institute Name, Director Name, Email, and Phone are mandatory.',
        },
      });
    }

    const orgId = `org-${instituteName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16)}-${Date.now().toString().slice(-4)}`;
    const branchId = `br-${orgId}-main`;
    const userId = `usr-${directorName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 16)}-owner`;

    const newOrg = {
      id: orgId,
      legalName: legalName || `${instituteName} Educational Foundation`,
      tradeName: instituteName,
      gstin: '08AAACX' + Math.floor(1000 + Math.random() * 9000) + 'A1Z5',
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      tier: (studentTier as any) || 'GROWTH',
      status: 'ACTIVE' as const,
    };

    const newBranch = {
      id: branchId,
      organizationId: orgId,
      branchCode: `${(city || 'CAMPUS').toUpperCase().slice(0, 4)}_MAIN`,
      name: `Main Campus - ${city || 'City Centre'}`,
      address: `101, Education Hub, ${city || 'Kota'}`,
      city: city || 'Kota',
      state: state || 'Rajasthan',
      pincode: '324005',
      phone: phone,
      status: 'ACTIVE' as const,
    };

    const newUser = {
      id: userId,
      organizationId: orgId,
      primaryBranchId: branchId,
      phone: phone,
      email: email,
      fullName: directorName,
      role: 'OWNER' as const,
      designation: 'Founder & Managing Director',
    };

    // 1. DYNAMIC PERSISTENCE: Save directly to MySQL database!
    await db.createOrganization(newOrg);
    await db.createBranch(newBranch);
    await db.createUser({
      ...newUser,
      password: password || 'CoachingOS@2026',
    });

    // 2. Initialize fresh payment account in database
    await db.updatePaymentAccount(orgId, {
      upiEnabled: true,
      upiId: `${instituteName.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`,
      upiMerchantName: instituteName,
      gatewayEnabled: true,
      gatewayProvider: 'SANDBOX',
      bankTransferEnabled: true,
      cashEnabled: true,
      paymentLinksEnabled: true,
      testMode: true,
    });

    // 3. Log registration in audit_logs table
    await db.logAudit(orgId, directorName, 'OWNER', 'REGISTER_INSTITUTE', 'organizations', orgId);

    // 4. Also keep in-memory lists updated for backward-compatibility
    SEED_ORGANIZATIONS.unshift(newOrg);
    SEED_BRANCHES.unshift(newBranch);
    SEED_USERS.unshift(newUser);

    const token = `cos_jwt_${newUser.id}_${Date.now()}`;

    res.status(201).json({
      data: {
        token,
        user: newUser,
        organization: newOrg,
        branch: newBranch,
      },
      message: `Congratulations! ${instituteName} has been onboarded and saved to the database successfully.`,
    });
  } catch (error: any) {
    console.error('Error during registration:', error);
    res.status(500).json({
      data: null,
      error: { message: error.message || 'Registration failed' },
    });
  }
});

// POST /api/v1/auth/forgot-password
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const { emailOrPhone } = req.body;
  if (!emailOrPhone) {
    return res.status(400).json({
      data: null,
      error: { message: 'Email or Mobile Number is required' },
    });
  }

  res.json({
    data: {
      success: true,
      demoOtp: '492815',
      expiresIn: '10 minutes',
    },
    message: `Password reset instructions and 6-digit OTP sent to ${emailOrPhone}. (Demo OTP: 492815)`,
  });
});

// POST /api/v1/auth/change-password
authRouter.post('/change-password', async (req: Request, res: Response) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({
        data: null,
        error: { message: 'userId and newPassword are required' },
      });
    }

    await db.updateUserPassword(userId, newPassword);

    res.json({
      data: { success: true },
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      data: null,
      error: { message: error.message || 'Failed to update password' },
    });
  }
});

