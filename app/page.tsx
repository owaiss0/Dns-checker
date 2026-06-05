import { DnsBenchmark } from "@/components/dns-benchmark";

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: "DNS Test",
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        description:
          "A DNS speed test that compares public DNS resolvers and recommends the best DNS provider for a network.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "What is the best DNS server for me?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "The best DNS server depends on your network. This tool runs real DNS checks and recommends the provider with the best speed and reliability for the selected websites.",
            },
          },
          {
            "@type": "Question",
            name: "Can I copy DNS IPv4 addresses?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. After the benchmark completes, the app shows the recommended IPv4 DNS addresses and provides copy buttons for router or device setup.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen flex-1 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <DnsBenchmark />
    </main>
  );
}
