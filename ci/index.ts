import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Hello, CicadaCI!");
});

app.listen(PORT, () => {
  console.log(`CicadaCI API listening on port ${PORT}`);
});
