import { getOrders } from "../services/orderService.js";
import { getProducts } from "../services/productService.js";
import { requireAuth } from "../utils/auth.js";
import { escapeHtml, productImage } from "../utils/images.js";
import { initLayout } from "../utils/ui.js";

if (!requireAuth()) throw new Error("Authentication required");

initLayout();

const [orders, products] = await Promise.all([
  getOrders(),
  getProducts(),
]);

const ORDER_STAGES = [
  "Placed",
  "Confirmed",
  "Processing",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

function renderTimeline(status = "Placed") {
  const currentIndex = ORDER_STAGES.indexOf(status);

  return `
    <div class="timeline">
      ${ORDER_STAGES.map(
        (stage, index) => `
          <div class="timeline-step">
            <div class="timeline-marker ${
              index <= currentIndex ? "active" : ""
            }"></div>

            ${
              index < ORDER_STAGES.length - 1
                ? `<div class="timeline-line ${
                    index < currentIndex ? "active" : ""
                  }"></div>`
                : ""
            }

            <span class="timeline-label">
              ${escapeHtml(stage)}
            </span>
          </div>
        `
      ).join("")}
    </div>
  `;
}

document.getElementById("ordersList").innerHTML =
  orders.length > 0
    ? orders
        .map((order) => {
          const product = products.find(
            (item) => Number(item.id) === Number(order.product_id)
          );

          return `
            <article class="order-card">
              <div class="order-product">
                ${product ? productImage(product, "order-image") : ""}

                <div class="order-top">
                  <div>
                    <strong>#${order.id}</strong>

                    <p class="muted">
                      ${escapeHtml(product?.name || "Product")} |
                      $${order.total_price}
                    </p>
                  </div>

                  <span class="status">
                    ${escapeHtml(order.status || "Placed")}
                  </span>
                </div>
              </div>

              ${renderTimeline(order.status)}
            </article>
          `;
        })
        .join("")
    : `<div class="panel"><p>No orders found.</p></div>`;