  "use client"

import ProductForm from "@/components/ProductForm";
// import { ProductDialog } from "./ProductDialog";

  
  export default function ProductCreation() {
    // const [showForm, setShowForm] = useState(false);

    // const handleButtonClick = () => {
    //   setShowForm(true); // Show form when button is clicked
    // };
  
    
    return (
        <>
        {/* {showForm ? 
            (    <ProductForm  /> ) 
            : 
            (
            // <Button variant="agro" onClick={handleButtonClick}>
            // Add new Product
            // </Button> 
            <ProductDialog/>
        )
        } */}
        <ProductForm  />
        </>
    )
  }
