// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUpload from "../components/FileUpload";

const mockPost = vi.fn();
const mockPickFiles = vi.fn();

vi.mock("../api/client", () => ({
  default: {
    POST: (...args: unknown[]) => mockPost(...args),
  },
}));

vi.mock("@capgo/capacitor-file-picker", () => ({
  CapgoFilePicker: {
    pickFiles: (...args: unknown[]) => mockPickFiles(...args),
  },
}));

describe("FileUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPost.mockResolvedValue({ data: { id: "doc-1" }, error: undefined });
  });

  it("shows HTTPS validation error for URL import", async () => {
    const user = userEvent.setup();
    render(<FileUpload courseId={10} />);

    await user.type(screen.getByPlaceholderText("https://example.com/file.pdf"), "http://example.com/file.pdf");
    await user.click(screen.getByRole("button", { name: "Fetch" }));

    expect(await screen.findByText("Only valid HTTPS URLs are allowed")).toBeInTheDocument();
  });

  it("rejects unsupported file type", async () => {
    const user = userEvent.setup();
    mockPickFiles.mockResolvedValue({
      files: [
        {
          name: "malware.exe",
          mimeType: "application/x-msdownload",
          blob: new Blob(["abc"], { type: "application/x-msdownload" }),
        },
      ],
    });

    render(<FileUpload courseId={10} />);

    await user.click(screen.getByRole("button", { name: "Choose File" }));

    expect(await screen.findByText("Unsupported file type")).toBeInTheDocument();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it("uploads valid file from picker", async () => {
    const user = userEvent.setup();
    mockPickFiles.mockResolvedValue({
      files: [
        {
          name: "notes.pdf",
          mimeType: "application/pdf",
          blob: new Blob(["valid"], { type: "application/pdf" }),
        },
      ],
    });

    render(<FileUpload courseId={42} />);

    await user.click(screen.getByRole("button", { name: "Choose File" }));

    expect(mockPost).toHaveBeenCalledWith(
      "/api/courses/{course_id}/documents",
      expect.objectContaining({
        params: { path: { course_id: 42 } },
      }),
    );
    expect(await screen.findByText(/Uploaded notes.pdf/)).toBeInTheDocument();
  });
});
