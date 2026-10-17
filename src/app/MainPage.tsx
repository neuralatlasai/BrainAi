import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Interface } from './Interface';
import { chapters, directorInput } from '../motion/storyboard';
import { useChapters } from '../motion/useChapters';
import { useExperienceStore } from '../state/experienceStore';

const SceneCanvas = lazy(() => import('../scene/SceneCanvas'));

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

declare global {
  interface Window {
    __BRAIN__?: { capture: (position: number) => void; resume: () => void; frameTimes: () => number[]; motion: () => { time: number; rotationY: number; deformation: number } };
  }
}

export function MainPage() {
  const { reducedMotion, quality, rendererStatus, setQuality, setReducedMotion, setRendererStatus } = useExperienceStore();
  const { track, chapter, progress, navigate } = useChapters(reducedMotion || rendererStatus === 'fallback');
  const [attempt, setAttempt] = useState(0);
  const currentAttempt = useRef(attempt);
  const [posterChapter, setPosterChapter] = useState(chapter);
  const onReady = useCallback(() => {
    if (currentAttempt.current === attempt && useExperienceStore.getState().rendererStatus === 'loading') setRendererStatus('ready');
  }, [attempt, setRendererStatus]);
  const onFailure = useCallback(() => {
    if (currentAttempt.current !== attempt || useExperienceStore.getState().rendererStatus === 'fallback') return;
    if (attempt === 0) { currentAttempt.current = 1; setAttempt(1); setRendererStatus('loading'); }
    else setRendererStatus('fallback');
  }, [attempt, setRendererStatus]);
  useEffect(() => {
    setPosterChapter(chapter);
  }, [chapter]);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    if (import.meta.env.DEV && new URLSearchParams(location.search).has('fallback')) setRendererStatus('fallback');
    return () => preference.removeEventListener('change', update);
  }, [setReducedMotion, setRendererStatus]);
  useEffect(() => {
    if (rendererStatus !== 'loading') return;
    const timeout = window.setTimeout(onFailure, 30_000);
    return () => window.clearTimeout(timeout);
  }, [rendererStatus, onFailure]);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__BRAIN__ = {
      capture: (position) => {
        directorInput.capture = true;
        directorInput.target = Math.max(0, Math.min(3, position));
        setPosterChapter(Math.round(position));
        window.dispatchEvent(new Event('scroll'));
      },
      resume: () => { directorInput.capture = false; window.dispatchEvent(new Event('scroll')); },
      frameTimes: () => [...directorInput.frameTimes],
      motion: () => ({ time: directorInput.ambientTime, rotationY: directorInput.rotationY, deformation: directorInput.deformation }),
    };
    return () => { delete window.__BRAIN__; };
  }, []);
  const retry = useCallback(() => {
    currentAttempt.current += 1;
    setAttempt(currentAttempt.current);
    setRendererStatus('loading');
  }, [setRendererStatus]);

  return <div className="experience" data-renderer-status={rendererStatus}>
    <a className="skip-link" href="#journey">Skip to experience</a>
    <div className="scene-environment" aria-hidden="true"><img src="/images/architecture-v2.webp" alt="" /></div>
    <div className={`scene-poster ${rendererStatus === 'ready' ? 'is-hidden' : ''}`} aria-hidden="true">
      <picture>
        <source media="(max-width: 700px)" srcSet={`/images/mobile-${chapters[posterChapter].id}.webp`} />
        <img src={`/images/${chapters[posterChapter].id}.webp`} alt="" fetchPriority="high" />
      </picture>
    </div>
    {rendererStatus !== 'fallback' && <div className={`scene-viewport ${rendererStatus === 'ready' ? 'is-ready' : ''}`}>
      <SceneBoundary key={attempt} onFailure={onFailure}>
        <Suspense fallback={null}><SceneCanvas compatibility={attempt > 0} onReady={onReady} onFailure={onFailure} /></Suspense>
      </SceneBoundary>
    </div>}
    <div className="scene-grain" aria-hidden="true" />
    <div className="scene-shade" aria-hidden="true" />
    <Interface chapter={chapter} progress={progress} reducedMotion={reducedMotion} quality={quality} onQualityChange={setQuality} onNavigate={navigate} rendererStatus={rendererStatus} onRetry={retry} />
    <main id="journey" ref={track} className={`journey ${rendererStatus === 'fallback' || reducedMotion ? 'is-static' : ''}`} tabIndex={-1}>
      {chapters.map((item, index) => <section className="chapter" id={item.id} data-chapter={index} key={item.id} aria-labelledby={`chapter-${item.id}`}>
        <h1 className="sr-only" id={`chapter-${item.id}`}>{item.name}</h1>
        <p className="sr-only">{item.description}</p>
      </section>)}
    </main>
  </div>;
}
