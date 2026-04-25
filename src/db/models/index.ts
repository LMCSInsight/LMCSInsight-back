import { prisma } from '../prisma.js'

// Centralized model delegates for the data layer.
export const TeamModel = prisma.team
export const ThemeModel = prisma.theme
export const ChercheurModel = prisma.chercheur
export const UserModel = prisma.user
export const StudentModel = prisma.student
export const SupervisionModel = prisma.supervision
export const SupervisionSupervisorModel = prisma.supervisionSupervisor
export const ValidationLogModel = prisma.validationLog
export const AuditLogModel = prisma.auditLog
export const NotificationModel = prisma.notification
