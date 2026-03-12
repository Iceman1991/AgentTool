import { supabase, getUserId } from './lib/supabase';
import { uid, generateKey } from './lib/utils';
import type { EntityType, RelationshipType, PropertyDefinition } from './types';

let seedCalled = false;

function makeProp(name: string, type: PropertyDefinition['type'], order: number, extras?: Partial<PropertyDefinition>): PropertyDefinition {
  return { id: uid(), name, key: generateKey(name), type, required: false, order, ...extras };
}

export async function seedDatabase(): Promise<void> {
  if (seedCalled) return;
  seedCalled = true;

  const userId = getUserId();
  const { count } = await supabase.from('entity_types').select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if (count && count > 0) return;

  const now = Date.now();
  const wsId = 'default-workspace';

  const entityTypes: EntityType[] = [
    { id: uid(), name: 'NPC', slug: 'npc', description: 'Nicht-Spieler-Charaktere der Kampagne', color: '#7C3AED', icon: 'User', isSystem: true, workspaceId: wsId, createdAt: now, updatedAt: now, properties: [makeProp('Rasse', 'text', 0), makeProp('Klasse', 'text', 1), makeProp('Alter', 'number', 2), makeProp('Beruf', 'text', 3), makeProp('Gesinnung', 'select', 4, { options: [{value:'LG',label:'LG - Rechtschaffen Gut'},{value:'NG',label:'NG - Neutral Gut'},{value:'CG',label:'CG - Chaotisch Gut'},{value:'LN',label:'LN - Rechtschaffen Neutral'},{value:'N',label:'N - Neutral'},{value:'CN',label:'CN - Chaotisch Neutral'},{value:'LE',label:'LE - Rechtschaffen Böse'},{value:'NE',label:'NE - Neutral Böse'},{value:'CE',label:'CE - Chaotisch Böse'}] }), makeProp('Ort', 'text', 5), makeProp('Notizen', 'richtext', 6)] },
    { id: uid(), name: 'Stadt', slug: 'stadt', description: 'Städte und Ortschaften der Kampagnenwelt', color: '#0891B2', icon: 'Building2', isSystem: true, workspaceId: wsId, createdAt: now, updatedAt: now, properties: [makeProp('Einwohnerzahl', 'number', 0), makeProp('Land', 'text', 1), makeProp('Regierungsform', 'text', 2), makeProp('Beschreibung', 'richtext', 3)] },
    { id: uid(), name: 'Fraktion', slug: 'fraktion', description: 'Gilden, Organisationen und Fraktionen', color: '#DC2626', icon: 'Flag', isSystem: true, workspaceId: wsId, createdAt: now, updatedAt: now, properties: [makeProp('Motto', 'text', 0), makeProp('Ziel', 'text', 1), makeProp('Anführer', 'entity_ref', 2, { entityTypeRef: 'npc' }), makeProp('Beschreibung', 'richtext', 3)] },
    { id: uid(), name: 'Ort', slug: 'ort', description: 'Dungeons, Ruinen, Tempel und andere wichtige Orte', color: '#059669', icon: 'MapPin', isSystem: true, workspaceId: wsId, createdAt: now, updatedAt: now, properties: [makeProp('Typ', 'select', 0, { options: [{value:'Dungeon',label:'Dungeon'},{value:'Wildnis',label:'Wildnis'},{value:'Stadt',label:'Stadt'},{value:'Tempel',label:'Tempel'},{value:'Ruine',label:'Ruine'}] }), makeProp('Region', 'text', 1), makeProp('Beschreibung', 'richtext', 2)] },
    { id: uid(), name: 'Gegenstand', slug: 'gegenstand', description: 'Wichtige Gegenstände, Artefakte und magische Items', color: '#D97706', icon: 'Package', isSystem: true, workspaceId: wsId, createdAt: now, updatedAt: now, properties: [makeProp('Seltenheit', 'select', 0, { options: [{value:'Gewöhnlich',label:'Gewöhnlich',color:'#6B7280'},{value:'Ungewöhnlich',label:'Ungewöhnlich',color:'#059669'},{value:'Selten',label:'Selten',color:'#2563EB'},{value:'Einzigartig',label:'Einzigartig',color:'#D97706'}] }), makeProp('Wert', 'text', 1), makeProp('Beschreibung', 'richtext', 2)] },
  ];

  const relationshipTypes: RelationshipType[] = [
    { id: uid(), label: 'Verbündet', color: '#059669', direction: 'undirected', isFamilial: false },
    { id: uid(), label: 'Feind', color: '#DC2626', direction: 'undirected', isFamilial: false },
    { id: uid(), label: 'Elternteil von', inverseLabel: 'Kind von', color: '#2563EB', direction: 'directed', isFamilial: true },
    { id: uid(), label: 'Mitglied von', color: '#7C3AED', direction: 'directed', isFamilial: false },
    { id: uid(), label: 'Verheiratet mit', color: '#DB2777', direction: 'undirected', isFamilial: true },
    { id: uid(), label: 'Regiert', color: '#D97706', direction: 'directed', isFamilial: false },
  ];

  await Promise.all([
    supabase.from('entity_types').insert(entityTypes.map(et => ({ ...et, user_id: userId }))),
    supabase.from('relationship_types').insert(relationshipTypes.map(rt => ({ ...rt, user_id: userId }))),
  ]);

  console.log('[Campaign Manager] Database seeded with default data');
}
