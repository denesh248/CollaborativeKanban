import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { JWT_SECRET } from '../config/environment.js';

// ---------------------------------------------------------------------
// Helper: Helper function to generate a standard JWT token
// ---------------------------------------------------------------------
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

// ---------------------------------------------------------------------
// 1. Login user with email & password
// ---------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            organization: true,
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password hash
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Format accessible tenants and organizations for frontend
    const organizations = [];
    const tenants = [];
    const orgMap = new Map();

    user.memberships.forEach((m) => {
      // Collect unique organizations
      if (m.organization && !orgMap.has(m.organization.id)) {
        orgMap.set(m.organization.id, true);
        organizations.push({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role,
        });
      }

      // Collect accessible tenants/branches
      if (m.tenant) {
        tenants.push({
          id: m.tenant.id,
          name: m.tenant.name,
          organizationId: m.organizationId,
          role: m.role,
        });
      } else if (m.role === 'ORG_ADMIN') {
        // If Org Admin at organization level, they can see all branches in that org
        // (Handled also when fetching org branches)
      }
    });

    // Generate JWT token
    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizations,
        tenants,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          organizationId: m.organizationId,
          organizationName: m.organization?.name,
          tenantId: m.tenantId,
          tenantName: m.tenant?.name || 'All Branches (Org-wide)',
        })),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ---------------------------------------------------------------------
// 2. Get current logged-in user profile & memberships
// ---------------------------------------------------------------------
export const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        memberships: {
          include: {
            organization: true,
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Format organizations and branches
    const organizations = [];
    const tenants = [];
    const orgMap = new Map();

    user.memberships.forEach((m) => {
      if (m.organization && !orgMap.has(m.organization.id)) {
        orgMap.set(m.organization.id, true);
        organizations.push({
          id: m.organization.id,
          name: m.organization.name,
          role: m.role,
        });
      }

      if (m.tenant) {
        tenants.push({
          id: m.tenant.id,
          name: m.tenant.name,
          organizationId: m.organizationId,
          role: m.role,
        });
      }
    });

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        organizations,
        tenants,
        memberships: user.memberships.map((m) => ({
          id: m.id,
          role: m.role,
          organizationId: m.organizationId,
          organizationName: m.organization?.name,
          tenantId: m.tenantId,
          tenantName: m.tenant?.name || 'All Branches (Org-wide)',
        })),
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ message: 'Server error retrieving user profile' });
  }
};

// ---------------------------------------------------------------------
// 3. Simple registration (creates a standard MEMBER account)
// ---------------------------------------------------------------------
export const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ message: 'Email, password, and full name are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if email already in use
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase().trim(),
        fullName: fullName.trim(),
        passwordHash,
      },
    });

    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        organizations: [],
        tenants: [],
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error registering user' });
  }
};
