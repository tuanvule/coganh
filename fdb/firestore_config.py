import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore
from dotenv import load_dotenv
import os

load_dotenv()

cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.getenv('project_id'),
    "private_key_id": os.getenv('private_key_id'),
    "private_key": os.getenv('private_key'),
    "client_email": os.getenv('client_email'),
    "client_id": os.getenv('client_id'),
    "auth_uri": os.getenv('auth_uri'),
    "token_uri": os.getenv('token_uri'),
    "auth_provider_x509_cert_url": os.getenv('auth_provider_x509_cert_url'),
    "client_x509_cert_url": os.getenv('client_x509_cert_url'),
    "universe_domain": os.getenv('universe_domain')
})

firebase_admin.initialize_app(cred)

fdb = firestore.client()