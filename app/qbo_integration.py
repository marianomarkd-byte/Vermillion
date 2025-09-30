"""
QuickBooks Online Integration Module

This module handles all QuickBooks Online API interactions including:
- OAuth 2.0 authentication
- Journal entry creation and management
- Invoice creation and management
- Error handling and retry logic
"""

import os
import json
import requests
import base64
from datetime import datetime, timedelta
from urllib.parse import urlencode, parse_qs
from flask import current_app
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class QBOIntegration:
    """QuickBooks Online API Integration Class"""
    
    def __init__(self):
        self.client_id = os.getenv('QBO_CLIENT_ID')
        self.client_secret = os.getenv('QBO_CLIENT_SECRET')
        self.redirect_uri = os.getenv('QBO_REDIRECT_URI', 'http://localhost:3000/qbo/callback')
        self.discovery_document_url = 'https://appcenter.intuit.com/api/v1/OpenID/QBOpenID'
        self.base_url = 'https://sandbox-quickbooks.api.intuit.com'  # Use production URL for live
        self.access_token = None
        self.refresh_token = None
        self.realm_id = None
        self.token_expires_at = None
        
        # Mock mode for testing without real credentials
        self.mock_mode = not (self.client_id and self.client_secret and 
                            self.client_id != 'your_client_id_here' and 
                            self.client_secret != 'your_client_secret_here')
        
        # Mock data for testing
        self.mock_company_info = {
            'QueryResponse': {
                'CompanyInfo': [{
                    'Id': '123456789',
                    'CompanyName': 'Vermillion Construction (Mock)',
                    'LegalName': 'Vermillion Construction LLC',
                    'CompanyAddr': {
                        'Line1': '123 Construction Way',
                        'City': 'Denver',
                        'CountrySubDivisionCode': 'CO',
                        'PostalCode': '80202'
                    },
                    'PrimaryPhone': {
                        'FreeFormNumber': '(555) 123-4567'
                    },
                    'Email': {
                        'Address': 'info@vermillionconstruction.com'
                    }
                }]
            }
        }
        
        self.mock_journal_entry_response = {
            'QueryResponse': {
                'JournalEntry': [{
                    'Id': '123',
                    'DocNumber': 'JE-001',
                    'TxnDate': '2024-09-09',
                    'TotalAmt': 1000.00,
                    'Line': [
                        {
                            'Id': '1',
                            'DetailType': 'JournalEntryLineDetail',
                            'Amount': 1000.00,
                            'Description': 'Mock Journal Entry - Test Project',
                            'JournalEntryLineDetail': {
                                'PostingType': 'Debit',
                                'AccountRef': {
                                    'value': '1',
                                    'name': 'Construction Revenue'
                                }
                            }
                        },
                        {
                            'Id': '2',
                            'DetailType': 'JournalEntryLineDetail',
                            'Amount': 1000.00,
                            'Description': 'Mock Journal Entry - Test Project',
                            'JournalEntryLineDetail': {
                                'PostingType': 'Credit',
                                'AccountRef': {
                                    'value': '2',
                                    'name': 'Accounts Receivable'
                                }
                            }
                        }
                    ]
                }]
            }
        }
        
    def get_authorization_url(self, state=None):
        """Generate QuickBooks Online authorization URL"""
        if self.mock_mode:
            logger.info("Mock mode: Returning mock authorization URL")
            return "https://mock-qbo-auth.com/oauth2?mock=true"
        
        params = {
            'client_id': self.client_id,
            'scope': 'com.intuit.quickbooks.accounting',
            'redirect_uri': self.redirect_uri,
            'response_type': 'code',
            'access_type': 'offline',
            'state': state or 'default_state'
        }
        
        auth_url = f"https://appcenter.intuit.com/connect/oauth2?{urlencode(params)}"
        return auth_url
    
    def exchange_code_for_tokens(self, authorization_code, realm_id):
        """Exchange authorization code for access and refresh tokens"""
        if self.mock_mode:
            logger.info("Mock mode: Simulating successful token exchange")
            self.access_token = "mock_access_token_12345"
            self.refresh_token = "mock_refresh_token_67890"
            self.realm_id = realm_id or "mock_realm_123"
            self.token_expires_at = datetime.utcnow() + timedelta(hours=1)
            return True
        
        try:
            # Create basic auth header
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'grant_type': 'authorization_code',
                'code': authorization_code,
                'redirect_uri': self.redirect_uri
            }
            
            response = requests.post(
                'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                self.refresh_token = token_data.get('refresh_token')
                self.realm_id = realm_id
                
                # Calculate token expiration
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                
                logger.info(f"Successfully obtained QBO tokens for realm {realm_id}")
                return True
            else:
                logger.error(f"Failed to exchange code for tokens: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error exchanging code for tokens: {str(e)}")
            return False
    
    def refresh_access_token(self):
        """Refresh the access token using refresh token"""
        if self.mock_mode:
            logger.info("Mock mode: Simulating successful token refresh")
            self.access_token = "mock_refreshed_access_token_54321"
            self.token_expires_at = datetime.utcnow() + timedelta(hours=1)
            return True
        
        try:
            if not self.refresh_token:
                logger.error("No refresh token available")
                return False
                
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            data = {
                'grant_type': 'refresh_token',
                'refresh_token': self.refresh_token
            }
            
            response = requests.post(
                'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
                headers=headers,
                data=data
            )
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get('access_token')
                
                # Update refresh token if provided
                if 'refresh_token' in token_data:
                    self.refresh_token = token_data.get('refresh_token')
                
                # Calculate new expiration
                expires_in = token_data.get('expires_in', 3600)
                self.token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
                
                logger.info("Successfully refreshed QBO access token")
                return True
            else:
                logger.error(f"Failed to refresh access token: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Error refreshing access token: {str(e)}")
            return False
    
    def is_token_valid(self):
        """Check if the current access token is valid and not expired"""
        if self.mock_mode:
            return True  # Mock mode always has valid tokens
        
        if not self.access_token:
            return False
        
        if self.token_expires_at and datetime.utcnow() >= self.token_expires_at:
            # Token is expired, try to refresh
            return self.refresh_access_token()
        
        return True
    
    def _make_qbo_request(self, method, endpoint, data=None, params=None):
        """Make authenticated request to QuickBooks Online API"""
        if self.mock_mode:
            logger.info(f"Mock mode: Simulating {method} request to {endpoint}")
            # Return appropriate mock data based on endpoint
            if 'companyinfo' in endpoint:
                return self.mock_company_info
            elif 'journalentries' in endpoint:
                if method.upper() == 'POST':
                    # Return a mock created journal entry
                    return {
                        'QueryResponse': {
                            'JournalEntry': [{
                                'Id': f"mock_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                                'DocNumber': data.get('DocNumber', 'JE-MOCK'),
                                'TxnDate': data.get('TxnDate', datetime.now().strftime('%Y-%m-%d')),
                                'TotalAmt': sum(line.get('Amount', 0) for line in data.get('Line', [])),
                                'Line': data.get('Line', [])
                            }]
                        }
                    }
                else:
                    return self.mock_journal_entry_response
            elif 'invoices' in endpoint:
                return {
                    'QueryResponse': {
                        'Invoice': [{
                            'Id': f"mock_inv_{datetime.now().strftime('%Y%m%d%H%M%S')}",
                            'DocNumber': data.get('DocNumber', 'INV-MOCK') if data else 'INV-001',
                            'TxnDate': data.get('TxnDate', datetime.now().strftime('%Y-%m-%d')) if data else '2024-09-09',
                            'TotalAmt': data.get('TotalAmt', 1000.00) if data else 1000.00
                        }]
                    }
                }
            else:
                return {'QueryResponse': {}}
        
        if not self.is_token_valid():
            logger.error("No valid access token available")
            return None
        
        url = f"{self.base_url}/v3/company/{self.realm_id}/{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method.upper() == 'POST':
                response = requests.post(url, headers=headers, json=data)
            elif method.upper() == 'PUT':
                response = requests.put(url, headers=headers, json=data)
            else:
                logger.error(f"Unsupported HTTP method: {method}")
                return None
            
            if response.status_code in [200, 201]:
                return response.json()
            elif response.status_code == 401:
                # Token might be invalid, try to refresh
                if self.refresh_access_token():
                    return self._make_qbo_request(method, endpoint, data, params)
                else:
                    logger.error("Authentication failed and token refresh unsuccessful")
                    return None
            else:
                logger.error(f"QBO API request failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error making QBO request: {str(e)}")
            return None
    
    def get_company_info(self):
        """Get company information from QuickBooks Online"""
        return self._make_qbo_request('GET', 'companyinfo/1')
    
    def get_accounts(self):
        """Get chart of accounts from QuickBooks Online"""
        return self._make_qbo_request('GET', 'accounts')
    
    def create_journal_entry(self, journal_entry_data):
        """Create a journal entry in QuickBooks Online"""
        qbo_journal_entry = {
            "DocNumber": journal_entry_data.get('journal_number'),
            "TxnDate": journal_entry_data.get('entry_date'),
            "Line": []
        }
        
        # Add line items
        for line in journal_entry_data.get('line_items', []):
            qbo_line = {
                "Id": f"JEL_{line.get('vuid', '')}",
                "LineNum": len(qbo_journal_entry['Line']) + 1,
                "Description": line.get('description', ''),
                "Amount": float(line.get('debit_amount', 0)) or float(line.get('credit_amount', 0)),
                "DetailType": "JournalEntryLineDetail",
                "JournalEntryLineDetail": {
                    "PostingType": "Debit" if line.get('debit_amount', 0) else "Credit",
                    "AccountRef": {
                        "value": line.get('account_id', '1'),  # Default to first account
                        "name": line.get('account_name', 'Unknown Account')
                    }
                }
            }
            qbo_journal_entry['Line'].append(qbo_line)
        
        return self._make_qbo_request('POST', 'journalentries', qbo_journal_entry)
    
    def create_invoice(self, invoice_data):
        """Create an invoice in QuickBooks Online"""
        qbo_invoice = {
            "DocNumber": invoice_data.get('invoice_number'),
            "TxnDate": invoice_data.get('invoice_date'),
            "DueDate": invoice_data.get('due_date'),
            "TotalAmt": float(invoice_data.get('total_amount', 0)),
            "Balance": float(invoice_data.get('total_amount', 0)),
            "PrivateNote": invoice_data.get('private_note', ''),
            "Line": []
        }
        
        # Add line items
        for line in invoice_data.get('line_items', []):
            qbo_line = {
                "Id": f"INV_{line.get('vuid', '')}",
                "LineNum": len(qbo_invoice['Line']) + 1,
                "Description": line.get('description', ''),
                "Amount": float(line.get('amount', 0)),
                "DetailType": "SalesItemLineDetail",
                "SalesItemLineDetail": {
                    "ItemRef": {
                        "value": line.get('item_id', '1'),
                        "name": line.get('item_name', 'Service')
                    },
                    "Qty": 1,
                    "UnitPrice": float(line.get('amount', 0))
                }
            }
            qbo_invoice['Line'].append(qbo_line)
        
        return self._make_qbo_request('POST', 'invoices', qbo_invoice)
    
    def get_journal_entries(self, start_date=None, end_date=None):
        """Get journal entries from QuickBooks Online"""
        params = {}
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
            
        return self._make_qbo_request('GET', 'journalentries', params=params)
    
    def get_invoices(self, start_date=None, end_date=None):
        """Get invoices from QuickBooks Online"""
        params = {}
        if start_date:
            params['start_date'] = start_date
        if end_date:
            params['end_date'] = end_date
            
        return self._make_qbo_request('GET', 'invoices', params=params)
    
    def test_connection(self):
        """Test the connection to QuickBooks Online"""
        if self.mock_mode:
            logger.info("Mock mode: Simulating successful connection test")
            return {
                'success': True,
                'company_name': 'Vermillion Construction (Mock)',
                'realm_id': 'mock_realm_123',
                'mock_mode': True
            }
        
        try:
            company_info = self.get_company_info()
            if company_info and 'QueryResponse' in company_info:
                return {
                    'success': True,
                    'company_name': company_info['QueryResponse']['CompanyInfo'][0].get('CompanyName', 'Unknown'),
                    'realm_id': self.realm_id
                }
            else:
                return {
                    'success': False,
                    'error': 'Failed to retrieve company information'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Connection test failed: {str(e)}'
            }

# Global QBO integration instance
qbo_integration = QBOIntegration()
