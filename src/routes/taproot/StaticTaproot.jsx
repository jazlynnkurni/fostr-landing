// StaticTaproot.jsx — prefers-reduced-motion variant. No canvas, no camera motion:
// each panel is a static stacked section descending the depth palette, with the
// taproot fully grown as a continuous teal rule and questions as gold captions.
import Logo from "../../components/Logo.jsx";
import { PANELS, BUSINESS_LINE, DEMO_DOCS, TRACE_EXAMPLE } from "../../copy.js";

const mono = { fontFamily: "var(--font-inter)", fontWeight: 600 };

const BGS = ["#1E2624", "#7A614B", "#B8D7D6", "#4A3A2C", "#DFECEB", "#ECF4F3", "#FFFFFF", "#221A13"];
const FGS = ["#1E2624", "#F1EBE2", "#F1EBE2", "#F1EBE2", "#F1EBE2", "#F1EBE2", "#CFC5B8", "#F1EBE2"];

const ROOT_X = "clamp(20px, 6vw, 64px)";

function Rule({ withDot = true }) {
  return (
    <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: ROOT_X, width: 3, background: "var(--teal)" }}>
      {withDot && (
        <div
          style={{
            position: "absolute",
            top: "18vh",
            left: "50%",
            transform: "translate(-50%, 0)",
            width: 11,
            height: 11,
            borderRadius: "50%",
            background: "var(--teal)",
          }}
        />
      )}
    </div>
  );
}

function Caption({ text }) {
  if (!text) return null;
  return (
    <div
      style={{
        display: "inline-block",
        marginTop: 40,
        background: "var(--gold)",
        color: "#FFFFFF",
        borderRadius: 999,
        padding: "8px 16px",
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {text}
    </div>
  );
}

function Section({ i, children, root = true }) {
  return (
    <section
      style={{
        position: "relative",
        background: BGS[i],
        color: FGS[i],
        padding: "16vh 8vw 14vh",
        paddingLeft: `calc(${ROOT_X} + 8vw)`,
        borderBottom: i === 0 ? "2px solid var(--ink)" : "none",
        overflow: "hidden",
      }}
    >
      {root && <Rule />}
      {children}
      <Caption text={PANELS[i].tooltip} />
    </section>
  );
}

const h2Style = {
  fontWeight: 800,
  fontSize: "clamp(1.9rem, 5vw, 3.6rem)",
  lineHeight: 1.1,
  letterSpacing: "-0.02em",
  margin: 0,
  maxWidth: "22ch",
};

const cardStyle = {
  background: "rgba(255,255,255,0.5)",
  border: "1px solid rgba(30,38,36,0.16)",
  borderRadius: 10,
  padding: "14px 16px",
};

function Bars({ n = 3 }) {
  const widths = ["92%", "74%", "58%"];
  return (
    <div aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ height: 6, width: widths[i % 3], background: "rgba(30,38,36,0.2)", borderRadius: 3, marginBottom: 6 }} />
      ))}
    </div>
  );
}

export default function StaticTaproot() {
  return (
    <main style={{ background: "var(--bedrock)" }}>
      <header style={{ position: "absolute", top: 0, left: 0, zIndex: 2, padding: "20px 28px", color: "var(--ink)" }}>
        <Logo height={26} />
      </header>

      {/* 1 — hero, above ground */}
      <Section i={0} root={false}>
        <div style={{ paddingTop: "6vh" }}>
          <h1 style={{ ...h2Style, fontSize: "clamp(2.2rem, 6vw, 4.4rem)" }}>{PANELS[0].text}</h1>
        </div>
      </Section>

      {/* 2 — forms fossilized in the soil */}
      <Section i={1}>
        <h2 style={h2Style}>{PANELS[1].text}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, maxWidth: 620, marginTop: 36 }}>
          {[0, 1, 2].map((k) => (
            <div key={k} style={{ ...cardStyle, opacity: 0.75 }}>
              {["Name", "DOB", "Placement"].map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                  <span style={{ ...mono, fontSize: 10, opacity: 0.7 }}>{f}</span>
                  <span style={{ flex: 1, borderBottom: "1px dotted rgba(30,38,36,0.35)" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Section>

      {/* 3 — stillness */}
      <Section i={2}>
        <h2 style={{ ...h2Style, maxWidth: "24ch" }}>{PANELS[2].text}</h2>
      </Section>

      {/* 4 — the branch: four documents */}
      <Section i={3}>
        <h2 style={h2Style}>{PANELS[3].text}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, maxWidth: 760, marginTop: 36 }}>
          {DEMO_DOCS.map((title, i) => (
            <div key={title} style={cardStyle}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", color: "var(--teal)" }}>{`0${i + 1}`}</div>
              <div style={{ fontWeight: 700, fontSize: 14, margin: "6px 0 10px" }}>{title}</div>
              <Bars />
            </div>
          ))}
        </div>
      </Section>

      {/* 5 — the trace */}
      <Section i={4}>
        <h2 style={{ ...h2Style, fontSize: "clamp(1.4rem, 3.2vw, 2.2rem)", maxWidth: "40ch" }}>{PANELS[4].text}</h2>
        <div style={{ maxWidth: 560, marginTop: 36 }}>
          <div style={{ ...cardStyle, borderLeft: "2px solid var(--teal)" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: "var(--teal)", marginBottom: 8 }}>{TRACE_EXAMPLE.provenance}</div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55 }}>{TRACE_EXAMPLE.sourceNote}</p>
          </div>
          <div aria-hidden style={{ width: 2, height: 44, background: "var(--teal)", marginLeft: 26 }} />
          <div style={{ ...cardStyle }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", color: "var(--teal)", marginBottom: 8 }}>
              {`${DEMO_DOCS[2].toUpperCase()} · DRAFT`}
            </div>
            <Bars n={2} />
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.55 }}>
              <span style={{ background: "rgba(93,161,161,0.28)", borderRadius: 3, padding: "1px 4px" }}>{TRACE_EXAMPLE.filingLine}</span>
            </p>
          </div>
        </div>
      </Section>

      {/* 6 — lateral galleries + the business line */}
      <Section i={5}>
        <h2 style={h2Style}>{PANELS[5].text}</h2>
        <div style={{ display: "flex", gap: 40, marginTop: 30, ...mono, fontSize: 11, letterSpacing: "0.2em", color: "rgba(93,161,161,0.55)" }}>
          <span>group homes</span>
          <span>elder care</span>
        </div>
        <div style={{ marginTop: 44 }}>
          <div aria-hidden style={{ width: 1, height: 30, background: "rgba(30,38,36,0.35)", marginBottom: 12 }} />
          <div style={{ ...mono, fontSize: 12, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(30,38,36,0.75)" }}>
            {BUSINESS_LINE}
          </div>
        </div>
      </Section>

      {/* 7 — the seed */}
      <Section i={6}>
        <div aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: "#2E241C", border: "1px solid #3A2E24", marginBottom: 30 }} />
        <p style={{ fontWeight: 400, fontSize: 17, lineHeight: 1.7, maxWidth: "34ch", margin: 0 }}>{PANELS[6].text}</p>
        <p style={{ color: "var(--gold)", fontSize: 13, marginTop: 22 }}>{`— ${PANELS[6].attribution}`}</p>
      </Section>

      {/* 8 — germination + CTA */}
      <Section i={7} root={false}>
        <svg viewBox="112 122 32 20" width="60" aria-hidden style={{ overflow: "visible", display: "block", marginBottom: 26 }}>
          <path d="M128.571 140V131.952C127.175 129.999 121.029 125.903 116 127.619" stroke="var(--teal)" strokeWidth="4.19" fill="none" />
          <path d="M128.571 131.952C130.899 129.222 137.79 125.698 141.143 127.485" stroke="var(--teal)" strokeWidth="4.19" fill="none" />
        </svg>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ background: "var(--teal)", color: "#0F1B1A", fontWeight: 700, padding: "14px 26px", borderRadius: 999, textDecoration: "none", fontSize: 15 }}
          >
            {PANELS[7].text}
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{ border: "1px solid rgba(30,38,36,0.45)", color: "var(--paper)", fontWeight: 600, padding: "14px 26px", borderRadius: 999, textDecoration: "none", fontSize: 15 }}
          >
            {PANELS[7].secondary}
          </a>
        </div>
      </Section>
    </main>
  );
}
