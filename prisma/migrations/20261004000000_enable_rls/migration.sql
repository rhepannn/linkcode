-- Supabase mengekspos schema "public" lewat REST API (PostgREST) dengan anon key.
-- Aktifkan RLS tanpa policy → role anon/authenticated ditolak total.
-- Backend memakai Prisma dengan role "postgres" (bypass RLS), jadi tidak terpengaruh.
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PIC" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Admin" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
