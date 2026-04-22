import NavBar from './components/landing/NavBar';
import Hero from './components/landing/Hero';
import PhaseShowcase from './components/landing/PhaseShowcase';
import HowItWorks from './components/landing/HowItWorks';
import UseCases from './components/landing/UseCases';
import DownloadCTA from './components/landing/DownloadCTA';
import Footer from './components/landing/Footer';
import CookieBanner from './components/landing/CookieBanner';
import PhoneFrame from './components/landing/mockups/PhoneFrame';
import PlanningMockup from './components/landing/mockups/PlanningMockup';
import LivingMockup from './components/landing/mockups/LivingMockup';
import RecapMockup from './components/landing/mockups/RecapMockup';

export default function Home() {
  return (
    <>
      <NavBar />

      <main id="top" className="landing-main min-h-screen bg-bg1 text-text1 overflow-x-hidden">
        <Hero />

        <PhaseShowcase
          number="01"
          phase="planning"
          eyebrow="PLANNING"
          title="Agree on a plan without the chaos."
          description="Spin up an event in 20 seconds. Let the group vote on dates and places. Get RSVPs that actually mean something."
          bullets={[
            'Create an event in 20 seconds',
            'Poll dates and places — let the group vote',
            'RSVPs that actually work',
          ]}
          mockup={
            <PhoneFrame glowColor="#169C3E">
              <PlanningMockup />
            </PhoneFrame>
          }
        />

        <PhaseShowcase
          number="02"
          phase="living"
          eyebrow="LIVING"
          title="The app you open at the party."
          description="Everyone uploads to one shared photo feed. Chat with the crew in the moment. See who just arrived."
          bullets={[
            'Shared photo feed — everyone uploads, everyone sees',
            'Group chat with the crew',
            'See who just arrived',
          ]}
          mockup={
            <PhoneFrame glowColor="#8A38F5">
              <LivingMockup />
            </PhoneFrame>
          }
          reverse
        />

        <PhaseShowcase
          number="03"
          phase="recap"
          eyebrow="RECAP"
          title="The memory makes itself."
          description="An auto-generated photo mosaic of everything that happened. One link to share with the whole group. Relive it a year later."
          bullets={[
            'Auto-generated photo mosaic',
            'One link to share with the group',
            'Relive it a year later',
          ]}
          mockup={
            <PhoneFrame glowColor="#FF751A">
              <RecapMockup />
            </PhoneFrame>
          }
        />

        <HowItWorks />
        <UseCases />
        <DownloadCTA />
      </main>

      <div className="mt-12 md:mt-16">
        <Footer />
      </div>
      <CookieBanner />
    </>
  );
}
