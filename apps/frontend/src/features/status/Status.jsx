import { useState, useEffect, useCallback } from 'react';
import './Status.css';
import { fetchGet } from '../../utils/utils';

const POLL_INTERVAL = 30000;

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function StatusBadge({ status }) {
  const map = {
    ok: { label: 'healthy', cls: 'badge-ok' },
    degraded: { label: 'degraded', cls: 'badge-warn' },
    error: { label: 'error', cls: 'badge-err' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-warn' };
  return <span className={`status-badge ${cls}`}>{label}</span>;
}

function Dot({ status }) {
  const cls = status === 'ok' ? 'dot-ok' : status === 'error' ? 'dot-err' : 'dot-warn';
  return <span className={`status-dot ${cls}`} />;
}

function ServiceRow({ name, detail, latency, status }) {
  return (
    <div className="service-row">
      <Dot status={status} />
      <div className="service-info">
        <span className="service-name">{name}</span>
        <span className="service-detail">{detail}</span>
      </div>
      <span className="service-latency">{latency != null ? `${latency} ms` : '—'}</span>
      <StatusBadge status={status} />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card osrs-glass">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function Status() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [countdown, setCountdown] = useState(POLL_INTERVAL / 1000);

  const fetchHealth = useCallback(async () => {
    try {
      const [json, err] = await fetchGet('health', { allowErrorData: true });
      if (!json) throw err;
      setData(json);
      setError(null);
    } catch {
      setError('Could not reach the API.');
    } finally {
      setLoading(false);
      setLastChecked(new Date());
      setCountdown(POLL_INTERVAL / 1000);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const poll = setInterval(fetchHealth, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchHealth]);

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastChecked]);

  const overallOk = data?.status === 'ok';
  const rqStatus = data?.rq?.workers === 0 ? 'degraded' : (data?.rq?.status ?? 'ok');

  return (
    <div className="status-page">
      <div className="status-container">
        <div className="status-header osrs-glass-raised">
          <div className="status-header-left">
            <h1 className="osrs-header status-title">System Status</h1>
            <p className="status-subtitle">praynr.com</p>
          </div>
          <div className="status-header-right">
            {loading ? (
              <span className="overall-badge badge-loading">checking…</span>
            ) : error ? (
              <span className="overall-badge badge-err">⚠ API unreachable</span>
            ) : (
              <span className={`overall-badge ${overallOk ? 'badge-ok' : 'badge-warn'}`}>
                <span className={`overall-dot ${overallOk ? 'dot-ok' : 'dot-warn'}`} />
                {overallOk ? 'All systems operational' : 'Degraded'}
              </span>
            )}
          </div>
        </div>

        {lastChecked && (
          <p className="status-ts">
            Last checked {lastChecked.toLocaleTimeString()} · refreshing in {countdown}s
            <button className="refresh-btn" onClick={fetchHealth}>
              ↻ Refresh
            </button>
          </p>
        )}

        {error && <div className="status-error-banner">{error}</div>}

        <section className="status-section">
          <h2 className="status-section-label">Services</h2>
          <div className="services-card osrs-glass">
            {loading ? (
              <>
                <div className="service-row skeleton" />
                <div className="service-row skeleton" />
                <div className="service-row skeleton" />
                <div className="service-row skeleton" />
              </>
            ) : data ? (
              <>
                <ServiceRow
                  name="MongoDB"
                  detail={
                    data.mongo.status === 'ok'
                      ? `ping ok · ${data.mongo.boards_count ?? '?'} boards`
                      : (data.mongo.error ?? 'unreachable')
                  }
                  latency={data.mongo.latency_ms}
                  status={data.mongo.status}
                />
                <ServiceRow
                  name="Redis"
                  detail={
                    data.redis.status === 'ok'
                      ? 'PING → PONG · pub/sub active'
                      : (data.redis.error ?? 'unreachable')
                  }
                  latency={data.redis.latency_ms}
                  status={data.redis.status}
                />
                <ServiceRow
                  name="RQ worker"
                  detail={
                    data.rq.status === 'error'
                      ? (data.rq.error ?? 'unavailable')
                      : `${data.rq.workers} worker${data.rq.workers !== 1 ? 's' : ''} online · ${data.rq.failed} failed`
                  }
                  latency={null}
                  status={rqStatus}
                />
                <ServiceRow
                  name="RQ queue"
                  detail={
                    data.rq.status === 'error'
                      ? '—'
                      : `${data.rq.queued} queued · ${data.rq.started} running`
                  }
                  latency={null}
                  status={data.rq.queued > 5 ? 'degraded' : 'ok'}
                />
              </>
            ) : null}
          </div>
        </section>

        <section className="status-section">
          <h2 className="status-section-label">Application</h2>
          <div className="stat-grid">
            <StatCard
              label="Uptime"
              value={data ? formatUptime(data.uptime_seconds) : null}
              sub="since last restart"
            />
            <StatCard
              label="Boards in DB"
              value={data?.mongo?.boards_count ?? null}
              sub="active (non-expired)"
            />
            <StatCard
              label="RQ workers"
              value={data ? String(data.rq?.workers ?? '?') : null}
              sub={data?.rq?.failed > 0 ? `${data.rq.failed} failed jobs` : 'no failed jobs'}
            />
            <StatCard label="Rate limiting" value="Redis" sub="flask-limiter backend" />
          </div>
        </section>

        <section className="status-section">
          <h2 className="status-section-label">Endpoint</h2>
          <div className="endpoint-card osrs-glass">
            <p className="endpoint-label">
              Raw JSON from <code className="endpoint-url">GET /health</code>
            </p>
            <pre className="json-block">
              {data ? JSON.stringify(data, null, 2) : loading ? 'Loading…' : error}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
}
