import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Layout from "../components/Layout";
import Dashboard from "../components/Dashboard";
import CourseCatalog from "../components/CourseCatalog";
import type { components } from "../api/v1.d.ts";

type Course = components["schemas"]["Course"];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [newCourse, setNewCourse] = useState<Course | undefined>(undefined);

  return (
    <Layout>
      {isAuthenticated && <Dashboard onCourseAdded={setNewCourse} />}
      <CourseCatalog onCourseAdded={newCourse} />
    </Layout>
  );
}
