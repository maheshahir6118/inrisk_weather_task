// This file handles the API route for saving weather data. 
// When our frontend sends a POST request to "/api/store-weather-data", this code runs on our server.

import { NextResponse } from 'next/server'; // Next.js tool for sending responses back to the frontend
import s3Client, { BUCKET_NAME } from '@/lib/s3'; // Our Amazon S3 connection
import { PutObjectCommand } from '@aws-sdk/client-s3'; // Command telling AWS we want to put/upload a new object (file)
import { fetchHistoricalWeather } from '@/lib/open-meteo'; // Our custom helper function to grab Open-Meteo data

// The POST function handles incoming HTTP POST requests
export async function POST(request: Request) {
    try {
        // 1. Read the data sent from the frontend
        // request.json() reads the body of the request (like lat, lon, dates, etc.)
        const body = await request.json();

        // Destructure the variables so they are easier to use
        const lat = body.lat;
        const lon = body.lon;
        const startDate = body.startDate;
        const endDate = body.endDate;
        const locationName = body.locationName;

        // 2. Validate that the frontend actually sent us all the necessary pieces of data
        if (!lat || !lon || !startDate || !endDate) {
            // If anything is missing, send back a 400 Bad Request error
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Logic: Ensure the user doesn't fetch more than 31 days (Case Study Requirement)
        // Create Date objects out of the string dates (e.g., "2023-01-01")
        const start = new Date(startDate);
        const end = new Date(endDate);

        // .getTime() gets the time in milliseconds. Subtract to find the difference. 
        // Math.abs makes sure it's always positive.
        const differenceInMilliseconds = Math.abs(end.getTime() - start.getTime());

        // Convert milliseconds to days (1000ms * 60sec * 60min * 24hrs)
        const differenceInDays = Math.ceil(differenceInMilliseconds / (1000 * 60 * 60 * 24));

        // If the difference is larger than 31 days, stop the code and return an error
        if (differenceInDays > 31) {
            return NextResponse.json({ error: 'Date range cannot exceed 31 days' }, { status: 400 });
        }

        // 4. Fetch from Open-Meteo API
        // We wait (await) for the external weather API to return data before moving on
        const weatherData = await fetchHistoricalWeather(lat, lon, startDate, endDate);

        // 5. Structure the Data Document
        // We wrap the weather data inside an object alongside useful metadata.
        // This is the exact JSON structure that will be saved to our S3 bucket.
        const documentToSave = {
            metadata: {
                lat: lat,
                lon: lon,
                startDate: startDate,
                endDate: endDate,
                locationName: locationName,
                timestamp: new Date().toISOString() // E.g: "2026-07-31T12:00:00Z"
            },
            data: weatherData
        };

        // 6. Name the file carefully
        // Replace empty spaces in locationName with underscores, and attach the current Date.now() timestamp
        // so that every file name is 100% unique and doesn't accidentally overwrite an old one.
        const safeLocationName = locationName.replace(/ /g, '_'); // "New York" -> "New_York"
        const uniqueTimeId = Date.now();
        const fileName = `weather/${safeLocationName}_${startDate}_to_${endDate}_${uniqueTimeId}.json`;

        // 7. Verify S3 configuration exists
        if (!BUCKET_NAME) {
            // If the bucket name is missing in .env.local, send a 500 Internal Server error
            return NextResponse.json({ error: 'S3_BUCKET_NAME is not configured' }, { status: 500 });
        }

        // 8. Send the data to Amazon S3
        // PutObjectCommand instructs S3 to create a new file
        const uploadCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileName, // Key is the S3 term for what the file name should be called
            Body: JSON.stringify(documentToSave), // Turn our javascript object into a pure string so S3 can save it textually
            ContentType: 'application/json', // Let S3 know this string is actually JSON
        });

        // We wait for S3 client to confirm the upload was successful
        await s3Client.send(uploadCommand);

        // 9. Successfully finished!
        // Send a 200 OK message back to the frontend letting it know everything worked exactly as planned
        return NextResponse.json({ message: 'Success', fileName: fileName });

    } catch (error: any) {
        // If ANY of the code inside 'try' breaks (fetching, saving to S3), JavaScript immediately jumps down here
        console.error('Store error:', error);
        // Send the error message back to the frontend so it can display a red error box to the user
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
