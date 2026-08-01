import os
import json
import uuid
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
import boto3
from botocore.exceptions import ClientError
import httpx

from dotenv import load_dotenv
load_dotenv()
app = FastAPI(title="InRisk Weather Explorer")
S3_BUCKET = os.getenv("S3_BUCKET_NAME")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
)
class FetchRequest(BaseModel):
    latitude: float
    longitude: float
    start_date: str
    end_date: str
    location_name: str
@app.post("/api/weather-fetch")
async def fetch_and_store_weather(req: FetchRequest):
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": req.latitude,
        "longitude": req.longitude,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "timezone": "auto"
    }
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch weather data")
        weather_data = resp.json()
    document = {
        "metadata": {
            "fetch_timestamp": datetime.now(timezone.utc).isoformat(),
            "location_name": req.location_name,
            "latitude": req.latitude,
            "longitude": req.longitude,
            "start_date": req.start_date,
            "end_date": req.end_date,
        },
        "data": weather_data
    }
    if not S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME not configured in .env")
    file_id = str(uuid.uuid4())[:8]
    sanitized_loc = req.location_name.replace(' ', '_').lower()
    file_key = f"weather/{sanitized_loc}_{req.start_date}_{file_id}.json"
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=file_key,
            Body=json.dumps(document),
            ContentType="application/json"
        )
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 Error: {str(e)}")
    return {"message": "Data fetched and stored successfully", "file_key": file_key}
@app.get("/api/weather-files")
def list_stored_files():
    if not S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME not configured in .env")
        
    try:
        response = s3_client.list_objects_v2(Bucket=S3_BUCKET, Prefix="weather/")
        files = []
        if "Contents" in response:
            for obj in response["Contents"]:
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "last_modified": obj["LastModified"].isoformat()
                })
        # sort by last modified descending
        files.sort(key=lambda x: x["last_modified"], reverse=True)
        return {"files": files}
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 Error: {str(e)}")
@app.get("/api/weather-file")
def get_weather_file(key: str):
    if not S3_BUCKET:
        raise HTTPException(status_code=500, detail="S3_BUCKET_NAME not configured in .env")
        
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        data = json.loads(response['Body'].read().decode('utf-8'))
        return data
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"S3 Error: {str(e)}")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BASE_DIR, "static")

if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
def read_root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))