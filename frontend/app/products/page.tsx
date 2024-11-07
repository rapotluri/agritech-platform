
import Header from "@/components/Header";
import { Card, CardContent,CardHeader, CardTitle } from "@/components/ui/card";
// import ProductTable from "@/components/ProductTable";
import ProductCreation from "@/components/ProductCreation";


export default function InsuranceProducts() {

  return (
    <>
        <Header />
        <div className="flex justify-center items-start space-x-6">
                <Card className="w-[700px]">
                <CardHeader>
                    <CardTitle>Insurance Product Creation</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full items-center gap-4">
                        <ProductCreation/>
                    </div>
                </CardContent>
                </Card>
                {/* <Card className="w-[700px]">
                <CardHeader>
                    <CardTitle>Existing Insurance Products</CardTitle>
                </CardHeader>
                <CardContent>
                    <ProductTable />
                </CardContent>
                </Card> */}
            </div>


    </>

  );
}
