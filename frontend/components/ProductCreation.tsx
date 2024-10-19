  "use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ProductForm from "@/components/ProductForm";

  
  export default function ProductCreation() {
    const [showForm, setShowForm] = useState(false);

    const handleButtonClick = () => {
      setShowForm(true); // Show form when button is clicked
    };
  
    const handleFormSubmit = () => {
      setShowForm(false); // Hide form and show button after form is submitted
    };
    
    return (
        <>
        {showForm ? 
            (    <ProductForm  /> ) 
            : 
            (
            <Button variant="agro" onClick={handleButtonClick}>
            Add new Product
            </Button> 
        )
        }
        </>
    )
  }
