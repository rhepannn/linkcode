-- CreateEnum
CREATE TYPE "Sector" AS ENUM ('industri', 'lingkungan', 'pemerintahan', 'platform', 'bisnis');

-- CreateTable
CREATE TABLE "Showcase" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sector" "Sector" NOT NULL,
    "description" TEXT NOT NULL,
    "year" INTEGER,
    "techStack" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "thumbnailUrl" TEXT,
    "previewUrl" TEXT,
    "videoUrl" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "embeddable" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Showcase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Showcase_slug_key" ON "Showcase"("slug");

-- Supabase: kunci tabel dari REST API publik (lihat migrasi enable_rls).
ALTER TABLE "Showcase" ENABLE ROW LEVEL SECURITY;
