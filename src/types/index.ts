export type PropertyType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'richtext' | 'boolean' | 'entity_ref';

export interface SelectOption { value: string; label: string; color?: string; }

export interface PropertyDefinition {
  id: string;
  name: string;
  key: string;
  type: PropertyType;
  required: boolean;
  options?: SelectOption[];
  entityTypeRef?: string;
  placeholder?: string;
  description?: string;
  order: number;
}

export interface EntityType {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color: string;
  icon: string;
  properties: PropertyDefinition[];
  isSystem: boolean;
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

export type PropertyValue = string | number | boolean | string[] | null;

export interface ImagePosition { x: number; y: number; }

export interface EntityFolder {
  id: string;
  typeId: string;
  name: string;
  color?: string;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface Entity {
  id: string;
  typeId: string;
  name: string;
  summary?: string;
  imageUrl?: string;
  imagePosition?: ImagePosition;
  imageLayout?: 'top' | 'side';
  imageSize?: number;
  folderId?: string;
  order?: number;
  workspaceId?: string;
  properties: Record<string, PropertyValue>;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export type RelationshipDirection = 'directed' | 'undirected';

export interface RelationshipType {
  id: string;
  label: string;
  inverseLabel?: string;
  color: string;
  direction: RelationshipDirection;
  isFamilial: boolean;
}

export interface Relationship {
  id: string;
  sourceId: string;
  targetId: string;
  typeId: string;
  label?: string;
  notes?: string;
  isFamilial: boolean;
  createdAt: number;
  updatedAt: number;
}

export type GolarionMonth = 'Abadius' | 'Calistril' | 'Pharast' | 'Gozran' | 'Desnus' | 'Sarenith' | 'Erastus' | 'Arodus' | 'Rova' | 'Lamashan' | 'Neth' | 'Kuthona';

export interface GolarionDate { day: number; month: GolarionMonth; year: number; }

export type EventCategory = 'combat' | 'social' | 'exploration' | 'downtime' | 'revelation' | 'death' | 'milestone' | 'custom';

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  date: GolarionDate;
  endDate?: GolarionDate;
  category: EventCategory;
  linkedEntityIds: string[];
  sessionNumber?: number;
  tags: string[];
  isSecret: boolean;
  createdAt: number;
  updatedAt: number;
}

export type Theme = 'light' | 'dark' | 'system';
export type EntityViewMode = 'grid' | 'table' | 'graph';

export interface ModalConfig {
  type: 'createEntityType' | 'editEntityType' | 'createEntity' | 'editEntity' | 'deleteConfirm' | 'addRelationship' | 'createEvent' | 'editEvent' | 'editRelationship' | 'addRelationshipType' | 'editRelationshipType';
  payload?: Record<string, unknown>;
}

// ── Note Pages ────────────────────────────────────────────────────────────

export type BlockType = 'text' | 'drawing' | 'image' | 'heading' | 'divider' | 'columns';

export interface PageBlock {
  id: string;
  type: BlockType;
  content: string; // richtext HTML for 'text'/'heading', base64 dataURL for 'drawing'/'image', empty for 'divider'
  order: number;
}

export interface NotePage {
  id: string;
  title: string;
  icon: string;          // emoji or Lucide icon name
  parentId?: string;     // null/undefined = root level
  order: number;         // sort order among siblings
  blocks: PageBlock[];
  tags: string[];
  linkedEntityIds: string[]; // optional entity links
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FamilyTree {
  id: string;
  name: string;
  description?: string;
  rootEntityId?: string;    // optional starting entity
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Timeline {
  id: string;
  name: string;
  description?: string;
  filterEntityIds: string[];  // if non-empty, only show events linked to these entities
  filterTags: string[];       // if non-empty, only show events with these tags
  color: string;              // accent color for this timeline
  workspaceId?: string;
  createdAt: number;
  updatedAt: number;
}
