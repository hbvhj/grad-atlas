# Grad Atlas

Private 2027 graduate application workspace. School view contains editable programs, rounds, admission requirements, tracks, and source links. GRE/TOEFL view stores goals and mock results and derives planning dates from selected deadlines.

Records are stored in D1 with optimistic version checks. The private Sites access gateway restricts the entire site to the owner. Keep the site private unless application-level user isolation is added.

Source monitoring runs on page open and periodically while open, with a per-program 24-hour cache. It detects changes to readable official admissions snippets and retains user edits for manual verification. It does not operate as an unattended scheduler. Current official domains are allowlisted server-side; other schools support manual editing and links.

Initial research was imported from the user's Graduate_Programs_2027.xlsx, checked September 14, 2026. LBS rounds and selected multi-program policies were updated September 16, 2026. Unverified information is explicitly labelled.

Validation: TypeScript checks, production build, Worker SSR and D1 create/edit/delete, score validation, settings persistence, and conflict detection passed locally. Browser QA and WebMCP runtime validation were unavailable in this task's permitted context.
