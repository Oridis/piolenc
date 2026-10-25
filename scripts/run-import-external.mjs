import { importExternalProducts } from "./external-prepare.mjs";

const payload = JSON.parse(process.argv[2] || "[]");
if (!payload.length) {
  console.error("Usage: node scripts/run-import-external.mjs '[ {...}, {...} ]'");
  process.exit(0);
}

importExternalProducts(payload)
  .then((results) => {
    console.log(JSON.stringify({ imported: results.length, results }, null, 2));
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
