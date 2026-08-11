import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import "./Settings.css";

interface TenantDetail {
  ourStory: string;
  domain?: { name?: string; status?: string };
  branding: {
    logoUrl: string;
    primaryColor: string;
    secondaryColor: string;
    theme: string;
  };
}

// Tier order, lowest to highest. "bumpa" is the top plan.
const PLAN_TIERS = ["free", "growth", "pro", "bumpa"];
const EJS_APP_BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/api\/?$/, "");
const UPGRADE_URL = `${EJS_APP_BASE}/multitenant/new-compare-plans`;

function planRank(plan?: string) {
  const i = PLAN_TIERS.indexOf(plan || "free");
  return i === -1 ? 0 : i;
}

export default function Settings() {
  const { tenant } = useAuth();
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0d9488");
  const [secondaryColor, setSecondaryColor] = useState("#111827");
  const [ourStory, setOurStory] = useState("");
  const [domainName, setDomainName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) return;
    api
      .post("/tenant-auth/get-one-tenant", { tenantId: tenant.tenantId })
      .then((res) => {
        const t: TenantDetail = res.data.tenant;
        setLogoUrl(t.branding?.logoUrl || "");
        setPrimaryColor(t.branding?.primaryColor || "#0d9488");
        setSecondaryColor(t.branding?.secondaryColor || "#111827");
        setOurStory(t.ourStory || "");
        setDomainName(t.domain?.name || null);
      })
      .catch(() => setError("Couldn't load settings."))
      .finally(() => setLoading(false));
  }, [tenant]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api.post("/tenant-auth/update-branding", {
        logoUrl,
        primaryColor,
        secondaryColor,
        ourStory,
      });
      setSaved(true);
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="products-page">
        <div className="page-header">
          <h1>Settings</h1>
        </div>
        <div className="card">
          <div className="empty-state">Loading…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-sub">Store branding &amp; details</p>
        </div>
      </div>

      <form className="card settings-card" onSubmit={handleSubmit}>
        <div className="settings-section">
          <h3>Store</h3>
          <dl className="info-list">
            <div>
              <dt>Name</dt>
              <dd>{tenant?.slug}</dd>
            </div>
            <div>
              <dt>Plan</dt>
              <dd>{tenant?.plan}</dd>
            </div>
          </dl>
        </div>

        <div className="settings-section">
          <h3>Domain</h3>
          {(() => {
            const rank = planRank(tenant?.plan);
            const isTopTier = rank === PLAN_TIERS.length - 1;

            if (rank === 0) {
              // Free plan: no domain access at all, straight upsell.
              return (
                <div className="domain-card domain-card-upsell">
                  <p>Custom domains are available from the Growth plan and up.</p>
                  <a className="btn btn-primary" href={UPGRADE_URL} target="_blank" rel="noreferrer">
                    Upgrade plan
                  </a>
                </div>
              );
            }

            if (!domainName) {
              // Paid plan (any tier), no domain configured yet.
              return (
                <div className="domain-card">
                  <p>No custom domain connected yet.</p>
                  <a className="btn btn-primary" href={`${EJS_APP_BASE}/multitenant/select-domain`} target="_blank" rel="noreferrer">
                    Set up custom domain
                  </a>
                </div>
              );
            }

            // Has a domain already.
            return (
              <div className="domain-card">
                <p>
                  Connected domain: <strong>{domainName}</strong>
                </p>
                {!isTopTier && (
                  <a className="btn btn-secondary" href={UPGRADE_URL} target="_blank" rel="noreferrer">
                    Upgrade for more
                  </a>
                )}
              </div>
            );
          })()}
        </div>

        <div className="settings-section">
          <h3>Branding</h3>

          <label className="field">
            <span>Logo URL</span>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Primary color</span>
              <div className="color-field">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
              </div>
            </label>
            <label className="field">
              <span>Secondary color</span>
              <div className="color-field">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
                <input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
              </div>
            </label>
          </div>

          <label className="field">
            <span>Our story</span>
            <textarea rows={3} value={ourStory} onChange={(e) => setOurStory(e.target.value)} />
          </label>
        </div>

        {error && <div className="login-error">{error}</div>}
        {saved && <div className="settings-saved">Saved.</div>}

        <div className="modal-footer settings-footer">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
