'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
  Zap, ArrowRight, ArrowLeft, CheckCircle,
  User, Target, Lightbulb, Link as LinkIcon, Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STEPS = [
  { id: 'welcome', title: 'Welcome!', icon: Zap, description: 'Tell us a bit about yourself' },
  { id: 'voice', title: 'Your Voice', icon: User, description: 'Help AI write in your style' },
  { id: 'audience', title: 'Your Audience', icon: Target, description: 'Who do you create for?' },
  { id: 'goals', title: 'Content Goals', icon: Lightbulb, description: 'What do you want to achieve?' },
  { id: 'done', title: 'All Set!', icon: Rocket, description: 'You\'re ready to go' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    persona: '',
    writing_style: '',
    niche_description: '',
    target_audience: '',
    content_goals: '',
    avoid_topics: '',
    posting_frequency: '5',
    linkedin_url: '',
    writing_sample_1: '',
  });

  const update = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleFinish = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }

      await supabase.from('users').upsert({
        id: user.id,
        ...form,
        onboarding_completed: true,
      }, { onConflict: 'id' });

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const currentStep = STEPS[step];
  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 560 }} className="animate-fade-in">

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem', justifyContent: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9,
            background: 'var(--foreground)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Zap size={18} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>The Personal Brand</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--foreground)' }}>
              {Math.round(progress)}% complete
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--muted)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${progress}%`,
              background: 'var(--foreground)',
              borderRadius: 100,
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem' }}>
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: done ? 'var(--foreground)' : active ? 'var(--foreground)' : 'var(--muted)',
                    border: active ? '2px solid var(--foreground)' : '2px solid transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {done
                      ? <CheckCircle size={14} color="white" />
                      : <Icon size={14} color={active ? 'white' : 'var(--muted-foreground)'} />
                    }
                  </div>
                  <span style={{ fontSize: '0.625rem', color: active ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: active ? 600 : 400, display: 'none' }} className="hidden sm:block">
                    {s.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.375rem', color: 'var(--foreground)', marginBottom: '0.25rem' }}>
              {currentStep.title}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
              {currentStep.description}
            </p>
          </div>

          {/* ─── STEP 0: Welcome ─── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Your full name</label>
                <input
                  className="input-field"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="e.g. Sarah Johnson"
                />
              </div>
              <div>
                <label className="label">What best describes you?</label>
                <select
                  className="input-field"
                  value={form.persona}
                  onChange={e => update('persona', e.target.value)}
                >
                  <option value="">Select your role...</option>
                  <option>Founder / Entrepreneur</option>
                  <option>Content Creator / Influencer</option>
                  <option>Marketing Professional</option>
                  <option>Freelancer / Consultant</option>
                  <option>Executive / C-Suite</option>
                  <option>Agency Owner</option>
                  <option>Investor</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Your niche or industry</label>
                <input
                  className="input-field"
                  value={form.niche_description}
                  onChange={e => update('niche_description', e.target.value)}
                  placeholder="e.g. B2B SaaS, DTC ecommerce, Climate tech..."
                />
              </div>
            </div>
          )}

          {/* ─── STEP 1: Voice ─── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Your writing style</label>
                <select
                  className="input-field"
                  value={form.writing_style}
                  onChange={e => update('writing_style', e.target.value)}
                >
                  <option value="">Select your style...</option>
                  <option>Direct and data-driven</option>
                  <option>Conversational and casual</option>
                  <option>Authoritative and thought-leadership</option>
                  <option>Humorous and edgy</option>
                  <option>Inspirational and motivational</option>
                  <option>Educational and detailed</option>
                  <option>Storytelling-focused</option>
                </select>
              </div>
              <div>
                <label className="label">Share a sample post you're proud of</label>
                <textarea
                  className="input-field"
                  value={form.writing_sample_1}
                  onChange={e => update('writing_sample_1', e.target.value)}
                  placeholder="Paste one of your best LinkedIn posts or any content you've written. The AI will learn from your style..."
                  rows={6}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.375rem' }}>
                  Optional but highly recommended — this dramatically improves AI output quality.
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Audience ─── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Who is your target audience?</label>
                <textarea
                  className="input-field"
                  value={form.target_audience}
                  onChange={e => update('target_audience', e.target.value)}
                  placeholder="e.g. B2B SaaS founders at Series A stage, 25-45, based in the US and UK, interested in growth and fundraising..."
                  rows={4}
                />
              </div>
              <div>
                <label className="label">Topics to NEVER post about</label>
                <input
                  className="input-field"
                  value={form.avoid_topics}
                  onChange={e => update('avoid_topics', e.target.value)}
                  placeholder="e.g. Politics, religion, competitor mentions..."
                />
              </div>
              <div>
                <label className="label">LinkedIn profile URL (optional)</label>
                <input
                  className="input-field"
                  value={form.linkedin_url}
                  onChange={e => update('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  type="url"
                />
              </div>
            </div>
          )}

          {/* ─── STEP 3: Goals ─── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Why do you post on social media?</label>
                <textarea
                  className="input-field"
                  value={form.content_goals}
                  onChange={e => update('content_goals', e.target.value)}
                  placeholder="e.g. Build thought leadership in AI SaaS, attract inbound leads, grow my personal brand for fundraising..."
                  rows={4}
                />
              </div>
              <div>
                <label className="label">How many posts per week do you want?</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                  {['2', '3', '4', '5', '7'].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => update('posting_frequency', n)}
                      style={{
                        padding: '0.75rem', borderRadius: 'var(--radius)',
                        border: form.posting_frequency === n ? '2px solid var(--foreground)' : '1px solid var(--border)',
                        background: form.posting_frequency === n ? 'var(--foreground)' : 'transparent',
                        color: form.posting_frequency === n ? 'white' : 'var(--foreground)',
                        fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', marginTop: '0.375rem' }}>
                  Posts per week. Five is a sustainable pace for most creators.
                </p>
              </div>
            </div>
          )}

          {/* ─── STEP 4: Done ─── */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'var(--sage-bg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <Rocket size={34} style={{ color: 'var(--sage-ink)' }} />
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '0.75rem' }}>
                You're all set, {form.full_name.split(' ')[0] || 'there'}!
              </h3>
              <p style={{ color: 'var(--muted-foreground)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Your AI voice profile is configured. Head to the dashboard to create your first post in your own style.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'AI voice profile saved',
                  'Content strategy configured',
                  'Ready to generate your first post',
                ].map(item => (
                  <div key={item} style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--sage-bg)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.875rem',
                    color: 'var(--sage-ink)',
                    fontWeight: 550,
                    textAlign: 'left',
                  }}>
                    <CheckCircle size={15} /> {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginTop: '2rem',
            paddingTop: '1.5rem', borderTop: '1px solid var(--border)',
          }}>
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="btn-ghost"
              style={{ opacity: step === 0 ? 0 : 1, pointerEvents: step === 0 ? 'none' : 'auto' }}
            >
              <ArrowLeft size={15} /> Back
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {step < STEPS.length - 1 && step > 0 && (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="btn-ghost"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Skip
                </button>
              )}
              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="btn-primary"
                >
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="btn-primary"
                  style={{ minWidth: 160, justifyContent: 'center' }}
                >
                  {saving ? 'Saving...' : 'Go to Dashboard →'}
                </button>
              )}
            </div>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.8125rem', color: 'var(--muted-foreground)', marginTop: '1.25rem' }}>
          You can update all of this later in{' '}
          <Link href="/settings/brand" style={{ color: 'var(--foreground)', fontWeight: 600 }}>
            Brand Profile
          </Link>
        </p>
      </div>
    </div>
  );
}
