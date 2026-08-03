import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Home from "./pages/Home";
import UserManagement from "./pages/UserManagement";
import CourseManagementPage from "./pages/CourseManagementPage";
import EditCoursePage from "./pages/EditCoursePage";
import CourseDetailPage from "./pages/CourseDetailPage";
import StudyPage from "./pages/StudyPage";
import TriagePage from "./pages/TriagePage";
import { useAuth } from "./hooks/useAuth";
import { hasRole } from "./context/auth-context";

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (!hasRole(user, "Administrator") && !hasRole(user, "SuperUser"))
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ContentCreatorRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/" replace />;
  if (
    !hasRole(user, "Administrator") &&
    !hasRole(user, "SuperUser") &&
    !hasRole(user, "Instructor")
  )
    return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/users"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />
        <Route
          path="/courses/manage"
          element={
            <ContentCreatorRoute>
              <CourseManagementPage />
            </ContentCreatorRoute>
          }
        />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/courses/:id/study" element={<StudyPage />} />
        <Route
          path="/triage"
          element={
            <ContentCreatorRoute>
              <TriagePage />
            </ContentCreatorRoute>
          }
        />
        <Route
          path="/courses/:id/edit"
          element={
            <ContentCreatorRoute>
              <EditCoursePage />
            </ContentCreatorRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
