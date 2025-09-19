import Footer from "@/components/Footer";
import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col bg-white">
      {/* Fixed Header */}
      {/* Use Navbar component for header */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="w-full flex flex-col items-center text-center max-w-7xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-6 tracking-tight text-gray-900">
            Turn WhatsApp into Your Best Sales Assistant
          </h1>
          <p className="text-base sm:text-lg md:text-2xl mb-8 text-gray-800 max-w-3xl">
            DoshiAI helps your team close more sales with instant, accurate, and human-like AI answers that improve over time.
          </p>
          <Image
            src="/joyz-hp-featured-image.png"
            alt="AI Featured"
            width={720}
            height={400}
            className="w-full max-w-3xl h-auto rounded-xl shadow-lg mb-12"
          />
        </section>

        {/* What is DoshiAI */}
        <section className="w-full mb-16 max-w-5xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">What is DoshiAI?</h2>
          <p className="text-base sm:text-lg text-gray-800">
            DoshiAI is an AI-powered WhatsApp sales and support assistant. It helps businesses deliver fast, accurate,
            and human-like answers while learning from every interaction. Whether it’s managing FAQs, workflows, or
            customer journeys, DoshiAI reduces manual work and boosts conversions.
          </p>
        </section>

        {/* Benefits */}
        <section className="w-full mb-16 max-w-5xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">Why Businesses Choose DoshiAI</h2>
          <ul className="list-disc pl-6 text-base sm:text-lg text-gray-800 space-y-2">
            <li>24/7 automated support in multiple languages</li>
            <li>Accurate, self-learning AI that improves over time</li>
            <li>Streamlined support teams with reduced workload</li>
            <li>Higher customer satisfaction and sales conversions</li>
          </ul>
        </section>

        {/* Features */}
        <section className="w-full mb-16 max-w-6xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 text-gray-900">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Instant AI Replies</h3>
              <p className="text-gray-800">Answer customer queries instantly with AI-powered, natural conversations that feel human.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Intent-based Workflows</h3>
              <p className="text-gray-800">Build workflows around customer intents, integrate APIs, and automate your sales processes.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">Unanswered Questions</h3>
              <p className="text-gray-800">Collect unanswered queries, add answers, and automate up to 80% of recurring support.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow hover:shadow-md transition">
              <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">WhatsApp Chatbot</h3>
              <p className="text-gray-800">Connect to WhatsApp Web, configure in minutes, and offer AI + manual support seamlessly.</p>
            </div>
          </div>
        </section>

        {/* Upcoming Features */}
        <section className="w-full mb-16 max-w-6xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-8 text-gray-900">Upcoming Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-6 rounded-xl shadow flex flex-col items-center text-center hover:shadow-md transition">
              <Image src="/upcoming_feature_1.png" alt="Conversational AI forms" width={500} height={600} className="w-full max-w-3xl h-auto rounded-xl shadow-lg" />
              <h3 className="text-base md:text-lg font-semibold mb-2 mt-2 text-gray-900">Conversational AI Forms</h3>
              <p className="text-gray-800">Capture leads through natural chat Instead of long static forms.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow flex flex-col items-center text-center hover:shadow-md transition">
              <Image src="/upcoming_feature_2.png" alt="Conversational AI forms" width={500} height={600} className="w-full max-w-3xl h-auto rounded-xl shadow-lg" />
              <h3 className="text-base md:text-lg font-semibold mb-2 mt-2 text-gray-900">API Agent</h3>
              <p className="text-gray-800">Fetch user-specific data with APIs and deliver personalized responses.</p>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl shadow flex flex-col items-center text-center hover:shadow-md transition">
              <Image src="/upcoming_feature_3.jpeg" alt="Conversational forms" width={500} height={600} className="w-full max-w-3xl h-auto rounded-xl shadow-lg" />
              <h3 className="text-base md:text-lg font-semibold mb-2 mt-2 text-gray-900">Smart Tickets</h3>
              <p className="text-gray-800">Create tickets for unsolved queries and auto-update users when resolved.</p>
            </div>
          </div>
        </section>

        {/* How to Get Started */}
        <section className="w-full mb-16 max-w-5xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4 text-gray-900">Get Started in 3 Easy Steps</h2>
          <ol className="list-decimal pl-6 text-base sm:text-lg text-gray-800 space-y-2">
            <li>Upload your FAQs and website content — deploy in under 60 seconds.</li>
            <li>Track customer questions and grow your knowledge base.</li>
            <li>Automate the top 20% of queries to save up to 80% of your team’s time.</li>
          </ol>
        </section>

        {/* FAQ */}
        <section className="w-full mb-16 max-w-6xl mx-auto px-2 sm:px-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-6 text-gray-900">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="bg-gray-50 p-4 rounded shadow">
              <summary className="font-semibold text-base sm:text-lg text-gray-900">What does DoshiAI do?</summary>
              <p className="mt-2 text-gray-800">
                DoshiAI is your AI-powered WhatsApp sales and support assistant. It gives human-like, accurate answers
                and reduces repetitive workload for your team.
              </p>
            </details>
            <details className="bg-gray-50 p-4 rounded shadow">
              <summary className="font-semibold text-base sm:text-lg text-gray-900">How do I set it up on WhatsApp?</summary>
              <ol className="mt-2 text-gray-800 list-decimal pl-6">
                <li>Scan the QR code to connect.</li>
                <li>Monitor unanswered questions.</li>
                <li>Add answers and let AI handle them automatically.</li>
              </ol>
            </details>
            <details className="bg-gray-50 p-4 rounded shadow">
              <summary className="font-semibold text-base sm:text-lg text-gray-900">How much does it cost?</summary>
              <p className="mt-2 text-gray-800">
                Simple usage-based pricing: flat ₹2.5 per conversation after your free trial credits.
              </p>
            </details>
            <details className="bg-gray-50 p-4 rounded shadow">
              <summary className="font-semibold text-base sm:text-lg text-gray-900">What if AI gives a wrong answer?</summary>
              <p className="mt-2 text-gray-800">
                DoshiAI only responds from your verified knowledge base. If something is missing, you can add the answer,
                and AI will handle it correctly in the future.
              </p>
            </details>
            <details className="bg-gray-50 p-4 rounded shadow">
              <summary className="font-semibold text-base sm:text-lg text-gray-900">Will it sound robotic?</summary>
              <p className="mt-2 text-gray-800">
                Not at all. DoshiAI is designed to respond naturally, and your agents can always step in anytime.
              </p>
            </details>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
// ...existing code...
