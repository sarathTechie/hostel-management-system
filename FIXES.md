# Fixes applied

1. **Freeze when clicking actions (root cause)** – `client/src/ui/RecordPage.tsx`
   The data table received a brand-new `data` array and `columns` array on every render, so TanStack Table kept
   resetting the page index, which triggered another render, forever (~180 renders/second while idle). Every
   click (Review, Update, Record payment, Mark exit, Edit, Delete, ...) then fought that loop and the UI hung.
   Data and columns are now memoised, `autoResetPageIndex` is off, and the page index resets only when a filter changes.
2. **Vacate bed / Mark for maintenance did nothing** – `client/src/ui/RoomsPage.tsx`
   The handler used a stale dialog value, so no API call was made but "updated successfully" was shown.
   The action is now passed explicitly; dialog state is reset between steps.
3. **Fee-status and visitor-status filters had no effect** – `RecordPage.tsx` compared against `'fees'`/`'visitors'` instead of `'/fees'`/`'/visitors'`.
4. **Every sidebar link forced a full page reload** – removed `reloadInternalNavigation` from `App.tsx`; normal SPA navigation restored.
5. Garbled `?` characters in table sort arrows and the room filter replaced with ▲ ▼ ·
6. Added `client/src/ui/regression.test.tsx` (render-loop guard on 6 data pages, leave review submit, vacate bed).
7. `client/dist` rebuilt so `npm run preview` (port 4173) also has the fix.
