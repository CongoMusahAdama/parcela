/** In-memory only — welcome shows again after a full reload until Get started is tapped. */
let welcomeDismissed = false;

export async function hasSeenWelcome(): Promise<boolean> {
  return welcomeDismissed;
}

export async function markWelcomeSeen(): Promise<void> {
  welcomeDismissed = true;
}

export async function clearWelcomeSeen(): Promise<void> {
  welcomeDismissed = false;
}
