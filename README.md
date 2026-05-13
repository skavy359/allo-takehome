# Inventory Reservation System

This is a simple inventory reservation system built for a take-home assignment. I spent about 1-2 days on this, focusing on getting the core reservation logic right without overengineering it.

## Tech Stack
- **Next.js (App Router)**: I used it for both the frontend and API routes.
- **Prisma & Postgres**: I used it for the database and ORM. I used transactions to handle concurrent reservations safely.
- **Tailwind CSS**: For very basic, minimal styling, basically fonts.

## Features I've implemented
- **Product Listing**: Shows available products and their stock.
- **Reservations**: Users can reserve a quantity of a product. This holds the stock temporarily (10 minutes).
- **Concurrency**: I used `prisma.$transaction` to make sure we don't oversell stock if two people click reserve at the exact same time.
- **Lazy Expiration Cleanup**: I don't have the knowledge of cron job or Redis so I implemented a lazy cleanup approach. The API simply checks for and releases expired reservations whenever products are fetched or new reservations are made.

## How to Run Locally

1. Install dependencies:
bash
npm install

2. Create a `.env` file in the root directory and add your Postgres database URL:
bash
DATABASE_URL="your-postgres-url"

3. Push the database schema:
bash
   npx prisma db push

4. Seed the database with sample products and warehouses:
bash
npx prisma db seed

5. Run the development server:
bash
npm run dev

Open [Live Link](i will deploy it in next step) to view the app.

## Known Limitations / Trade-offs
To keep the project simple and focused on the core requirements:
- There is no authentication or user accounts.
- There are no payments or checkout flows.
- The UI is extremely minimal.
- I avoided complex architectures like microservices or Redis because the requirements favored simplicity and i simply don't have the knowledge of them right now.
