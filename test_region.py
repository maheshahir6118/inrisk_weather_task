import boto3
client = boto3.client('s3', aws_access_key_id='YOUR_AWS_ACCESS_KEY', aws_secret_access_key='YOUR_AWS_SECRET_KEY')
try:
    loc = client.get_bucket_location(Bucket='inrisk-weather-data-mahesh')
    print('REGION IS:', loc.get('LocationConstraint'))
except Exception as e:
    print('ERROR IS:', e)