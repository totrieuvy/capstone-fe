export const getFormattedPrice = (price: string | number): string => {
  let numericPrice: number;
  
  if (typeof price === "number") {
    numericPrice = price;
  } else {
    // Handle string prices that may have commas as thousand separators
    // Remove commas and parse as number
    const cleanPrice = price.replace(/,/g, "");
    numericPrice = parseFloat(cleanPrice) || 0;
  }
  
  const integerPart = Math.floor(numericPrice).toLocaleString("vi-VN");
  return `${integerPart} đ`;
};
