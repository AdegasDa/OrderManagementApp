import "dotenv/config";
import { createClient } from "@libsql/client";

const db = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const CLOSED = new Set([0, 1]); // Sun, Mon

function getWorkingDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < n) {
    if (!CLOSED.has(d.getDay())) days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function cuid() {
  return "c" + Math.random().toString(36).slice(2, 13) + Date.now().toString(36);
}

const clients = [
  "seed-client-ana-ferreira",
  "seed-client-bruno-martins",
  "seed-client-carla-sousa",
  "seed-client-david-oliveira",
  "seed-client-elsa-rodrigues",
  "seed-client-filipe-costa",
  "seed-client-gabriela-nunes",
  "seed-client-hélder-santos",
  "seed-client-inês-carvalho",
  "seed-client-joão-pereira",
  "seed-client-kátia-lopes",
  "cmpzxn1hz000104jumle3hhoq",
];

const products = [
  { id: "seed-product-camisola-personalizada", price: 24.99 },
  { id: "seed-product-caneca-sublimada",       price: 12.50 },
  { id: "seed-product-almofada-foto",          price: 18.00 },
  { id: "seed-product-quadro-acrílico",        price: 35.00 },
  { id: "seed-product-porta-chaves-gravado",   price:  8.99 },
  { id: "seed-product-puzzle-personalizado",   price: 22.00 },
  { id: "seed-product-t-shirt-manga-curta",    price: 19.99 },
  { id: "seed-product-calendário-de-parede",   price: 15.00 },
  { id: "seed-product-tote-bag-estampada",     price: 11.50 },
  { id: "seed-product-boné-bordado",           price: 16.99 },
];

const statuses = [
  "cmpy4l25u0004iovxz1cy47vs", // A confirmar
  "cmpy4l2jq0005iovxa8dfi71s", // Em Progresso
  "cmpy4l2uw0006iovxnvm6k8jo", // Pronto
];

const payments = [
  "cmpy4l0jt0000iovxviuys0lj", // Numerário
  "cmpy4l1070001iovxmh4ox38o", // Cartão
  "cmpy4l1h40002iovxspn6dcjo", // Transferência
  "cmpy4l1ur0003iovxtgwp6s7x", // MB Way
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

// 2–4 orders per day
const ordersPerDay = [3, 2, 4, 2, 3, 2, 3];

async function main() {
  const { rows } = await db.execute(`SELECT MAX(orderNumber) as max FROM orders`);
  let nextNum = ((rows[0].max as number) ?? 0) + 1;

  const days = getWorkingDays(7);

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const count = ordersPerDay[i];

    for (let j = 0; j < count; j++) {
      const orderId = cuid();
      const client  = pick(clients);
      const prod1   = pick(products);
      // occasionally add a second product
      const extraProd = Math.random() > 0.6 ? pick(products.filter(p => p.id !== prod1.id)) : null;
      const qty1    = Math.random() > 0.7 ? 2 : 1;
      const qty2    = 1;
      const deliveryFee = Math.random() > 0.6 ? 5 : 0;
      const total   = +(prod1.price * qty1 + (extraProd ? extraProd.price * qty2 : 0) + deliveryFee).toFixed(2);
      const advance = Math.random() > 0.5 ? +(total * 0.5).toFixed(2) : 0;
      const status  = pick(statuses);
      const payment = pick(payments);

      await db.execute({
        sql: `INSERT INTO orders (id, orderNumber, orderDate, clientId, paymentTypeId, statusId, totalValue, advanceAmount, deliveryFee, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [orderId, nextNum++, day + "T12:00:00.000Z", client, payment, status, total, advance, deliveryFee],
      });

      await db.execute({
        sql: `INSERT INTO order_products (id, orderId, productId, quantity) VALUES (?, ?, ?, ?)`,
        args: [cuid(), orderId, prod1.id, qty1],
      });

      if (extraProd) {
        await db.execute({
          sql: `INSERT INTO order_products (id, orderId, productId, quantity) VALUES (?, ?, ?, ?)`,
          args: [cuid(), orderId, extraProd.id, qty2],
        });
      }

      console.log(`✓ Encomenda #${nextNum - 1} — ${day}`);
    }
  }

  console.log("Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
