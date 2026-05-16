const fs = require('fs');
const filePath = 'c:\\xampp\\htdocs\\ropita\\client\\pages\\Product.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/selected_options:\s*matchingVariant\?\.variant_values\s*\n\s*\}\);/, `selected_options: matchingVariant?.variant_values,
        stock_quantity: displayStockCount,
        manage_stock: product.stockStatus === 'stock_based'
      });`);

fs.writeFileSync(filePath, content);
console.log('Product.tsx updated with stock_quantity and manage_stock');
