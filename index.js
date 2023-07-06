const express = require("express");
const cors = require("cors");
const app = express();
const server = require("http").createServer(app);

const port = process.env.PORT || 3000;

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  })
);

app.use("/upload", require("./routes/uploadFiles"));

server.listen(port, function () {
  console.log("Server listening on *:" + port);
});
