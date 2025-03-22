import dynamic from "next/dynamic";

// Import the client component with no SSR to avoid hydration issues
const PaymentContent = dynamic(() => import("./PaymentContent"), {
  ssr: false,
});

export default function PaymentPage() {
  return <PaymentContent />;
}
