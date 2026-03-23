import { redirect } from "next/navigation";

// Root route redirects users to login.
export default function Home() {
    redirect("/login");
}
