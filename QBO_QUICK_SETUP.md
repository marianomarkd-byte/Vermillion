# QuickBooks Online Quick Setup

## Current Status
The QuickBooks Online integration is installed but needs your app credentials to work.

## Quick Setup (5 minutes)

### 1. Get QuickBooks Online App Credentials

1. Go to [Intuit Developer Dashboard](https://developer.intuit.com/)
2. Sign in with your Intuit account
3. Click **"Create an App"**
4. Choose **"QuickBooks Online API"**
5. Fill in:
   - **App Name**: `Vermillion Construction`
   - **Description**: `Construction project management integration`
   - **Redirect URI**: `http://localhost:3000/qbo/callback`
6. Copy your **Client ID** and **Client Secret**

### 2. Update Environment Variables

Edit the `.env` file in your project root and replace the placeholder values:

```bash
# QuickBooks Online Integration
QBO_CLIENT_ID=your_actual_client_id_here
QBO_CLIENT_SECRET=your_actual_client_secret_here
QBO_REDIRECT_URI=http://localhost:3000/qbo/callback
QBO_ENVIRONMENT=sandbox
```

### 3. Restart the Backend

```bash
# Stop the current backend (Ctrl+C)
# Then restart:
python3 app/main.py
```

### 4. Test the Connection

1. Go to **Journal Entries** page
2. Click **"Send to Accounting"**
3. Click **"Connect to QuickBooks"**
4. Complete the OAuth flow
5. You should see "Connected to [Your Company Name]"

## What This Enables

Once configured, you can:
- ✅ **Export journal entries** directly to QuickBooks Online
- ✅ **Real-time synchronization** with your QBO account
- ✅ **Automatic account mapping** between systems
- ✅ **Secure OAuth authentication**

## Troubleshooting

**"Failed to retrieve company information"** = Missing or invalid credentials
**"Connection failed"** = Check your Client ID and Secret
**"Authorization failed"** = Clear browser cache and try again

## Need Help?

1. Check the browser console for detailed error messages
2. Check the backend terminal for Python errors
3. Verify your Intuit Developer app is set to "Production" or "Sandbox" mode
4. Ensure your QBO account has the necessary permissions

The integration is ready - it just needs your app credentials! 🚀

