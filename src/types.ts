
export enum FanKind {
  APP = 1,
  NAT,
  FUN,
  THUNK,
  DAT,
}

export enum DatKind {
  ROW,
  TAB,
  BAR,
  COW,
  CAB
};

export type Nat = bigint;

export type Fan =
  | { t: FanKind.APP; f:Fan; x:Fan }
  | { t: FanKind.NAT; v:Nat }
  | { t: FanKind.FUN; n:Nat; a:Nat; b:Fan; x:(f : Fan[]) => Fan }
  | { t: FanKind.THUNK; x:() => void }
  | { t: FanKind.DAT; d:Dat }

export type Dat =
  | { t: DatKind.ROW; r:Fan[] }
  | { t: DatKind.COW; z:Nat }

// Local Variables:
// typescript-indent-level: 2
// End:
// vim: noai:ts=2:sw=2

