import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import client from "../api/client";
import type { components } from "../api/v1.d.ts";
import Layout from "../components/Layout";
import FileUpload from "../components/FileUpload";

type Course = components["schemas"]["Course"];

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    number_of_credits: 1,
    difficulty: "beginner",
    status: "COMING_SOON" as Course["status"],
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const { data, error: err } = await client.GET("/api/courses");
      if (cancelled) return;

      if (err) {
        setError("Failed to load courses");
        setLoading(false);
        return;
      }

      const found = data.find((c) => c.id === Number(id));
      if (!found) {
        setError("Course not found");
        setLoading(false);
        return;
      }

      setCourse(found);
      setForm({
        title: found.title,
        description: found.description,
        number_of_credits: found.number_of_credits,
        difficulty: found.difficulty,
        status: found.status,
      });
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleChange() {
    // no-op — editing not available yet
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <Layout>
      <div className="flex flex-col gap-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Content</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Edit Course
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Update course details or attach documents
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Back to courses
          </button>
        </div>

        {loading && (
          <div className="flex flex-col gap-4">
            <div className="h-48 animate-pulse rounded-2xl bg-gray-100" />
            <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && course && (
          <>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6"
            >
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Course Details
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Modify the information below and save your changes
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={form.title}
                    onChange={handleChange}
                    disabled
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={3}
                    value={form.description}
                    onChange={handleChange}
                    disabled
                    className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="number_of_credits"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Credits
                    </label>
                    <input
                      id="number_of_credits"
                      name="number_of_credits"
                      type="number"
                      min={1}
                      max={10}
                      required
                      value={form.number_of_credits}
                      onChange={handleChange}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="difficulty"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Difficulty
                    </label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={form.difficulty}
                      onChange={handleChange}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Status
                  </label>
                    <select
                      id="status"
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      disabled
                      className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm shadow-sm"
                    >
                    <option value="OPEN">Open</option>
                    <option value="CLOSED">Closed</option>
                    <option value="COMING_SOON">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-700">
                Course editing is not yet available. You can upload documents
                below.
              </div>
            </form>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-6">
              <FileUpload courseId={course.id} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
