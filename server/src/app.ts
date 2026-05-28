import express from "express";
import cors from "cors";
import employeeRoutes from "./routes/employee.routes";
import insightsRoutes from "./routes/insights.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/insights", insightsRoutes);

export default app;
