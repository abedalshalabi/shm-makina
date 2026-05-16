const fs = require('fs');
const path = 'c:/xampp/htdocs/ropita/client/pages/Product.tsx';
let content = fs.readFileSync(path, 'utf8');

console.log('Original content length:', content.length);

// 1. Update interface
content = content.replace(
  /filter_values: Record<string, string\[\]>;\s*}/,
  'filter_values: Record<string, string[]>;\n  show_description?: boolean;\n  show_specifications?: boolean;\n}'
);

// 2. Update loadProduct
const loadProductPattern = /return normalized;\s*\}\)\(\)\s*\};/;
if (loadProductPattern.test(content)) {
    content = content.replace(
      loadProductPattern,
      `return normalized;
          })(),
          show_description: apiProduct.show_description !== undefined ? Boolean(apiProduct.show_description) : true,
          show_specifications: apiProduct.show_specifications !== undefined ? Boolean(apiProduct.show_specifications) : true,
        };`
    );
} else {
    console.log('Failed to match loadProductPattern');
}

// Add initial active tab logic
const variantsPattern = /if \(apiProduct\.variants && apiProduct\.variants\.length > 0\) \{/;
if (variantsPattern.test(content)) {
    content = content.replace(
      variantsPattern,
      `if (transformedProduct.show_description) {
          setActiveTab('description');
        } else if (transformedProduct.show_specifications) {
          setActiveTab('specifications');
        }

        if (apiProduct.variants && apiProduct.variants.length > 0) {`
    );
} else {
    console.log('Failed to match variantsPattern');
}

// 3. Update UI
const tabsHeaderPattern = /\{\s*\[\s*\{\s*key:\s*'description',\s*label:\s*'الوصف'\s*\},\s*\{\s*key:\s*'specifications',\s*label:\s*'المواصفات'\s*\}\s*\]\.map\(\(tab\) => \(/;
if (tabsHeaderPattern.test(content)) {
    content = content.replace(
      tabsHeaderPattern,
      `{
                [
                  { key: 'description', label: 'الوصف', show: product.show_description },
                  { key: 'specifications', label: 'المواصفات', show: product.show_specifications }
                ].filter(tab => tab.show).map((tab) => (`
    );
} else {
    console.log('Failed to match tabsHeaderPattern');
}

// Wrap the whole tabs section
const tabsDivPattern = /\{\/\* Product Details Tabs \*\/\}\s*<div className="bg-white rounded-2xl shadow-lg overflow-hidden">/;
if (tabsDivPattern.test(content)) {
    content = content.replace(
      tabsDivPattern,
      `{/* Product Details Tabs */}
        {(product.show_description || product.show_specifications) && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">`
    );
    
    // Add closing parenthesis for the conditional
    // This is the hardest part. I'll search for the div closure before Contact Support.
    const contactSupportPattern = /\s*\{\/\* Contact Support \*\/\}/;
    const parts = content.split(contactSupportPattern);
    if (parts.length > 1) {
        // Find the last </div> in the first part
        const lastDivIndex = parts[0].lastIndexOf('</div>');
        if (lastDivIndex !== -1) {
            parts[0] = parts[0].substring(0, lastDivIndex + 6) + '\n        )}' + parts[0].substring(lastDivIndex + 6);
            content = parts.join('        {/* Contact Support */}'); // join with the anchor
            // Wait, the split removed the anchor.
        }
    }
} else {
    console.log('Failed to match tabsDivPattern');
}

content = content.replace(
  /\{activeTab === 'description' && \(/g,
  `{activeTab === 'description' && product.show_description && (`
);

content = content.replace(
  /\{activeTab === 'specifications' && \(/g,
  `{activeTab === 'specifications' && product.show_specifications && (`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully updated Product.tsx');
console.log('Updated content length:', content.length);
