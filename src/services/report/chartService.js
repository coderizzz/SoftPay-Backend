import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const width = 400, height = 300;
const canvas = new ChartJSNodeCanvas({ width, height });

export async function generateCharts(transactions) {
  const totals = {};
  for (const txn of transactions) {
    totals[txn.category] = (totals[txn.category] || 0) + txn.amount;
  }
  const labels = Object.keys(totals);
  const data = Object.values(totals);

  const pieBuffer = await canvas.renderToBuffer({
    type: "pie",
    data: { labels, datasets: [{ data }] },
    options: { plugins: { legend: { position: "bottom" } } },
  });

  const barBuffer = await canvas.renderToBuffer({
    type: "bar",
    data: { labels, datasets: [{ label: "Spending", data }] },
  });

  return { pieBuffer, barBuffer };
}
