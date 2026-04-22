import NavBar from './components/landing/NavBar';
import Hero from './components/landing/Hero';
import PhaseShowcase from './components/landing/PhaseShowcase';
import HowItWorks from './components/landing/HowItWorks';
import UseCases from './components/landing/UseCases';
import DownloadCTA from './components/landing/DownloadCTA';
import Footer from './components/landing/Footer';
import CookieBanner from './components/landing/CookieBanner';

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

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
            'Create in 20 seconds',
            'Group votes on dates',
            'RSVPs that stick',
          ]}
          imageSrc={UNSPLASH('photo-1529156069898-49953e39b3ac')}
          imageAlt="Friends planning together around a table"
          reverse
        />

        <PhaseShowcase
          number="02"
          phase="living"
          eyebrow="LIVING"
          title="The app you open at the party."
          description="Everyone uploads to one shared photo feed. Chat with the crew in the moment. See who just arrived."
          bullets={[
            'One shared photo feed',
            'Live group chat',
            'See who just arrived',
          ]}
          imageSrc={UNSPLASH('photo-1492684223066-81342ee5ff30')}
          imageAlt="People celebrating at a party"
          edgeBleed="right"
        />

        <PhaseShowcase
          number="03"
          phase="recap"
          eyebrow="RECAP"
          title="The memory makes itself."
          description="An auto-generated photo mosaic of everything that happened. One link to share with the whole group. Relive it a year later."
          bullets={[
            'Auto-built photo mosaic',
            'One link, whole group',
            'Relive it anytime',
          ]}
          imageSrc={UNSPLASH('photo-1543007630-9710e4a00a20')}
          imageAlt="Friends looking back at memories together"
          reverse
        />

        <HowItWorks />
        <UseCases />
        <DownloadCTA />
      </main>

      <Footer />
      <CookieBanner />
    </>
  );
}
