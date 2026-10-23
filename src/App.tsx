import { useState } from 'react';
import { Battlefield } from './screens/Battlefield';
import { Information } from './screens/Information';
import { ShipArt } from './components/ShipArt';
import './App.css';

type Screen = 'menu' | 'game' | 'instructions' | 'history';
const navigation: { id: Screen; label: string }[] = [
  { id: 'menu', label: 'Main Menu' },
  { id: 'game', label: 'Game' },
  { id: 'instructions', label: 'How to Play' },
  { id: 'history', label: 'Historical Background' },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  function navigate(next: Screen) {
    setScreen(next);
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      <button className="brand" aria-label="Revolutionary Naval War — Main Menu" onClick={() => navigate('menu')}>
        <svg className="brand-symbol" viewBox="0 0 40 48" fill="none" aria-hidden="true"><circle cx="20" cy="7" r="4" /><path d="M20 11v30M11 19h18M5 28c0 17 30 17 30 0M2 31l3-4 5 3M30 30l5-3 3 4" /></svg>
        <span>REVOLUTIONARY<br /><b>NAVAL WAR</b></span>
      </button>
      <nav aria-label="Main navigation">{navigation.map(item => <button key={item.id} aria-current={screen === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.label}</button>)}</nav>
      <span className="edition">A STRATEGY GAME IN DEVELOPMENT</span>
    </header>
    <main id="main-content" tabIndex={-1}>
      {screen === 'menu' ? <section className="hero">
        <div className="hero-chart" aria-hidden="true"><div className="chart-rings" /><span className="chart-word">THE NORTH ATLANTIC</span><ShipArt /><span className="chart-coordinate">ORIGINAL ILLUSTRATION · PROVISIONAL CHART</span></div>
        <div className="hero-copy">
          <p className="eyebrow">A MARITIME STRATEGY EXPERIENCE</p>
          <h1>Revolutionary<br />Naval <em>War</em></h1>
          <p className="subtitle">The Battle for the Atlantic, 1775–1783.</p>
          <div className="gold-rule" />
          <p className="description">Take command of a provisional fleet. Navigate the chart, issue orders, and test your strategy against a British AI opponent.</p>
          <div className="menu-actions">
            <button className="primary" onClick={() => navigate('game')}>Play Game <span aria-hidden="true">→</span></button>
            <button className="secondary" onClick={() => navigate('instructions')}>How to Play</button>
            <button className="text-button" onClick={() => navigate('history')}>Historical Background <span aria-hidden="true">↗</span></button>
          </div>
          <p className="prototype-note"><span className="status-dot" /> PLAYABLE PROTOTYPE <span className="note-divider">/</span> RESEARCH IN PROGRESS</p>
        </div>
        <div className="hero-bottom"><span>01 / THE WAR AT SEA</span><p>[Historical background to be added]</p><span>1775 — 1783</span></div>
      </section> : screen === 'game' ? null : <Information kind={screen} onPlay={() => setScreen('game')} />}
      <div hidden={screen !== 'game'}><Battlefield /></div>
    </main>
    <footer className="site-footer"><span>REVOLUTIONARY NAVAL WAR</span><span>Issa Mansour - Hist 238 Final</span><span>Playable prototype · Research in progress</span></footer>
  </div>;
}
