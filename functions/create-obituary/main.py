# add your create-obituary function here
import base64
import json
import os
import time
import requests
import hashlib
import boto3
from requests_toolbelt.multipart import decoder

ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')
tablename = "obituaries-30149694"
table = dynamodb.Table(tablename)

# Main lambda function
def create_obituaries_30147366(event,context):
    body = event["body"]

    if event["isBase64Encoded"]:
        body = base64.b64decode(body)

    content_type = event["headers"]["content-type"]
    data = decoder.MultipartDecoder(body, content_type)
    binary_data = [part.content for part in data.parts]

    image = binary_data[0]
    name = binary_data[1].decode()
    born = binary_data[2].decode()
    died = binary_data[3].decode()
    id = binary_data[4].decode()
    number = binary_data[5].decode()


    chatgptanswer = gpt_prompt(name, born, died)

    respoly = read_this(chatgptanswer)

    respoly = upload_to_cloudinary(respoly, "raw")
    
    # you only have access to the /tmp folder in Lambda
    key = "obituary.jpg"
    filename = os.path.join("/tmp", key)
    with open(filename, "wb") as f:
        f.write(image)  

    resimage = upload_to_cloudinary(filename, resource_type="image")

    table.put_item(
        Item={
            'id': id,
            'image': resimage["secure_url"],
            'name': name,
            'born': born,
            'died': died,
            'chatgpt': chatgptanswer,
            'polly': respoly["secure_url"],
            'number': number
        }
    )

    return {
        "statusCode": 200,
        "body": json.dumps({
            "id": id,
            "image": resimage["secure_url"],
            "name": name,
            "born": born,
            "died": died,
            "chatgpt": chatgptanswer,
            "polly": respoly["secure_url"],
            "number": number
        })
    }

def retrieve_secret_key(secret_key):
    response = ssm.get_parameters(
        Names=[
            secret_key,
        ],
        WithDecryption=True
    )
    for parameter in response['Parameters']:
        return parameter['Value']

def sort_dictionary(dictionary, exclude):
    return {k: v for k, v in sorted(dictionary.items(), key=lambda item:item[0]) if k not in exclude}

def upload_to_cloudinary(filename, resource_type, extra_fields={}):
    api_key = retrieve_secret_key('Cloudinary_API_Key')
    cloud_name = "dwbqbhynf"
    secret_key = retrieve_secret_key('Cloudinary_Secret_Key')

    body = {
        "api_key": api_key
    }

    files = {
        "file": open(filename, "rb")
    }

    body.update(extra_fields)

    body["signature"] = create_signature(body, secret_key)
    
    url = f"https://api.cloudinary.com/v1_1/{cloud_name}/{resource_type}/upload"
    res = requests.post(url, files=files, data=body)

    return res.json()

def create_signature(body, secret_key):
    exclude = ["api_key", "resource_type", "cloud_name"]
    timestamp = int(time.time())
    body["timestamp"] = timestamp
    sorted_body = sort_dictionary(body, exclude)
    query_string = create_query_string(sorted_body)
    query_string_append = f"{query_string}{secret_key}"
    hashed = hashlib.sha1(query_string_append.encode())
    signature = hashed.hexdigest()
    return signature

def create_query_string(body):
    query_string = ""
    for idx, (k, v) in enumerate(body.items()):
        query_string = f"{k}={v}" if idx == 0 else f"{query_string}&{k}={v}"

    return query_string

def gpt_prompt(name, born, died):

    prompt = "write an obituary about a fictional character named" + name + "who was born on" + born + "and died on" + died + "."

    GPT_Key = retrieve_secret_key("GPT_Secret_Key")
    url = "https://api.openai.com/v1/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GPT_Key}"
    }

    body = {
        "model": "text-davinci-003",
        "prompt": prompt,
        "max_tokens": 400,
        "temperature": 0.2
    }

    res = requests.post(url, headers=headers, json=body)
    return res.json()["choices"][0]["text"]

def read_this(text):
    client = boto3.client('polly')
    response = client.synthesize_speech(
        Engine='standard',
        LanguageCode='en-US',
        OutputFormat='mp3',
        Text=text,
        TextType='text',
        VoiceId="Joanna"
    )

    filename = os.path.join("/tmp", "polly.mp3")
    with open(filename, "wb") as f:
        f.write(response["AudioStream"].read())
    
    return filename

    #gpt = retrieve_secret_key('Cloudinary_Secret_Key')