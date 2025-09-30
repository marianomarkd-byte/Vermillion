# QuickBooks Online Integration Setup

This guide will help you set up the QuickBooks Online integration to export journal entries directly to your QBO account.

## Prerequisites

1. **QuickBooks Online Account**: You need an active QuickBooks Online account
2. **Intuit Developer Account**: You need to create an app in the Intuit Developer Dashboard

## Step 1: Create Intuit Developer App

1. Go to [Intuit Developer Dashboard](https://developer.intuit.com/)
2. Sign in with your Intuit account
3. Click "Create an App"
4. Choose "QuickBooks Online API"
5. Fill in the app details:
   - **App Name**: Vermillion Construction
   - **Description**: Construction project management integration
   - **Redirect URI**: `http://localhost:3000/qbo/callback`
6. Note down your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory with:

```bash
# QuickBooks Online Integration
QBO_CLIENT_ID=your_client_id_here
QBO_CLIENT_SECRET=your_client_secret_here
QBO_REDIRECT_URI=http://localhost:3000/qbo/callback
```

## Step 3: Install Required Dependencies

The integration uses the `requests` library which should already be installed. If not:

```bash
pip install requests
```

## Step 4: Test the Integration

1. Start the backend server:
   ```bash
   python3 app/main.py
   ```

2. Start the frontend server:
   ```bash
   cd frontend
   npm start
   ```

3. Navigate to the Journal Entries page
4. Click "Send to Accounting" button
5. In the modal, you'll see the QuickBooks Online connection status
6. Click "Connect to QuickBooks" to start the OAuth flow
7. Complete the authorization in the popup window
8. Once connected, you can export journal entries directly to QuickBooks Online

## Features

### What Gets Exported

- **Journal Entries**: All journal entries for the selected accounting period
- **Line Items**: Debit and credit lines with proper account mapping
- **Metadata**: Entry dates, descriptions, and reference information

### Account Mapping

The system maps your internal chart of accounts to QuickBooks Online accounts. You may need to:

1. Ensure your chart of accounts in Vermillion matches your QBO chart of accounts
2. Update account names to match exactly
3. Create missing accounts in QuickBooks Online if needed

### Export Process

1. **Connection Test**: The system tests the QBO connection before exporting
2. **Data Validation**: Journal entries are validated for proper debit/credit balancing
3. **Real-time Export**: Data is sent directly to your QuickBooks Online account
4. **Status Tracking**: Exported entries are marked to prevent duplicate exports

## Troubleshooting

### Common Issues

1. **"Connection Failed"**: Check your Client ID and Client Secret
2. **"Account Not Found"**: Ensure account names match between systems
3. **"Authorization Failed"**: Clear browser cache and try reconnecting

### Debug Mode

Enable debug logging by checking the browser console and backend terminal for detailed error messages.

## Security Notes

- Client credentials are stored securely in environment variables
- OAuth tokens are managed automatically with refresh capability
- No sensitive data is stored in the database

## Support

For issues with the QuickBooks Online integration:

1. Check the browser console for JavaScript errors
2. Check the backend terminal for Python errors
3. Verify your Intuit Developer app configuration
4. Ensure your QBO account has the necessary permissions

## Next Steps

Once the integration is working:

1. **Test with Sample Data**: Export a few test journal entries
2. **Verify in QBO**: Check that entries appear correctly in QuickBooks Online
3. **Set Up Regular Exports**: Use the integration for monthly period closes
4. **Train Users**: Show your team how to use the export functionality

