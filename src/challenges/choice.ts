/** One answer a player can pick in a multiple-choice challenge. */
export interface Choice {
  id: string
  /** Shown when the player picks this choice and it is wrong. */
  whyNot?: string
}

export function getChoice<C extends Choice>(choices: C[], id: string): C {
  const choice = choices.find((c) => c.id === id)
  if (!choice) {
    throw new Error(`No choice with id "${id}"`)
  }
  return choice
}
