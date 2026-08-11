import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Customer } from "../types";

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/customers")
      .then((res) => setCustomers(res.data.customers || []))
      .catch(() => setError("Couldn't load customers."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p className="page-sub">
            {customers.length} customer{customers.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state empty-state-error">{error}</div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <p>No customers yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c._id}>
                  <td>{c.name || "—"}</td>
                  <td>{c.email}</td>
                  <td>{c.phoneNumber || "—"}</td>
                  <td>
                    <span className={`pill ${c.isVerified ? "pill-ok" : "pill-muted"}`}>
                      {c.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </td>
                  <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
