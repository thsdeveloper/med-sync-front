'use client';

import React, { useEffect } from 'react';
import { HeaderLanding } from '../components/organisms/landing/HeaderLanding';
import { HeroLanding } from '../components/organisms/landing/HeroLanding';
import { PainPoints } from '../components/organisms/landing/PainPoints';
import { SolutionSection } from '../components/organisms/landing/SolutionSection';
import { ROISection } from '../components/organisms/landing/ROISection';
import { TestimonialsLanding } from '../components/organisms/landing/TestimonialsLanding';
import { FAQ } from '../components/organisms/landing/FAQ';
import { CTAFinal } from '../components/organisms/landing/CTAFinal';
import { FooterLanding } from '../components/organisms/landing/FooterLanding';

export default function Home() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    document.querySelectorAll('.fade-in-section').forEach(section => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <main className="overflow-x-hidden">
      <HeaderLanding />
      <HeroLanding />
      <section id="problema">
        <PainPoints />
      </section>
      <section id="solucao">
        <SolutionSection />
      </section>
      <section id="resultados">
        <ROISection />
      </section>
      <TestimonialsLanding />
      <FAQ />
      <CTAFinal />
      <FooterLanding />
    </main>
  );
}
