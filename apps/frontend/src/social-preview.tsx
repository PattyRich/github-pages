// Development-only artwork source. Reuses the production tiles, theme and KC Trackers renderers.
import type { CSSProperties } from 'react';
import ReactDOM from 'react-dom/client';
import BoardTile from './features/bingo/BoardTile';
import './index.css';
import './features/bingo/BoardView.css';
import './social-preview.css';

declare const GLASS_BOSSES: Record<string, unknown>;
declare const GLASS_RENDERERS: Record<
  string,
  (
    config: unknown,
    context: {
      esc: (value: string) => string;
      getJournal: () => { base: number; dropTiles: object };
    }
  ) => {
    art: (
      count: number,
      scene: number,
      uid: string,
      celebrate: boolean,
      appearance: { shape: string; frame: string }
    ) => string;
  }
>;

const htmlEscapes: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function windowArtwork(boss: string, scene: number, frame: string) {
  return GLASS_RENDERERS[boss](GLASS_BOSSES[boss], {
    esc: (value) => String(value).replace(/[&<>"']/g, (character) => htmlEscapes[character]),
    getJournal: () => ({ base: 0, dropTiles: {} }),
  }).art(100, scene, `social-preview-${boss}`, false, { shape: 'lancet', frame });
}

const images = import.meta.glob<string>('./assets/*.png', { eager: true, import: 'default' });
const tiles = [
  ['Twisted bow', 'Twisted bow', 1, 0],
  ['Dragon claws', 'Dragon claws', 1, 1],
  ['Crystal seed', 'Enhanced crystal weapon seed', 3, 3],
  ['Armadyl hilt', 'Armadyl hilt', 1, 0],
  ['Zulrah fangs', 'Tanzanite fang', 6, 6],
  ['Ancestral', 'Ancestral hat', 1, 0],
  ['Bandos top', 'Bandos chestplate', 1, 1],
  ['1 ToA unique', "Tumeken's shadow", 1, 0],
  ['Masori body', 'Masori body', 1, 0],
  ['Nex unique', 'Nihil horn', 1, 1],
  ['1 ToB unique', 'Scythe of vitur (uncharged)', 1, 0],
  ['Olmlet', 'Olmlet', 1, 0],
  ['Lightbearer', 'Lightbearer', 3, 3],
  ['Visage', 'Draconic visage', 1, 0],
  ['Any GWD hilt', 'Saradomin hilt', 4, 2],
  ['1 PNM orb', 'Harmonised orb', 1, 0],
  ['Elysian sigil', 'Elysian sigil', 1, 1],
  ['Torva helm', 'Torva full helm (damaged)', 1, 0],
  ['Vambraces', 'Zaryte vambraces', 1, 0],
  ['B. tassets', 'Bandos tassets', 1, 1],
  ['Vorki', 'Vorki', 1, 0],
  ['Elder maul', 'Elder maul', 1, 1],
  ['Ghrazi rapier', 'Ghrazi rapier', 1, 0],
  ['PNM pet', 'Little nightmare', 1, 0],
  ['Zammy spear', 'Zamorakian spear', 1, 1],
] as const;

function PreviewBoard({ size = 90 }: { size?: number }) {
  return (
    <div
      className="social-preview-board"
      style={{ '--preview-tile-size': `${size}px` } as CSSProperties}
    >
      {tiles.map(([title, image, points, progress], index) => (
        <BoardTile
          key={title}
          dem={size}
          cord={[Math.floor(index / 5), index % 5]}
          privilege="general"
          info={{
            title,
            points,
            image: { url: images[`./assets/${image}.png`], opacity: 100, usePixel: true },
          }}
          teamInfo={{ checked: progress === points, currPoints: progress }}
        />
      ))}
    </div>
  );
}

function PreviewWindows() {
  return (
    <div className="social-preview-windows">
      <div className="social-preview-light social-preview-light--gold" />
      <div className="social-preview-light social-preview-light--mint" />
      <div
        className="social-preview-window"
        dangerouslySetInnerHTML={{ __html: windowArtwork('toa', 0, 'gilded') }}
      />
      <div
        className="social-preview-window"
        dangerouslySetInnerHTML={{ __html: windowArtwork('cg', 2, 'ivory') }}
      />
    </div>
  );
}

function DefaultPreview() {
  return (
    <main className="social-preview" data-preview-feature="all">
      <header className="social-preview-heading">
        <h1>Praynr</h1>
        <p>OSRS community tools</p>
      </header>
      <div className="social-preview-features">
        <section className="social-preview-bingo" aria-labelledby="preview-bingo-title">
          <PreviewBoard />
          <h2 id="preview-bingo-title">OSRS Bingo</h2>
        </section>
        <section className="social-preview-glass" aria-labelledby="preview-glass-title">
          <PreviewWindows />
          <h2 id="preview-glass-title">KC Trackers</h2>
        </section>
      </div>
    </main>
  );
}

function FeaturePreview({ feature }: { feature: 'kc-trackers' | 'bingo' }) {
  const isTracker = feature === 'kc-trackers';
  return (
    <main
      className={`social-preview social-preview--feature social-preview--${feature}`}
      data-preview-feature={feature}
    >
      <header className="social-preview-copy">
        <p className="social-preview-kicker">OSRS community tools</p>
        <h1>{isTracker ? 'KC Trackers' : 'OSRS Bingo'}</h1>
        <p className="social-preview-tagline">
          {isTracker ? (
            <>
              A record of
              <br />
              showing up.
            </>
          ) : (
            <>
              Build a board.
              <br />
              Rally your clan.
            </>
          )}
        </p>
        <p className="social-preview-purpose">
          {isTracker
            ? 'Track boss kills, save drop memories, and complete your collection.'
            : 'Custom tiles, team progress, and every drop worth chasing.'}
        </p>
        <p className="social-preview-brand">Praynr</p>
      </header>
      <div className="social-preview-feature-art">
        {isTracker ? <PreviewWindows /> : <PreviewBoard size={100} />}
      </div>
    </main>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Social preview root missing');
const feature = new URLSearchParams(window.location.search).get('feature');

ReactDOM.createRoot(rootElement).render(
  feature === 'kc-trackers' || feature === 'bingo' ? (
    <FeaturePreview feature={feature} />
  ) : (
    <DefaultPreview />
  )
);
