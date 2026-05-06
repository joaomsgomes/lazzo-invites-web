import NavBar from './components/landing/NavBar';
import Hero from './components/landing/Hero';
import PhaseShowcase from './components/landing/PhaseShowcase';
import HowItWorks from './components/landing/HowItWorks';
import UseCases from './components/landing/UseCases';
import DownloadCTA from './components/landing/DownloadCTA';
import Footer from './components/landing/Footer';
import CookieBanner from './components/landing/CookieBanner';

// App screenshots rendered inside phone frames in the phase sections.
// Drop the actual PNGs at these paths — see public/screenshots/README.md.
const SCREENSHOT = {
  planning: '/screenshots/planning.png',
  living: '/screenshots/living.png',
  recap: '/screenshots/recap.png',
};

export default function Home() {
  return (
    <>
      <NavBar />

      <main id="top" className="landing-main min-h-screen bg-bg1 text-text1 overflow-x-hidden">
        <Hero />

        <div style={{ paddingTop: '7rem' }}>
          <PhaseShowcase
            number="01"
            phase="planning"
            eyebrow="PLANNING"
            title="Agree on a plan without the chaos"
            description="Spin up an event in 20 seconds. Let the group vote on dates and places. Get RSVPs that actually mean something."
            bullets={[
              'Create in 20 seconds',
              'Group votes on dates',
              'RSVPs that stick',
            ]}
            imageSrc={SCREENSHOT.planning}
            imageAlt="Lazzo planning screen — group voting on event dates"
            reverse
          />
        </div>

        <div style={{ paddingTop: '7rem' }}>
          <PhaseShowcase
            number="02"
            phase="living"
            eyebrow="LIVING"
            title="The app you open at the party"
            description="Everyone uploads to one shared photo feed. Chat with the crew in the moment. See who just arrived."
            bullets={[
              'One shared photo feed',
              'Live group chat',
              'See who just arrived',
            ]}
            imageSrc={SCREENSHOT.living}
            imageAlt="Lazzo living screen — shared photo feed during the event"
          />
        </div>

        <div style={{ paddingTop: '7rem' }}>
          <PhaseShowcase
            number="03"
            phase="recap"
            eyebrow="RECAP"
            title="The memory makes itself"
            description="An auto-generated photo mosaic of everything that happened. One link to share with the whole group. Relive it a year later."
            bullets={[
              'Auto-built photo mosaic',
              'One link, whole group',
              'Relive it anytime',
            ]}
            imageSrc={SCREENSHOT.recap}
            imageAlt="Lazzo recap screen — auto-generated photo mosaic"
            reverse
          />
        </div>

        <div style={{ paddingTop: '7rem' }}><HowItWorks /></div>
        <div className="flex flex-col" style={{ paddingTop: '7rem' }}><UseCases /></div>
        <div style={{ paddingTop: '3rem', paddingBottom: '3rem' }}><DownloadCTA /></div>
        <div style={{ paddingTop: '3rem' }}><Footer /></div>
        <CookieBanner />
      </main>
    </>
  );
}
