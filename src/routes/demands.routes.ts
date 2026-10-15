import { Router } from "express";
import { prisma } from "../prisma.js";
import { authenticate } from "../middlewares/authenticate.js";

const router = Router();

router.use(authenticate);

const prioridades = ["LOW", "MEDIUM", "HIGH"] as const;
type Prioridade = (typeof prioridades)[number];

router.post("/", async (req, res) => {
  const { title, description, priority } = req.body ?? {};

  if (typeof title !== "string" || title.trim().length < 3) {
    res.status(400).json({ error: "O título precisa ter pelo menos 3 caracteres." });
    return;
  }

  if (description !== undefined && typeof description !== "string") {
    res.status(400).json({ error: "A descrição precisa ser um texto." });
    return;
  }

  if (priority !== undefined && !prioridades.includes(priority)) {
    res.status(400).json({ error: "Prioridade inválida." });
    return;
  }

  const userId: string = res.locals.userId;

  const demand = await prisma.demand.create({
    data: {
      title: title.trim(),
      description: description?.trim(),
      priority: (priority as Prioridade | undefined) ?? "MEDIUM",
      createdById: userId,
      history: {
        create: {
          action: "CREATED",
          performedById: userId,
        },
      },
    },
  });

  res.status(201).json(demand);
});

export default router;
