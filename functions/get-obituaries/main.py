import json
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = "obituaries-30149694"
table = dynamodb.Table(table_name)

def get_obituaries_30147366(event, context):

    try:
        response = table.scan()
    except Exception as e:
        print(e)
        return {
            'statusCode': 500,
            'body': json.dumps('Error scanning the table')
        }
        
    items = response['Items']

    return {
        'statusCode': 200,
        'body': json.dumps(items)
    }