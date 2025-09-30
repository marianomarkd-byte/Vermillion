import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ProjectBreadcrumb from './components/ProjectBreadcrumb';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import ProjectBudgets from './components/ProjectBudgets';
import ProjectContracts from './components/ProjectContracts';
import ProjectSettings from './components/ProjectSettings';
import Commitments from './components/Commitments';
import APInvoices from './components/APInvoices';
import ProjectBilling from './components/ProjectBilling';
import WIP from './components/WIP';
import GLSettings from './components/GLSettings';
import CostCodes from './components/CostCodes';
import CostTypes from './components/CostTypes';
import Vendors from './components/Vendors';
import Customers from './components/Customers';
import Integrations from './components/Integrations';
import AccountingPeriods from './components/AccountingPeriods';
import ChartOfAccounts from './components/ChartOfAccounts';
import ExternalChangeOrders from './components/ExternalChangeOrders';
import InternalChangeOrders from './components/InternalChangeOrders';
import JournalEntries from './components/JournalEntries';
import JournalEntriesPreview from './components/JournalEntriesPreview';
import LaborCosts from './components/LaborCosts';
import Employees from './components/Employees';
import ProjectExpenses from './components/ProjectExpenses';
import CommitmentChangeOrders from './components/CommitmentChangeOrders';
import CommitmentsReport from './components/CommitmentsReport';
import BuyoutAndForecasting from './components/BuyoutAndForecasting';
import WIPSettings from './components/WIPSettings';


function App() {

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <ProjectBreadcrumb />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route 
              path="/" 
              element={<Projects />} 
            />
            <Route
              path="/projects/:projectVuid/settings"
              element={<ProjectSettings />}
            />
            <Route
              path="/projects/:projectVuid"
              element={<ProjectDetails />}
            />
            <Route 
              path="/projects" 
              element={<Projects />} 
            />
            <Route 
              path="/costcodes" 
              element={<CostCodes />} 
            />
            <Route 
              path="/costtypes" 
              element={<CostTypes />} 
            />
            <Route 
              path="/vendors" 
              element={<Vendors />} 
            />
            <Route 
              path="/customers" 
              element={<Customers />} 
            />
            <Route
              path="/chartofaccounts"
              element={<ChartOfAccounts />}
            />
            <Route
              path="/integrations"
              element={<Integrations />}
            />
            <Route
              path="/commitments"
              element={<Commitments />}
            />
            <Route
              path="/ap-invoices"
              element={<APInvoices />}
            />
            <Route
              path="/project-budgets"
              element={<ProjectBudgets />}
            />
            <Route
              path="/project-contracts"
              element={<ProjectContracts />}
            />
            <Route
              path="/internal-change-orders"
              element={<InternalChangeOrders />}
            />
            <Route
              path="/external-change-orders"
              element={<ExternalChangeOrders />}
            />
            <Route
              path="/wip"
              element={<WIP />}
            />
            <Route
              path="/accounting-periods"
              element={<AccountingPeriods />}
            />
            <Route
              path="/gl-settings"
              element={<GLSettings />}
            />
            <Route
              path="/project-billing"
              element={<ProjectBilling />}
            />
            <Route
              path="/journal-entries"
              element={<JournalEntries />}
            />
            <Route
              path="/journal-entries-preview"
              element={<JournalEntriesPreview />}
            />
            <Route
              path="/labor-costs"
              element={<LaborCosts />}
            />
            <Route
              path="/employees"
              element={<Employees />}
            />
            <Route
              path="/project-expenses"
              element={<ProjectExpenses />}
            />
            <Route
              path="/commitment-change-orders"
              element={<CommitmentChangeOrders />}
            />
            <Route
              path="/commitments-report"
              element={<CommitmentsReport />}
            />
            <Route
              path="/projects/:projectVuid/buyout-forecasting"
              element={<BuyoutAndForecasting />}
            />
            <Route
              path="/wip-settings"
              element={<WIPSettings />}
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
