import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Order } from "../types";
import "./Orders.css";

const STATUS_OPTIONS: Order["status"][] = ["processing", "shipped", "delivered", "cancelled"];

function statusPillClass(status: Order["status"]) {
  switch (status) {
    case "delivered":
      return "pill-ok";
    case "cancelled":
      return "pill-danger";
    case "shipped":
      return "pill-warn";
    default:
      return "pill-muted";
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Order[]>("/orders")
      .then((res) => setOrders(res.data))
      .catch(() => setError("Couldn't load orders."))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(order: Order, status: Order["status"]) {
    setUpdatingId(order._id);
    try {
      const { data } = await api.put(`/orders/${order._id}`, { status });
      setOrders((prev) => prev.map((o) => (o._id === order._id ? data : o)));
    } catch {
      alert("Failed to update order status.");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="page-sub">
            {orders.length} order{orders.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : error ? (
          <div className="empty-state empty-state-error">{error}</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Placed</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id}>
                  <td className="order-id">#{o.orderId.slice(0, 8)}</td>
                  <td>
                    <div className="product-name">{o.customer?.name || "—"}</div>
                    <div className="product-desc">{o.customer?.email}</div>
                  </td>
                  <td>{o.items?.length || 0}</td>
                  <td>₦{Number(o.totalAmount).toLocaleString()}</td>
                  <td>
                    <span
                      className={`pill ${
                        o.paymentStatus === "paid"
                          ? "pill-ok"
                          : o.paymentStatus === "failed"
                          ? "pill-danger"
                          : "pill-warn"
                      }`}
                    >
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <select
                      className={`status-select ${statusPillClass(o.status)}`}
                      value={o.status}
                      disabled={updatingId === o._id}
                      onChange={(e) => handleStatusChange(o, e.target.value as Order["status"])}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
