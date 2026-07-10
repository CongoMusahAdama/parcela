/** Parcela platform admin — internal onboarding of VIP/STC HQ. */

export type PlatformAccount = {
  id: string;
  email: string;
  displayName: string;
};

export type PlatformSession = {
  admin: PlatformAccount;
  signedInAt: string;
};
