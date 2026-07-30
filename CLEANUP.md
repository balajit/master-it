# CLEANUP.md

Actionable cleanup items identified during senior engineer code review.
Items are ordered by priority. Each entry includes the file(s), issue,
and the exact fix to apply.

---

## P1 — Fix first

### N-1 · Rename `GoogleAuthCard.tsx` → `AuthMenu.tsx`
- **Files:** `src/components/auth/GoogleAuthCard.tsx`, `src/components/Layout.tsx`
- **Issue:** File is named `GoogleAuthCard` but exports `AuthMenu`. It is not a card
  and handles all auth forms, not just Google.
- **Fix:** Rename the file to `AuthMenu.tsx`. Update the import in `Layout.tsx`.

### S-4 · Remove mock-course fallback for authenticated users with empty API response
- **Files:** `src/components/CourseCatalog.tsx:97–103`
- **Issue:** When the API returns an empty array for an authenticated user, the app
  silently loads mock courses with negative IDs. Navigating into them breaks routing.
- **Fix:** Remove the `data.length === 0` branch. Show a real empty state instead.

### L-3 · Fix crash risk in `RolePermissions.handleSave`
- **Files:** `src/components/RolePermissions.tsx:81`
- **Issue:** `allPermissions.find(...)!.name` uses a non-null assertion. If `find`
  returns `undefined`, this crashes at runtime. The downstream `filter(Boolean)` is
  also redundant given the assertion.
- **Fix:** Replace with `allPermissions.find(...)?.name` and use a type-safe filter:
  `.filter((n): n is string => Boolean(n))`.

### D-8 · Disable save in `EditCoursePage` until backend endpoint exists
- **Files:** `src/pages/EditCoursePage.tsx`
- **Issue:** `handleSubmit` always calls `setError(...)`. The Save button is enabled
  and styled as interactive but can never succeed.
- **Fix:** Disable the submit button. Replace `handleSubmit` body with a TODO comment
  explaining the save is blocked pending a backend PATCH/PUT course endpoint.

---

## P2 — High value cleanup

### DUP-1 · Extract `STATUS_COLORS` and `DIFFICULTY_COLORS` to a shared module
- **Files:** `src/components/CourseCatalog.tsx`, `src/pages/CourseDetailPage.tsx`,
  `src/pages/CourseManagementPage.tsx`
- **Issue:** Identical record constants copy-pasted in all three files.
- **Fix:** Create `src/lib/courseColors.ts`. Export both constants. Update the three
  consumers to import from it.

### DUP-2 · Extract `formatBytes` to a shared module
- **Files:** `src/components/FileUpload.tsx`, `src/pages/CourseDetailPage.tsx`,
  `src/pages/CourseManagementPage.tsx`
- **Issue:** Identical `formatBytes(bytes: number): string` function copy-pasted in
  all three files.
- **Fix:** Create `src/lib/formatBytes.ts`. Export the function. Update the three
  consumers to import from it.

### DUP-6 · Extract delete-confirmation modal to a shared component
- **Files:** `src/components/CourseCatalog.tsx`, `src/pages/CourseManagementPage.tsx`
- **Issue:** The two-button confirmation modal JSX (Cancel / Delete, loading state,
  styled overlay) is duplicated three times across these two files.
- **Fix:** Create `src/components/ConfirmDeleteModal.tsx` with props:
  `title`, `description`, `onConfirm`, `onCancel`, `loading`. Replace all three
  inline modals with this component.

### S-2 · Remove hardcoded "MOCK" strings from production UI
- **Files:** `src/pages/StudyPage.tsx:301`, `src/pages/StudyPage.tsx:364`
- **Issue:** `"MOCK 50 mastery points"` and `"MOCK No practice activities yet."` are
  visible to real users in the rendered UI.
- **Fix:** Replace the mastery points label with real data or remove it. Replace the
  "MOCK No practice activities yet." `<p>` with a clean empty state without the prefix.

### D-7 · Add TODO for unimplemented URL import in `FileUpload`
- **Files:** `src/components/FileUpload.tsx`
- **Issue:** `handleFetchUrl` currently stubs with an error message. The feature is
  needed but not yet implemented.
- **Fix:** Replace the stub with a clear TODO comment explaining what needs to be
  implemented (fetch URL, convert to `File`, pass to `uploadFile`). Keep the UI.

### D-5 · Wire up "Exit" button in `StudyPage`
- **Files:** `src/pages/StudyPage.tsx:193`
- **Issue:** `<Button variant="ghost" size="sm">Exit</Button>` has no `onClick`.
  Clicking it does nothing.
- **Fix:** Add `onClick={() => navigate(\`/courses/\${id}\`)}` using the existing
  `useNavigate` import.

### L-5 · Move `setAuthToken` side effect out of `useState` initializer
- **Files:** `src/context/AuthContext.tsx:64–75`
- **Issue:** `getInitialAuth()` is used as a lazy `useState` initializer but calls
  `setAuthToken()` as a side effect. In React Strict Mode, state initializers can run
  twice, causing double invocation.
- **Fix:** Remove the `setAuthToken` call from `getInitialAuth`. Call it in a
  `useEffect([], [])` that reads the stored token from state on mount.

### N-2 · Rename `onCourseAdded` prop to `newCourse` in `CourseCatalog`
- **Files:** `src/components/CourseCatalog.tsx:54`, `src/pages/Home.tsx:17`
- **Issue:** `onCourseAdded?: Course` looks like a callback (`onX` convention) but is
  actually a data prop — the newly-added course object passed from the parent.
- **Fix:** Rename to `newCourse?: Course` in the prop interface and at the call site
  in `Home.tsx`. Update the internal truthiness guard to an explicit `!= null` check.

---

## P3 — Incremental

### N-3/N-4 · Rename `deleting` / `deletingId` / `deletingDocId` in `CourseManagementPage`
- **Files:** `src/pages/CourseManagementPage.tsx:37–38,51`
- **Issue:** `deleting` holds a `Course | null` — misleading name implying a boolean.
  `deletingId` and `deletingDocId` are booleans — misleading names implying they hold
  IDs.
- **Fix:**
  - `deleting` → `courseToDelete`
  - `deletingId` → `isDeletingCourse`
  - `deletingDocId` → `isDeletingDoc`

### D-1 · Remove unused `deleteNote` export
- **Files:** `src/services/notesApi.ts:75–78`
- **Issue:** `deleteNote` is exported but never imported or called anywhere in the
  codebase.
- **Fix:** Remove the function and its export. Re-add when a UI needs it.

### D-2 · Remove unused `getAuthToken` export
- **Files:** `src/api/client.ts:10–12`
- **Issue:** `getAuthToken` is exported but never imported or called anywhere after
  the P0 `studyApi.ts` refactor.
- **Fix:** Remove the function and its export.

### S-1 · Remove stale TODO in `study.ts`
- **Files:** `src/services/study.ts:100–102`
- **Issue:** TODO references "backend Changes 10+11" for the resume endpoint. The
  endpoint is already called in `studyApi.ts`. The TODO is stale and the issue
  reference is untrackable.
- **Fix:** Remove the TODO comment block.

### S-3 · Add TODO for dynamic import of mock service
- **Files:** `src/services/getStudyService.ts`
- **Issue:** `MockStudyService` is compiled into the production bundle. It should only
  be loaded in development builds.
- **Fix:** Add a TODO comment explaining that `MockStudyService` should be loaded via
  a dynamic `import()` so it is tree-shaken from production builds. Example pattern:
  ```ts
  // TODO: replace static import with dynamic import to exclude mock from prod bundle:
  // const { MockStudyService } = await import("./studyMock");
  ```

### S-7 · Fix `login()` setting `user.name` to the email address
- **Files:** `src/context/AuthContext.tsx:114`
- **Issue:** Email/password login sets `name: loginPayload.email`. The user's email
  appears as their display name in the greeting and user menu.
- **Fix:** Set `name: ""` (or omit) and update `UserMenu` and `Dashboard` to handle
  a missing name gracefully (e.g., fall back to the email, or show "Account").

### L-2 · Guard loading-flag resets by `cancelled` in `CourseDetailPage`
- **Files:** `src/pages/CourseDetailPage.tsx:137,145`
- **Issue:** `setDocsLoading(false)` and `setPlanLoading(false)` are called
  unconditionally, setting state on potentially unmounted components.
- **Fix:** Wrap both calls in `if (!cancelled) { ... }`.

### L-6 · Compute `selectedIndex` once in `StudyPage`
- **Files:** `src/pages/StudyPage.tsx:403–421`
- **Issue:** `allItems.findIndex((i) => i.id === selectedId)` is computed four times
  per render (once in each `onClick` and once in each `disabled` prop for the
  Prev/Next buttons).
- **Fix:** Compute `const selectedIndex = allItems.findIndex((i) => i.id === selectedId)`
  once above the `return` and reference it in both buttons.

### N-6 · Collapse `color` / `cellClass` redundancy in `statusConfig.ts`
- **Files:** `src/components/study/statusConfig.ts`, `src/components/study/ProgressCard.tsx`,
  `src/components/study/ProgressCells.tsx`
- **Issue:** `StatusMeta` has both `color` and `cellClass` with identical Tailwind
  values. Two separate consumers each use one of the two fields.
- **Fix:** Merge into a single `colorClass` field. Update both consumers.

### N-7 · Call `getInitialAuth()` once in `AuthContext`
- **Files:** `src/context/AuthContext.tsx:74–75`
- **Issue:** `getInitialAuth()` is called twice — once for the `user` initializer and
  once for the `token` initializer — causing two `localStorage` reads and two
  `setAuthToken` calls on mount.
- **Fix:** Call `getInitialAuth()` once before the `useState` declarations, store the
  result, and use the destructured values as initial state.

### L-1 / N-5 · Remove ineffective `key` props and unused `index` from `LessonContent`
- **Files:** `src/components/study/LessonContent.tsx`
- **Issue:** `key` props inside switch-case return values are ineffective — React only
  uses `key` on elements in arrays/iterables. The `index` parameter is only used for
  these no-op `key` props.
- **Fix:** Remove `key={index}` props from all switch-case returns. Remove `index`
  from `RenderItem`'s props if it has no other use.

---

## Deferred / Out of scope

| ID | Reason |
|---|---|
| DUP-5 · Auth form extraction | Large refactor; deferred to a dedicated auth cleanup task |
| DUP-3/DUP-4 · `useEscapeKey` / `useClickOutside` hooks | Low risk, low impact; follow-up |
| S-5 · `loggedOutRef` fragile workaround | Requires broader auth flow refactor |
| S-6 · `owner_id: 0` in `AddCourse` | Requires API response change |
| D-3 · `StudyItem.children` | Intentionally kept; nested sidebar hierarchy is planned |
| D-4 · Sidebar mobile/desktop state edge case | Design decision pending |
| D-6 · `LessonItem.onClick` always no-op in `StudyPage` | Functionality question open |
| S-3 · Mock bundle in production | Kept as feature-flag toggle; TODO added only |
