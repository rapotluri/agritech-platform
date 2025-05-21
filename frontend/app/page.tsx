// Placeholder home page for unsigned users
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Welcome to AccuRate</h1>
      <p className="text-lg text-gray-700 mb-8">Sign in to access weather data retrieval and insurance product development tools.</p>
      <a href="/sign-in" className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">Sign In</a>
    </div>
  );
}
