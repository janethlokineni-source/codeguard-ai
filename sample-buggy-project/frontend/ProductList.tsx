import React from 'react';

export const ProductList = ({ items }: any) => {
  // TODO: Add pagination and error boundary
  return (
    <div className="product-list">
      {/* Missing alt attribute */}
      <img src="/logo.png" />

      {/* Missing React key in iteration */}
      {items.map((item: any) => (
        <div>
          <h3>{item.name}</h3>
          <p>{item.price}</p>
        </div>
      ))}
    </div>
  );
};

