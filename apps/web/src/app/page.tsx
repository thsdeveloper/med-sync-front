'use client';

import React, { useEffect } from 'react';
import { Header } from '../components/organisms/Header';
import { Hero } from '../components/organisms/Hero';
import { LogoBar } from '../components/organisms/LogoBar';
import { Benefits } from '../components/organisms/Benefits';
import { AIDemo } from '../components/organisms/AIDemo';
import { PlatformFeatures } from '../components/organisms/PlatformFeatures';
import { MobileApp } from '../components/organisms/MobileApp';
import { SocialProof } from '../components/organisms/SocialProof';
import { CTA } from '../components/organisms/CTA';
import { Footer } from '../components/organisms/Footer';

export default function Home() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main id="main-content" className="overflow-x-hidden">
      <Header />
      <Hero />
      <LogoBar />
      <Benefits />
      <AIDemo />
      <PlatformFeatures />
      <MobileApp />
      <SocialProof />
      <CTA />
      <Footer />
    </main>
  );
}
