// This file handles GET requests to load all saved files inside our S3 Bucket.

import { NextResponse } from 'next/server';
import s3Client, { BUCKET_NAME } from '@/lib/s3';
import { ListObjectsV2Command } from '@aws-sdk/client-s3'; // Command to list all items inside a bucket

export async function GET() {
    try {
        // 1. Make sure we have a bucket name configured
        if (!BUCKET_NAME) {
            return NextResponse.json({ error: 'S3_BUCKET_NAME is not configured' }, { status: 500 });
        }

        // 2. Prepare the command to ask S3 for a list of items
        // 'Prefix' acts like a folder search. It only returns items that start with "weather/"
        const listCommand = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: 'weather/',
        });

        // 3. Send the command to S3 and wait for its response
        const awsResponse = await s3Client.send(listCommand);

        // awsResponse.Contents holds an array of file records from S3. 
        // If it's undefined (bucket is empty), default to an empty array []
        const bucketContents = awsResponse.Contents || [];

        // 4. Map (transform) and Sort the files
        // We 'map' the complicated AWS response into a very simple array of objects for our frontend
        let files = bucketContents.map((file) => {
            return {
                key: file.Key,             // The name/path of the file (e.g. weather/data.json)
                lastModified: file.LastModified, // Date the file was created in S3
                size: file.Size,           // File size in bytes
            };
        });

        // We sort the array so the newest files appear first (descending order).
        // We convert the Date objects into timestamps and subtract them to sort.
        files.sort((a, b) => {
            const timeA = new Date(a.lastModified!).getTime(); // '!' tells typescript it won't be null
            const timeB = new Date(b.lastModified!).getTime();
            return timeB - timeA;
        });

        // 5. Send this clean array of files back to the frontend
        return NextResponse.json({ files: files });

    } catch (error: any) {
        console.error('List files error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
