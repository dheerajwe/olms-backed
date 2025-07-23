# OLMS Backend Project Overview

## 1. Project Purpose
This is a Node.js/Express backend for an Online Leave and Outing Management System (OLMS) for hostels/universities. It manages student leaves and outings, supports role-based admin controls, and provides a secure, RESTful API.

---

## 2. Entry Points
- **index.js / server.js**: Initialize Express, connect to MongoDB, set up middleware, serve static files, and mount all API routes. Both listen on a configurable port.

---

## 3. Configuration
- **config/constants.js**: Global constants (max outings/leaves, status enums, admin roles, role hierarchy).
- **config/db.js**: MongoDB connection logic using Mongoose.

---

## 4. Middleware
- **auth.js**: JWT authentication, role-based authorization, minimum role checks.
- **errorHandler.js**: Centralized error handling for all routes.
- **upload.js**: Handles file uploads (student images) using multer, with file type and size restrictions.

---

## 5. Models
- **Admin.js**: Admin schema (name, position, role, phone, email, password, reportsTo, block, gender).
- **Student.js**: Student schema (personal, academic, parent info, image, password, outing/leave counts). Methods for year upgrade and count resets.
- **Leave.js**: Leave request schema (student, admin, dates, status, reason, destination).
- **Outing.js**: Outing request schema (student, admin, times, status, purpose, destination).
- **LeaveHistory.js / OutingHistory.js**: Historical records for leaves and outings.

---

## 6. Controllers
- **adminController.js**: CRUD for admins, role hierarchy enforcement, get subordinates.
- **authController.js**: Login (JWT), get current user, change password.
- **leaveController.js**: CRUD for leaves, approval flow, status changes, out/in date recording.
- **outingController.js**: CRUD for outings, approval flow, status changes, out/in time recording.
- **leaveHistoryController.js / outingHistoryController.js**: Fetch leave/outing history for students/admins.
- **studentController.js**: CRUD for students, bulk create, year upgrade, count resets, delete.

---

## 7. Routes
- **adminRoutes.js**: `/api/admins` (admin management, subordinates, protected by role).
- **authRoutes.js**: `/api/auth` (login, get current user, change password).
- **leaveRoutes.js**: `/api/leaves` (CRUD, pending, out/in dates, student/admin access).
- **outingRoutes.js**: `/api/outings` (CRUD, pending, out/in times, student/admin access).
- **leaveHistoryRoutes.js / outingHistoryRoutes.js**: `/api/leave-history`, `/api/outing-history` (history by user or student).
- **studentRoutes.js**: `/api/students` (CRUD, bulk, year upgrade, count resets, image upload).

---

## 8. Authentication & Authorization
- JWT-based for both students and admins.
- Role-based access control for all admin actions.
- Students can only access/modify their own data.

---

## 9. File Uploads
- Student images uploaded via multer, stored in `/uploads`, 1MB limit, images only.

---

## 10. Error Handling
- Centralized error handler for all API routes.
- Handles Mongoose errors and returns user-friendly messages.

---

## 11. Environment & Scripts
- **package.json**: Express, mongoose, bcryptjs, jsonwebtoken, multer, dotenv, cors, express-validator. Scripts for start/dev.

---

## 12. Constants & Role Hierarchy
- Roles: caretaker < chiefwarden < warden < adsw < dsw
- Used for permission checks throughout the app.

---

## 13. API Structure
- All routes prefixed with `/api/`.
- RESTful: GET, POST, PUT, DELETE for resources.
- Protected routes use JWT and role checks.

---

## 14. System Flow (High-Level)
1. **Authentication**: User logs in (student/admin) → receives JWT.
2. **Requests**: Students submit leave/outing requests.
3. **Approval**: Admins (with proper roles) view, approve, or reject requests.
4. **History**: All actions logged in history collections.
5. **Student Management**: Admins can add, update, delete, or bulk manage students.
6. **File Uploads**: Student images uploaded and linked to profiles.

---

## 15. Key Features
- Role-based access control with hierarchy.
- Bulk operations for student management.
- Comprehensive error handling and validation.
- RESTful, modular structure for maintainability.
- File upload support for student images.
- Secure authentication and password handling.

---

## 16. What to Emphasize in Interviews
- End-to-end flow: authentication, request handling, admin approval.
- Role-based permissions and enforcement.
- Secure file uploads and password handling.
- Bulk operations and their benefits.
- Error handling and security best practices.
- Database schema and relationships.

---

**Be ready to discuss any file, feature, or flow in detail!** 