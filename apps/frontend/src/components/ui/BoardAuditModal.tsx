import { ModalButton, ModalShell } from './ModalShell';
import './BoardAuditModal.css';

type AuditValue = boolean | number | string | null | undefined;

export interface BoardAuditChange {
  added?: number;
  after?: AuditValue;
  before?: AuditValue;
  changed?: boolean;
  field: string;
  removed?: number;
  teamId?: number;
  teams?: Array<{ name: string; teamId: number }>;
}

export interface BoardAuditEvent {
  actor: { role?: string; teamId?: number; teamName?: string };
  changes: BoardAuditChange[];
  createdAt: string;
  eventType: string;
  id: string;
  target: { col?: number; row?: number; title?: string; type?: string };
}

interface BoardAuditModalProps {
  error?: string | null;
  events: BoardAuditEvent[];
  hasMore: boolean;
  loading: boolean;
  onClose: () => void;
  onLoadMore: () => void;
}

export default function BoardAuditModal({
  error,
  events,
  hasMore,
  loading,
  onClose,
  onLoadMore,
}: BoardAuditModalProps) {
  return (
    <ModalShell
      title={<h2>Board History</h2>}
      titleId="board-audit-title"
      onClose={onClose}
      maxWidth="720px"
      className="board-audit-modal"
      footer={<ModalButton onClick={onClose}>Close</ModalButton>}
    >
      <div className="board-audit-intro">
        <span className="board-audit-kicker">Event ledger</span>
        <p>Recent board activity, newest first.</p>
      </div>
      {error && <p className="board-audit-error">Could not load history: {error}</p>}
      {loading && !events.length && <p className="board-audit-status">Opening the ledger…</p>}
      {!loading && !events.length && !error && (
        <p className="board-audit-status">No recorded activity yet.</p>
      )}
      {!!events.length && (
        <ol className="board-audit-list" aria-label="Board history">
          {events.map((event) => (
            <li className="board-audit-entry" key={event.id}>
              <div className="board-audit-entry-head">
                <div>
                  <strong>{eventTitle(event)}</strong>
                  <span className="board-audit-actor">{actorLabel(event.actor)}</span>
                </div>
                <time dateTime={event.createdAt}>{formatAuditTime(event.createdAt)}</time>
              </div>
              {event.changes.length > 0 && (
                <ul className="board-audit-changes">
                  {event.changes.map((change, index) => (
                    <li key={`${event.id}-${change.field}-${change.teamId ?? index}`}>
                      {changeLabel(change)}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ol>
      )}
      {hasMore && (
        <div className="board-audit-load-more">
          <ModalButton size="small" onClick={onLoadMore} disabled={loading}>
            {loading ? 'Loading…' : 'Load older activity'}
          </ModalButton>
        </div>
      )}
    </ModalShell>
  );
}

function eventTitle(event: BoardAuditEvent): string {
  if (event.eventType === 'board.created') return 'Board created';
  if (event.eventType === 'board.settings_updated') return 'Board settings updated';
  if (event.target.type === 'tile') {
    const coordinate = `Tile ${Number(event.target.col ?? 0) + 1}, ${Number(event.target.row ?? 0) + 1}`;
    return event.target.title ? `${coordinate}: ${event.target.title}` : coordinate;
  }
  return 'Board updated';
}

function actorLabel(actor: BoardAuditEvent['actor']): string {
  if (actor.role === 'admin') return 'Admin';
  if (actor.teamName) return actor.teamName;
  if (typeof actor.teamId === 'number') return `Team ${actor.teamId + 1}`;
  return 'Board editor';
}

function changeLabel(change: BoardAuditChange): string {
  if (change.field === 'proof') return 'Proof note updated';
  if (change.field === 'proofImages') {
    const parts = [];
    if (change.added) parts.push(`${change.added} added`);
    if (change.removed) parts.push(`${change.removed} removed`);
    return `Proof images: ${parts.join(', ')}`;
  }
  if (change.field === 'teamPassword')
    return `Team ${Number(change.teamId ?? 0) + 1} password updated`;
  if (change.field === 'teamsAdded' || change.field === 'teamsRemoved') {
    const label = change.field === 'teamsAdded' ? 'Teams added' : 'Teams removed';
    return `${label}: ${(change.teams || []).map((team) => team.name || `Team ${team.teamId + 1}`).join(', ')}`;
  }

  const label = fieldLabel(change.field);
  if (change.changed) return `${label} updated`;
  if ('before' in change || 'after' in change) {
    return `${label}: ${formatValue(change.before)} → ${formatValue(change.after)}`;
  }
  return `${label} updated`;
}

function fieldLabel(field: string): string {
  const labels: Record<string, string> = {
    checked: 'Completion',
    columns: 'Columns',
    currPoints: 'Current points',
    description: 'Description',
    image: 'Tile image',
    passwordRequired: 'Team passwords required',
    points: 'Tile points',
    rowBingo: 'Row bingo bonus',
    colBingo: 'Column bingo bonus',
    rows: 'Rows',
    teamName: 'Team name',
    title: 'Title',
    visibleRows: 'Visible columns',
  };
  return labels[field] || field;
}

function formatValue(value: AuditValue): string {
  if (value === '') return '(empty)';
  if (value === null || value === undefined) return '(none)';
  if (typeof value === 'boolean') return value ? 'On' : 'Off';
  return String(value);
}

function formatAuditTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown time';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
