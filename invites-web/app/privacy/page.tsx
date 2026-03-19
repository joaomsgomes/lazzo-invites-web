import { BrandColors, Spacing } from '../design/constants';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: BrandColors.bg1,
      padding: Spacing.lg,
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl,
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: Spacing.xl,
        }}>
          <Link href="/" style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: Spacing.lg,
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: BrandColors.bg1,
              borderRadius: Spacing.radiusMd,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              border: `2px solid ${BrandColors.bg3}`,
            }}>
              <img 
                src="/app-icon.png" 
                alt="Lazzo"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          </Link>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 700,
            color: BrandColors.text1,
            marginBottom: Spacing.xs,
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontSize: '14px',
            color: BrandColors.text2,
          }}>
            Last updated: 2026-01-11
          </p>
        </div>

        {/* Content */}
        <div style={{
          background: BrandColors.bg2,
          borderRadius: Spacing.radiusMd,
          padding: Spacing.xl,
          border: `1px solid ${BrandColors.border}`,
          color: BrandColors.text1,
          lineHeight: 1.7,
        }}>
          <p style={{ marginBottom: Spacing.lg }}>
            This Privacy Policy explains how the <strong>Lazzo</strong> app (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) collects, uses, and shares information when you use the app and related services.
          </p>

          <div style={{
            background: BrandColors.bg3,
            padding: Spacing.md,
            borderRadius: Spacing.radiusSm,
            marginBottom: Spacing.lg,
          }}>
            <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>Data Controller</p>
            <ul style={{ paddingLeft: Spacing.lg, margin: 0 }}>
              <li><strong>Controller:</strong> Guilherme Monteiro</li>
              <li><strong>Contact:</strong> realeventapp@gmail.com</li>
              <li><strong>Country/Region:</strong> Portugal</li>
            </ul>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            1) What the app does
          </h2>
          <p style={{ marginBottom: Spacing.lg }}>
            Lazzo helps you <strong>create and share invites and memories</strong> (e.g., events with friends), including features such as:
          </p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
            <li>creating/managing events</li>
            <li>invite links and QR codes</li>
            <li>sharing photos/videos (optional)</li>
            <li>event location (optional)</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            2) Information we collect
          </h2>
          <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>A) Account data (required to create an account)</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>Name</li>
            <li>Email address</li>
          </ul>

          <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>B) Profile information (optional)</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>Profile photo/avatar</li>
            <li>Birthday</li>
            <li>City/location (text only, not precise coordinates)</li>
          </ul>

          <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>C) Content you provide</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>Photos and/or videos you upload to events</li>
            <li>Text you enter (e.g., event titles, notes, chat messages)</li>
          </ul>

          <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>D) Location (optional, only when using the app)</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>If you allow it, we may use your location <strong>only while you are using the app</strong> to help you select your current location when creating an event</li>
            <li>We do not track your location in the background</li>
          </ul>

          <p style={{ fontWeight: 600, marginBottom: Spacing.xs }}>E) Technical and usage data</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>Basic information required for the app to function (e.g., internal identifiers, device information)</li>
            <li>Error logs and performance diagnostics to improve the app</li>
          </ul>

          <div style={{
            background: BrandColors.bg3,
            padding: Spacing.md,
            borderRadius: Spacing.radiusSm,
            marginBottom: Spacing.lg,
          }}>
            <p style={{ margin: 0 }}><strong>Note:</strong> We <strong>do not sell</strong> your personal data.</p>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            3) How we collect information
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>We collect information when you:</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
            <li>create an account or sign in</li>
            <li>edit your profile (add profile photo, birthday, city)</li>
            <li>create or participate in events, invites, and memories</li>
            <li>upload photos/videos or send messages</li>
            <li>grant permissions to access camera, photos, location, or calendar</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            4) How we use information
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>We use information to:</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
            <li><strong>provide and operate</strong> the app (accounts, events, invites, memories)</li>
            <li><strong>sync</strong> your content across devices</li>
            <li><strong>improve and secure</strong> the service (security, abuse prevention, bug fixing)</li>
            <li><strong>customer support</strong> (respond to requests)</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            5) Device permissions
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>The app may request the following permissions on iOS:</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li><strong>Camera:</strong> to take photos/videos during events</li>
            <li><strong>Photos/Media Library:</strong> to select and upload photos/videos from your device; to save event memories to your gallery</li>
            <li><strong>Location (When In Use):</strong> to help you select your current location when creating an event. We only access location while you are actively using the app, not in the background</li>
            <li><strong>Calendar:</strong> to add events to your device calendar</li>
            <li><strong>Notifications:</strong> to receive alerts about events, messages, and activities (optional)</li>
          </ul>
          <p style={{ marginBottom: Spacing.lg }}>
            You can change or revoke these permissions anytime in your device <strong>Settings</strong>.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            6) Who we share information with
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>
            We share information only as needed to operate the app, with service providers (&quot;processors&quot;), such as:
          </p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li><strong>Supabase</strong> (authentication, database, and file storage) — stores your account data, profile information, event data, photos, and messages on secure cloud servers</li>
            <li><strong>Vercel</strong> (hosting for web pages) — hosts web pages for event invites and policies</li>
          </ul>
          <p style={{ marginBottom: Spacing.xs }}>
            We currently <strong>do not</strong> use third-party analytics, advertising, or crash reporting services.
          </p>
          <p style={{ marginBottom: Spacing.lg }}>
            We <strong>do not sell</strong> your personal data to third parties.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            7) Where information is processed
          </h2>
          <p style={{ marginBottom: Spacing.lg }}>
            Your data may be processed and stored on servers outside Portugal/the EU (depending on service provider infrastructure). We use service providers that comply with industry-standard security practices and, where applicable, appropriate safeguards for international data transfers (e.g., standard contractual clauses).
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            8) Data retention
          </h2>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
            <li>We keep your data <strong>for as long as your account is active</strong>.</li>
            <li>If you delete your account, we permanently delete your personal data (account information, profile, photos) <strong>within 30 days</strong>, unless we must keep it for legal or security reasons (e.g., abuse prevention).</li>
            <li>Some data may be retained in backups for a limited period but will not be accessible or used.</li>
          </ul>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            9) Security
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>
            We take security seriously and use technical and organizational measures to protect your data, including:
          </p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Secure authentication (email OTP, passwordless login)</li>
            <li>Access controls and secure storage practices</li>
            <li>Row-level security policies in our database to ensure users can only access their own data and the data of groups they belong to</li>
          </ul>
          <p style={{ marginBottom: Spacing.lg }}>
            No system is 100% secure, but we continuously work to reduce risks and protect your information.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            10) Your rights
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>
            Depending on your region (including the EU/Portugal), you may have rights such as:
          </p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>access, correction, deletion</li>
            <li>restriction or objection</li>
            <li>data portability</li>
          </ul>
          <p style={{ marginBottom: Spacing.lg }}>
            To exercise your rights, contact: <strong>realeventapp@gmail.com</strong>.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            11) Deleting your account and data
          </h2>
          <p style={{ marginBottom: Spacing.xs }}>You can delete your account and data:</p>
          <ul style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.md }}>
            <li>in the app <strong>Settings</strong> using <strong>Delete Account</strong>; or</li>
            <li>by emailing <strong>realeventapp@gmail.com</strong>.</li>
          </ul>
          <p style={{ marginBottom: Spacing.lg }}>
            After your request, we permanently delete your personal data <strong>within 30 days</strong>, unless we must keep it for legal or security reasons.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            12) Children
          </h2>
          <p style={{ marginBottom: Spacing.lg }}>
            Lazzo is not intended for children under 13 years of age (or the minimum age required by local law in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided personal data, please contact us at <strong>realeventapp@gmail.com</strong> so we can delete it.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            13) Changes to this policy
          </h2>
          <p style={{ marginBottom: Spacing.lg }}>
            We may update this policy. If changes are material, we will notify you in the app or on our website.
          </p>

          <h2 style={{ fontSize: '24px', fontWeight: 600, color: BrandColors.text1, marginTop: Spacing.xl, marginBottom: Spacing.md }}>
            14) Contact
          </h2>
          <p style={{ marginBottom: 0 }}>
            For any questions, concerns, or requests regarding this Privacy Policy or your data, contact us at:
          </p>
          <p style={{ marginTop: Spacing.md, marginBottom: 0 }}>
            Email: <strong>realeventapp@gmail.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: Spacing.xl,
          paddingTop: Spacing.lg,
          borderTop: `1px solid ${BrandColors.border}`,
        }}>
          <Link 
            href="/"
            style={{
              color: BrandColors.planning,
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
