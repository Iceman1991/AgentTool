-- ============================================================
-- PF2 Campaign Notes – Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_workspaces" ON workspaces FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- entity_types
CREATE TABLE IF NOT EXISTS entity_types (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '[]',
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE entity_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_entity_types" ON entity_types FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- entity_folders
CREATE TABLE IF NOT EXISTS entity_folders (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  "typeId" TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE entity_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_entity_folders" ON entity_folders FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- entities
CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  "typeId" TEXT NOT NULL,
  name TEXT NOT NULL,
  summary TEXT,
  "imageUrl" TEXT,
  "imagePosition" JSONB,
  "imageLayout" TEXT,
  "imageSize" INTEGER,
  "folderId" TEXT,
  "order" INTEGER,
  properties JSONB NOT NULL DEFAULT '{}',
  tags JSONB NOT NULL DEFAULT '[]',
  "deletedAt" BIGINT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_entities" ON entities FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- relationship_types
CREATE TABLE IF NOT EXISTS relationship_types (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  label TEXT NOT NULL,
  "inverseLabel" TEXT,
  color TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'undirected',
  "isFamilial" BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE relationship_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_relationship_types" ON relationship_types FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- relationships
CREATE TABLE IF NOT EXISTS relationships (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "sourceId" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "typeId" TEXT NOT NULL,
  label TEXT,
  notes TEXT,
  "isFamilial" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_relationships" ON relationships FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- timeline_events
CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  date JSONB NOT NULL,
  "endDate" JSONB,
  category TEXT NOT NULL DEFAULT 'custom',
  "linkedEntityIds" JSONB NOT NULL DEFAULT '[]',
  "sessionNumber" INTEGER,
  tags JSONB NOT NULL DEFAULT '[]',
  "isSecret" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_timeline_events" ON timeline_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- note_pages
CREATE TABLE IF NOT EXISTS note_pages (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📄',
  "parentId" TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  blocks JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  "linkedEntityIds" JSONB NOT NULL DEFAULT '[]',
  "deletedAt" BIGINT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE note_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_note_pages" ON note_pages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- family_trees
CREATE TABLE IF NOT EXISTS family_trees (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  name TEXT NOT NULL,
  description TEXT,
  "rootEntityId" TEXT,
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE family_trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_family_trees" ON family_trees FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- timelines
CREATE TABLE IF NOT EXISTS timelines (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  "workspaceId" TEXT,
  name TEXT NOT NULL,
  description TEXT,
  "filterEntityIds" JSONB NOT NULL DEFAULT '[]',
  "filterTags" JSONB NOT NULL DEFAULT '[]',
  color TEXT NOT NULL DEFAULT '#7C3AED',
  "createdAt" BIGINT NOT NULL,
  "updatedAt" BIGINT NOT NULL
);
ALTER TABLE timelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_timelines" ON timelines FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
