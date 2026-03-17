import { prisma } from "../db/prisma.js";

export async function getTotalSupervisions() {
  return prisma.supervision.count();
}

export async function getDistributionByType() {
  const result = await prisma.supervision.groupBy({
    by: ["type"],
    _count: { id: true },
  });
  return result.map((r) => ({ type: r.type, count: r._count.id }));
}

export async function getSupervisionLoadPerResearcher() {
  const result = await prisma.supervisionSupervisor.groupBy({
    by: ["supervisorId"],
    _count: { supervisionId: true },
  });
  const chercheurIds = result.map((r) => r.supervisorId);
  const chercheurs = await prisma.chercheur.findMany({
    where: { chercheur_id: { in: chercheurIds } },
    select: { chercheur_id: true, nom_complet: true },
  });
  const chercheurMap = new Map(chercheurs.map((c) => [c.chercheur_id, c]));
  return result.map((r) => ({
    chercheurId: r.supervisorId,
    chercheurName: chercheurMap.get(r.supervisorId)?.nom_complet ?? "Unknown",
    count: r._count.supervisionId,
  }));
}

export async function getDefenseRate() {
  const [total, defended] = await Promise.all([
    prisma.supervision.count(),
    prisma.supervision.count({ where: { status: "DEFENDED" } }),
  ]);
  return { total, defended, rate: total > 0 ? defended / total : 0 };
}

export async function getAverageSupervisionDuration() {
  const supervisions = await prisma.supervision.findMany({
    where: { status: "DEFENDED", actualEndDate: { not: null } },
    select: { startDate: true, actualEndDate: true },
  });
  if (supervisions.length === 0) {
    return { averageMonths: 0, sampleSize: 0 };
  }
  const totalMonths = supervisions.reduce((acc, s) => {
    const end = s.actualEndDate ?? new Date();
    const months = (end.getTime() - s.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    return acc + months;
  }, 0);
  return { averageMonths: totalMonths / supervisions.length, sampleSize: supervisions.length };
}
