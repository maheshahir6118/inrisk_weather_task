# Full Stack Weather Explorer

A Next.js application that fetches historical daily weather data from the Open-Meteo API, stores it in AWS S3, and provides a web dashboard to manage and visualize the data. Built as a case study for InRisk Labs.

## Features

- **Next.js 13 App Router**: Robust and clean architecture.
- **Tailwind CSS**: Beautiful, responsive styling.
- **AWS S3 Integration**: Utilizes `@aws-sdk/client-s3` to securely store raw JSON payloads in a cloud bucket.
- **Open-Meteo API**: Fetches historical climate data without any API key requirement.
- **Chart.js**: Rich interactive chart for Temperature trends.
- **Paginated Table**: Handles large records nicely with 10/20/50 rows pagination.
- **Validation**: Enforces the 31-day fetch limit directly in the API Route.

## Requirements

You will need:
- Node.js installed locally OR you can deploy the repository directly to a hosting provider.
- An AWS Account with an active S3 Bucket. (Free-tier eligible is perfect)

## Setup and Deployment

### 1. Vercel Deployment (Recommended)
This repository is optimized to be deployed directly to Vercel. 
1. Create a GitHub repository and push this code to it.
2. Log into [Vercel](https://vercel.com) and import the repository.
3. In the Environment Variables section during setup, you **MUST** provide:
   - `AWS_REGION`
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET_NAME`
4. Click Deploy. Vercel handles installing modules `npm install` and building `npm run build` out of the box!

### 2. Local Setup
Since Node might not be completely available on your current machine configuration, if you test it on another machine:
1. Clone the repository.
2. Run `npm install`
3. Duplicate or edit `.env.local` with your AWS bucket variables.
4. Run `npm run dev` and navigate to `http://localhost:3000`.

## Architecture & Decisions

- **Why Next.js App Router?** It allows us to seamlessly define the backend GET/POST hooks (`/api/store-weather-data`, `/api/list-weather-files`) in the same monolithic structure as the React frontend.
- **S3 Strategy:** Files are saved using `Date.now()` mixed with the location name. This ensures bucket uniqueness preventing accidental overwrites.
- **Client Components**: Because Chart.js and stateful Pagination need the browser context, Dashboard and its subsequent components use `'use client'` while the API routes rely exclusively on the Node server runtime.
