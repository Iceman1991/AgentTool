import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Modal } from '../ui/Modal';
import { useUIStore } from '../../stores/uiStore';
import { cn } from '../../lib/utils';
import { useEntityTypeStore } from '../../stores/entityTypeStore';
import { useEntityStore } from '../../stores/entityStore';
import { useTimelineStore } from '../../stores/timelineStore';
import { EntityTypeForm } from '../forms/EntityTypeForm';
import { EntityForm } from '../forms/EntityForm';
import { RelationshipForm } from '../forms/RelationshipForm';
import { TimelineEventForm } from '../forms/TimelineEventForm';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

function ModalRenderer() {
  const { modal, closeModal } = useUIStore();
  const { entityTypes, deleteEntityType } = useEntityTypeStore();
  const { entities, deleteEntity } = useEntityStore();
  const { events, deleteEvent } = useTimelineStore();
  const navigate = useNavigate();

  if (!modal) return null;

  switch (modal.type) {
    case 'createEntityType':
      return (
        <Modal isOpen onClose={closeModal} title="Neuer Entitäts-Typ" size="lg">
          <EntityTypeForm onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );

    case 'editEntityType': {
      const et = entityTypes.find(t => t.id === modal.payload?.entityTypeId);
      if (!et) return null;
      return (
        <Modal isOpen onClose={closeModal} title={`Typ bearbeiten: ${et.name}`} size="lg">
          <EntityTypeForm entityType={et} onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'createEntity': {
      const typeId = modal.payload?.entityTypeId as string | undefined;
      const et = entityTypes.find(t => t.id === typeId) || entityTypes[0];
      if (!et) return null;
      return (
        <Modal isOpen onClose={closeModal} title={`Neuer ${et.name}`} size="lg">
          <EntityForm entityType={et} onSave={(entity) => { closeModal(); navigate(`/entities/${entity.id}`); }} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'editEntity': {
      const entityId = modal.payload?.entityId as string | undefined;
      const entity = entities.find(e => e.id === entityId);
      const et = entityTypes.find(t => t.id === entity?.typeId);
      if (!entity || !et) return null;
      return (
        <Modal isOpen onClose={closeModal} title={`Bearbeiten: ${entity.name}`} size="lg">
          <EntityForm entityType={et} entity={entity} onSave={() => closeModal()} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'deleteConfirm': {
      const entityId = modal.payload?.entityId as string | undefined;
      const entity = entities.find(e => e.id === entityId);
      return (
        <ConfirmDialog
          isOpen
          onClose={closeModal}
          onConfirm={async () => {
            if (entityId) {
              await deleteEntity(entityId);
              closeModal();
              navigate('/');
            }
          }}
          title="Eintrag löschen"
          message={`Möchtest du "${entity?.name}" wirklich löschen? Alle Beziehungen werden ebenfalls gelöscht.`}
        />
      );
    }

    case 'addRelationship': {
      const sourceId = modal.payload?.sourceEntityId as string | undefined;
      return (
        <Modal isOpen onClose={closeModal} title="Beziehung hinzufügen" size="md">
          <RelationshipForm sourceEntityId={sourceId} onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'editRelationship': {
      return (
        <Modal isOpen onClose={closeModal} title="Beziehung bearbeiten" size="md">
          <RelationshipForm onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'createEvent':
      return (
        <Modal isOpen onClose={closeModal} title="Ereignis hinzufügen" size="lg">
          <TimelineEventForm onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );

    case 'editEvent': {
      const eventId = modal.payload?.eventId as string | undefined;
      const event = events.find(e => e.id === eventId);
      if (!event) return null;
      return (
        <Modal isOpen onClose={closeModal} title={`Bearbeiten: ${event.title}`} size="lg">
          <TimelineEventForm event={event} onSave={closeModal} onCancel={closeModal} />
        </Modal>
      );
    }

    case 'addRelationshipType':
      return (
        <Modal isOpen onClose={closeModal} title="Beziehungstyp hinzufügen" size="sm">
          <div className="text-gray-400">Beziehungstypen können in den Einstellungen verwaltet werden.</div>
        </Modal>
      );

    default:
      return null;
  }
}

export function AppShell() {
  const { mobileSidebarOpen, closeMobileSidebar } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-950">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar: hidden on mobile unless open, always visible on md+ */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-30 md:relative md:flex md:z-auto',
        'transition-transform duration-200',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
      <ModalRenderer />
    </div>
  );
}
