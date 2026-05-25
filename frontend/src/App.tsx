import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './store/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/Login/LoginPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import UserListPage from './pages/Users/UserListPage';
import ReviewTypeListPage from './pages/ReviewTypes/ReviewTypeListPage';
import TemplateListPage from './pages/Templates/TemplateListPage';
import TemplateCreatePage from './pages/Templates/TemplateCreatePage';
import TemplateEditPage from './pages/Templates/TemplateEditPage';
import TemplateDetailPage from './pages/Templates/TemplateDetailPage';
import TemplatePreviewPage from './pages/Templates/TemplatePreviewPage';
import VersionListPage from './pages/Versions/VersionListPage';
import VersionDetailPage from './pages/Versions/VersionDetailPage';
import VersionDiffPage from './pages/Versions/VersionDiffPage';
import PendingApprovalsPage from './pages/Approvals/PendingApprovalsPage';
import ApprovalHistoryPage from './pages/Approvals/ApprovalHistoryPage';
import RolePermissionsPage from './pages/Admin/RolePermissionsPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UserListPage />} />
          <Route path="review-types" element={<ReviewTypeListPage />} />
          <Route path="templates" element={<TemplateListPage />} />
          <Route path="templates/create" element={<TemplateCreatePage />} />
          <Route path="templates/:id" element={<TemplateDetailPage />} />
          <Route path="templates/:id/edit" element={<TemplateEditPage />} />
          <Route path="templates/:id/preview" element={<TemplatePreviewPage />} />
          <Route path="templates/:tid/versions" element={<VersionListPage />} />
          <Route path="templates/:tid/versions/:vid" element={<VersionDetailPage />} />
          <Route path="templates/:tid/versions/:vid/diff" element={<VersionDiffPage />} />
          <Route path="approvals/pending" element={<PendingApprovalsPage />} />
          <Route path="approvals/:templateId" element={<ApprovalHistoryPage />} />
          <Route path="admin/roles" element={<RolePermissionsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
