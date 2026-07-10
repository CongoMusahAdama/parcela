export type StaffRole = 'station_staff' | 'station_lead' | 'operator_admin';

export type StaffAccountRecord = {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  password: string;
  pin: string;
  active: boolean;
  role: StaffRole;
  operator: string;
  stationId: string;
  stationName: string;
  stationCode: string;
  location?: string;
  mustChangePassword?: boolean;
  lastLoginAt?: string;
  lastLogoutAt?: string;
};

type SeedAccountTemplate = Omit<StaffAccountRecord, 'password' | 'pin'> & {
  /** Which seeded credential set to use (from env). */
  credential: 'staff' | 'lead' | 'admin';
};

/**
 * Seeded demo accounts — passwords/PINs come from env (SEED_*_PASSWORD / SEED_*_PIN).
 * Never hardcode secrets here; GitGuardian and production both require that.
 */
const SEED_ACCOUNT_TEMPLATES: SeedAccountTemplate[] = [
  {
    id: 'lead-test-01',
    displayName: 'Branch Lead Test',
    email: 'lead.test@parcela.lead',
    phone: '0531878243',
    credential: 'lead',
    active: true,
    role: 'station_lead',
    operator: 'VIP',
    stationId: 'acc-circle-vip',
    stationName: 'Circle Terminal',
    stationCode: 'VIP-CRL',
    location: 'Circle, Accra',
  },
  {
    id: 'lead-circle-01',
    displayName: 'Kofi Mensah',
    email: 'kofi.mensah@parcela.lead',
    phone: '0244555666',
    credential: 'lead',
    active: true,
    role: 'station_lead',
    operator: 'VIP',
    stationId: 'acc-circle-vip',
    stationName: 'Circle Terminal',
    stationCode: 'VIP-CRL',
    location: 'Circle, Accra',
  },
  {
    id: 'staff-circle-02',
    displayName: 'Yaw Asante',
    email: 'yaw.asante@parcela.staff',
    phone: '0244111222',
    credential: 'staff',
    active: true,
    role: 'station_staff',
    operator: 'VIP',
    stationId: 'acc-circle-vip',
    stationName: 'Circle Terminal',
    stationCode: 'VIP-CRL',
    location: 'Circle, Accra',
  },
  {
    id: 'staff-circle-03',
    displayName: 'Abena Osei',
    email: 'abena.osei@parcela.staff',
    phone: '0244333444',
    credential: 'staff',
    active: true,
    role: 'station_staff',
    operator: 'VIP',
    stationId: 'acc-circle-vip',
    stationName: 'Circle Terminal',
    stationCode: 'VIP-CRL',
    location: 'Circle, Accra',
  },
  {
    id: 'staff-kaneshie-01',
    displayName: 'Ama Serwaa',
    email: 'ama.serwaa@parcela.staff',
    phone: '0244123456',
    credential: 'staff',
    active: true,
    role: 'station_staff',
    operator: 'VIP',
    stationId: 'acc-kaneshie',
    stationName: 'Kaneshie Terminal',
    stationCode: 'VIP-KNH',
    location: 'Kaneshie, Accra',
  },
  {
    id: 'lead-tema-01',
    displayName: 'Akosua Darko',
    email: 'akosua.darko@parcela.lead',
    phone: '0244777888',
    credential: 'lead',
    active: true,
    role: 'station_lead',
    operator: 'STC',
    stationId: 'acc-tema-stc',
    stationName: 'Tema Terminal',
    stationCode: 'STC-TEM',
    location: 'Tema, Greater Accra',
  },
  {
    id: 'staff-tema-01',
    displayName: 'Efua Boateng',
    email: 'efua.boateng@parcela.staff',
    phone: '0244987654',
    credential: 'staff',
    active: true,
    role: 'station_staff',
    operator: 'STC',
    stationId: 'acc-tema-stc',
    stationName: 'Tema Terminal',
    stationCode: 'STC-TEM',
    location: 'Tema, Greater Accra',
  },
  {
    id: 'staff-tema-02',
    displayName: 'Kwame Adjei',
    email: 'kwame.adjei@parcela.staff',
    phone: '0244999000',
    credential: 'staff',
    active: false,
    role: 'station_staff',
    operator: 'STC',
    stationId: 'acc-tema-stc',
    stationName: 'Tema Terminal',
    stationCode: 'STC-TEM',
    location: 'Tema, Greater Accra',
  },
  {
    id: 'admin-hq-pending',
    displayName: 'HQ Administrator',
    email: 'hq.admin@parcela.app',
    phone: '0200000001',
    credential: 'admin',
    active: true,
    role: 'operator_admin',
    operator: 'VIP',
    stationId: 'hq-vip',
    stationName: 'VIP HQ',
    stationCode: 'HQ-VIP',
  },
  {
    id: 'admin-hq-vip',
    displayName: 'VIP HQ Admin',
    email: 'hq.vip@parcela.app',
    phone: '0200000002',
    credential: 'admin',
    active: true,
    role: 'operator_admin',
    operator: 'VIP',
    stationId: 'hq-vip',
    stationName: 'VIP HQ',
    stationCode: 'HQ-VIP',
  },
  {
    id: 'admin-hq-stc',
    displayName: 'STC HQ Admin',
    email: 'hq.stc@parcela.app',
    phone: '0200000003',
    credential: 'admin',
    active: true,
    role: 'operator_admin',
    operator: 'STC',
    stationId: 'hq-stc',
    stationName: 'STC HQ',
    stationCode: 'HQ-STC',
  },
];

/** Legacy demo account IDs — purged on startup; never re-seeded. */
export const DEMO_STAFF_ACCOUNT_IDS = SEED_ACCOUNT_TEMPLATES.map((template) => template.id);
