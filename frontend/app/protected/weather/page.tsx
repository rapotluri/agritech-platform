import Header from "../../../components/Header";
import WeatherDataForm from "../../../components/weather/WeatherDataForm";
import WeatherDownloadHistory from "../../../components/weather/WeatherDownloadHistory";

export default function WeatherDataRetrieval() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Weather Data Retrieval</h1>
          <p className="text-gray-600 mt-2">Request and download weather data for agricultural analysis</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="order-1 lg:order-1 lg:col-span-1">
            <WeatherDataForm />
          </div>
          
          {/* History Card */}
          <div className="order-2 lg:order-2 lg:col-span-2">
            <WeatherDownloadHistory />
          </div>
        </div>
      </div>
    </>
  );
} 