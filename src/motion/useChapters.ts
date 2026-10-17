import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { directorInput } from './storyboard';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function useChapters(reduced: boolean) {
  const track = useRef<HTMLElement>(null);
  const [chapter, setChapter] = useState(0);
  const [progress, setProgress] = useState(0);
  const anchors = useRef<number[]>([]);

  useGSAP(() => {
    const sections = Array.from(track.current?.querySelectorAll<HTMLElement>('[data-chapter]') ?? []);
    const measure = () => {
      anchors.current = sections.map((section) => section.getBoundingClientRect().top + window.scrollY);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      anchors.current[3] = Math.min(anchors.current[3], max);
    };
    const update = () => {
      if (directorInput.capture) return;
      const points = anchors.current;
      if (points.length < 4) return;
      const y = window.scrollY;
      let index = 0;
      while (index < 3 && y >= points[index + 1]) index++;
      const segment = index === 3 ? 0 : Math.min(1, (y - points[index]) / Math.max(1, points[index + 1] - points[index]));
      const position = index + segment;
      directorInput.target = reduced ? Math.round(position) : position;
      setChapter(Math.min(3, Math.round(position)));
      setProgress(position / 3);
    };
    measure();
    const trigger = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: () => { measure(); update(); } });
    update();
    return () => trigger.kill();
  }, { scope: track, dependencies: [reduced], revertOnUpdate: true });

  const navigate = (index: number) => {
    window.scrollTo({ top: anchors.current[index] ?? 0, behavior: reduced ? 'instant' : 'smooth' });
  };
  return { track, chapter, progress, navigate };
}
