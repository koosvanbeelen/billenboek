import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Voedingen (feedings)
export const voedingen = pgTable("voedingen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  type: text("type").notNull(), // "borstvoeding" | "kunstvoeding"
  borst: text("borst"), // "links" | "rechts" | "beide"
  duurMinuten: integer("duur_minuten"),
  hoeveelheidMl: integer("hoeveelheid_ml"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Luiers (diapers)
export const luiers = pgTable("luiers", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  plas: boolean("plas").notNull().default(false),
  poep: boolean("poep").notNull().default(false),
  schoon: boolean("schoon").notNull().default(false),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Temperaturen (temperatures)
export const temperaturen = pgTable("temperaturen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  temperatuur: numeric("temperatuur", { precision: 4, scale: 1 }).notNull(),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Boertjes / Spugen (burps / spit-up)
export const boertjesSpugen = pgTable("boertjes_spugen", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Vitamines (vitamins)
export const vitamines = pgTable("vitamines", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  vitamineK: boolean("vitamine_k").notNull().default(false),
  vitamineD: boolean("vitamine_d").notNull().default(false),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Medicatie (medication)
export const medicatie = pgTable("medicatie", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  naam: text("naam").notNull(),
  dosering: text("dosering"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Notities (free-form notes)
export const notities = pgTable("notities", {
  id: serial("id").primaryKey(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true })
    .notNull()
    .defaultNow(),
  notitie: text("notitie").notNull(),
})

export type Voeding = typeof voedingen.$inferSelect
export type Luier = typeof luiers.$inferSelect
export type Temperatuur = typeof temperaturen.$inferSelect
export type BoertjeSpugen = typeof boertjesSpugen.$inferSelect
export type Vitamine = typeof vitamines.$inferSelect
export type Medicatie = typeof medicatie.$inferSelect
export type Notitie = typeof notities.$inferSelect
