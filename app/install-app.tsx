'use client';
import { useEffect, useRef, useState } from 'react';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallApp() {
  const promptRef = useRef<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(true);
  const [canPrompt, setCanPrompt] = useState(false);
  const [help, setHelp] = useState(false);
  const [ios, setIos] = useState(false);
  useEffect(() => {
    const standalone = matchMedia('(display-mode: standalone)');
    const check = () => setInstalled(standalone.matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    check();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const onPrompt = (event: Event) => { event.preventDefault(); promptRef.current = event as InstallPrompt; setCanPrompt(true); };
    const onInstalled = () => { setInstalled(true); setHelp(false); promptRef.current = null; };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    standalone.addEventListener('change', check);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      standalone.removeEventListener('change', check);
    };
  }, []);
  async function install() {
    const event = promptRef.current;
    if (!event) { setHelp(open => !open); return; }
    try {
      await event.prompt();
      if ((await event.userChoice).outcome === 'accepted') setHelp(false);
    } catch { setHelp(true); } finally { promptRef.current = null; setCanPrompt(false); }
  }
  if (installed) return null;
  return <aside className="install-app" aria-label="Install Laro FC">
    <button className="secondary-button" onClick={install} aria-expanded={help}>{canPrompt ? 'Install Laro FC' : 'Add Laro FC to your home screen'}</button>
    {help && <div className="install-help"><strong>Install Laro FC</strong>
      <p>{ios ? 'Open this page in Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if shown, then tap Add.' : 'Open your browser’s menu and choose Install app or Add to Home screen. On a computer, look for the install icon in the address bar.'}</p>
      <p>Internet is needed to play and save your career.</p>
      <button onClick={() => setHelp(false)}>Got it</button></div>}
  </aside>;
}
