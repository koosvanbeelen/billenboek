import { sql } from "drizzle-orm"
import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core"

// Elke tabel met gezinsgegevens krijgt een gezin_id kolom. De standaardwaarde
// wordt door Postgres zelf ingevuld op basis van de sessievariabele die
// lib/db/gezin.ts instelt (SET LOCAL / set_config), dus deze hoeft NOOIT
// handmatig meegegeven te worden bij een insert. Row Level Security zorgt
// ervoor dat elk gezin alleen zijn eigen rijen ziet.
// Zie LEES_MIJ_migratie_stap1.sql en LEES_MIJ_migratie_stap2.sql.
const gezinIdKolom = () =>
  text("gezin_id")
    .notNull()
    .default(sql`current_setting('app.huidig_gezin_id', true)`)

// Kinderen (children). Eén gezin kan meerdere kinderen hebben; op dit moment
// gebruikt de app altijd het eerste/enige kind van het gezin. Wisselen
// tussen meerdere kinderen is een toekomstige uitbreiding.
export const kinderen = pgTable("kinderen", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  naam: text("naam").notNull(),
  geboortedatum: date("geboortedatum"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Voedingen (feedings)
export const voedingen = pgTable("voedingen", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  type: text("type").notNull(), // "borstvoeding" | "kolfmelk" | "kunstvoeding"
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
  gezinId: gezinIdKolom(),
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
  gezinId: gezinIdKolom(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  temperatuur: numeric("temperatuur", { precision: 4, scale: 1 }).notNull(),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Spugen (spit-up)
export const spugen = pgTable("spugen", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
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
  gezinId: gezinIdKolom(),
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
  gezinId: gezinIdKolom(),
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
  gezinId: gezinIdKolom(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true })
    .notNull()
    .defaultNow(),
  notitie: text("notitie").notNull(),
})

// Groei (growth: gewicht/lengte metingen)
export const groei = pgTable("groei", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  gewichtKg: numeric("gewicht_kg", { precision: 5, scale: 2 }),
  lengteCm: numeric("lengte_cm", { precision: 5, scale: 1 }),
  opmerking: text("opmerking"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Slapen (sleep sessies)
export const slapen = pgTable("slapen", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  einde: timestamp("einde", { withTimezone: true }).notNull(),
  duurMinuten: integer("duur_minuten").notNull(),
  locatie: text("locatie"),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Huilen (crying sessies)
export const huilen = pgTable("huilen", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  start: timestamp("start", { withTimezone: true }).notNull(),
  einde: timestamp("einde", { withTimezone: true }).notNull(),
  duurMinuten: integer("duur_minuten").notNull(),
  oorzaak: text("oorzaak"),
  troost: text("troost"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

// Kolven (afkolven van moedermelk)
export const kolven = pgTable("kolven", {
  id: serial("id").primaryKey(),
  gezinId: gezinIdKolom(),
  datumTijd: timestamp("datum_tijd", { withTimezone: true }).notNull(),
  borst: text("borst").notNull(), // "links" | "rechts" | "beide"
  hoeveelheidMl: integer("hoeveelheid_ml").notNull(),
  notitie: text("notitie"),
  aangemaaktOp: timestamp("aangemaakt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
  bijgewerktOp: timestamp("bijgewerkt_op", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export type Kind = typeof kinderen.$inferSelect
export type Voeding = typeof voedingen.$inferSelect
export type Luier = typeof luiers.$inferSelect
export type Temperatuur = typeof temperaturen.$inferSelect
export type Spugen = typeof spugen.$inferSelect
export type Vitamine = typeof vitamines.$inferSelect
export type Medicatie = typeof medicatie.$inferSelect
export type Notitie = typeof notities.$inferSelect
export type Groei = typeof groei.$inferSelect
export type Slapen = typeof slapen.$inferSelect
export type Huilen = typeof huilen.$inferSelect
export type Kolven = typeof kolven.$inferSelect
