import { useState, type ReactNode } from "react";

type IconName =
  | "arrow"
  | "book"
  | "chevron"
  | "clock"
  | "gear"
  | "home"
  | "instagram"
  | "leaf"
  | "lock"
  | "pause"
  | "shield"
  | "youtube";

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<IconName, ReactNode> = {
    arrow: (
      <>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </>
    ),
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
        <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z" />
      </>
    ),
    chevron: <path d="m8 10 4 4 4-4" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.4v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-1.5-1H2V10h.1A1.7 1.7 0 0 0 3.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06L6.06 4.2l.06.06A1.7 1.7 0 0 0 8 4.6a1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10M9 20v-6h6v6" />
      </>
    ),
    instagram: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r=".7" fill="currentColor" stroke="none" />
      </>
    ),
    leaf: (
      <>
        <path d="M20 4C12 4 5 8 5 14c0 3 2 5 5 5 6 0 10-7 10-15Z" />
        <path d="M4 21c2-5 6-8 11-11" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
    pause: (
      <>
        <rect x="6" y="5" width="4" height="14" rx="1" />
        <rect x="14" y="5" width="4" height="14" rx="1" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.7 3.1 8.3 7.5 9.5 4.4-1.2 7.5-4.8 7.5-9.5V6L12 3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    youtube: (
      <>
        <path d="M21 8.1a3 3 0 0 0-2.1-2.15C17.05 5.45 12 5.45 12 5.45s-5.05 0-6.9.5A3 3 0 0 0 3 8.1a31 31 0 0 0-.5 3.9 31 31 0 0 0 .5 3.9 3 3 0 0 0 2.1 2.15c1.85.5 6.9.5 6.9.5s5.05 0 6.9-.5A3 3 0 0 0 21 15.9a31 31 0 0 0 .5-3.9 31 31 0 0 0-.5-3.9Z" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <img className="logo-mark" src="/unscroller-mark.png" alt="UnScroller" />
      {!compact && <span>UnScroller</span>}
    </div>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      className={`switch ${checked ? "is-on" : ""}`}
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
    >
      <span />
    </button>
  );
}

function ScreenShell({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <section className={`phone ${className}`} aria-label={label}>
      <div className="phone-speaker" />
      <div className="phone-content">{children}</div>
    </section>
  );
}

function OnboardingScreen() {
  const [granted, setGranted] = useState(false);

  return (
    <ScreenShell label="Onboarding and permission screen" className="onboarding">
      <header className="screen-header">
        <Logo />
      </header>
      <main className="permission-main">
        <div className="permission-visual" aria-hidden="true">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="shield-core">
            <Icon name={granted ? "shield" : "lock"} size={28} />
          </div>
        </div>
        <div className={`status-chip ${granted ? "success" : ""}`}>
          <span className="status-dot" />
          Accessibility Permission: {granted ? "Enabled" : "Disabled"}
        </div>
        <div className="intro-copy">
          <p className="eyebrow">ONE SMALL STEP</p>
          <h1>Protect your attention.</h1>
          <p>
            To detect and automatically close Shorts and Reels, we need Accessibility permission.
            Your data stays 100% private on your device.
          </p>
        </div>
      </main>
      <footer className="permission-footer">
        <button className="primary-button" onClick={() => setGranted(true)}>
          {granted ? "Permission Granted" : "Grant Permission"}
          <Icon name={granted ? "shield" : "arrow"} size={19} />
        </button>
        <button className="text-button">Why do we need this?</button>
        <p className="privacy-note">
          <Icon name="lock" size={13} /> Nothing leaves your phone
        </p>
      </footer>
    </ScreenShell>
  );
}

function TargetRow({
  type,
  title,
  enabled,
  onToggle,
  mode,
  onMode,
}: {
  type: "youtube" | "instagram";
  title: string;
  enabled: boolean;
  onToggle: () => void;
  mode: "tabs" | "app";
  onMode: (mode: "tabs" | "app") => void;
}) {
  return (
    <div className={`target-row ${enabled ? "" : "disabled"}`}>
      <div className="target-heading">
        <div className={`app-icon ${type}`}>
          <Icon name={type} size={22} />
        </div>
        <div>
          <strong>{title}</strong>
          <span>{enabled ? "Blocking now" : "Not blocked"}</span>
        </div>
        <Switch checked={enabled} onChange={onToggle} label={`Toggle ${title}`} />
      </div>
      <div className="mini-segment" aria-label={`${title} blocking scope`}>
        <button className={mode === "tabs" ? "active" : ""} onClick={() => onMode("tabs")}>
          Just {type === "youtube" ? "Shorts" : "Reels"}
        </button>
        <button className={mode === "app" ? "active" : ""} onClick={() => onMode("app")}>
          Entire App
        </button>
      </div>
    </div>
  );
}

function DashboardScreen() {
  const [active, setActive] = useState(true);
  const [youtube, setYoutube] = useState(true);
  const [instagram, setInstagram] = useState(true);
  const [youtubeMode, setYoutubeMode] = useState<"tabs" | "app">("tabs");
  const [instagramMode, setInstagramMode] = useState<"tabs" | "app">("tabs");

  return (
    <ScreenShell label="Active blocker dashboard">
      <header className="top-bar">
        <Logo />
        <button className="icon-button" aria-label="Open settings">
          <Icon name="gear" size={21} />
        </button>
      </header>
      <main>
        <div className={`master-card ${active ? "active" : ""}`}>
          <div className="master-top">
            <div>
              <p className="eyebrow">MASTER BLOCKER</p>
              <h2>{active ? "You’re protected" : "Protection paused"}</h2>
            </div>
            <Switch
              checked={active}
              onChange={() => setActive(!active)}
              label="Toggle master blocker"
            />
          </div>
          <div className="active-status">
            <span />
            {active ? "Active — Watching for Shorts and Reels" : "Inactive — Blocking is paused"}
          </div>
        </div>

        <div className="section-heading">
          <h3>Block Targets</h3>
          <span>2 active</span>
        </div>
        <div className="targets-card">
          <TargetRow
            type="youtube"
            title="Block YouTube Shorts"
            enabled={youtube}
            onToggle={() => setYoutube(!youtube)}
            mode={youtubeMode}
            onMode={setYoutubeMode}
          />
          <TargetRow
            type="instagram"
            title="Block Instagram Reels"
            enabled={instagram}
            onToggle={() => setInstagram(!instagram)}
            mode={instagramMode}
            onMode={setInstagramMode}
          />
        </div>

        <div className="stats-card">
          <div className="stats-title">
            <span>Today’s impact</span>
            <div className="trend">+18%</div>
          </div>
          <div className="stats-grid">
            <div>
              <strong>14</strong>
              <span>Blocks today</span>
            </div>
            <div>
              <strong>~42</strong>
              <span>Mins saved</span>
            </div>
          </div>
          <div className="progress">
            <span />
          </div>
          <p>42 of your 60 minute focus goal</p>
        </div>
      </main>
    </ScreenShell>
  );
}

type Action = "home" | "redirect" | "pause";

function ConfigurationScreen() {
  const [action, setAction] = useState<Action>("home");
  const [duration, setDuration] = useState("15 Mins");
  const [friction, setFriction] = useState(true);
  const [paused, setPaused] = useState(false);

  const choices: { id: Action; title: string; copy: string; icon: IconName }[] = [
    { id: "home", title: "Kick to Home Screen", copy: "Close the feed immediately", icon: "home" },
    {
      id: "redirect",
      title: "Redirect to Productive App",
      copy: "Swap the impulse for a better habit",
      icon: "book",
    },
    {
      id: "pause",
      title: "Show Mindful Pause Screen",
      copy: "A 5-second breathing reset",
      icon: "leaf",
    },
  ];

  return (
    <ScreenShell label="Configuration and emergency bypass screen">
      <header className="top-bar settings-title">
        <div>
          <p className="eyebrow">PREFERENCES</p>
          <h2>Configure</h2>
        </div>
        <button className="icon-button" aria-label="Close settings">
          ×
        </button>
      </header>
      <main>
        <div className="section-heading">
          <h3>Interception Action</h3>
          <span>When detected</span>
        </div>
        <div className="choice-list">
          {choices.map((choice) => (
            <button
              key={choice.id}
              className={`choice ${action === choice.id ? "selected" : ""}`}
              onClick={() => setAction(choice.id)}
            >
              <div className="choice-icon">
                <Icon name={choice.icon} size={20} />
              </div>
              <div>
                <strong>{choice.title}</strong>
                <span>{choice.copy}</span>
              </div>
              <i />
            </button>
          ))}
          {action === "redirect" && (
            <button className="app-dropdown">
              Kindle <Icon name="chevron" size={16} />
            </button>
          )}
        </div>

        <div className="divider" />
        <div className="section-heading bypass-heading">
          <h3>Emergency Bypass</h3>
          <span>Temporary access</span>
        </div>
        <div className="bypass-card">
          <div className="bypass-icon">
            <Icon name={paused ? "clock" : "pause"} size={22} />
          </div>
          <div className="bypass-copy">
            <strong>{paused ? `Paused for ${duration}` : "Pause Blocker for..."}</strong>
            <span>
              {paused ? "Tap again to resume early" : "Choose a short, intentional break"}
            </span>
          </div>
          <button className="outline-button" onClick={() => setPaused(!paused)}>
            {paused ? "Resume" : "Pause"}
          </button>
          <div className="duration-segment">
            {["5 Mins", "15 Mins", "1 Hour"].map((item) => (
              <button
                key={item}
                className={duration === item ? "active" : ""}
                onClick={() => setDuration(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="friction-row">
          <div className="friction-icon">
            <Icon name="lock" size={18} />
          </div>
          <div>
            <strong>Friction Lock</strong>
            <span>Require a code to disable</span>
          </div>
          <Switch
            checked={friction}
            onChange={() => setFriction(!friction)}
            label="Toggle friction lock"
          />
        </div>
      </main>
      <p className="settings-footnote">Changes are saved automatically</p>
    </ScreenShell>
  );
}

const screens = [
  { label: "Permission", component: <OnboardingScreen /> },
  { label: "Dashboard", component: <DashboardScreen /> },
  { label: "Configure", component: <ConfigurationScreen /> },
];

export default function App() {
  const [mobileScreen, setMobileScreen] = useState(1);

  return (
    <div className="app">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <header className="showcase-header">
        <div>
          <p className="eyebrow">UNSCROLLER · DIGITAL WELLBEING</p>
          <h1>Less scroll. More life.</h1>
        </div>
        <p>A calmer way to protect your attention.</p>
      </header>
      <nav className="screen-tabs" aria-label="Preview screens">
        {screens.map((screen, index) => (
          <button
            key={screen.label}
            onClick={() => setMobileScreen(index)}
            className={mobileScreen === index ? "active" : ""}
          >
            {screen.label}
          </button>
        ))}
      </nav>
      <div className="screen-grid">
        {screens.map((screen, index) => (
          <div key={screen.label} className={mobileScreen === index ? "mobile-visible" : ""}>
            {screen.component}
          </div>
        ))}
      </div>
    </div>
  );
}
