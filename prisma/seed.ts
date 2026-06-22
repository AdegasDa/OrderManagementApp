import "dotenv/config";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Payment types ────────────────────────────────────────────────────────────
  const paymentTypes = ["Numerário", "Cartão", "Transferência", "MB Way"];
  for (const name of paymentTypes) {
    await prisma.paymentType.upsert({ where: { name }, update: {}, create: { name } });
  }

  // ── Statuses ─────────────────────────────────────────────────────────────────
  const statuses = [
    { name: "Novo",         color: "#3b82f6" },
    { name: "Em Progresso", color: "#f59e0b" },
    { name: "Pronto",       color: "#10b981" },
    { name: "Entregue",     color: "#6b7280" },
    { name: "Cancelado",    color: "#ef4444" },
  ];
  for (const s of statuses) {
    await prisma.orderStatus.upsert({ where: { name: s.name }, update: {}, create: s });
  }

  // ── Fetch refs ────────────────────────────────────────────────────────────────
  const [pt, st] = await Promise.all([
    prisma.paymentType.findMany(),
    prisma.orderStatus.findMany(),
  ]);

  const ptByName  = Object.fromEntries(pt.map((p: { name: string; id: string }) => [p.name, p.id]));
  const stByName  = Object.fromEntries(st.map((s: { name: string; id: string }) => [s.name, s.id]));

  // ── Clients ───────────────────────────────────────────────────────────────────
  const clientsData = [
    { name: "Ana Ferreira",       phone: "+351 912 345 678", source: "STORE"     },
    { name: "Bruno Martins",      phone: "+351 963 210 987", source: "INSTAGRAM" },
    { name: "Carla Sousa",        phone: "+351 934 567 890", source: "WHATSAPP"  },
    { name: "David Oliveira",     phone: "+351 916 789 012", source: "STORE"     },
    { name: "Elsa Rodrigues",     phone: "+351 961 234 567", source: "INSTAGRAM" },
    { name: "Filipe Costa",       phone: "+351 937 890 123", source: "WHATSAPP"  },
    { name: "Gabriela Nunes",     phone: "+351 915 678 901", source: "STORE"     },
    { name: "Hélder Santos",      phone: "+351 962 345 678", source: "INSTAGRAM" },
    { name: "Inês Carvalho",      phone: "+351 933 456 789", source: "WHATSAPP"  },
    { name: "João Pereira",       phone: "+351 914 567 890", source: "STORE"     },
    { name: "Kátia Lopes",        phone: "+351 965 678 901", source: "INSTAGRAM" },
    { name: "Luís Mendes",        phone: "+351 936 789 012", source: "WHATSAPP"  },
    { name: "Marta Gonçalves",    phone: "+351 913 890 123", source: "STORE"     },
    { name: "Nuno Araújo",        phone: "+351 964 901 234", source: "INSTAGRAM" },
    { name: "Olga Fernandes",     phone: "+351 935 012 345", source: "STORE"     },
  ];

  const clients = await Promise.all(
    clientsData.map((c) =>
      prisma.client.upsert({
        where: { id: `seed-client-${c.name.replace(/\s+/g, "-").toLowerCase()}` },
        update: {},
        create: { id: `seed-client-${c.name.replace(/\s+/g, "-").toLowerCase()}`, ...c },
      })
    )
  );

  // ── Products ──────────────────────────────────────────────────────────────────
  const productsData = [
    { name: "Camisola Personalizada",   description: "Algodão 100%, impressão frontal", salePrice: 24.99 },
    { name: "Caneca Sublimada",         description: "Cerâmica branca 330ml",            salePrice: 12.50 },
    { name: "Almofada Foto",            description: "45×45cm, enchimento incluído",      salePrice: 18.00 },
    { name: "Quadro Acrílico",          description: "Impressão HD 20×30cm",              salePrice: 35.00 },
    { name: "Porta-Chaves Gravado",     description: "Metal inoxidável, dupla face",      salePrice: 8.99  },
    { name: "Puzzle Personalizado",     description: "500 peças, 50×35cm",                salePrice: 22.00 },
    { name: "T-Shirt Manga Curta",      description: "100% algodão penteado",             salePrice: 19.99 },
    { name: "Calendário de Parede",     description: "12 folhas, A3, plastificado",       salePrice: 15.00 },
    { name: "Tote Bag Estampada",       description: "Algodão orgânico 38×42cm",          salePrice: 11.50 },
    { name: "Boné Bordado",             description: "6 painéis, ajustável",               salePrice: 16.99 },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.upsert({
        where: { id: `seed-product-${p.name.replace(/[\s\/]+/g, "-").toLowerCase()}` },
        update: {},
        create: { id: `seed-product-${p.name.replace(/[\s\/]+/g, "-").toLowerCase()}`, ...p },
      })
    )
  );

  // ── Orders ────────────────────────────────────────────────────────────────────
  // Only create orders that don't already exist (check by orderNumber)
  const existingOrderNumbers = new Set(
    (await prisma.order.findMany({ select: { orderNumber: true } })).map((o: { orderNumber: number }) => o.orderNumber)
  );

  const now = new Date();
  function daysAgo(n: number) {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  }

  const ordersData = [
    // --- Novo ---
    { clientIdx: 0,  productIdx: 0, ptName: "Numerário",    stName: "Novo",         date: daysAgo(1),  total: 24.99,  advance: 0,     notes: "Tamanho M, cor azul navy", deliveryNotes: "" },
    { clientIdx: 2,  productIdx: 6, ptName: "MB Way",       stName: "Novo",         date: daysAgo(0),  total: 19.99,  advance: 10,    notes: "Imprimir foto de família", deliveryNotes: "Ligar antes" },
    { clientIdx: 5,  productIdx: 3, ptName: "Transferência",stName: "Novo",         date: daysAgo(2),  total: 35.00,  advance: 15,    notes: "Foto do casamento",         deliveryNotes: "" },
    // --- Em Progresso ---
    { clientIdx: 1,  productIdx: 1, ptName: "Cartão",       stName: "Em Progresso", date: daysAgo(4),  total: 12.50,  advance: 12.50, notes: "Logo da empresa",           deliveryNotes: "" },
    { clientIdx: 3,  productIdx: 2, ptName: "MB Way",       stName: "Em Progresso", date: daysAgo(5),  total: 18.00,  advance: 9.00,  notes: "Foto do bebé",              deliveryNotes: "Entregar na loja" },
    { clientIdx: 7,  productIdx: 5, ptName: "Numerário",    stName: "Em Progresso", date: daysAgo(3),  total: 22.00,  advance: 0,     notes: "Aniversário 50 anos",       deliveryNotes: "" },
    { clientIdx: 9,  productIdx: 8, ptName: "Transferência",stName: "Em Progresso", date: daysAgo(6),  total: 11.50,  advance: 5,     notes: "Arte minimalista",          deliveryNotes: "" },
    { clientIdx: 11, productIdx: 9, ptName: "Cartão",       stName: "Em Progresso", date: daysAgo(7),  total: 16.99,  advance: 16.99, notes: "Bordado nome + número",     deliveryNotes: "Urgente" },
    // --- Pronto ---
    { clientIdx: 4,  productIdx: 4, ptName: "Numerário",    stName: "Pronto",       date: daysAgo(8),  total: 8.99,   advance: 8.99,  notes: "Gravação: 'Para sempre'",   deliveryNotes: "" },
    { clientIdx: 6,  productIdx: 7, ptName: "MB Way",       stName: "Pronto",       date: daysAgo(9),  total: 15.00,  advance: 7.50,  notes: "Calendário 2027 família",   deliveryNotes: "Enviar por CTT" },
    { clientIdx: 10, productIdx: 0, ptName: "Cartão",       stName: "Pronto",       date: daysAgo(10), total: 24.99,  advance: 24.99, notes: "Tamanho L, cinza",          deliveryNotes: "" },
    { clientIdx: 13, productIdx: 3, ptName: "Transferência",stName: "Pronto",       date: daysAgo(11), total: 35.00,  advance: 20,    notes: "Fotos de viagem",           deliveryNotes: "" },
    // --- Entregue ---
    { clientIdx: 8,  productIdx: 1, ptName: "Numerário",    stName: "Entregue",     date: daysAgo(14), total: 12.50,  advance: 12.50, notes: "",                          deliveryNotes: "" },
    { clientIdx: 12, productIdx: 2, ptName: "Cartão",       stName: "Entregue",     date: daysAgo(15), total: 18.00,  advance: 18.00, notes: "Foto de casal",             deliveryNotes: "" },
    { clientIdx: 0,  productIdx: 6, ptName: "MB Way",       stName: "Entregue",     date: daysAgo(18), total: 19.99,  advance: 19.99, notes: "Tamanho S",                 deliveryNotes: "" },
    { clientIdx: 14, productIdx: 5, ptName: "Transferência",stName: "Entregue",     date: daysAgo(20), total: 22.00,  advance: 22.00, notes: "Foto de turma",             deliveryNotes: "" },
    { clientIdx: 3,  productIdx: 8, ptName: "Numerário",    stName: "Entregue",     date: daysAgo(21), total: 11.50,  advance: 11.50, notes: "",                          deliveryNotes: "" },
    { clientIdx: 7,  productIdx: 9, ptName: "Cartão",       stName: "Entregue",     date: daysAgo(22), total: 16.99,  advance: 16.99, notes: "Equipa de futebol",         deliveryNotes: "" },
    { clientIdx: 2,  productIdx: 4, ptName: "MB Way",       stName: "Entregue",     date: daysAgo(25), total: 8.99,   advance: 8.99,  notes: "",                          deliveryNotes: "" },
    { clientIdx: 5,  productIdx: 7, ptName: "Transferência",stName: "Entregue",     date: daysAgo(28), total: 15.00,  advance: 15.00, notes: "Calendário empresa 2026",   deliveryNotes: "" },
    // --- Cancelado ---
    { clientIdx: 1,  productIdx: 3, ptName: "Cartão",       stName: "Cancelado",    date: daysAgo(12), total: 35.00,  advance: 0,     notes: "Cliente cancelou",          deliveryNotes: "" },
    { clientIdx: 9,  productIdx: 0, ptName: "Numerário",    stName: "Cancelado",    date: daysAgo(30), total: 24.99,  advance: 0,     notes: "Produto esgotado",          deliveryNotes: "" },
    // --- Extra recent orders spread across calendar ─────────────────────────
    { clientIdx: 4,  productIdx: 1, ptName: "MB Way",       stName: "Novo",         date: daysAgo(0),  total: 25.00,  advance: 0,     notes: "2x canecas",                deliveryNotes: "" },
    { clientIdx: 6,  productIdx: 6, ptName: "Cartão",       stName: "Em Progresso", date: daysAgo(1),  total: 39.98,  advance: 20,    notes: "2x t-shirts XL",            deliveryNotes: "" },
    { clientIdx: 8,  productIdx: 2, ptName: "Numerário",    stName: "Pronto",       date: daysAgo(3),  total: 36.00,  advance: 18,    notes: "2x almofadas",              deliveryNotes: "" },
    { clientIdx: 10, productIdx: 5, ptName: "Transferência",stName: "Entregue",     date: daysAgo(5),  total: 44.00,  advance: 44,    notes: "2x puzzles aniversário",    deliveryNotes: "" },
    { clientIdx: 12, productIdx: 9, ptName: "MB Way",       stName: "Novo",         date: daysAgo(0),  total: 16.99,  advance: 0,     notes: "Boné personalizado",        deliveryNotes: "" },
    { clientIdx: 14, productIdx: 4, ptName: "Cartão",       stName: "Em Progresso", date: daysAgo(2),  total: 17.98,  advance: 9,     notes: "2x porta-chaves",           deliveryNotes: "" },
  ];

  let nextNumber = (await prisma.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } }))?.orderNumber ?? 0;

  for (const o of ordersData) {
    nextNumber++;
    if (existingOrderNumbers.has(nextNumber)) { nextNumber++; }

    await prisma.order.create({
      data: {
        orderNumber:   nextNumber,
        orderDate:     o.date,
        clientId:      clients[o.clientIdx].id,
        paymentTypeId: ptByName[o.ptName],
        statusId:      stByName[o.stName],
        totalValue:    o.total,
        advanceAmount: o.advance,
        notes:         o.notes   || null,
        deliveryNotes: o.deliveryNotes || null,
        orderProducts: {
          create: [{ productId: products[o.productIdx].id, quantity: 1 }],
        },
      },
    });
  }

  const totals = await Promise.all([
    prisma.client.count(),
    prisma.product.count(),
    prisma.order.count(),
  ]);
  console.log(`Seed concluído — ${totals[0]} clientes, ${totals[1]} produtos, ${totals[2]} encomendas.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
