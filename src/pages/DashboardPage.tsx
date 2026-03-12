import { useNavigate } from 'react-router-dom';
import { Plus, Network, Clock, Settings, Circle, BookOpen, Link2, ScrollText, Zap } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ForwardRefExoticComponent, RefAttributes } from 'react';
import { useEntityTypeStore } from '../stores/entityTypeStore';
import { useEntityStore } from '../stores/entityStore';
import { useTimelineStore } from '../stores/timelineStore';
import { useRelationshipStore } from '../stores/relationshipStore';
import { useNotePageStore } from '../stores/notePageStore';
import { useUIStore } from '../stores/uiStore';
import { formatGolarionDate } from '../lib/utils';

type LucideIconComponent = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;

function EntityTypeIcon({ name, size = 16 }: { name: string; size?: number }) {
  const Icon = (LucideIcons as unknown as Record<string, LucideIconComponent>)[name];
  return Icon ? <Icon size={size} /> : <Circle size={size} />;
}

function StatCard({
  value, label, icon, color,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #141419 0%, #1c1c23 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow blob */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        backgroundColor: color, opacity: 0.08, filter: 'blur(20px)',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: color + '22', color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '28px', fontWeight: 700, lineHeight: 1, color, fontVariantNumeric: 'tabular-nums' }}>
          {value}
        </div>
        <div style={{ fontSize: '12px', color: '#8A8070', marginTop: '3px' }}>{label}</div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const entityTypes = useEntityTypeStore(s => s.entityTypes);
  const entities = useEntityStore(s => s.entities);
  const { getSortedEvents } = useTimelineStore();
  const { relationships } = useRelationshipStore();
  const notePages = useNotePageStore(s => s.notePages);
  const openModal = useUIStore(s => s.openModal);

  const sortedEvents = getSortedEvents();
  const recentEntities = [...entities].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const recentEvents = sortedEvents.slice(-5).reverse();
  const typeMap = new Map(entityTypes.map(et => [et.id, et]));

  // Entities per type for bar chart
  const typeStats = entityTypes
    .map(et => ({ et, count: entities.filter(e => e.typeId === et.id).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...typeStats.map(x => x.count), 1);

  return (
    <div style={{ padding: 'clamp(16px, 4vw, 32px)', maxWidth: '1100px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 'clamp(20px, 3vw, 32px)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '28px', fontWeight: 700, color: '#EDE8DC', margin: 0, lineHeight: 1.1 }}>
            Campaign Manager
          </h1>
          <p style={{ color: '#8A8070', fontSize: '14px', marginTop: '6px' }}>
            Überblick deiner Kampagnenwelt
          </p>
        </div>
        {sortedEvents.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 14px', borderRadius: '10px',
            backgroundColor: 'rgba(196,154,74,0.1)', border: '1px solid rgba(196,154,74,0.2)',
          }}>
            <Zap size={13} style={{ color: '#C49A4A' }} />
            <span style={{ fontSize: '12px', color: '#C49A4A', fontWeight: 500 }}>
              Letztes Ereignis: {recentEvents[0]?.title}
            </span>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <StatCard value={entities.length} label="Entitäten" icon={<Circle size={20} />} color="#C49A4A" />
        <StatCard value={relationships.length} label="Beziehungen" icon={<Link2 size={20} />} color="#7C9FD4" />
        <StatCard value={sortedEvents.length} label="Ereignisse" icon={<Clock size={20} />} color="#7DC47B" />
        <StatCard value={notePages.length} label="Notizseiten" icon={<BookOpen size={20} />} color="#C47D9F" />
      </div>

      {/* Entity type bar chart */}
      {typeStats.length > 0 && (
        <div style={{
          backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '16px', fontWeight: 600, color: '#EDE8DC', margin: 0 }}>
              Entitäten nach Typ
            </h2>
            <span style={{ fontSize: '12px', color: '#4A4438' }}>{entities.length} gesamt</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {typeStats.map(({ et, count }) => (
              <div
                key={et.id}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => navigate(`/type/${et.slug}`)}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: et.color + '22', color: et.color,
                }}>
                  <EntityTypeIcon name={et.icon} size={13} />
                </div>
                <div style={{ width: 'clamp(64px, 18vw, 100px)', flexShrink: 0, fontSize: '13px', color: '#8A8070', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {et.name}
                </div>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#1c1c23', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: '999px',
                    width: `${(count / maxCount) * 100}%`,
                    backgroundColor: et.color,
                    opacity: 0.8,
                    transition: 'width 600ms ease',
                  }} />
                </div>
                <div style={{ width: '28px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: et.color, flexShrink: 0 }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two-column: recent entities + recent events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>

        {/* Recent entities */}
        <div style={{
          backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '16px', fontWeight: 600, color: '#EDE8DC', margin: 0 }}>
              Zuletzt hinzugefügt
            </h2>
            <button
              onClick={() => navigate('/graph')}
              style={{ fontSize: '12px', color: '#8A8070', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EDE8DC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8A8070'; }}
            >
              Alle →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentEntities.map(entity => {
              const et = typeMap.get(entity.typeId);
              return (
                <div
                  key={entity.id}
                  onClick={() => navigate(`/entities/${entity.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                    backgroundColor: 'transparent', border: '1px solid transparent',
                    transition: 'background-color 120ms, border-color 120ms',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor = '#1c1c23';
                    el.style.borderColor = 'rgba(255,255,255,0.06)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.backgroundColor = 'transparent';
                    el.style.borderColor = 'transparent';
                  }}
                >
                  {et && (
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: et.color + '22', color: et.color,
                    }}>
                      <EntityTypeIcon name={et.icon} size={14} />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDE8DC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entity.name}
                    </div>
                    {et && <div style={{ fontSize: '11px', color: '#4A4438', marginTop: '1px' }}>{et.name}</div>}
                  </div>
                  {entity.tags.length > 0 && (
                    <div style={{
                      fontSize: '10px', padding: '2px 7px', borderRadius: '999px',
                      backgroundColor: 'rgba(196,154,74,0.1)', color: '#C49A4A', flexShrink: 0,
                    }}>
                      {entity.tags[0]}
                    </div>
                  )}
                </div>
              );
            })}
            {recentEntities.length === 0 && (
              <p style={{ fontSize: '13px', color: '#4A4438', textAlign: 'center', padding: '24px 0' }}>
                Noch keine Entitäten vorhanden
              </p>
            )}
          </div>
        </div>

        {/* Recent timeline events */}
        <div style={{
          backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '16px', padding: '24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '16px', fontWeight: 600, color: '#EDE8DC', margin: 0 }}>
              Letzte Ereignisse
            </h2>
            <button
              onClick={() => navigate('/timeline')}
              style={{ fontSize: '12px', color: '#8A8070', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#EDE8DC'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#8A8070'; }}
            >
              Alle →
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentEvents.map((event, i) => (
              <div
                key={event.id}
                onClick={() => navigate('/timeline')}
                style={{ display: 'flex', gap: '12px', cursor: 'pointer', paddingBottom: i < recentEvents.length - 1 ? '0' : '0' }}
              >
                {/* Timeline line + dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '20px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', marginTop: '14px', flexShrink: 0,
                    backgroundColor: '#C49A4A', boxShadow: '0 0 6px rgba(196,154,74,0.5)',
                  }} />
                  {i < recentEvents.length - 1 && (
                    <div style={{ flex: 1, width: '1px', backgroundColor: 'rgba(255,255,255,0.06)', minHeight: '20px', marginTop: '4px' }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, padding: '10px 0', paddingBottom: i < recentEvents.length - 1 ? '10px' : '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '10px', color: '#4A4438', fontFamily: 'monospace' }}>
                      {formatGolarionDate(event.date)}
                    </span>
                    {event.sessionNumber && (
                      <span style={{
                        fontSize: '10px', padding: '1px 6px', borderRadius: '999px',
                        backgroundColor: 'rgba(196,154,74,0.1)', color: '#C49A4A',
                      }}>
                        S{event.sessionNumber}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#EDE8DC' }}>{event.title}</div>
                  {event.description && (
                    <div style={{
                      fontSize: '11px', color: '#8A8070', marginTop: '2px',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {event.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {recentEvents.length === 0 && (
              <p style={{ fontSize: '13px', color: '#4A4438', textAlign: 'center', padding: '24px 0' }}>
                Noch keine Ereignisse vorhanden
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div style={{
        backgroundColor: '#141419', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '16px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '12px', color: '#4A4438', marginRight: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Schnellaktionen
        </span>
        {[
          {
            label: 'Neuer Typ',
            icon: <Plus size={13} />,
            accent: true,
            onClick: () => openModal({ type: 'createEntityType' }),
          },
          ...(entityTypes[0] ? [{
            label: `${entityTypes[0].name} erstellen`,
            icon: <Plus size={13} />,
            accent: false,
            onClick: () => openModal({ type: 'createEntity', payload: { entityTypeId: entityTypes[0].id } }),
          }] : []),
          {
            label: 'Ereignis hinzufügen',
            icon: <Clock size={13} />,
            accent: false,
            onClick: () => openModal({ type: 'createEvent' }),
          },
          {
            label: 'Graph',
            icon: <Network size={13} />,
            accent: false,
            onClick: () => navigate('/graph'),
          },
          {
            label: 'Notizseite',
            icon: <ScrollText size={13} />,
            accent: false,
            onClick: () => navigate('/pages'),
          },
          {
            label: 'Einstellungen',
            icon: <Settings size={13} />,
            accent: false,
            onClick: () => navigate('/settings'),
          },
        ].map((action, i) => (
          <button
            key={i}
            onClick={action.onClick}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', border: 'none', transition: 'background-color 120ms, color 120ms',
              backgroundColor: action.accent ? '#C49A4A' : '#1c1c23',
              color: action.accent ? '#fff' : '#8A8070',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = action.accent ? '#D4AA5A' : '#222228';
              el.style.color = action.accent ? '#fff' : '#EDE8DC';
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLButtonElement;
              el.style.backgroundColor = action.accent ? '#C49A4A' : '#1c1c23';
              el.style.color = action.accent ? '#fff' : '#8A8070';
            }}
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

    </div>
  );
}
