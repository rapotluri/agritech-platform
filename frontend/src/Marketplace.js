import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Marketplace() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/marketplace');
        console.log('Products fetched:', response.data);
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div>
      <h1>Marketplace</h1>
      {products.length > 0 ? (
        <ul>
          {products.map(product => (
            <li key={product.id}>{product.name}: ${product.price}</li>
          ))}
        </ul>
      ) : (
        <p>No products available.</p>
      )}
    </div>
  );
}

export default Marketplace;
