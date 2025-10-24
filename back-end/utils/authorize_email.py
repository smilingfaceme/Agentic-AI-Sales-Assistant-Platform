from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle, os

SCOPES = ["https://www.googleapis.com/auth/gmail.send"]

def main():
    flow = InstalledAppFlow.from_client_secrets_file("credentials.json", SCOPES)
    creds = flow.run_local_server(port=0)
    with open("token.json", "wb") as token:
        pickle.dump(creds, token)
    print("✅ Token saved to token.json")

if __name__ == "__main__":
    main()
