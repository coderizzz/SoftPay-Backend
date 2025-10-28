// src/services/report/chartService.js
import QuickChart from "quickchart-js";

export async function generateCharts(transactions) {
  const categoryTotals = {};
  transactions.forEach(t => {
    if (!t.category) return;
    categoryTotals[t.category] =
      (categoryTotals[t.category] || 0) + t.amount;
  });

  const labels = Object.keys(categoryTotals);
  const values = Object.values(categoryTotals);

  // Pie chart
  const pieChart = new QuickChart();
  pieChart.setConfig({
    type: "pie",
    data: { labels, datasets: [{ data: values }] },
  });
  const pieBuffer = await pieChart.toBinary();

  // Bar chart
  const barChart = new QuickChart();
  barChart.setConfig({
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Spending", backgroundColor: "#3B5BDB", data: values },
      ],
    },
  });
  const barBuffer = await barChart.toBinary();

  return { pieBuffer, barBuffer };
}
