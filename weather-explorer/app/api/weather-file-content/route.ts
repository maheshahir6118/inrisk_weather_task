// This file handles GET requests to download the actual JSON content of a specific file inside S3

import { NextResponse } from 'next/server';
import s3Client, { BUCKET_NAME } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3'; // Command to download a specific object (file) from S3

export async function GET(request: Request) {
    try {
        // 1. Read the Query Parameters inside the URL
        // e.g. /api/weather-file-content?file=weather/New_York.json
        const url = new URL(request.url);
        const fileKey = url.searchParams.get('file');

        // 2. Validate that the frontend actually provided a file name
        if (!fileKey) {
            return NextResponse.json({ error: 'File key is required' }, { status: 400 });
        }

        if (!BUCKET_NAME) {
            return NextResponse.json({ error: 'S3_BUCKET_NAME is not configured' }, { status: 500 });
        }

        // 3. Ask S3 to grab this exact file using its Key
        const getCommand = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
        });

        const awsResponse = await s3Client.send(getCommand);

        // 4. Download and Transform the File contents
        // awsResponse.Body is a readable stream of data. AWS provides .transformToString() to automatically read it into a String.
        const fileContents = await awsResponse.Body?.transformToString();

        if (!fileContents) {
            return NextResponse.json({ error: 'File is completely empty' }, { status: 404 });
        }

        // 5. Turn the String back into a JavaScript JSON object and send it to the frontend!
        // JSON.parse() takes textual JSON and converts it back into variables/arrays/objects.
        const javascriptObject = JSON.parse(fileContents);
        return NextResponse.json(javascriptObject);

    } catch (error: any) {
        console.error('Get file error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
