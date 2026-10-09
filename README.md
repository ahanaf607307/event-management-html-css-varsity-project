# Eventify - Premium Event Discovery & Booking Platform (Frontend).

Eventify is a premium, production-grade event booking and ticketing application built with **HTML5, CSS3, and Vanilla JavaScript (ES6 Modules)**. It integrates seamlessly with a Node.js/PostgreSQL backend API, utilizing modern glassmorphism design principles, responsive structures, and advanced features like live QR ticket generation, real-time metrics, staff QR code check-in scanner, and comprehensive analytics.

------

## - 🚀 Features

### 1. Unified Authentication Flow
- Tabbed Login & Registration views with optional avatar upload.
- Full email verification using OTP (One Time Password) with resend capability.
- Integrated Google OAuth Sign-in support.
- Comprehensive step-by-step Forgot Password and Reset Password wizard.

### 2. Event Discovery & Booking
- **Landing Page**: Glowing hero banner with search, dynamic category filtering, trending events carousel, statistics counter, and visual steps guide.
- **Events Catalog**: Instant keywords search with live filters (Categories, Price range slider, Date, Status), sorting options, and dynamic pagination.
- **Event Details**: Countdown timer to event schedule, highlight icons, gallery lightbox, and verified customer review lists.
- **Booking checkout**: Seat count picker with live total calculation, payment method options (Card, Mobile Financial Services, Gate cash), and customized requirements input.

### 3. Digital QR Ticket Pass
- Boarding-pass style ticket layout featuring booking codes, seat details, and check-in badges.
- Dynamic **on-canvas QR Code generation** containing unique booking code credentials.
- Printable styling rules (`@media print`) for clean PDF saves and paper tickets.

### 4. Multi-Role Unified Dashboard
Dynamically alters sidebar links and panels based on logged-in user permissions:
- **Attendee (User)**: Metrics tracker (spent, bookings, attended count), bookings registrations list (cancel, view ticket), reviews moderator, notification logs, profile settings, and activity logs.
- **Staff**: Live QR camera scanner viewport (with html5-qrcode library), manual ticket checker, attendee directory, and schedule listings.
- **Manager**: Revenue analytics curves, event creator (banner file upload, highlights parameters), manager bookings, manager staff CRUD, and review comments moderator.
- **System Owner (Admin)**: Full Manager access plus platform analytics, user accounts directory (suspend/activate), manager directory, and event categories CRUD with icon upload.

---

## 🛠️ Technology Stack

- **Structure**: Semantic HTML5 markup
- **Styling**: Vanilla CSS3 (custom CSS variables, dark-theme layout, glassmorphic panels, keyframe animations)
- **Logic**: Vanilla ES6 JavaScript (ES Modules, async-fetch client with auto JWT Authorization header inject and token refresh retries)
- **Third-Party CDN Integrations**:
  - `FontAwesome`: Vector icons
  - `Chart.js`: Analytics curves
  - `QRious`: Dynamic QR Canvas generation
  - `Html5-Qrcode`: Camera stream scanner

---

## 📦 Run Locally  -  

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd eventify_frontend
   ```

2. **Serve files**:
   Host the directory using a local static HTTP server:-
   - Node: `npx http-server -p 3000 -c-1`
   - Python: `python -m http.server 3000`
   - VS Code: Open `index.html` and launch the `Live Server` extension..

3. **Browse application**:
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.
