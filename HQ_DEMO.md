# HQ Admin — Demo walkthrough

Use this path when showing the HQ MVP. Same story every time.

## Test accounts

Credentials live in your local `.env.local` (never commit them):

| Role | Where | Account |
|------|--------|---------|
| VIP HQ (configured) | `/admin/login` | `hq.vip@parcela.app` + `SEED_ADMIN_PASSWORD` |
| Built-in lead (Circle) | `/lead/login` | `0244555666` + `SEED_LEAD_PIN` |
| HQ-created lead | `/lead/login` | Phone + temp PIN from **Branch leads → Send login** |

Copy the seed keys from `.env.example` into `.env.local` before the demo.

## Happy path (7 steps)

1. **Sign in as VIP HQ**  
   Open `/admin/login` → `hq.vip@parcela.app` with your local admin seed password.

2. **Create a branch lead**  
   Go to **Branch leads** → **Create lead account** → pick a station → name + phone → create → **Send login**.  
   Note the phone and temporary PIN from the credentials card.

3. **Confirm coverage in Admin setup**  
   Open **Admin setup** → Continue to step 2 (**Branch lead coverage**).  
   The station you just assigned should show the lead (use **Refresh** if needed).

4. **Lead signs in for that branch**  
   Open `/lead/login` in another tab → enter the HQ phone + PIN.  
   Dashboard should be locked to that station only.

5. **Insights**  
   Back in HQ → **Insights**. Alerts sit at the top; branch comparison and charts below.

6. **Reports**  
   **Reports** → open any module (e.g. Activities) → set dates → **Generate preview** → Print / Export.

7. **Operator freeze (prove locks work)**  
   **Operator controls** → lock **Staff operations** (and optionally **Lead operations**).  
   In staff / lead portals you should see a red freeze banner; verify/arrive/release and add/edit staff are blocked.  
   Unlock again when the demo is done.

## Tips

- Prefer the **configured** VIP account so branding and network data are live.
- If lead login fails for an HQ-created account, confirm **Send login** ran and the PIN matches the credentials card.
- Single-user deactivate stays on **Roles directory**; network freezes stay on **Operator controls**.
