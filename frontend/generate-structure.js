import path from "path";
import fs from "fs";
const structure = {
  src: {
    components: {
      common: {
        Button: ["Button.jsx", "index.js"],
        Card: [],
        Icon: [],
        Input: [],
        Badge: [],
        Loader: [],
      },
      layout: {
        Header: [],
        Footer: [],
        Sidebar: [],
      },
      features: {
        products: [],
        cart: [],
        auth: [],
      },
    },
    pages: [],
    hooks: [],
    contexts: [],
    utils: [],
    constants: [],
    services: [],
  },
};

function create(item, currentPath) {
  for (const [name, value] of Object.entries(item)) {
    const fullPath = path.join(currentPath, name);

    if (Array.isArray(value)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 ${fullPath}`);

      value.forEach((file) => {
        const filePath = path.join(fullPath, file);

        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, "");
          console.log(`   📄 ${file}`);
        }
      });
    } else {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`📁 ${fullPath}`);
      create(value, fullPath);
    }
  }
}

create(structure, process.cwd());

console.log("\n✅ Project structure created successfully!");