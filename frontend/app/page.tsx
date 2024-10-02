import Header from "../components/Header";
import Form from "../components/Form";


export default function Home() {
  return (
    <>
      <Header />
      <div className="w-full max-w-lg ml-4 p-6 border border-gray-300 shadow-lg rounded-lg">
        <Form />
      </div>

    </>

  );
}
