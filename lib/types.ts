export type Soort =
  | "voeding"
  | "luier"
  | "temperatuur"
  | "boertje"
  | "vitamine"
  | "medicatie"

export type VoedingItem = {
  id: number
  datumTijd: string
  type: "borstvoeding" | "kunstvoeding"
  borst: "links" | "rechts" | "beide" | null
  duurMinuten: number | null
  hoeveelheidMl: number | null
  notitie: string | null
}

export type LuierItem = {
  id: number
  datumTijd: string
  plas: boolean
  poep: boolean
  schoon: boolean
}

export type TemperatuurItem = {
  id: number
  datumTijd: string
  temperatuur: number
}

export type BoertjeItem = {
  id: number
  datumTijd: string
  notitie: string | null
}

export type VitamineItem = {
  id: number
  datumTijd: string
  vitamineK: boolean
  vitamineD: boolean
}

export type MedicatieItem = {
  id: number
  datumTijd: string
  naam: string
  dosering: string | null
  notitie: string | null
}

export type TijdlijnItem =
  | { soort: "voeding"; id: number; datumTijd: string; record: VoedingItem }
  | { soort: "luier"; id: number; datumTijd: string; record: LuierItem }
  | {
      soort: "temperatuur"
      id: number
      datumTijd: string
      record: TemperatuurItem
    }
  | { soort: "boertje"; id: number; datumTijd: string; record: BoertjeItem }
  | { soort: "vitamine"; id: number; datumTijd: string; record: VitamineItem }
  | {
      soort: "medicatie"
      id: number
      datumTijd: string
      record: MedicatieItem
    }

export type DagTellers = {
  voedingenAantal: number
  voedingenMinuten: number
  luiersPoep: number
  luiersPlas: number
}

export type DagGegevens = {
  datum: string
  items: TijdlijnItem[]
  tellers: DagTellers
}

export type NotitieItem = {
  id: number
  datumTijd: string
  notitie: string
}
