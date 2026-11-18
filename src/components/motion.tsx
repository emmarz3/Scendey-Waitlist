"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function HeroMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => { void fetch("/api/analytics", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "waitlist_page_view", source: "website" }) }); }, []);
  useGSAP(() => {
    const hero = anchor.current?.closest(".hero");
    if (!hero) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
        entrance.from(".hero-copy > .eyebrow", { y: 14, autoAlpha: 0, duration: 0.45 })
          .from(".hero-copy h1", { y: 28, autoAlpha: 0, duration: 0.65 }, "-=0.2")
          .from(".hero-copy > p, .hero-ctas > *, .hero-foot", { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.08 }, "-=0.25")
          .from(".preview-wrap", { y: 22, rotateY: -8, transformPerspective: 900, autoAlpha: 0, duration: 0.8 }, "-=0.4");
      }, hero);
      return () => context.revert();
    });
    return () => mm.revert();
  }, { scope: anchor });
  return <span ref={anchor} className="motion-anchor" aria-hidden="true"/>;
}

export function PageMotion() {
  const anchor = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const context = gsap.context(() => {
        const sections = gsap.utils.toArray<HTMLElement>("main > section:not(.hero)");
        sections.forEach(section => {
          const targets = section.querySelectorAll(":scope > .container > .section-head, :scope > .container > .feature-split, :scope > .container > .categories-layout, :scope > .container > .faq-grid, :scope > .container > .early-inner, :scope > .container > .final-inner");
          if (!targets.length) return;
          gsap.from(targets, { y: 20, autoAlpha: 0, duration: 0.65, ease: "power2.out", stagger: 0.08, scrollTrigger: { trigger: section, start: "top 86%", once: true } });
        });
      }, main);
      return () => context.revert();
    });
    return () => mm.revert();
  }, { scope: anchor });
  return <span ref={anchor} className="motion-anchor" aria-hidden="true"/>;
}
