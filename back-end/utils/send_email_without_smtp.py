from __future__ import print_function
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import base64, os, pickle
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://yourfrontend.com")

def get_gmail_service():
    """Load stored credentials or refresh them."""
    creds = None
    if os.path.exists("token.json"):
        with open("token.json", "rb") as token:
            creds = pickle.load(token)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            raise Exception("❌ Missing Gmail API credentials; run authorize_gmail.py first.")
        with open("token.json", "wb") as token:
            pickle.dump(creds, token)
    return build("gmail", "v1", credentials=creds)

def send_invitation(receiver_email: str, token: str, company_name: str,
                    invited_by: str, invited_by_name: str):
    """Send invitation email using Gmail API (no SMTP)."""
    try:
        service = get_gmail_service()
        sender_email = "me"   # 'me' means the authenticated Gmail user

        # --- Email content ---
        subject = "Invitation to join DoshiAI"
        body = f"""
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr><td align="center" style="padding:40px 0">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:8px;overflow:hidden">
              <tr>
                <td style="padding:40px 30px;text-align:center;background:#0f172a;color:#ffffff">
                  <h1 style="margin:0;font-size:24px">DoshiAI Admin Panel</h1>
                  <p style="margin:8px 0 0;font-size:14px;opacity:0.85">
                    Manage your WhatsApp Assistant Bot
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:30px;text-align:left;color:#333333">
                  <h2 style="margin-top:0;font-size:20px;color:#0f172a">You're Invited!</h2>
                  <p style="font-size:15px;line-height:1.6;margin:16px 0">
                    You have been invited to join the <strong>{company_name}</strong> by
                    <strong><a href="mailto:{invited_by}" target="_blank">{invited_by_name}</a></strong> 🎉<br>
                    To accept this invitation, please click below:
                  </p>
                  <p style="text-align:center;margin:30px 0">
                    <a href="{FRONTEND_URL}/accept-invite?token={token}"
                       style="background:#2563eb;color:#fff;text-decoration:none;
                              padding:14px 28px;border-radius:6px;font-weight:bold;display:inline-block"
                       target="_blank">Accept Invitation</a>
                  </p>
                  <p style="font-size:14px;line-height:1.6;color:#555">
                    This invitation link is valid for <strong>3 days</strong>.
                    <br><br>If you did not expect this, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 30px;text-align:center;background:#f9fafb;font-size:12px;color:#777">
                  <p style="margin:0">DoshiAI • AI-Powered WhatsApp Automation</p>
                  <p style="margin:4px 0 0">Need help?
                    <a href="mailto:support@doshi.ai" style="color:#2563eb;text-decoration:none">support@doshi.ai</a>
                  </p>
                </td>
              </tr>
            </table>
          </td></tr>
        </table>
        """

        # --- Build MIME message ---
        message = MIMEMultipart()
        message["To"] = receiver_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "html"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_body = {"raw": raw}

        sent_message = (
            service.users().messages().send(userId=sender_email, body=send_body).execute()
        )
        print(f"✅ Email sent! Message ID: {sent_message['id']}")
        return True

    except Exception as e:
        print("❌ Error sending email:", e)
        return False


def send_reset_password_email(receiver_email:str, token:str):
    try:
        service = get_gmail_service()
        sender_email = "me"   # 'me' means the authenticated Gmail user

        # --- Email content ---
        subject = "Reset Your Password — DoshiAI Admin Panel"
        body = f"""
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tbody>
    <tr>
      <td align="center" style="padding:40px 0">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding:40px 30px;text-align:center;background:#0f172a;color:#ffffff">
                <h1 style="margin:0;font-size:24px">DoshiAI Admin Panel</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.85">Manage your WhatsApp Assistant Bot</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;text-align:left;color:#333333">
                <h2 style="margin-top:0;font-size:20px;color:#0f172a">Reset Your Password</h2>
                <p style="font-size:15px;line-height:1.6;margin:16px 0">
                  We received a request to reset your password for your <strong>DoshiAI Admin Panel</strong> account.  
                  Click the button below to choose a new password:
                </p>

                <!-- CTA Button -->
                <p style="text-align:center;margin:30px 0">
                  <a href="{FRONTEND_URL}/reset-password?token={token}" 
                     style="background:#2563eb;color:#ffffff;text-decoration:none;
                            padding:14px 28px;border-radius:6px;font-weight:bold;display:inline-block" 
                     target="_blank">
                    Reset Password
                  </a>
                </p>

                <!-- Expiry Note -->
                <p style="font-size:14px;line-height:1.6;color:#555555">
                  This password reset link will expire in <strong>1 hour</strong>.  
                  <br><br>
                  If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 30px;text-align:center;background:#f9fafb;font-size:12px;color:#777777">
                <p style="margin:0">DoshiAI • AI-Powered WhatsApp Automation</p>
                <p style="margin:4px 0 0">Need help? Contact us at 
                  <a href="mailto:support@doshi.ai" style="color:#2563eb;text-decoration:none" target="_blank">support@doshi.ai</a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
"""

        # --- Build MIME message ---
        message = MIMEMultipart()
        message["To"] = receiver_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "html"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_body = {"raw": raw}

        sent_message = (
            service.users().messages().send(userId=sender_email, body=send_body).execute()
        )
        print(f"✅ Email sent! Message ID: {sent_message['id']}")
        return True

    except Exception as e:
        print("❌ Error sending email:", e)
        return False
     

def send_email_with_customize_content(receiver_email: str, content: str, extra_attachment: str):
    try:
        service = get_gmail_service()
        sender_email = "me"   # 'me' means the authenticated Gmail user 

        # --- Email content ---
        subject = "Customized Email from DoshiAI"
        body = f"""
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
  <tbody>
    <tr>
      <td align="center" style="padding:40px 0">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden">
          <tbody>
            <!-- Header -->
            <tr>
              <td style="padding:40px 30px;text-align:center;background:#0f172a;color:#ffffff">
                <h1 style="margin:0;font-size:24px">DoshiAI Admin Panel</h1>
                <p style="margin:8px 0 0;font-size:14px;opacity:0.85">Manage your WhatsApp Assistant Bot</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;text-align:left;color:#333333">
                <h2 style="margin-top:0;font-size:20px;color:#0f172a">Customized Email</h2>
                <p style="font-size:15px;line-height:1.6;margin:16px 0">
                  {content}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:20px 30px;text-align:center;background:#f9fafb;font-size:12px;color:#777777">
                <p style="margin:0">DoshiAI • AI-Powered WhatsApp Automation</p>
                <p style="margin:4px 0 0">Need help? Contact us at 
                  <a href="mailto:support@doshi.ai" style="color:#2563eb;text-decoration:none" target="_blank">support@doshi.ai</a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
"""

        # --- Build MIME message ---
        message = MIMEMultipart()
        message["To"] = receiver_email
        message["Subject"] = subject
        message.attach(MIMEText(body, "html"))

        raw = base64.urlsafe_b64encode(message.as_bytes()).decode()
        send_body = {"raw": raw}

        sent_message = (
            service.users().messages().send(userId=sender_email, body=send_body).execute()
        )
        print(f"✅ Email sent! Message ID: {sent_message['id']}")
        return True

    except Exception as e:
        print("❌ Error sending email:", e)
        return False