import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LabDetailPage from './pages/lab/LabDetailPage';
import LabListPage from './pages/lab/LabListPage';
import LabRegisterPage from './pages/lab/LabRegisterPage';
import WasteDetailPage from './pages/waste/WasteDetailPage';
import WasteFormPage from './pages/waste/WasteFormPage';
import WasteListPage from './pages/waste/WasteListPage';
import UserDetailPage from './pages/user/UserDetailPage';
import UserListPage from './pages/user/UserListPage';
import UserRegisterPage from './pages/user/UserRegisterPage';
import ChemicalDetailPage from './pages/chemical/ChemicalDetailPage';
import ChemicalListPage from './pages/chemical/ChemicalListPage';
import ChemicalRegisterPage from './pages/chemical/ChemicalRegisterPage';
import EducationDetailPage from './pages/education/EducationDetailPage';
import EducationListPage from './pages/education/EducationListPage';
import EducationRegisterPage from './pages/education/EducationRegisterPage';
import ChecklistCreatePage from './pages/inspection/ChecklistCreatePage';
import ChecklistPage from './pages/inspection/ChecklistPage';
import InspectionCalendarPage from './pages/inspection/InspectionCalendarPage';
import InspectionDetailPage from './pages/inspection/InspectionDetailPage';
import InspectionListPage from './pages/inspection/InspectionListPage';
import InspectionRegisterPage from './pages/inspection/InspectionRegisterPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="labs" element={<LabListPage />} />
            <Route path="labs/new" element={<LabRegisterPage />} />
            <Route path="labs/:labId" element={<LabDetailPage />} />
            <Route path="wastes" element={<WasteListPage />} />
            <Route path="wastes/new" element={<WasteFormPage />} />
            <Route path="wastes/:wasteId" element={<WasteDetailPage />} />
            <Route path="wastes/:wasteId/edit" element={<WasteFormPage />} />
            <Route path="chemicals/new" element={<ChemicalRegisterPage />} />
            <Route path="chemicals/:chemicalId" element={<ChemicalDetailPage />} />
            <Route path="chemicals" element={<ChemicalListPage />} />
            <Route path="users/new" element={<UserRegisterPage />} />
            <Route path="users/:userId" element={<UserDetailPage />} />
            <Route path="users" element={<UserListPage />} />
            <Route path="educations/new" element={<EducationRegisterPage />} />
            <Route path="educations/:contentId" element={<EducationDetailPage />} />
            <Route path="educations" element={<EducationListPage />} />
            <Route path="inspections/calendar" element={<InspectionCalendarPage />} />
            <Route path="inspections/checklist/new" element={<ChecklistCreatePage />} />
            <Route path="inspections/checklist" element={<ChecklistPage />} />
            <Route path="inspections/new" element={<InspectionRegisterPage />} />
            <Route path="inspections/:inspectionId" element={<InspectionDetailPage />} />
            <Route path="inspections" element={<InspectionListPage />} />
            <Route path="checklist" element={<Navigate to="/inspections/checklist" replace />} />
            <Route path="checklist/new" element={<Navigate to="/inspections/checklist/new" replace />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
