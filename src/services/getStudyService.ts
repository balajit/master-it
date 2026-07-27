/**
 * getStudyService.ts — Returns the appropriate StudyService implementation.
 *
 * Set VITE_USE_MOCK_STUDY=true in .env.local to use the mock service.
 * Omit or set to any other value to use the real API service.
 *
 * Example .env.local:
 *   VITE_USE_MOCK_STUDY=true
 */

import type { StudyService } from "./study";
import { MockStudyService } from "./studyMock";
import { ApiStudyService } from "./studyApi";

let _instance: StudyService | null = null;

export function getStudyService(): StudyService {
  if (!_instance) {
    _instance =
      import.meta.env.VITE_USE_MOCK_STUDY === "true"
        ? new MockStudyService()
        : new ApiStudyService();
  }
  return _instance;
}
