import Budget from "../models/budgetModel.js";
import Transaction from "../models/Transaction.js";
import BudgetHistory from "../models/budgetHistoryModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import fetch from "node-fetch"; // For OpenAI meme API
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===============================================
// 😂 Generate Funny Comment + Meme
// ===============================================
const generateFunnyComment = async (category, difference) => {
  const overspend = difference > 0;
  const fallbackRoasts = [
    overspend
      ? `You spent way too much on ${category}. You’re basically sponsoring that industry 💸😂`
      : `You actually saved on ${category}? Is this a side quest or are you okay? 🧐💰`,
    overspend
      ? `Chill! Your ${category} budget just went Super Saiyan 💥🔥`
      : `${category} didn’t stand a chance against your savings discipline 👑`,
    overspend
      ? `Your ${category} expenses look like a crypto pump chart 📈💀`
      : `Saving on ${category}? Bro just unlocked financial Ultra Instinct 💫`,
  ];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Create a short, Gen Z meme-style roast or funny quote about ${
      overspend ? "overspending" : "saving"
    } in ${category}. Tone: sarcastic, relatable, playful. Use emojis naturally.`;
    const result = await model.generateContent(prompt);
    const text =
      result.response.text().trim() ||
      fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)];

    // Try generating meme image (optional)
    const memePrompt = `funny meme about ${
      overspend ? "overspending" : "saving"
    } in ${category}, trending meme style, high quality, PNG`;

    let funnyMemeUrl = "";
    try {
      const memeResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-image-1",
            prompt: memePrompt,
            size: "512x512",
          }),
        }
      );
      const memeData = await memeResponse.json();
      funnyMemeUrl = memeData?.data?.[0]?.url || "";
    } catch (err) {
      console.warn("⚠️ Meme generation failed:", err.message);
    }

    return { funnyMessage: text, funnyMemeUrl };
  } catch (err) {
    console.error("Error generating funny comment:", err.message);
    return {
      funnyMessage:
        fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)],
      funnyMemeUrl: "",
    };
  }
};

// ===============================================
// 🧮 Set Budget
// ===============================================
export const setBudget = async (req, res) => {
  try {
    const { predictedBudgets } = req.body;
    const userId = req.user.id;

    let budget = await Budget.findOne({ userId });
    if (budget) {
      budget.predictedBudgets = predictedBudgets;
      await budget.save();
      return res.json({ message: "Predicted budgets updated" });
    }

    budget = new Budget({ userId, predictedBudgets });
    await budget.save();
    res.status(201).json({ message: "Predicted budgets set" });
  } catch (err) {
    console.error("Error in setBudget:", err);
    res.status(500).json({ error: "Failed to set predicted budgets" });
  }
};

// ===============================================
// 📊 Compare Spending
// ===============================================
export const compareSpending = async (req, res) => {
  try {
    const userId = req.user.id;

    const txns = await Transaction.find({ userId });
    const actualSpending = {
      food: 0,
      transport: 0,
      shopping: 0,
      entertainment: 0,
      bills: 0,
      groceries: 0,
    };

    txns.forEach((txn) => {
      if (txn.category && actualSpending.hasOwnProperty(txn.category)) {
        actualSpending[txn.category] += txn.amount;
      }
    });

    const budget = await Budget.findOne({ userId });
    if (!budget)
      return res.status(404).json({ error: "No budget found for this user" });

    const comparison = Object.keys(actualSpending).map((category) => {
      const predicted = budget.predictedBudgets[category] || 0;
      const actual = actualSpending[category] || 0;
      const difference = actual - predicted;
      return { category, predicted, actual, difference };
    });

    res.json({ comparison });
  } catch (err) {
    console.error("Error in compareSpending:", err);
    res.status(500).json({ error: "Failed to compare spending" });
  }
};

// ===============================================
// 🤖 Generate Monthly Insight + Meme
// ===============================================
export const generateMonthlyInsight = async (req, res) => {
  try {
    const userId = req.user.id;

    const txns = await Transaction.find({ userId });
    const budget = await Budget.findOne({ userId });
    if (!budget)
      return res.status(404).json({ error: "No budget found for user" });

    const actualSpending = {
      food: 0,
      transport: 0,
      shopping: 0,
      entertainment: 0,
      bills: 0,
      groceries: 0,
    };

    txns.forEach((txn) => {
      if (txn.category && actualSpending.hasOwnProperty(txn.category)) {
        actualSpending[txn.category] += txn.amount;
      }
    });

    const comparison = Object.keys(budget.predictedBudgets).map((cat) => {
      const predicted = budget.predictedBudgets[cat];
      const actual = actualSpending[cat];
      const difference = actual - predicted;
      return { category: cat, predicted, actual, difference };
    });

    const totalPredicted = Object.values(budget.predictedBudgets).reduce(
      (a, b) => a + b,
      0
    );
    const totalActual = Object.values(actualSpending).reduce(
      (a, b) => a + b,
      0
    );
    const overspendPercent =
      ((totalActual - totalPredicted) / totalPredicted) * 100;

    const topCategory =
      comparison.sort((a, b) => b.actual - a.actual)[0]?.category || "N/A";
    const topDifference =
      comparison.sort((a, b) => b.difference - a.difference)[0]?.difference ||
      0;

    const { funnyMessage, funnyMemeUrl } = await generateFunnyComment(
      topCategory,
      topDifference
    );

    const now = new Date();
    const month = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();

    const history = new BudgetHistory({
      userId,
      month,
      year,
      predictedBudgets: budget.predictedBudgets,
      actualSpending,
      overspendPercent,
      funnyMessage,
      funnyMemeUrl,
    });

    await history.save();

    res.json({
      message: "Monthly insight generated successfully",
      overspendPercent,
      topCategory,
      funnyMessage,
      funnyMemeUrl,
      comparison,
    });
  } catch (err) {
    console.error("Error in generateMonthlyInsight:", err);
    res.status(500).json({ error: "Failed to generate monthly insight" });
  }
};

// ===============================================
// 🗂️ Get All Budget History
// ===============================================
export const getAllBudgetHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const histories = await BudgetHistory.find({ userId }).sort({
      createdAt: -1,
    });
    res.json(histories);
  } catch (err) {
    console.error("Error fetching budget histories:", err);
    res.status(500).json({ error: "Failed to fetch budget histories" });
  }
};
