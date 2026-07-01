/** In-memory only — welcome shows again after a full refresh until Get started is tapped. */
let welcomeDismissed = false;

export function hasSeenWelcome(): boolean {
  return welcomeDismissed;
}

export function markWelcomeSeen(): void {
  welcomeDismissed = true;
}

export function clearWelcomeSeen(): void {
  welcomeDismissed = false;
}
