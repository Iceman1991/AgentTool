import Dexie, { type Table } from 'dexie';
import type { EntityType, Entity, EntityFolder, Relationship, RelationshipType, TimelineEvent, NotePage, FamilyTree, Timeline, Workspace } from '../types';

export class CampaignDatabase extends Dexie {
  workspaces!: Table<Workspace>;
  entityTypes!: Table<EntityType>;
  entities!: Table<Entity>;
  entityFolders!: Table<EntityFolder>;
  relationships!: Table<Relationship>;
  relationshipTypes!: Table<RelationshipType>;
  timelineEvents!: Table<TimelineEvent>;
  notePages!: Table<NotePage>;
  familyTrees!: Table<FamilyTree>;
  timelines!: Table<Timeline>;

  constructor() {
    super('pf2-campaign-notes');
    this.version(1).stores({
      entityTypes: 'id, slug, createdAt',
      entities: 'id, typeId, name, createdAt',
      relationships: 'id, sourceId, targetId, typeId, createdAt',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
    });
    this.version(2).stores({
      entityTypes: 'id, slug, createdAt',
      entities: 'id, typeId, name, createdAt',
      relationships: 'id, sourceId, targetId, typeId, createdAt',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
      notePages: 'id, title, createdAt, updatedAt',
    });
    this.version(3).stores({
      entityTypes: 'id, slug, createdAt',
      entities: 'id, typeId, name, createdAt',
      relationships: 'id, sourceId, targetId, typeId, createdAt',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
      notePages: 'id, title, createdAt, updatedAt',
      familyTrees: 'id, name, createdAt',
    });
    this.version(4).stores({
      entityTypes: 'id, slug, createdAt',
      entities: 'id, typeId, name, createdAt',
      relationships: 'id, sourceId, targetId, typeId, createdAt',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
      notePages: 'id, title, createdAt, updatedAt',
      familyTrees: 'id, name, createdAt',
      timelines: 'id, name, createdAt',
    });
    this.version(5).stores({
      entityTypes: 'id, slug, createdAt',
      entities: 'id, typeId, name, createdAt, folderId',
      entityFolders: 'id, typeId, createdAt',
      relationships: 'id, sourceId, targetId, typeId, createdAt',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
      notePages: 'id, title, createdAt, updatedAt',
      familyTrees: 'id, name, createdAt',
      timelines: 'id, name, createdAt',
    });
    this.version(6).stores({
      workspaces: 'id, createdAt',
      entityTypes: 'id, slug, createdAt, workspaceId',
      entities: 'id, typeId, name, createdAt, folderId, workspaceId',
      entityFolders: 'id, typeId, createdAt, workspaceId',
      relationships: 'id, sourceId, targetId, typeId, createdAt, workspaceId',
      relationshipTypes: 'id, label',
      timelineEvents: 'id, createdAt',
      notePages: 'id, title, createdAt, updatedAt, workspaceId',
      familyTrees: 'id, name, createdAt, workspaceId',
      timelines: 'id, name, createdAt, workspaceId',
    }).upgrade(async tx => {
      const DEFAULT_WS = 'default-workspace';
      // Create default workspace
      await tx.table('workspaces').add({
        id: DEFAULT_WS,
        name: 'Standard',
        description: 'Standard-Workspace',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      // Assign all existing data to default workspace
      for (const tbl of ['entityTypes', 'entities', 'entityFolders', 'relationships', 'notePages', 'familyTrees', 'timelines']) {
        await tx.table(tbl).toCollection().modify({ workspaceId: DEFAULT_WS });
      }
    });
  }
}

export const db = new CampaignDatabase();
