import { Link } from 'react-router-dom';
import './GlassKcFeature.css';

export default function GlassKcFeature() {
  return (
    <section className="home-feature glass-kc-feature" aria-labelledby="glass-feature-title">
      <h2 className="section-title" id="glass-feature-title">
        Featured: Glass KC Tracker
      </h2>
      <div className="glass-feature-layout">
        <div className="glass-feature-copy">
          <h3>Every kill leaves a little light.</h3>
          <p className="glass-feature-intro">
            Even on a dry streak, your collection grows. Turn your boss grind into animated stained
            glass, one kill at a time.
          </p>
          <dl className="glass-feature-benefits">
            <div>
              <dt>One kill. One pane.</dt>
              <dd>100 recorded kills complete a window for your sanctuary.</dd>
            </div>
            <div>
              <dt>Keep the moments that matter.</dt>
              <dd>Save rare drops, screenshots and notes inside your glass.</dd>
            </div>
            <div>
              <dt>Make the collection yours.</dt>
              <dd>Six boss collections, custom frames and new colour editions to earn.</dd>
            </div>
          </dl>
          <div className="glass-feature-actions">
            <Link className="glass-feature-launch" to="/glass-kc">
              Start your collection <span aria-hidden="true">→</span>
            </Link>
            <p>No account needed to start.</p>
          </div>
        </div>
        <figure className="glass-feature-preview">
          <Link
            to="/glass-kc"
            className="glass-feature-art-link"
            aria-label="Start a Glass KC collection like these animated stained-glass windows"
          >
            <iframe
              src={`${import.meta.env.BASE_URL}glass-kc/featured.html?v=featured-4`}
              title="Animated stained-glass collection: Shadow, Prifddinas, Olm, Zebak and Sleepwalkers"
              loading="lazy"
              tabIndex={-1}
              aria-hidden="true"
            />
          </Link>
        </figure>
      </div>
    </section>
  );
}
