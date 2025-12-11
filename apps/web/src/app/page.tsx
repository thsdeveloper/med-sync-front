'use client';

import React, { useEffect } from 'react';
import { Header } from '../components/organisms/Header';
import { Hero } from '../components/organisms/Hero';
import { MobileApp } from '../components/organisms/MobileApp';
import { AIDemo } from '../components/organisms/AIDemo';
import { Benefits } from '../components/organisms/Benefits';
import { SocialProof } from '../components/organisms/SocialProof';
import { CTA } from '../components/organisms/CTA';
import { Footer } from '../components/organisms/Footer';

import { PlatformFeatures } from '../components/organisms/PlatformFeatures';

export default function Home() {
  // Intersection Observer for Fade In
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="overflow-x-hidden">
      <Header />
      <Hero />
      <AIDemo />
      <Benefits />
      <MobileApp />
      <PlatformFeatures />
      <SocialProof />
      <CTA />
      <Footer />
    </main>
  );
}
