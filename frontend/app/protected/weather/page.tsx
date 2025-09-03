import Header from "../../../components/Header";
import Form from "../../../components/Form";
import DownloadHistory from "../../../components/weather/DownloadHistory";

export default function WeatherDataRetrieval() {
  return (
    <>
      <Header />
      <div className="container mx-auto p-6 space-y-8">
        <div className="w-full max-w-lg p-6 border border-gray-300 shadow-lg rounded-lg">
          <Form />
        </div>
        <DownloadHistory />
      </div>
    </>
  );
} 