
export enum Kind {
  APP = 1,
  NAT,
  FUN,
  THUNK,
}

export type Nat = bigint;

export type Fan =
  | { t: Kind.APP; f:Fan; x:Fan }
  | { t: Kind.NAT; v:Nat }
  | { t: Kind.FUN; n:Nat; a:Nat; b:Fan; x:(f : Fan[]) => Fan }
  | { t: Kind.THUNK; x:() => void }
