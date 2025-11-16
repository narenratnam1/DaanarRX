# DaanaRx Invitation Email Template

## Setup Instructions

To customize the invitation email template in Supabase:

1. Go to [Supabase Dashboard](https://app.supabase.com/project/cnjajswnqmzzhzoyadqa)
2. Navigate to **Authentication** → **Email Templates**
3. Select **Invite User** template
4. Replace the default template with the custom template below

---

## Custom Invitation Email Template

**Subject:** You're invited to join {{ .ClinicName }} on DaanaRx

**Email Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to DaanaRx</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background-color: #f5f5f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .header p {
      margin: 10px 0 0;
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #1a1a1a;
      font-size: 22px;
      margin: 0 0 20px;
      font-weight: 600;
    }
    .content p {
      color: #4a5568;
      font-size: 16px;
      margin: 0 0 20px;
      line-height: 1.7;
    }
    .clinic-badge {
      background-color: #f7fafc;
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 16px;
      margin: 25px 0;
      text-align: center;
    }
    .clinic-badge strong {
      color: #667eea;
      font-size: 18px;
      display: block;
      margin-bottom: 5px;
    }
    .clinic-badge span {
      color: #718096;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 40px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 25px 0;
      text-align: center;
      box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .footer {
      background-color: #f7fafc;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
    }
    .footer p {
      color: #718096;
      font-size: 14px;
      margin: 5px 0;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
    .expiry-notice {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 15px;
      margin: 25px 0;
      border-radius: 4px;
    }
    .expiry-notice p {
      color: #742a2a;
      font-size: 14px;
      margin: 0;
    }
    .features {
      background-color: #f7fafc;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .features h3 {
      color: #1a1a1a;
      font-size: 16px;
      margin: 0 0 15px;
      font-weight: 600;
    }
    .features ul {
      margin: 0;
      padding-left: 20px;
      color: #4a5568;
      font-size: 14px;
    }
    .features li {
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎯 Welcome to DaanaRx</h1>
      <p>Modern Pharmaceutical Inventory Management</p>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>You've been invited!</h2>
      
      <p>
        You've been invited to join the team at <strong>{{ .Data.clinic_name }}</strong> 
        on DaanaRx, the modern pharmaceutical inventory management platform.
      </p>

      <div class="clinic-badge">
        <strong>{{ .Data.clinic_name }}</strong>
        <span>DaanaRx Clinic</span>
      </div>

      <p>
        DaanaRx helps healthcare organizations manage their pharmaceutical inventory with ease, 
        track medications, and ensure compliance with regulatory requirements.
      </p>

      <div class="features">
        <h3>What you can do with DaanaRx:</h3>
        <ul>
          <li>Track medication inventory in real-time</li>
          <li>Scan and manage drug units with QR codes</li>
          <li>Monitor expiration dates and receive alerts</li>
          <li>Generate compliance reports instantly</li>
          <li>Collaborate with your team seamlessly</li>
        </ul>
      </div>

      <!-- Call to Action -->
      <div class="cta-container">
        <a href="{{ .Data.invite_url }}" class="cta-button">
          Accept Invitation & Create Account
        </a>
      </div>

      <div class="expiry-notice">
        <p>
          ⚠️ <strong>This invitation expires in 7 days.</strong> 
          Click the button above to create your account before it expires.
        </p>
      </div>

      <p style="font-size: 14px; color: #718096;">
        If you're having trouble with the button above, copy and paste this URL into your browser:
        <br>
        <span style="color: #667eea; word-break: break-all;">{{ .Data.invite_url }}</span>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>DaanaRx</strong> - Pharmaceutical Inventory Management</p>
      <p>
        Questions? Contact your administrator at {{ .Data.clinic_name }}
      </p>
      <p style="margin-top: 15px;">
        <a href="{{ .SiteURL }}">Visit DaanaRx</a>
      </p>
    </div>
  </div>
</body>
</html>
```

---

## Template Variables

The following variables are available in the template:

- `{{ .Data.clinic_name }}` - The name of the clinic inviting the user
- `{{ .Data.invite_url }}` - The unique invitation URL with token
- `{{ .Data.invitation_token }}` - The invitation token (for debugging)
- `{{ .SiteURL }}` - Your application's base URL
- `{{ .Email }}` - The recipient's email address

---

## Testing the Template

After setting up the template:

1. Go to the Settings page in your DaanaRx application
2. Click "Send Invitation"
3. Enter an email address and role
4. Check the recipient's inbox for the branded invitation email

---

## Email Preview

The email will have:
- ✅ DaanaRx gradient header with brand colors (#667eea to #764ba2)
- ✅ Clinic name prominently displayed in a badge
- ✅ Clear call-to-action button
- ✅ Feature highlights for new users
- ✅ Expiration warning (7 days)
- ✅ Fallback URL for accessibility
- ✅ Professional footer with clinic branding
- ✅ Mobile-responsive design

---

## Alternative: Plain Text Version

For email clients that don't support HTML, Supabase will automatically generate a plain text version. However, you can also customize it:

```
You're invited to join {{ .Data.clinic_name }} on DaanaRx!

You've been invited to join the team at {{ .Data.clinic_name }} on DaanaRx, 
the modern pharmaceutical inventory management platform.

Click here to accept your invitation and create your account:
{{ .Data.invite_url }}

This invitation expires in 7 days.

---
DaanaRx - Pharmaceutical Inventory Management
Questions? Contact your administrator at {{ .Data.clinic_name }}
{{ .SiteURL }}
```

---

## Notes

- The email template uses inline CSS for maximum compatibility across email clients
- The gradient background and modern design match the DaanaRx brand aesthetic
- The template is fully responsive and works on mobile devices
- All links open in the user's default browser

