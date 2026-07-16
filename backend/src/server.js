const { app } = require("./app");

const port = process.env.PORT || 3333;

app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server started on port ${port}!`);
});
