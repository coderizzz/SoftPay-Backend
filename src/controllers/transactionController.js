import Transaction from "../models/Transaction.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getTransactions = async (req, res) => {
  try {
    const txns = await Transaction.find().sort({ createdAt: -1 });
    res.json(txns);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
};

export const addTransaction = async (req, res) => {
  try {
    const txn = new Transaction(req.body);
    await txn.save();
    res.status(201).json(txn);
  } catch (err) {
    res.status(400).json({ error: "Failed to add transaction" });
  }
};

export const deleteTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Transaction deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
};

export const updateTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(txn);
  } catch (err) {
    res.status(400).json({ error: "Failed to update transaction" });
  }
};

export const getSummary = async (req, res) => {
  try {
    const txns = await Transaction.find();

    const totalIncome = txns
      .filter(txn => txn.type === "income")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const totalExpense = txns
      .filter(txn => txn.type === "expense")
      .reduce((sum, txn) => sum + txn.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const categoryTotals = {};
    txns.forEach((txn) => {
      if (txn.category) {
        categoryTotals[txn.category] = (categoryTotals[txn.category] || 0) + txn.amount;
      }
    });

    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    res.json({ totalIncome, totalExpense, netBalance, topCategory });
  } catch (err) {
    res.status(500).json({ error: "Failed to compute summary" });
  }
};

export const getCategoryData = async (req, res) => {
  try {
    const txns = await Transaction.find();
    const data = {};

    txns.forEach((txn) => {
      if (!txn.category) return;
      data[txn.category] = (data[txn.category] || 0) + txn.amount;
    });

    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    res.json(chartData);
  } catch (err) {
    res.status(500).json({ error: "Failed to compute category chart" });
  }
};

export const getMonthlyData = async (req, res) => {
  try {
    const txns = await Transaction.find();
    const monthlyTotals = Array(12).fill(0);

    txns.forEach((txn) => {
      const month = new Date(txn.date).getMonth();
      monthlyTotals[month] += txn.amount;
    });

    const data = monthlyTotals.map((total, i) => ({
      name: new Date(0, i).toLocaleString("default", { month: "short" }),
      total,
    }));

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to compute monthly chart" });
  }
};

function keywordCategorizer(desc) {
  const d = desc.toLowerCase();
  if (/(zomato|swiggy|restaurant|food|pizza|cafe|burger)/.test(d)) return "Food";
  if (/(uber|ola|metro|bus|train|taxi|cab|fuel|petrol)/.test(d)) return "Transport";
  if (/(amazon|flipkart|myntra|ajio|mall|shopping|clothes|shoes)/.test(d)) return "Shopping";
  if (/(netflix|spotify|movie|cinema|game|music)/.test(d)) return "Entertainment";
  if (/(bill|electricity|water|gas|mobile|recharge|rent)/.test(d)) return "Bills";
  if (/(grocer|vegetable|fruit|mart|store|daily need)/.test(d)) return "Groceries";
  return "Other";
}

export const autoCategorize = async (req, res) => {
  try {
    const { description } = req.body;
    if (!description || description.trim() === "")
      return res.status(400).json({ error: "Description required" });

    const prompt = `Categorize the following transaction into one of:
    ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Groceries", "Other"]
    Transaction: "${description}"
    Respond only with the category name.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const aiCategory = result.response.text().trim();

    const valid = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Groceries", "Other"];
    const finalCat = valid.includes(aiCategory) ? aiCategory : keywordCategorizer(description);

    res.json({ aiCategory: finalCat, source: "Gemini AI" });
  } catch (err) {
    console.error("Gemini failed, using fallback:", err.message);
    const fallback = keywordCategorizer(req.body.description || "");
    res.json({ aiCategory: fallback, source: "Fallback" });
  }
};
