<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architettura (rules)
- Economic formulas live only in `src/lib/calcoli.ts` and are covered by `src/test/calcoli.test.ts`; UI must call these helpers, never re-implement math, so preview and stored results always agree.
- Data access goes through the browser client with RLS (`src/lib/interventi.ts`); every app table is owner-scoped by `user_id = auth.uid()`, so no server functions are needed for CRUD.
- Signed-in pages live under `src/routes/_authenticated/` and wrap content in `AppShell` (sidebar on desktop, bottom nav on mobile), keeping navigation consistent.
- Numeric form fields are strings parsed with `leggiNumero` (accepts Italian comma decimals) and validated with zod schemas in `src/lib/interventi.ts`.
