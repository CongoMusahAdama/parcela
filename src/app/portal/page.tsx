import { redirect } from "next/navigation";
import { OPERATOR_LOGIN_PATH } from "@/lib/operator-auth";

export default function PortalIndexPage() {
  redirect(OPERATOR_LOGIN_PATH);
}
