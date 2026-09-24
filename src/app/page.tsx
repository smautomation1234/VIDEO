'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CheckCircle2,
  Clapperboard,
  ChevronDown,
  Compass,
  FileText,
  Film,
  Images,
  Lightbulb,
  Megaphone,
  MessageCircle,
  PenLine,
  Radar,
  Scissors,
  Sparkles,
  ShieldCheck,
  Target,
  Users,
  Zap,
} from 'lucide-react';

const CONTACT_EMAIL = 'ceo@thepersonalbrand.xyz';
const DEMO_MAILTO = `mailto:${CONTACT_EMAIL}?subject=The%20Personal%20Brand%20demo`;
const ROLLOUT_MAILTO = `mailto:${CONTACT_EMAIL}?subject=The%20Personal%20Brand%20company%20rollout`;

const results = [
  { value: 10.86, format: (value: number) => `${value.toFixed(2)}L`, label: 'Instagram views', change: '+3,369.8%' },
  { value: 13967, format: (value: number) => Math.round(value).toLocaleString('en-IN'), label: 'YouTube views', change: '+52.7%' },
  { value: 61983, format: (value: number) => Math.round(value).toLocaleString('en-IN'), label: 'Facebook views', change: '+987.2%' },
  { value: 4.3, format: (value: number) => `${value.toFixed(2)}L`, label: 'Instagram reach', change: '+2,661.3%' },
  { value: 1073, format: (value: number) => Math.round(value).toLocaleString('en-IN'), label: 'Instagram saves', change: '+1,006.2%' },
  { value: 402, format: (value: number) => Math.round(value).toLocaleString('en-IN'), label: 'Content-driven follows', change: '+1,286.2%' },
];

const actualClientResults = [
  {
    label: 'Client 01',
    title: 'A stronger reach curve',
    description: 'A real analytics comparison showing how consistent content expanded distribution beyond the existing audience.',
    beforeImage: '/images/client-results/client-a-before.jpeg',
    afterImage: '/images/client-results/client-a-after.jpeg',
    beforeAlt: 'Client 01 analytics before result',
    afterAlt: 'Client 01 analytics after result',
    metrics: [
      { label: 'Views', before: '307,805', after: '1,007,196' },
      { label: 'Net followers', before: '+239', after: '+374' },
      { label: 'Non-followers', before: '98.6%', after: '99.3%' },
    ],
  },
  {
    label: 'Client 02',
    title: 'From a few thousand to 1M+',
    description: 'A real platform snapshot showing the jump in views, followers and account reach after the content system was applied.',
    beforeImage: '/images/client-results/client-b-before.jpeg',
    afterImage: '/images/client-results/client-b-after.jpeg',
    beforeAlt: 'Client 02 analytics before result',
    afterAlt: 'Client 02 analytics after result',
    metrics: [
      { label: 'Views', before: '5,827', after: '1.1M' },
      { label: 'Followers', before: '+20', after: '+458' },
      { label: 'After snapshot', before: '2,398 reached', after: '124 posts shared' },
    ],
  },
];

const steps = [
  { number: '01', title: 'Find the signal', copy: 'Surface news and conversations worth having an opinion on.', icon: Radar },
  { number: '02', title: 'Own the angle', copy: 'Turn a topic into a point of view that sounds like you.', icon: Target },
  { number: '03', title: 'Make the formats', copy: 'Build a post, carousel and short-form script from one idea.', icon: Sparkles },
  { number: '04', title: 'Keep the rhythm', copy: 'Ship consistently without turning content into a second full-time job.', icon: Zap },
];

const features = [
  { title: 'Research that leads somewhere', copy: 'Filter live stories by market, geography and relevance—then turn the useful ones into approved company angles.', icon: Radar },
  { title: 'A brand voice people recognise', copy: 'Set tone, proof points and guardrails once. Every draft starts closer to how your company should sound.', icon: PenLine },
  { title: 'One idea. Multiple assets.', copy: 'Create sharp LinkedIn posts, social carousels, image sets and video scripts from a single approved brief.', icon: Images },
  { title: 'An operating rhythm, not a rush', copy: 'Plan, create, review and improve from one workspace—without scattered docs, agency handoffs or content chaos.', icon: FileText },
];

const companyWorkflow = [
  { number: '01', label: 'INPUT', title: 'Market signal', copy: 'Research, customer questions and founder expertise enter one brief.', icon: Radar },
  { number: '02', label: 'SYSTEM', title: 'Brand-ready content', copy: 'The Personal Brand turns the brief into posts, carousels and video directions.', icon: Sparkles },
  { number: '03', label: 'CONTROL', title: 'Review & publish', copy: 'Your team keeps the final call while the workflow stays moving.', icon: CheckCircle2 },
  { number: '04', label: 'LEARNING', title: 'Better next cycle', copy: 'Performance signals feed the next round of ideas and formats.', icon: BarChart3 },
];

const founderProblems = [
  {
    number: '01', label: 'Visibility gap', problem: 'We know our market, but our expertise is not visible enough.',
    bring: 'Founder expertise, customer proof and a commercial point of view.',
    autopilot: 'Finds timely conversations and turns them into company angles worth owning.',
    output: 'A weekly company signal board', icon: Radar,
  },
  {
    number: '02', label: 'Content gap', problem: 'Our best ideas stay in meetings instead of reaching the market.',
    bring: 'A rough thought, customer insight, voice note or useful link.',
    autopilot: 'Shapes one approved idea into a post, carousel, image set and short-form script.',
    output: 'A ready-to-review content set', icon: Images,
  },
  {
    number: '03', label: 'Consistency gap', problem: 'Our content sounds different depending on who creates it.',
    bring: 'Your brand voice, audience, proof points and approval guardrails.',
    autopilot: 'Keeps every draft anchored to company voice, content pillars and commercial context.',
    output: 'A recognisable company voice', icon: PenLine,
  },
  {
    number: '04', label: 'Learning gap', problem: 'We publish, but do not know what is earning attention or trust.',
    bring: 'Your publishing history, campaign priorities and channel signals.',
    autopilot: 'Connects performance back to the next research, strategy and creation cycle.',
    output: 'A smarter next month of content', icon: BarChart3,
  },
];

const videoSteps = [
  { number: '01', title: 'Choose the post', copy: 'Start with a post or idea that already has a point of view.', icon: FileText },
  { number: '02', title: 'Build the prompt', copy: 'Turn the idea into a fact-checked, cinematic video brief.', icon: ShieldCheck },
  { number: '03', title: 'Approve the story', copy: 'Review the direction before a clip is generated.', icon: CheckCircle2 },
  { number: '04', title: 'Generate the reel', copy: 'Create identity-consistent clips with Gemini Omni Flash.', icon: Film },
  { number: '05', title: 'Trim and export', copy: 'Pick a take, trim the timeline and download an MP4.', icon: Scissors },
];

const videoProcessMap = [
  { number: '02', label: 'BRAND CONTEXT', title: 'Add your voice', copy: 'Tone, claims and visual guardrails stay attached to every scene.', icon: ShieldCheck },
  { number: '03', label: 'AI STORYBOARD', title: 'Build the scenes', copy: 'Your approved idea becomes a sharp hook, script and shot list.', icon: Sparkles },
  { number: '04', label: 'GENERATE', title: 'Choose the best take', copy: 'Create multiple identity-consistent options without a production crew.', icon: Film },
  { number: '05', label: 'READY TO SHIP', title: 'Review & export', copy: 'Make the final call, trim the reel and download a clean MP4.', icon: CheckCircle2 },
];

const distributionChannels = ['LinkedIn', 'Instagram', 'YouTube', 'X / Twitter', 'Google Drive'];

const marketingJourney = [
  { number: '01', phase: 'Discover', title: 'Research the market', copy: 'Track India, world and niche signals your audience already cares about.', icon: Radar },
  { number: '02', phase: 'Discover', title: 'Shape the strategy', copy: 'Define your audience, point of view, content pillars and publishing rhythm.', icon: Compass },
  { number: '03', phase: 'Create', title: 'Posts & carousels', copy: 'Turn one strong idea into sharp social posts, captions and visual stories.', icon: PenLine },
  { number: '04', phase: 'Create', title: 'AI video', copy: 'Transform approved ideas into identity-consistent reels ready to publish.', icon: Film },
  { number: '05', phase: 'Distribute', title: 'Publish everywhere', copy: 'Adapt and distribute each idea across LinkedIn, Instagram, YouTube and more.', icon: Megaphone },
  { number: '06', phase: 'Distribute', title: 'Conversations & leads', copy: 'Turn attention into meaningful replies, relationships and qualified opportunities.', icon: MessageCircle },
  { number: '07', phase: 'Compound', title: 'Performance analytics', copy: 'See which topics, formats and platforms are earning reach, trust and action.', icon: BarChart3 },
  { number: '08', phase: 'Compound', title: 'Improve the next cycle', copy: 'Feed the winning signals back into research so every cycle gets stronger.', icon: Sparkles },
];

const faqs = [
  ['Which teams is The Personal Brand built for?', 'The Personal Brand is designed for founders and lean content teams that need a faster, more consistent way to turn expertise into distribution.'],
  ['Will it make generic AI content?', 'No. Every workflow begins with your market, source material, audience and point of view. The aim is a useful, brand-aware first draft your team can confidently review.'],
  ['Does our team keep control before publishing?', 'Yes. The Personal Brand creates review-ready research, posts, carousels and video briefs. Your team keeps the final say on every message that goes out.'],
];

function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        element.dataset.visible = 'true';
        observer.disconnect();
      }
    }, { threshold: 0.14 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={`ap-home-reveal ${className}`}>{children}</div>;
}

function AnimatedMetric({ value, format }: { value: number; format: (value: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setStarted(true);
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const startedAt = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [started, value]);

  return <span ref={ref} className="ap-home-result-value">{format(current)}</span>;
}

function ActualClientResults() {
  const [activeClient, setActiveClient] = useState(0);
  const client = actualClientResults[activeClient];

  return (
    <div className="ap-home-actual-results">
      <div className="ap-home-actual-results-tabs" role="tablist" aria-label="Actual client results">
        {actualClientResults.map((item, index) => (
          <button key={item.label} type="button" role="tab" aria-selected={activeClient === index} className={activeClient === index ? 'is-active' : ''} onClick={() => setActiveClient(index)}>
            <span>{item.label}</span><strong>{index === 0 ? '307K → 1M' : '5K → 1.1M'}</strong>
          </button>
        ))}
      </div>
      <div className="ap-home-actual-results-panel" role="tabpanel" key={client.label}>
        <div className="ap-home-actual-results-copy">
          <p className="ap-home-results-stat-kicker">{client.label} · ACTUAL ANALYTICS</p>
          <h3>{client.title}</h3>
          <p>{client.description}</p>
          <div className="ap-home-actual-metrics">
            {client.metrics.map((metric) => <div key={metric.label}><span>{metric.label}</span><b>{metric.before}</b><i>→</i><strong>{metric.after}</strong></div>)}
          </div>
        </div>
        <div className="ap-home-actual-results-images">
          <figure><img src={client.beforeImage} alt={client.beforeAlt} /><figcaption><span>BEFORE</span> Baseline snapshot</figcaption></figure>
          <figure><img src={client.afterImage} alt={client.afterAlt} /><figcaption><span>AFTER</span> Results snapshot</figcaption></figure>
        </div>
      </div>
      <p className="ap-home-actual-results-note">Client identities withheld. Figures are shown exactly as captured in the supplied platform analytics screenshots.</p>
    </div>
  );
}

function ProductPreview() {
  return (
    <div className="ap-home-product" aria-label="The Personal Brand company content workflow preview">
      <div className="ap-home-product-topbar">
        <div className="ap-home-product-brand"><span className="ap-home-mark">P</span> The Personal Brand</div>
        <span className="ap-home-live"><i /> Team workspace</span>
      </div>
      <div className="ap-home-product-shell">
        <aside className="ap-home-product-nav">
          <span className="is-current">Overview</span>
          <span>Signals</span>
          <span>Campaigns</span>
          <span>Library</span>
        </aside>
        <div className="ap-home-product-content">
          <div className="ap-home-product-title"><div><small>COMPANY CONTENT OPS</small><strong>Turn a signal into a campaign</strong></div><span className="ap-home-avatar">AP</span></div>
          <article className="ap-home-signal-card">
            <div className="ap-home-signal-meta"><span>Category pulse · India</span><span>Brand-ready</span></div>
            <h3>What should your company have an opinion on this week?</h3>
            <p>One useful signal becomes a clear angle, reviewable content and a distribution plan for your team.</p>
            <div className="ap-home-signal-foot"><span>Source attached</span><b>Ready for review</b></div>
          </article>
          <div className="ap-home-format-row">
            <span><FileText size={15} /> Executive post</span><span><Images size={15} /> Carousel</span><span><Sparkles size={15} /> Video brief</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompanyWorkflowPanel() {
  return (
    <section className="ap-home-company-section" aria-label="How The Personal Brand works for companies">
      <div className="ap-home-container ap-home-company-grid">
        <Reveal className="ap-home-company-copy">
          <p className="ap-home-kicker"><span /> BUILT FOR FOUNDER-LED COMPANIES</p>
          <h2>You have the expertise. We run the personal-brand engine.</h2>
          <p>You keep building the business. The Personal Brand turns your knowledge, customer questions and market signals into a connected content workflow your team can actually run.</p>
          <div className="ap-home-company-proof"><span><Check size={15} /> Your brand guardrails</span><span><Check size={15} /> Review-ready outputs</span><span><Check size={15} /> Multi-format production</span></div>
          <a className="ap-home-inline-link" href={DEMO_MAILTO}>Book a tailored demo <ArrowRight size={16} /></a>
        </Reveal>
        <Reveal className="ap-home-company-board">
          <div className="ap-home-company-board-head"><span><i /> CONTENT OPERATING SYSTEM</span><b>WEEKLY CYCLE</b></div>
          <div className="ap-home-company-workflow">
            {companyWorkflow.map(({ number, label, title, copy, icon: Icon }, index) => (
              <article key={number} className="ap-home-company-workflow-card">
                <div className="ap-home-company-workflow-top"><span>{number}</span><small>{label}</small><Icon size={17} strokeWidth={1.8} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
                {index < companyWorkflow.length - 1 && <span className="ap-home-company-connector" aria-hidden="true">→</span>}
              </article>
            ))}
          </div>
          <div className="ap-home-company-board-foot"><span><i /> Brand context connected</span><span><i /> Human approval in control</span><span><i /> Insights loop back</span></div>
        </Reveal>
      </div>
    </section>
  );
}

function CarouselPreview() {
  return (
    <div className="ap-home-carousel-preview" aria-label="Carousel creation preview">
      <div className="ap-home-carousel-head"><span>CAROUSEL STUDIO</span><span>3 slides · Ready to edit</span></div>
      <div className="ap-home-carousel-slides">
        <article className="ap-home-slide ap-home-slide-main"><small>01 / THE HOOK</small><h3>Your next post does not begin with AI.</h3><p>It begins with something worth saying.</p></article>
        <article className="ap-home-slide"><small>02 / THE ANGLE</small><h3>Expertise needs a point of view.</h3></article>
        <article className="ap-home-slide"><small>03 / THE CLOSE</small><h3>Build the audience before you need it.</h3></article>
      </div>
      <div className="ap-home-carousel-footer"><span>1080 × 1080</span><span className="ap-home-ready"><Check size={14} /> Export ready</span></div>
    </div>
  );
}

function FounderProblemSolver() {
  const [activeProblem, setActiveProblem] = useState(0);
  const selected = founderProblems[activeProblem];
  const SelectedIcon = selected.icon;

  return (
    <div className="ap-home-problem-ui">
      <div className="ap-home-problem-list" role="tablist" aria-label="Founder problems">
        {founderProblems.map((problem, index) => (
          <button
            key={problem.number}
            type="button"
            role="tab"
            aria-selected={activeProblem === index}
            className={`ap-home-problem-tab ${activeProblem === index ? 'is-active' : ''}`}
            onClick={() => setActiveProblem(index)}
          >
            <span className="ap-home-problem-tab-number">{problem.number}</span>
            <span className="ap-home-problem-tab-copy"><strong>{problem.problem}</strong><small>{problem.label}</small></span>
            <ArrowRight size={17} />
          </button>
        ))}
      </div>
      <div className="ap-home-problem-console" role="tabpanel">
        <div className="ap-home-problem-console-bar"><span><i /> THE PERSONAL BRAND / FOUNDER CONTROL ROOM</span><span>LIVE WORKFLOW</span></div>
        <div className="ap-home-problem-console-body" key={selected.number}>
          <div className="ap-home-problem-console-heading"><span className="ap-home-problem-icon"><SelectedIcon size={20} strokeWidth={1.7} /></span><div><small>{selected.label}</small><strong>Problem → system → outcome</strong></div><span className="ap-home-problem-status">ACTIVE</span></div>
          <h3>{selected.problem}</h3>
          <div className="ap-home-problem-map" aria-label="How The Personal Brand solves this founder problem">
            <article className="ap-home-problem-map-card is-input">
              <div className="ap-home-problem-map-label"><span><Users size={16} /></span><small>01 / FOUNDER INPUT</small></div>
              <p>{selected.bring}</p>
            </article>
            <span className="ap-home-problem-map-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
            <article className="ap-home-problem-map-card is-engine">
              <div className="ap-home-problem-map-label"><span><Sparkles size={16} /></span><small>02 / PERSONAL BRAND ENGINE</small></div>
              <p>{selected.autopilot}</p>
              <div className="ap-home-problem-map-chips"><span>Research</span><span>Voice</span><span>Formats</span></div>
            </article>
            <span className="ap-home-problem-map-arrow" aria-hidden="true"><ArrowRight size={18} /></span>
            <article className="ap-home-problem-map-card is-output">
              <div className="ap-home-problem-map-label"><span><CheckCircle2 size={16} /></span><small>03 / BUSINESS OUTPUT</small></div>
              <strong>{selected.output}</strong>
              <span className="ap-home-problem-map-ready"><Check size={14} /> Ready to use</span>
            </article>
          </div>
          <div className="ap-home-problem-solvebar"><span><i /> No agency handoffs</span><span><i /> One connected workspace</span><span><i /> Learns every cycle</span></div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="ap-home">
      <header className="ap-home-nav-wrap">
        <nav className="ap-home-nav" aria-label="Main navigation">
          <Link className="ap-home-logo" href="/"><span>✦</span> The Personal Brand</Link>
          <div className="ap-home-nav-links"><a href="#journey">Journey</a><a href="#founder-problems">Problems solved</a><a href="#results">Proof</a><a href="#video-studio">Video workflow</a><a href={DEMO_MAILTO}>Contact us</a></div>
          <div className="ap-home-nav-actions"><a className="ap-home-login" href={DEMO_MAILTO}>Book a demo</a><Link className="ap-home-btn ap-home-btn-small" href="/dashboard">Owner sign in</Link></div>
        </nav>
      </header>

      <section className="ap-home-hero">
        <div className="ap-home-gridlines" aria-hidden="true" />
        <div className="ap-home-container ap-home-hero-grid">
          <Reveal className="ap-home-hero-copy">
            <p className="ap-home-kicker"><span /> ONE BRAND ENGINE FOR FOUNDERS &amp; COMPANIES</p>
            <h1>Build your personal brand. <em>Grow your company brand.</em></h1>
            <p className="ap-home-intro">Turn your expertise into posts, carousels, short videos and a content calendar—without a marketing team, video editors or a second full-time job.</p>
            <div className="ap-home-hero-actions"><a className="ap-home-btn" href={DEMO_MAILTO}>Build your content engine <ArrowRight size={18} /></a><a className="ap-home-text-link" href="#founder-problems">See how it works <ArrowDown /></a></div>
            <div className="ap-home-hero-assurance"><span><Check size={14} /> No marketing team required</span><span><Check size={14} /> No video editor handoffs</span><span><Check size={14} /> Personal + company brand</span></div>
          </Reveal>
          <Reveal className="ap-home-hero-product"><ProductPreview /></Reveal>
        </div>
      </section>

      <div className="ap-home-ticker" aria-label="The Personal Brand workflow">
        <div className="ap-home-ticker-track"><span>RESEARCH THE SIGNAL</span><i>✦</i><span>OWN THE COMPANY ANGLE</span><i>✦</i><span>CREATE THE CONTENT</span><i>✦</i><span>LEARN FROM PERFORMANCE</span><i>✦</i><span>RESEARCH THE SIGNAL</span><i>✦</i><span>OWN THE COMPANY ANGLE</span><i>✦</i><span>CREATE THE CONTENT</span><i>✦</i><span>LEARN FROM PERFORMANCE</span><i>✦</i></div>
      </div>

      <div id="company-workflow"><CompanyWorkflowPanel /></div>

      <section id="results" className="ap-home-results">
        <div className="ap-home-container">
          <Reveal className="ap-home-results-header"><p className="ap-home-kicker">THE NUMBERS DON&apos;T LIE</p><h2>Real clients. <em>Bigger results.</em></h2><p>Actual analytics from two client accounts, shown without names.</p></Reveal>
          <Reveal className="ap-home-results-statblock">
            <article className="ap-home-results-lead-stat">
              <p className="ap-home-results-stat-kicker">EVERY SINGLE MONTH</p>
              <strong><AnimatedMetric value={results[0].value} format={results[0].format} /></strong>
              <p>Instagram views generated by a clearer company content system.</p>
              <b>{results[0].change} <span>vs. previous period</span></b>
            </article>
            <div className="ap-home-results-support-stats">
              {results.slice(1, 4).map((result) => <article key={result.label} className="ap-home-results-support-stat"><div><span>{result.label}</span><b>{result.change}</b></div><strong><AnimatedMetric value={result.value} format={result.format} /></strong></article>)}
            </div>
          </Reveal>
          <Reveal className="ap-home-results-secondary-stats">
            {results.slice(4).map((result) => <article key={result.label} className="ap-home-results-secondary-stat"><span>{result.label}</span><strong><AnimatedMetric value={result.value} format={result.format} /></strong><b>{result.change}</b></article>)}
          </Reveal>
          <p className="ap-home-disclaimer">Anonymised client results from July to August 2026. Results vary by audience, niche and publishing consistency.</p>
          <Reveal><ActualClientResults /></Reveal>
          <Reveal className="ap-home-results-proof">
            <div className="ap-home-results-proof-images">
              <img className="ap-home-results-proof-main" src="/images/founder-signal-hero-v2.png" alt="Founder turning a market signal into a content idea" />
              <img className="ap-home-results-proof-small" src="/images/founder-studio-hero-v1.png" alt="Founder producing content in a studio" />
            </div>
            <div className="ap-home-results-proof-copy">
              <p className="ap-home-results-proof-label">WHAT THE NUMBERS REPRESENT</p>
              <h3>More than reach. A repeatable founder presence.</h3>
              <p>Research, perspective and production working together—so one strong idea can travel across formats and keep earning attention.</p>
              <div className="ap-home-results-proof-tags"><span>Signal</span><i>→</i><span>Story</span><i>→</i><span>Distribution</span></div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="ap-home-reel-section" aria-label="The Personal Brand approach">
        <div className="ap-home-container ap-home-reel-grid">
          <Reveal className="ap-home-reel-image">
            <div className="ap-home-reel-stamp">THE FOUNDER&apos;S EDGE <span>01 / 03</span></div>
            <div className="ap-home-reel-caption"><span>RESEARCH</span><span>POINT OF VIEW</span><span>PUBLISH</span></div>
          </Reveal>
          <Reveal className="ap-home-reel-copy">
            <p className="ap-home-kicker"><span /> BUILD IN PUBLIC, DELIBERATELY</p>
            <h2>Turn your market knowledge into a company point of view.</h2>
            <p>The Personal Brand turns the thinking already inside your business into a visible body of work—without adding another layer of content operations.</p>
            <div className="ap-home-reel-tags"><span>Live signals</span><span>Your angle</span><span>Ready to publish</span></div>
          </Reveal>
        </div>
      </section>

      <section id="product" className="ap-home-section ap-home-product-section">
        <div className="ap-home-container ap-home-story-grid">
          <Reveal className="ap-home-story-copy"><p className="ap-home-kicker"><span /> FROM SIGNAL TO SYSTEM</p><h2>Make your company&apos;s thinking easier to find.</h2><p>Content should not be a weekly scramble for ideas. The Personal Brand brings research, perspective and production into one simple rhythm.</p><Link className="ap-home-inline-link" href="/research/trends">Explore live research <ArrowRight size={16} /></Link></Reveal>
          <Reveal><CarouselPreview /></Reveal>
        </div>
        <div className="ap-home-container ap-home-steps">
          {steps.map(({ number, title, copy, icon: Icon }) => <Reveal key={number} className="ap-home-step"><div className="ap-home-step-num">{number}</div><Icon size={21} strokeWidth={1.7} /><h3>{title}</h3><p>{copy}</p></Reveal>)}
        </div>
      </section>

      <section id="founder-problems" className="ap-home-problem-section">
        <div className="ap-home-container">
          <Reveal className="ap-home-problem-heading"><p className="ap-home-kicker"><span /> THE COMPANY CONTENT PROBLEM, MADE PRACTICAL</p><h2>Marketing problems become one connected workflow.</h2><p>Pick the part of your content operation that feels stuck. The Personal Brand shows what your team brings, what the system handles and what you get back.</p></Reveal>
          <Reveal><FounderProblemSolver /></Reveal>
        </div>
      </section>

      <section id="video-studio" className="ap-home-video-section">
        <div className="ap-home-container ap-home-video-intro"><Reveal><p className="ap-home-kicker"><span /> VIDEO WORKFLOW</p><h2>One approved photo. A brand-ready video.</h2><p>Start with one portrait or product image. The Personal Brand turns it into a reviewed short video—without a camera crew, studio booking or editor handoff.</p><span className="ap-home-video-cta">Built into your content workflow <CheckCircle2 size={17} /></span></Reveal><Reveal className="ap-home-video-console"><div className="ap-home-video-console-top"><span><i /> VIDEO WORKFLOW</span><span>WORKSPACE / 01</span></div><div className="ap-home-video-console-main"><div className="ap-home-video-frame"><div className="ap-home-play"><Clapperboard size={18} /></div><span>YOUR IDEA, IN MOTION</span></div><div className="ap-home-video-details"><small>THE VIDEO WORKFLOW</small><strong>Human approval at every important step.</strong><p>Fact-checked prompts, selectable regeneration takes, identity-consistent clips and clean MP4 export.</p><div className="ap-home-video-chips"><span>Fact-checked</span><span>Approval first</span><span>MP4 export</span></div></div></div></Reveal></div>
        <div className="ap-home-container">
          <Reveal className="ap-home-video-infographic">
            <div className="ap-home-video-infographic-head"><div><p className="ap-home-kicker"><span /> ONE PHOTO TO SHORT VIDEO</p><h3>A simple production map for a founder-led brand.</h3></div><p>Your team supplies the face, product or idea. The workflow handles the creative production around it.</p></div>
            <div className="ap-home-video-map" role="list" aria-label="Video generation process">
              <article className="ap-home-video-map-node ap-home-video-map-source" role="listitem"><div className="ap-home-video-source-photo"><img src="/images/founder-studio-hero-v1.png" alt="Founder portrait used as a video input" /><span>YOUR ASSET</span></div><small>INPUT / 01</small><h4>Upload one approved photo</h4><p>A founder portrait, product shot or brand visual is enough to begin.</p></article>
              {videoProcessMap.map(({ number, label, title, copy, icon: Icon }, index) => <article key={number} className={`ap-home-video-map-node ${index === videoProcessMap.length - 1 ? 'is-last' : ''}`} role="listitem"><div className="ap-home-video-map-icon"><Icon size={19} strokeWidth={1.8} /></div><small>{label} / {number}</small><h4>{title}</h4><p>{copy}</p></article>)}
            </div>
            <div className="ap-home-video-proof-row"><span><CheckCircle2 size={16} /> No filming equipment</span><span><CheckCircle2 size={16} /> No large production team</span><span><CheckCircle2 size={16} /> No scattered edit handoffs</span></div>
            <div className="ap-home-video-distribution"><span>MADE FOR THE CHANNELS YOUR BUYERS ALREADY USE</span><div>{distributionChannels.map((channel) => <b key={channel}>{channel}</b>)}</div></div>
          </Reveal>
        </div>
        <div className="ap-home-container ap-home-video-steps">{videoSteps.map(({ number, title, copy, icon: Icon }) => <Reveal key={number} className="ap-home-video-step"><span className="ap-home-video-num">{number}</span><Icon size={20} strokeWidth={1.7} /><h3>{title}</h3><p>{copy}</p></Reveal>)}</div>
      </section>

      <section id="journey" className="ap-home-journey-section">
        <div className="ap-home-container">
          <Reveal className="ap-home-journey-intro">
            <p className="ap-home-kicker"><span /> THE ONE-STOP FOUNDER MARKETING SYSTEM</p>
            <h2>One idea.<br />A complete growth journey.</h2>
            <p>Research, create, publish and improve without stitching together a large marketing team. Every step feeds the next—and the learning loops back into the system.</p>
          </Reveal>

          <div className="ap-home-journey-map" aria-label="Founder marketing journey">
            <div className="ap-home-journey-spine" aria-hidden="true" />
            <div className="ap-home-journey-start" aria-hidden="true"><Sparkles size={18} /><span>Your expertise</span></div>
            {['Discover', 'Create', 'Distribute', 'Compound'].map((phase, phaseIndex) => {
              const leftStep = marketingJourney[phaseIndex * 2];
              const rightStep = marketingJourney[(phaseIndex * 2) + 1];
              const LeftIcon = leftStep.icon;
              const RightIcon = rightStep.icon;
              return (
              <Reveal key={phase} className="ap-home-journey-stage">
                <article className="ap-home-journey-node is-left">
                  <div className="ap-home-journey-node-top">
                    <span className="ap-home-journey-phase">{leftStep.phase}</span>
                    <span className="ap-home-journey-number">{leftStep.number}</span>
                  </div>
                  <span className="ap-home-journey-icon"><LeftIcon size={22} strokeWidth={1.7} /></span>
                  <h3>{leftStep.title}</h3>
                  <p>{leftStep.copy}</p>
                </article>
                <div className="ap-home-journey-hub" aria-hidden="true"><small>Stage {phaseIndex + 1}</small><strong>{phase}</strong></div>
                <article className="ap-home-journey-node is-right">
                  <div className="ap-home-journey-node-top">
                    <span className="ap-home-journey-phase">{rightStep.phase}</span>
                    <span className="ap-home-journey-number">{rightStep.number}</span>
                  </div>
                  <span className="ap-home-journey-icon"><RightIcon size={22} strokeWidth={1.7} /></span>
                  <h3>{rightStep.title}</h3>
                  <p>{rightStep.copy}</p>
                </article>
              </Reveal>
            )})}
            <Reveal className="ap-home-journey-destination">
              <span className="ap-home-journey-destination-icon"><Users size={23} strokeWidth={1.7} /></span>
              <div><small>THE OUTCOME</small><strong>Your founder brand compounds.</strong><p>One connected system turns your expertise into content, attention and learning.</p></div>
              <a className="ap-home-inline-link" href="#contact">Build your system <ArrowRight size={16} /></a>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="ap-home-visuals-section" aria-label="The founder content system">
        <div className="ap-home-container"><Reveal className="ap-home-visuals-heading"><p className="ap-home-kicker"><span /> THE WORK BEHIND THE WORK</p><h2>Ideas are human. The system makes them repeatable.</h2></Reveal><div className="ap-home-visual-grid">
          <Reveal className="ap-home-visual-card ap-home-visual-card-tall"><img src="/images/founder-editorial-v1.png" alt="Founder reviewing a content idea at a desk" /><figcaption><span className="ap-home-visual-icon"><PenLine size={16} /></span><div><strong>Keep the voice human</strong><p>Your perspective stays at the centre of every draft.</p></div></figcaption></Reveal>
          <Reveal className="ap-home-visual-card"><img src="/images/founder-worktable-v1.png" alt="Content planning worktable with notebook and laptop" /><figcaption><span className="ap-home-visual-icon"><Lightbulb size={16} /></span><div><strong>Make the thinking visible</strong><p>Turn rough notes into an angle people can share.</p></div></figcaption></Reveal>
          <Reveal className="ap-home-visual-card"><img src="/images/founder-collab-v1.png" alt="Founders reviewing a video storyboard together" /><figcaption><span className="ap-home-visual-icon"><Clapperboard size={16} /></span><div><strong>Ship it in more formats</strong><p>Post, carousel or reel—one idea travels further.</p></div></figcaption></Reveal>
        </div></div>
      </section>

      <section className="ap-home-section ap-home-features-section">
        <div className="ap-home-container"><Reveal className="ap-home-section-heading"><p className="ap-home-kicker"><span /> BUILT FOR THE WORK</p><h2>One place to make your point.</h2></Reveal><div className="ap-home-feature-grid">{features.map(({ title, copy, icon: Icon }, index) => <Reveal key={title} className={`ap-home-feature ap-home-feature-${index + 1}`}><Icon size={24} strokeWidth={1.6} /><h3>{title}</h3><p>{copy}</p><span>Explore <ArrowUpRight size={15} /></span></Reveal>)}</div></div>
      </section>

      <section id="contact" className="ap-home-custom-section">
        <div className="ap-home-container ap-home-custom-grid"><Reveal><p className="ap-home-kicker"><span /> CUSTOM FOR YOUR COMPANY</p><h2>One system. Shaped around your growth motion.</h2><p>Every company starts from a different place. Tell us your categories, channels, content volume, brand requirements and team structure—we will design the right rollout and quote.</p><a className="ap-home-btn" href={ROLLOUT_MAILTO}>Plan your company rollout <ArrowRight size={18} /></a></Reveal><Reveal className="ap-home-custom-card"><p className="ap-home-custom-label">WHAT SHAPES YOUR ROLLOUT</p><div className="ap-home-custom-options"><span><b>01</b> Content volume &amp; formats</span><span><b>02</b> Brands, markets &amp; channels</span><span><b>03</b> Review &amp; approval workflow</span><span><b>04</b> Team enablement &amp; support</span></div><div className="ap-home-custom-note"><Lightbulb size={17} /> Custom pricing and onboarding, shaped around how your team works.</div></Reveal></div>
      </section>

      <section className="ap-home-section ap-home-faq"><div className="ap-home-container ap-home-faq-grid"><Reveal><p className="ap-home-kicker"><span /> A FEW GOOD QUESTIONS</p><h2>Built around a founder&apos;s real week.</h2><p>You do not need more tools to manage or more time to publish. You need a dependable content system.</p></Reveal><Reveal className="ap-home-faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</Reveal></div></section>

      <section className="ap-home-final"><div className="ap-home-container ap-home-final-inner"><Reveal><p className="ap-home-kicker"><span /> YOUR EXPERTISE. AT SCALE.</p><h2>Make your company easier to trust, remember and choose.</h2><p>Put a connected content system behind the expertise your team already has.</p><a className="ap-home-btn ap-home-btn-light" href={DEMO_MAILTO}>Book a tailored demo <ArrowRight size={18} /></a><a className="ap-home-final-email" href={`mailto:${CONTACT_EMAIL}`}>Contact us: {CONTACT_EMAIL}</a></Reveal></div></section>

      <footer className="ap-home-footer"><div className="ap-home-container"><Link className="ap-home-logo" href="/"><span>✦</span> The Personal Brand</Link><p>One-stop personal brand systems for founders with expertise worth sharing.</p><div><Link href="/dashboard">Dashboard</Link><Link href="/research/trends">Research</Link><Link href="/carousel">Carousel Studio</Link></div></div></footer>
    </main>
  );
}

function ArrowDown() { return <span aria-hidden="true">↓</span>; }
