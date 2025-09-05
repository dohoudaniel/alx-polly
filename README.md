# ALX Polly: A Polling Application

Welcome to ALX Polly, a full-stack polling application built with Next.js, TypeScript, and Supabase. This project serves as a practical learning ground for modern web development concepts, with a special focus on identifying and fixing common security vulnerabilities.

## About the Application

ALX Polly allows authenticated users to create, share, and vote on polls. It's a simple yet powerful application that demonstrates key features of modern web development:

- **Authentication**: Secure user sign-up and login.
- **Poll Management**: Users can create, view, and delete their own polls.
- **Voting System**: A straightforward system for casting and viewing votes.
- **User Dashboard**: A personalized space for users to manage their polls.

The application is built with a modern tech stack:

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend & Database**: [Supabase](https://supabase.io/)
- **UI**: [Tailwind CSS](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: React Server Components and Client Components

---

## 🚀 The Challenge: Security Audit & Remediation

As a developer, writing functional code is only half the battle. Ensuring that the code is secure, robust, and free of vulnerabilities is just as critical. This version of ALX Polly has been intentionally built with several security flaws, providing a real-world scenario for you to practice your security auditing skills.

**Your mission is to act as a security engineer tasked with auditing this codebase.**

### Your Objectives:

1.  **Identify Vulnerabilities**:

    - Thoroughly review the codebase to find security weaknesses.
    - Pay close attention to user authentication, data access, and business logic.
    - Think about how a malicious actor could misuse the application's features.

2.  **Understand the Impact**:

    - For each vulnerability you find, determine the potential impact.Query your AI assistant about it. What data could be exposed? What unauthorized actions could be performed?

3.  **Propose and Implement Fixes**:
    - Once a vulnerability is identified, ask your AI assistant to fix it.
    - Write secure, efficient, and clean code to patch the security holes.
    - Ensure that your fixes do not break existing functionality for legitimate users.

### Where to Start?

A good security audit involves both static code analysis and dynamic testing. Here’s a suggested approach:

1.  **Familiarize Yourself with the Code**:

    - Start with `app/lib/actions/` to understand how the application interacts with the database.
    - Explore the page routes in the `app/(dashboard)/` directory. How is data displayed and managed?
    - Look for hidden or undocumented features. Are there any pages not linked in the main UI?

2.  **Use Your AI Assistant**:
    - This is an open-book test. You are encouraged to use AI tools to help you.
    - Ask your AI assistant to review snippets of code for security issues.
    - Describe a feature's behavior to your AI and ask it to identify potential attack vectors.
    - When you find a vulnerability, ask your AI for the best way to patch it.

---

## Getting Started

To begin your security audit, you'll need to get the application running on your local machine.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Supabase](https://supabase.io/) account (the project is pre-configured, but you may need your own for a clean slate).

### 2. Installation

Clone the repository and install the dependencies:

```bash
git clone <repository-url>
cd alx-polly
npm install
```

### 3. Environment Variables

The project uses Supabase for its backend. An environment file `.env.local` is needed.Use the keys you created during the Supabase setup process.

### 4. Running the Development Server

Start the application in development mode:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Good luck, engineer! This is your chance to step into the shoes of a security professional and make a real impact on the quality and safety of this application. Happy hunting!

---

## 🔒 Security Audit & Fixes

**Status:** ✅ COMPLETED - All critical vulnerabilities have been identified and fixed.

This application has undergone a comprehensive security audit and remediation process. All critical and high-severity vulnerabilities have been addressed with proper security controls implemented.

### Security Fixes Implemented

1. **Admin Panel Access Control** - Added proper authentication and role-based access control
2. **Poll Deletion Authorization** - Implemented ownership verification and admin controls
3. **Double Voting Prevention** - Added duplicate vote detection and validation
4. **XSS Protection** - Implemented input sanitization and Content Security Policy
5. **Input Validation** - Added comprehensive validation using Zod schemas
6. **Security Headers** - Implemented all essential security headers
7. **Dependency Security** - Updated all vulnerable dependencies
8. **Environment Security** - Added proper environment variable management
9. **Automated Testing** - Created comprehensive security test suite
10. **CI/CD Security** - Implemented automated security scanning pipeline

### Security Features

- **Authentication & Authorization**: Secure user authentication with role-based access control
- **Input Validation**: Comprehensive validation and sanitization of all user inputs
- **XSS Protection**: Content Security Policy and HTML sanitization
- **CSRF Protection**: Security headers and same-origin policies
- **Rate Limiting Ready**: Infrastructure prepared for rate limiting implementation
- **Automated Security Scanning**: GitHub Actions workflow for continuous security monitoring
- **Dependency Management**: Dependabot for automated security updates

### For Developers

#### Environment Setup

1. Copy `.env.example` to `.env.local`
2. Configure your Supabase credentials
3. Set admin emails in `ADMIN_EMAILS` environment variable

#### Security Testing

```bash
# Run security tests
npm run test:security

# Run all tests
npm test

# Security audit
npm audit --audit-level=moderate
```

#### Admin Access

Admin access is controlled via the `ADMIN_EMAILS` environment variable. Add admin email addresses as a comma-separated list:

```
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### Security Documentation

For detailed information about the security audit and fixes, see [SECURITY_AUDIT.md](./SECURITY_AUDIT.md).

### Reporting Security Issues

If you discover a security vulnerability, please report it responsibly:

1. Do not create a public GitHub issue
2. Email security concerns to the maintainers
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

---
