import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api/client";
import "./Overview.css";

export default function Overview() {
  const { tenant, owner } = useAuth();
  const [productCount, setProductCount] = useState<number | null>(null);
  const [customerCount, setCustomerCount] = useState<number | null>(null);

  useEffect(() => {
    if (!tenant) return;
    api
      .post("/products/by-tenant", { tenantId: tenant.tenantId })
      .then((res) => setProductCount(res.data.products?.length ?? 0))
      .catch(() => setProductCount(0));

    api
      .get("/customers")
      .then((res) => setCustomerCount(res.data.count ?? 0))
      .catch(() => setCustomerCount(0));
  }, [tenant]);

  const domainLabel =
    typeof tenant?.domain === "string" ? tenant?.domain : tenant?.domain?.name;

  return (
    <div className="overview">
      <div className="overview-header">
        <div>
          <h1>Welcome back{owner?.email ? `, ${owner.email.split("@")[0]}` : ""}</h1>
          <p className="overview-sub">Here's what's happening with your store.</p>
        </div>
        {tenant?.url && (
          <a href={tenant.url} target="_blank" rel="noreferrer" className="btn btn-primary">
            View store ↗
          </a>
        )}
      </div>

      <div className="stat-grid">
        <div className="card stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{productCount ?? "…"}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{customerCount ?? "…"}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Plan</div>
          <div className="stat-value stat-value-text">{tenant?.plan || "free"}</div>
        </div>
      </div>

      <div className="card info-card">
        <h3>Store details</h3>
        <dl className="info-list">
          <div>
            <dt>Store URL</dt>
            <dd>
              <a href={tenant?.url} target="_blank" rel="noreferrer">
                {tenant?.url}
              </a>
            </dd>
          </div>
          <div>
            <dt>Slug</dt>
            <dd>{tenant?.slug}</dd>
          </div>
          {domainLabel && (
            <div>
              <dt>Custom domain</dt>
              <dd>{domainLabel}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
