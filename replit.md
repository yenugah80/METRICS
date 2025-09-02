# Overview

**CRITICAL AGENT SAFETY RULES:**
- 🚫 **NEVER delete, rename, or overwrite ANY existing files**
- 🚫 **NEVER modify shared/schema.ts without explicit user approval**
- 🚫 **NEVER touch database configuration files (drizzle.config.ts)**
- 🚫 **NEVER remove or restructure existing route files**
- ✅ **ONLY add new files or edit existing files with user permission**
- ✅ **ALWAYS preserve existing code architecture and patterns**

MyFoodMatrics is an AI-powered nutrition tracking application that revolutionizes food logging through image recognition, barcode scanning, and voice input. The platform provides comprehensive nutritional analysis with personalized insights including diet compatibility, allergen detection, sustainability scoring, and recipe recommendations. Built as a freemium SaaS product with a free tier offering basic functionality and a premium subscription unlocking advanced features like voice logging, detailed sustainability metrics, and unlimited AI-generated recipes.

# Recent Changes (September 2, 2025)

## Production-Ready Security & Quality Infrastructure (September 2, 2025)
- **COMPLETED**: Production hardening with SECURITY.md, CODEOWNERS, LICENSE, and explicit agent safety rules
- **COMPLETED**: Comprehensive CI/CD pipeline with GitHub Actions (lint, typecheck, test, build, k6 performance testing)
- **COMPLETED**: Runtime environment validation with Zod schemas and structured configuration
- **COMPLETED**: Quality gates: ESLint v9 flat config, Prettier, lint-staged, Husky pre-commit hooks
- **COMPLETED**: Security infrastructure: secret scanning, audit automation, hardcoded credential detection
- **COMPLETED**: Performance testing with k6 (p95<1000ms targets, <5% error rates)
- **COMPLETED**: OpenAPI 3.0 specification for all API endpoints
- **COMPLETED**: PRODUCTION_CHECKLIST.md with exact pre-deployment commands and validation steps

## Previous Technical Debt Remediation
- **COMPLETED**: Routes architecture refactoring from 2,631 to 1,499 lines (43% reduction)
- **COMPLETED**: Modular route architecture with specialized modules (food, nutrition, gamification, voice, stripe, etc.)
- **NEXT TARGET**: Address remaining code complexity in shared/schema.ts (1,377 lines)

# User Preferences

Preferred communication style: Simple, everyday language.
Preferred design aesthetic: Professional, trustworthy gradients with soft blue/teal color palette (similar to health/fitness apps).
UI/UX preference: Clean, premium glassmorphism with subtle professional glow effects rather than vibrant cosmic colors.

# Critical File Descriptions

**drizzle.config.ts**: SOURCE OF TRUTH for database migrations. Changes here require `npm run db:push` and potential data migration. Never modify without understanding migration impact.

**components.json**: Active shadcn/ui registry configuration. Used throughout codebase for component imports (@/components). Do not delete.

**test_cookies.txt**: Safe empty file with only Netscape headers. No real credentials present.

# System Architecture

## Frontend Architecture
The application uses a **React-based SPA** built with Vite, featuring a component-driven architecture with shadcn/ui for consistent design. The frontend implements:

- **Responsive Design**: Tailwind CSS with custom theming for brand colors and accessibility
- **State Management**: TanStack Query for server state and local React state for UI interactions
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Session-based auth with automatic redirects for unauthorized access
- **Payment Integration**: Stripe Elements for subscription management

## Backend Architecture
The server follows a **REST API pattern** using Express.js with:

- **Modular Route Structure**: Systematic extraction into specialized route modules (food, nutrition, gamification, voice, stripe, health, stats) with consistent registerXRoutes pattern
- **Session Management**: Express sessions with PostgreSQL storage for auth persistence
- **File Upload Strategy**: Direct-to-cloud uploads with presigned URLs for meal images
- **Error Handling**: Centralized error middleware with structured API responses
- **Development Tooling**: Hot reload with Vite integration and request logging

## Data Storage Architecture
**PostgreSQL** serves as the primary database with Drizzle ORM providing:

- **User Management**: Core user profiles with Stripe integration for billing
- **Meal Tracking**: Hierarchical structure (meals → meal items → nutrition data)
- **Scoring System**: Separate tables for nutrition scores, diet compatibility, and daily aggregates
- **Recipe Storage**: AI-generated recipe caching with user preferences
- **Session Storage**: Database-backed sessions for authentication

## Authentication & Authorization
**Replit Auth (OpenID Connect)** provides:

- **SSO Integration**: Seamless login through Replit's identity provider
- **Session Persistence**: PostgreSQL-backed session storage with automatic cleanup
- **Route Protection**: Middleware-based authentication checks with unauthorized handling
- **User Provisioning**: Automatic user creation/updates on successful authentication

## AI & Machine Learning Integration
**OpenAI GPT-4o-mini** powers multiple AI features:

- **Food Recognition**: Image analysis to identify foods and estimate quantities
- **Nutrition Calculation**: Intelligent macro/micronutrient estimation from food descriptions
- **Recipe Generation**: Personalized recipe creation based on dietary preferences
- **Text Processing**: Voice-to-text transcription and natural language food logging

## Authoritative Data Sources & Requirements

**Nutrition Data** (Hierarchical Priority):
- **Primary**: USDA FDC (Food Data Central) - core nutrition database
- **Secondary**: Open Food Facts - branded product labels and barcodes
- **Tertiary**: Regional databases as add-ons for local foods

**Allergen & Health Rules**:
- **FDA/EFSA** allergen lists for regulatory compliance
- **Internal rule engine** for health conditions (PCOS, diabetes, low-sodium, etc.)

**Environmental Impact**:
- **Peer-reviewed LCA factors** (GHG emissions, water usage, land use) keyed by ingredient
- **Regional overrides** where available for geographical accuracy

**Portion & Density Models**:
- **Cooked/raw density tables** for accurate volume-to-weight conversions
- **Utensil/plate reference library** for portion size estimation from images

## External Dependencies

- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **Stripe**: Payment processing and subscription management for premium features
- **OpenAI**: GPT-4o-mini for food analysis, nutrition scoring, and recipe generation
- **Replit Auth**: OpenID Connect authentication provider for user management
- **Google Cloud Storage**: Object storage for meal images with ACL-based access control
- **shadcn/ui**: Component library built on Radix UI primitives for accessible UI components
- **Tailwind CSS**: Utility-first styling with custom design system for brand consistency