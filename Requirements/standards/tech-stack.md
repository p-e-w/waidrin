# Tech Stack

> Version: 1.0.0
> Last Updated: 2025-07-22

## Context

This file is part of the Agent OS standards system. These global tech stack defaults are referenced by all product codebases when initializing new projects. Individual projects may override these choices in their `.agent-os/product/tech-stack.md` file.

## Core Technologies

### Application Framework
- **Framework:** Next.js
- **Version:** 15.4+
- **Language:** TypeScript 5+

### Database
- **Primary:** PostgreSQL
- **Version:** 17+
- **ORM:** Active Record

## Frontend Stack

### JavaScript Framework
- **Framework:** React
- **Version:** Latest stable
- **Build Tool:** Vite

### Import Strategy
- **Strategy:** Node.js modules
- **Package Manager:** npm
- **Node Version:** 22 LTS

### CSS Framework
- **Framework:** TailwindCSS
- **Version:** 4.0+
- **PostCSS:** Yes

### UI Components
- **Library:** Radix Themes
- **Version:** Latest
- **Installation:** import module

## Assets & Media

### Fonts
- **Provider:** Google Fonts
- **Loading Strategy:** Self-hosted for performance

### Icons
- **Library:** Lucide
- **Implementation:** React components

## Infrastructure

### Application Hosting
- **Platform:** Local
- **Service:** N/A
- **Region:** Primary region based on user base

### Database Hosting
- **Provider:** Local
- **Service:** N/A
- **Backups:** Daily automated

### Asset Storage
- **Provider:** N/A
- **CDN:** N/A
- **Access:** N/A

## Deployment

### CI/CD Pipeline
- **Platform:** GitHub Actions
- **Trigger:** Push to main/staging branches
- **Tests:** Run before deployment

### Environments
- **Production:** main branch
- **Staging:** staging branch
- **Review Apps:** PR-based (optional)

---

*Customize this file with your organization's preferred tech stack. These defaults are used when initializing new projects with Agent OS.*
