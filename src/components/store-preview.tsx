"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function StorePreview() {
  const stage = useRef<HTMLDivElement>(null);
  const scene = useRef<HTMLDivElement>(null);

  useGSAP((_, contextSafe) => {
    const element = stage.current;
    if (!element || !scene.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference) and (pointer: fine)", () => {
      const handleTilt = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width - 0.5;
        const y = (event.clientY - bounds.top) / bounds.height - 0.5;
        gsap.to(scene.current, { rotateY: x * 7, rotateX: y * -5, duration: 0.55, ease: "power3.out", transformPerspective: 1100, transformOrigin: "center" });
      };
      const tilt = contextSafe?.(handleTilt) ?? handleTilt;
      const resetMotion = () => gsap.to(scene.current, { rotateX: 0, rotateY: 0, duration: 0.8, ease: "elastic.out(1, 0.65)" });
      const reset = contextSafe?.(resetMotion) ?? resetMotion;
      element.addEventListener("pointermove", tilt);
      element.addEventListener("pointerleave", reset);
      gsap.to(".floating-orbit", { y: -9, rotateZ: 4, duration: 2.8, yoyo: true, repeat: -1, stagger: 0.35, ease: "sine.inOut" });
      return () => { element.removeEventListener("pointermove", tilt); element.removeEventListener("pointerleave", reset); };
    });
    return () => media.revert();
  }, { scope: stage });

  return <div className="preview-wrap" ref={stage}>
    <span className="preview-tag">Product preview · concept</span>
    <div className="store-scene" ref={scene} aria-label="Concept preview of a SCENDEY storefront">
      <div className="store-preview">
        <div className="preview-top"><span className="store-logo">FORME STUDIO</span><span className="store-nav"><span>New in</span><span>Clothing</span><span>About</span></span><span aria-hidden="true">Bag (0)</span></div>
        <div className="store-banner">
          <Image className="editorial-image" src="/images/scendey-editorial.png" alt="Editorial still life of independent retail products, including tailored fashion, a handbag and skincare" fill priority sizes="(max-width: 680px) 100vw, 55vw" />
          <div className="banner-shade" aria-hidden="true" />
          <div className="banner-copy"><span>Made in Lagos</span><strong>Clothes for<br/>your own rhythm.</strong><a>Explore the collection</a></div>
          <div className="orbit-objects" aria-hidden="true"><span className="floating-orbit orbit-silver"/><span className="floating-orbit orbit-red"/><span className="floating-orbit orbit-glass"/></div>
        </div>
        <div className="preview-products"><div className="mini-product"><div className="mini-photo"/><strong>Sunday shirt</strong>₦28,000</div><div className="mini-product"><div className="mini-photo b"/><strong>Everyday tote</strong>₦16,500</div><div className="mini-product"><div className="mini-photo c"/><strong>Soft structure</strong>₦32,000</div></div>
      </div>
    </div>
    <span className="preview-depth-note" aria-hidden="true">A store with its own point of view</span>
  </div>;
}
