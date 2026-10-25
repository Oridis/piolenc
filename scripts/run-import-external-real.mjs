import { importExternalProducts } from "./external-prepare.mjs";
import { externalRealProducts } from "./prepare-external-real-products.mjs";

importExternalProducts(externalRealProducts)
  .then((results) => {
    console.log(JSON.stringify({ imported: results.length, results }, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
