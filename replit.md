# Overview

This is a fully functional AI-powered meeting notes summarizer that allows users to upload transcript files or paste text directly, generate customized AI summaries using the Groq API, edit summaries, and share them via email. The application features a step-by-step workflow with file upload, AI customization templates, real-time editing, and email distribution capabilities. Built with modern web technologies and ready for deployment.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI components
- **State Management**: TanStack Query (React Query) for server state management and API interactions
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with dedicated routes for transcript upload, summary generation, and email sharing
- **File Processing**: Multer middleware for handling file uploads with support for .txt and .docx files
- **AI Integration**: Groq SDK for generating AI-powered summaries
- **Email Service**: Nodemailer for sending summary emails

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema**: Three main entities - transcripts, summaries, and email shares with proper foreign key relationships
- **Connection**: Neon Database serverless PostgreSQL instance
- **Migrations**: Drizzle Kit for database schema management and migrations

## Development Environment
- **Monorepo Structure**: Shared schema definitions between client and server
- **Build Process**: Vite for frontend bundling, esbuild for backend compilation
- **Development Server**: Hot module replacement with Vite integration
- **Type Safety**: Comprehensive TypeScript configuration with path aliases

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple
- **Security**: Basic session-based authentication (implementation details not fully visible in current codebase)

# External Dependencies

## AI Services
- **Groq API**: For generating AI-powered transcript summaries with customizable instructions using llama-3.3-70b-versatile model

## Database Services
- **Neon Database**: Serverless PostgreSQL database for data persistence
- **Connection**: Uses `@neondatabase/serverless` driver for optimal serverless performance

## Email Services
- **SMTP Provider**: Configurable SMTP service (default Gmail) for sending summary emails via Nodemailer

## UI Framework
- **shadcn/ui**: Comprehensive React component library built on Radix UI primitives
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework for styling

## Development Tools
- **Replit Integration**: Special development banner and cartographer plugin for Replit environment
- **Vite Plugins**: Runtime error overlay and development tooling

## File Processing
- **Multer**: Middleware for handling multipart/form-data file uploads
- **File Types**: Support for plain text (.txt) and Microsoft Word (.docx) documents