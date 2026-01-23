# Memora - Wedding Memory App

## Original Problem Statement
Build a wedding memory app where guests can leave memories (name, photo, message) for a couple. Pictures uploaded in order, with admin ability to change background photo and download all final pages as PDF.

## Architecture
- **Backend**: FastAPI with MongoDB
- **Frontend**: React with Tailwind CSS, framer-motion animations
- **Storage**: MongoDB for memories, settings, and base64-encoded images

## User Personas
1. **Wedding Guest**: Leaves memories with name, photo, and message
2. **Admin (Couple/Organizer)**: Manages settings, background, downloads memories

## Core Requirements
- [x] Landing page with MEMORA branding
- [x] Name entry page with configurable welcome text and couple names
- [x] Photo capture/upload page
- [x] Message writing page (200 char limit)
- [x] Final memory page with decorative borders
- [x] Admin panel with password protection (default: memora2024)
- [x] Configurable background image
- [x] Configurable couple names and welcome text
- [x] PDF download of all memories

## What's Been Implemented (Dec 2025)
- Full guest flow: Landing → Name → Photo → Message → Final Memory
- Glass-morphism UI with elegant serif typography
- Camera integration with fallback to file upload
- Admin panel with settings management
- Background image upload
- PDF generation with all memories
- Memory preview and deletion in admin

## API Endpoints
- GET /api/settings - Get app settings
- POST /api/admin/login - Admin authentication
- PUT /api/admin/settings - Update settings
- POST /api/admin/background - Upload background image
- POST /api/memories - Create memory
- GET /api/memories - Get all memories
- DELETE /api/memories/:id - Delete memory
- GET /api/memories/pdf - Download PDF

## Prioritized Backlog
### P0 (Critical)
- All core features implemented ✅

### P1 (Important)
- Email notifications when memory is submitted
- QR code generation for easy sharing

### P2 (Nice to Have)
- Multiple event support
- Gallery view of all memories
- Video message support

## Next Tasks
1. Test PDF generation with actual photos
2. Add email notification integration
3. Generate shareable QR code for guests
