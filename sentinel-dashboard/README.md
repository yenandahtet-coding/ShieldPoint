# Sentinel Dashboard

Build a modern, professional, responsive web dashboard for a university project called:

"Distributed Financial Transaction & Fraud Detection Pipeline"

Theme:

A real-time banking operations dashboard used by a bank's fraud monitoring team.

Design Style:

- Modern fintech UI

- Dark mode

- Blue + Cyan + Purple accents

- Glassmorphism cards

- Smooth animations

- Professional enterprise dashboard

- Responsive for desktop and tablet

Technology:

- React

- TypeScript

- Tailwind CSS

- Vite

- Recharts for charts

- Framer Motion for animations

- React Router

- Axios for API requests

The frontend must be designed to connect to a FastAPI backend later.

Use placeholder/mock API endpoints for now.

------------------------------------

Pages

------------------------------------

1. Login Page

Simple banking admin login.

Fields:

- Username

- Password

Professional bank branding.

------------------------------------

2. Dashboard

Display summary cards:

- Total Transactions Today

- Fraud Detected

- Legitimate Transactions

- Average Risk Score

- Active Consumers

- Kafka Queue Status

- API Status

- Database Status

Include animated counters.

------------------------------------

3. Live Transaction Monitor

A real-time updating table.

Columns:

- Transaction ID

- Customer Name

- Account Number (masked)

- Amount

- Currency

- Location

- Merchant

- Timestamp

- Risk Score

- Status

Status badges:

Green:

Approved

Yellow:

Review

Red:

Fraud

New transactions should animate into the table.

------------------------------------

4. Fraud Detection Panel

Display every suspicious transaction.

Each card contains:

- Customer

- Amount

- Country

- Reason

- Risk Score

- Time

Buttons:

View Details

Mark Reviewed

Freeze Account

------------------------------------

5. Transaction Details Modal

Display:

Customer Info

Transaction History

Risk Analysis

Triggered Fraud Rules

Example:

✓ Large Amount

✓ Impossible Travel

✓ Too Many Transactions

Overall Risk Score

Decision

------------------------------------

6. Analytics Page

Charts:

Transactions per minute

Fraud trend

Risk score distribution

Top merchant categories

Transactions by country

Fraud by country

Hourly transaction volume

------------------------------------

7. System Architecture Page

Create a beautiful animated architecture diagram.

Show:

Customer

↓

FastAPI

↓

Kafka

↓

Fraud Detection Service

↓

Logger Service

↓

PostgreSQL

↓

Alert Service

Animate moving particles between services to simulate live transaction flow.

Each service should have:

CPU Usage

Memory Usage

Health

Latency

------------------------------------

8. Alerts Page

Notification center.

Show:

High Risk Transaction

Impossible Travel

Large Withdrawal

Multiple Failed Attempts

Each alert should have:

Severity

Time

Status

------------------------------------

9. Settings

Backend URL

Kafka Status

Database Status

Theme Switch

------------------------------------

API Structure

Prepare Axios service files for:

GET /dashboard

GET /transactions

GET /frauds

GET /analytics

GET /alerts

POST /login

POST /transaction

Use mock JSON until backend exists.

------------------------------------

Extra Features

Animated loading skeletons

Toast notifications

Search

Filter

Pagination

Sorting

Export CSV

Dark/Light mode

Responsive layout

Professional typography

Beautiful banking icons

------------------------------------

Overall Goal

The UI should look like a commercial banking fraud monitoring platform rather than a school project.

The dashboard should impress lecturers with real-time visuals, smooth animations, clean architecture, and enterprise-level design.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6204e9de-58c4-495e-9b6d-a134ee16a497).

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
