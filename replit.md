# Overview

MyFoodMatrics is an AI-powered nutrition tracking application that revolutionizes food logging through image recognition, barcode scanning, and voice input. The platform provides comprehensive nutritional analysis with personalized insights including diet compatibility, allergen detection, sustainability scoring, and recipe recommendations. Built as a freemium SaaS product with a free tier offering basic functionality and a premium subscription unlocking advanced features like voice logging, detailed sustainability metrics, and unlimited AI-generated recipes.

# User Preferences

Preferred communication style: Simple, everyday language.

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

- **Modular Route Structure**: Centralized route registration with middleware-based authentication
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

## External Dependencies

- **Neon Database**: PostgreSQL hosting with connection pooling via @neondatabase/serverless
- **Stripe**: Payment processing and subscription management for premium features
- **OpenAI**: GPT-4o-mini for food analysis, nutrition scoring, and recipe generation
- **Replit Auth**: OpenID Connect authentication provider for user management
- **Google Cloud Storage**: Object storage for meal images with ACL-based access control
- **shadcn/ui**: Component library built on Radix UI primitives for accessible UI components
- **Tailwind CSS**: Utility-first styling with custom design system for brand consistency