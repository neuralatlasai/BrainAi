import { useEffect, useRef, useState } from 'react';
import {
  ArrowClockwise,
  ArrowUpRight,
  Check,
  List,
  Globe,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import type { FormEvent, KeyboardEvent, MouseEvent } from 'react';

export type ExperienceState = 'idle' | 'input' | 'processing' | 'ready' | 'error';

/** Connect a real service here before introducing processing or answer states. */
export interface ExperienceAdapter {
  submit(question: string, signal: AbortSignal): Promise<{ answer: string }>;
}

export type RenderingQuality = 'auto' | 'high' | 'low';

export interface InterfaceProps {
  chapter: number;
  progress: number;
  reducedMotion: boolean;
  quality: RenderingQuality;
  onQualityChange: (quality: RenderingQuality) => void;
  onNavigate: (chapter: number) => void;
  rendererStatus: 'loading' | 'ready' | 'fallback';
  onRetry: () => void;
}

const chapters = ['Form', 'Space', 'Surface', 'Stillness'] as const;
const draftKey = 'brainai.query.draft';
type Panel = 'query' | 'menu' | 'about' | null;

function readDraft(): string {
  try {
    return sessionStorage.getItem(draftKey) ?? '';
  } catch {
    return '';
  }
}

function RibbonMark({ variant = 'header' }: { variant?: string }) {
  return (
    <svg className="ribbon-mark" viewBox="0 0 48 64" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${variant}-mark-stone`} x1="9" y1="22" x2="34" y2="52" gradientUnits="userSpaceOnUse">
          <stop stopColor="#b0aea6" />
          <stop offset=".48" stopColor="#716f68" />
          <stop offset="1" stopColor="#c4beb2" />
        </linearGradient>
        <linearGradient id={`${variant}-mark-pearl`} x1="36" y1="13" x2="19" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#666a69" />
          <stop offset=".48" stopColor="#b4b8b6" />
          <stop offset="1" stopColor="#8a8172" />
        </linearGradient>
      </defs>
      <path d="M24 3C24 19 7 21 6 35C5 46 12 54 22 59C10 45 23 36 24 3Z" fill={`url(#${variant}-mark-stone)`} />
      <path d="M24 3C25 18 42 21 42 35C42 47 35 54 26 59C38 43 25 35 24 3Z" fill={`url(#${variant}-mark-pearl)`} />
      <path d="M24 18C25 36 13 41 18 52C19 55 21 57 24 60C27 57 30 53 30 49C30 40 23 36 24 18Z" fill="#a89c87" fillOpacity=".56" />
    </svg>
  );
}

export function Interface({
  chapter,
  progress,
  reducedMotion,
  quality,
  onQualityChange,
  onNavigate,
  rendererStatus,
  onRetry,
}: InterfaceProps) {
  const currentChapter = Math.max(0, Math.min(chapters.length - 1, chapter));
  const [panel, setPanel] = useState<Panel>(null);
  const [draft, setDraft] = useState(readDraft);
  const [attempted, setAttempted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const experienceState: ExperienceState = attempted ? 'error' : 'input';

  useEffect(() => {
    try {
      if (draft) sessionStorage.setItem(draftKey, draft);
      else sessionStorage.removeItem(draftKey);
    } catch {
      // In private or restricted sessions, the draft still lives in component state.
    }
  }, [draft]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (panel) {
      if (!dialog.open) dialog.showModal();
      dialog.querySelector<HTMLElement>('[data-initial-focus]')?.focus();
    } else if (dialog.open) {
      dialog.close();
      const target = returnFocusRef.current?.isConnected ? returnFocusRef.current : homeRef.current;
      target?.focus({ preventScroll: true });
    }
  }, [panel]);

  function openPanel(nextPanel: Exclude<Panel, null>, event: MouseEvent<HTMLButtonElement>) {
    returnFocusRef.current = event.currentTarget;
    setPanel(nextPanel);
  }

  function navigate(index: number) {
    onNavigate(index);
    setPanel(null);
  }

  function submitQuery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.trim()) setAttempted(true);
  }

  function trapDialogFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;

    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, a[href], [tabindex]',
    )).filter((element) => (
      element.tabIndex >= 0
      && !element.matches(':disabled')
      && !element.closest('[hidden], [inert]')
      && element.getClientRects().length > 0
      && getComputedStyle(element).visibility !== 'hidden'
    )).sort((a, b) => {
      // Positive tab indices precede the natural document order, if added later.
      const aOrder = a.tabIndex > 0 ? a.tabIndex : Infinity;
      const bOrder = b.tabIndex > 0 ? b.tabIndex : Infinity;
      return aOrder === bOrder ? 0 : aOrder - bOrder;
    });

    event.preventDefault();
    if (!controls.length) return;

    const currentIndex = controls.indexOf(document.activeElement as HTMLElement);
    const nextIndex = currentIndex < 0
      ? (event.shiftKey ? controls.length - 1 : 0)
      : (currentIndex + (event.shiftKey ? -1 : 1) + controls.length) % controls.length;
    controls[nextIndex].focus();
  }

  function qualityControl(id: string) {
    return (
      <label className="quality-control" htmlFor={id}>
        <span className="quality-label">Quality</span>
        <select
          id={id}
          data-testid={id}
          value={quality}
          onChange={(event) => onQualityChange(event.target.value as RenderingQuality)}
        >
          <option value="auto">Auto</option>
          <option value="high">High</option>
          <option value="low">Low</option>
        </select>
      </label>
    );
  }

  return (
    <div className="experience-ui">
      <header className="experience-header">
        <button
          type="button"
          ref={homeRef}
          className="home-control"
          aria-label="Return to Form"
          title="Return to Form"
          data-testid="home-button"
          onClick={() => navigate(0)}
        >
          <RibbonMark />
        </button>

        <nav className="chapter-rail" aria-label="Chapters">
          <span className="chapter-rail-track" aria-hidden="true">
            <span className="chapter-rail-fill" style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }} />
          </span>
          {chapters.map((name, index) => (
            <button
              type="button"
              key={name}
              className="chapter-stop"
              aria-label={`Go to ${name} chapter`}
              aria-current={currentChapter === index ? 'step' : undefined}
              title={name}
              data-testid={`chapter-${index}`}
              onClick={() => navigate(index)}
            >
              <span className="chapter-marker" aria-hidden="true" />
            </button>
          ))}
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="icon-control"
            aria-label="Open query"
            title="Open query"
            aria-haspopup="dialog"
            data-testid="query-button"
            onClick={(event) => openPanel('query', event)}
          >
            <MagnifyingGlass size={21} weight="light" />
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label="About this experience"
            title="About this experience"
            aria-haspopup="dialog"
            data-testid="world-button"
            onClick={(event) => openPanel('about', event)}
          >
            <Globe size={22} weight="light" />
          </button>
          <button
            type="button"
            className="icon-control"
            aria-label="Open navigation and settings"
            title="Navigation and settings"
            aria-haspopup="dialog"
            data-testid="menu-button"
            onClick={(event) => openPanel('menu', event)}
          >
            <List size={24} weight="light" />
          </button>
        </div>
      </header>

      <div className="closing-identity" style={{ opacity: Math.max(0, Math.min(1, (progress - 0.88) / 0.12)) }} aria-hidden="true"><RibbonMark variant="closing" /></div>
      <footer className={`experience-footer${currentChapter === 3 ? ' is-final' : ''}`} aria-label="Experience controls">
        <div className="footer-end">
          {rendererStatus === 'fallback' && (
            <button type="button" className="retry-control" aria-label="Retry 3D renderer" title="Retry 3D" onClick={onRetry} data-testid="retry-button">
              <ArrowClockwise size={16} weight="light" />
              <span>Retry 3D</span>
            </button>
          )}
          {currentChapter === 3 && (
            <>
              {qualityControl('quality-footer')}
              <button type="button" className="text-control" aria-haspopup="dialog" onClick={(event) => openPanel('about', event)} data-testid="about-button">
                About <ArrowUpRight size={13} />
              </button>
            </>
          )}
        </div>
      </footer>

      <span className="interface-sr-only" role="status" aria-live="polite">
        {rendererStatus === 'loading' && 'Preparing the three-dimensional experience.'}
        {rendererStatus === 'fallback' && 'The static experience is active. Navigation and controls remain available.'}
      </span>

      <dialog
        ref={dialogRef}
        className={`experience-dialog${panel === 'menu' ? ' navigation-dialog' : ''}`}
        aria-labelledby="experience-dialog-title"
        data-testid="experience-dialog"
        onKeyDown={trapDialogFocus}
        onCancel={(event) => {
          event.preventDefault();
          setPanel(null);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) setPanel(null);
        }}
      >
        {panel && (
          <div className="dialog-surface">
            <div className="dialog-topline">
              <span className="dialog-eyebrow">{panel === 'query' ? 'A space for thought' : panel === 'menu' ? 'Explore the experience' : 'Behind the form'}</span>
              <button type="button" className="icon-control" aria-label="Close dialog" data-testid="dialog-close" onClick={() => setPanel(null)}>
                <X size={21} weight="light" />
              </button>
            </div>

            {panel === 'query' && (
              <form className="query-form" onSubmit={submitQuery} data-experience-state={experienceState}>
                <h2 id="experience-dialog-title">What&apos;s on your mind?</h2>
                <label className="interface-sr-only" htmlFor="query-draft">Your question</label>
                <textarea
                  id="query-draft"
                  data-testid="query-input"
                  data-initial-focus
                  placeholder="Give your question a little space…"
                  value={draft}
                  maxLength={4000}
                  aria-describedby="query-privacy query-availability"
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setAttempted(false);
                  }}
                />
                <p id="query-privacy" className="query-note">Your draft stays in this tab. It has not been sent.</p>
                <div id="query-availability" className={`query-availability${attempted ? ' is-notice' : ''}`} role={attempted ? 'status' : undefined}>
                  <span className="availability-dot" aria-hidden="true" />
                  <p>{attempted ? 'The intelligence service is not connected. Your question is saved in this browser session, ready for when a service is added.' : 'The intelligence service is not connected yet.'}</p>
                </div>
                <div className="query-actions">
                  <button type="button" className="text-control" disabled={!draft} onClick={() => { setDraft(''); setAttempted(false); }}>Clear draft</button>
                  <button type="submit" className="submit-query" disabled={!draft.trim()} data-testid="query-submit">
                    Submit question <ArrowUpRight size={18} weight="light" />
                  </button>
                </div>
              </form>
            )}

            {panel === 'menu' && (
              <div className="navigation-content">
                <h2 id="experience-dialog-title">One form. Four moments.</h2>
                <nav className="dialog-chapters" aria-label="Journey chapters">
                  {chapters.map((name, index) => (
                    <button type="button" key={name} data-initial-focus={index === 0 ? true : undefined} data-testid={`menu-chapter-${index}`} aria-current={currentChapter === index ? 'step' : undefined} onClick={() => navigate(index)}>
                      <span className="menu-chapter-number">{String(index + 1).padStart(2, '0')}</span>
                      <span>{name}</span>
                      {currentChapter === index ? <Check size={19} weight="light" /> : <ArrowUpRight size={18} weight="light" />}
                    </button>
                  ))}
                </nav>
                <div className="dialog-settings">
                  <p className="motion-status" data-testid="motion-status">{reducedMotion ? 'Following your system’s reduced-motion preference.' : 'Always in motion. Animation starts automatically.'}</p>
                  {qualityControl('quality-menu')}
                </div>
                <button type="button" className="text-control about-from-menu" onClick={() => setPanel('about')}>About this experience <ArrowUpRight size={14} /></button>
              </div>
            )}

            {panel === 'about' && (
              <div className="about-content">
                <h2 id="experience-dialog-title" tabIndex={-1} data-initial-focus>A study in continuity.</h2>
                <p>One sculptural ribbon moves through four compositions: form, space, surface, and stillness.</p>
                <p>The sculpture moves continuously. Scroll at your own pace or use the chapter navigation to explore. Your system&apos;s reduced-motion preference is respected automatically.</p>
                <div className="about-service-note">
                  <span className="dialog-eyebrow">Product status</span>
                  <p>The query interface is a local draft space. An intelligence service has not been connected, and no questions are sent to a server.</p>
                </div>
                <button type="button" className="text-control" onClick={() => setPanel('menu')}>Navigation &amp; settings <ArrowUpRight size={14} /></button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </div>
  );
}
