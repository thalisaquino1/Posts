import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import demandsRoutes from "./routes/demands.routes.js";

const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/demands", demandsRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
