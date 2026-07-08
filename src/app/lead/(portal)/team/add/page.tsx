import { redirect } from "next/navigation";

export default function LeadAddStaffPage() {
  redirect("/lead/team?add=1");
}
