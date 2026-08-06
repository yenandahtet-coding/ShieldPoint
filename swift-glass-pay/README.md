# Nova Pay

# Role & Mandate

You are an expert Frontend Architect specializing in modern Fintech applications. Build a single-page React application for a mobile-first/desktop-responsive digital payment wallet (like KBZPay/PayPal). 

The app must feature a dark-mode, glassmorphic UI with blue/cyan/purple accents, smooth Framer Motion page transitions, and hardcoded/mocked API states built with Axios so it can seamlessly connect to a FastAPI backend later.

---

## Technical Stack & Dependencies

- **Framework:** React 18+ with TypeScript (Vite template structure)

- **Styling:** Tailwind CSS with custom glassmorphism utilities (`backdrop-blur-xl`, translucent borders, neon glows)

- **Routing:** React Router v6

- **Animations:** Framer Motion

- **Icons:** Lucide React (`lucide-react`)

- **API Client:** Axios with an decoupled API service layer (`src/services/api.ts`) using mock interceptors/delay handlers

- **QR Code Generation & Scanning:** `qrcode.react` (or canvas equivalent) and a camera scanner mockup view

---

## Design System & Theme Specifications

- **Theme:** Ultra-modern Dark Fintech Dashboard.

- **Color Palette:**

  - Background: Deep Slate/Zinc (`bg-slate-950` / `bg-zinc-950`)

  - Primary Accents: Electric Blue (`#3b82f6`), Cyan (`#06b6d4`), Vibrant Purple (`#8b5cf6`)

  - Gradients: Radial background glows and gradient border cards (`bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600`)

- **Card Aesthetics:** Glassmorphism panels using semi-transparent backgrounds (`bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 shadow-2xl rounded-2xl`).

- **Typography:** Crisp sans-serif with high contrast numbers for balances and transaction amounts.

- **Responsiveness:** Optimized for Mobile, Tablet, and Desktop layouts (Sidebar navigation on Desktop, Bottom bar or Tab bar on Mobile).

---

## Core Feature Pages & Component Hierarchy

### 1. Authentication / User Login (`/login`)

- **UI:** Glassmorphic card centered on a gradient ambient background.

- **Fields:** Phone number / User ID input & 6-digit transaction PIN input.

- **State:** Hardcode default user session (`User ID: usr_4021`, `Name: Alex Chen`, `Phone: 09987654321`, `Balance: $1,250.00`).

- **Behavior:** On submit, store token in local state/context and redirect to Dashboard.

### 2. Main Wallet Dashboard (`/`)

- **Balance Card:** Glowing glass card displaying Total Available Balance, Currency Switcher (USD / MMK), and quick action buttons (`Send`, `Scan`, `Receive`, `History`).

- **Quick Actions Bar:** Glass buttons with Framer Motion hover/tap scaling effects.

- **Recent Activity Widget:** Summary of the last 3-5 transactions with status badges (`Completed`, `Pending`, `Flagged`).

### 3. Phone Number Transfer View (`/pay/phone`)

- **Form Fields:** 

  - Recipient Phone Number (with phonebook contact picker mockup)

  - Amount Input (large interactive typography with preset fast-amount buttons like +$10, +$50, +$100)

  - Note/Description optional field

  - Transaction PIN modal prompt before final execution

- **Action:** Triggers a simulated Axios POST request to `/api/v1/payments/p2p`. Upon success, deducts the amount from state and logs the transaction.

### 4. Scan & Receive QR View (`/pay/qr`)

- **Dual Tab Interface:**

  - **Tab 1: "Scan QR Code"** -> Simulates a live camera viewfinder overlay with scanning target lines, flash toggle button, and an option to upload a QR image or click "Simulate Merchant Scan".

  - **Tab 2: "My QR Code"** -> Renders a dynamic, branded QR code containing the user's wallet ID and phone number. Includes an input to set a specific requested payment amount on the QR.

### 5. Transaction History Log (`/history`)

- **UI:** Filterable transaction feed.

- **Filters:** All, Outgoing (Debits), Incoming (Credits), Flagged/Pending.

- **List Item Details:** Merchant/Receiver name, timestamp, phone number, payment type tag (`P2P_PHONE`, `MERCHANT_QR`), transaction ID (`tx_xxxx`), and amount (Green for credit, Red/White for debit).

- **Detail Drawer:** Modal/Drawer that pops up when clicking a transaction to show receipt details.

---

## Data Contracts (TypeScript Interfaces)

Define these in `src/types/payment.ts`:

```typescript

export interface UserProfile {

  id: string;

  name: string;

  phone: string;

  balance: number;

  currency: 'USD' | 'MMK';

  avatarUrl?: string;

}

export interface Transaction {

  id: string;

  senderId: string;

  senderPhone: string;

  receiverId: string;

  receiverPhone: string;

  receiverName: string;

  amount: number;

  currency: string;

  type: 'PHONE_NUMBER' | 'MERCHANT_QR';

  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'FLAGGED';

  timestamp: string;

  note?: string;

}

export interface PaymentRequest {

  recipientPhone: string;

  amount: number;

  pin: string;

  note?: string;

}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swift-glass-pay.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0c6b3123-1157-4ef4-8ece-23c8e84be56d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
