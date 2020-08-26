const express = require("express");
const app = express();
const fs = require("fs").promises;
const filePath = "./data.json";

function checkHttps(request, response, next) {
    // Check the protocol — if http, redirect to https.
    if (request.get("X-Forwarded-Proto").indexOf("https") != -1) {
        return next();
    } else {
        response.redirect("https://" + request.hostname + request.url);
    }
}

app.all("*", checkHttps);

app.use(express.static("../client/build"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// http://localhost:8080/api/tickets?searchText=Need+a+Little
// http://localhost:8080/api/tickets?searchContent=my+code+to+display+commas
// http://localhost:8080/api/tickets?Email=jug%40nesetal.af
app.get("/api/tickets", async (req, res) => {
    const content = await fs.readFile(filePath);
    const arr = JSON.parse(content);
    const { searchText } = req.query;
    const { searchContent } = req.query;
    const email = req.query.Email;
    if (searchText) {
        const filterArr = arr.filter((obj) =>
            obj.title.toLowerCase().includes(searchText.toLowerCase())
        );
        res.send(filterArr);
    } else if (searchContent) {
        const filterArr = arr.filter((obj) =>
            obj.content.toLowerCase().includes(searchContent.toLowerCase())
        );
        res.send(filterArr);
    } else if (email) {
        const filterArr = arr.filter((obj) =>
            obj.userEmail.toLowerCase().includes(email.toLowerCase())
        );
        res.send(filterArr);
    } else {
        res.send(arr);
    }
});

app.post("/api/tickets/:ticketId/done", async (req, res) => {
    const content = await fs.readFile(filePath);
    const arr = JSON.parse(content);
    const index = arr.findIndex((obj) => obj.id === req.params.ticketId);
    arr[index].done = true;
    await fs.writeFile(filePath, JSON.stringify(arr));
    res.send({ updated: true });
});

app.post("/api/tickets/:ticketId/undone", async (req, res) => {
    const content = await fs.readFile(filePath);
    const arr = JSON.parse(content);
    const index = arr.findIndex((obj) => obj.id === req.params.ticketId);
    arr[index].done = false;
    await fs.writeFile(filePath, JSON.stringify(arr));
    res.send({ updated: true });
});

app.get("/api/tickets/done", async (req, res) => {
    const content = await fs.readFile(filePath);
    const arr = JSON.parse(content);
    const filterArr = arr.filter((obj) => obj.done);
    res.send(filterArr);
});

app.get("/api/tickets/undone", async (req, res) => {
    const content = await fs.readFile(filePath);
    const arr = JSON.parse(content);
    const filterArr = arr.filter((obj) => !obj.done);
    res.send(filterArr);
});

let port;
console.log("❇️ NODE_ENV is", process.env.NODE_ENV);
if (process.env.NODE_ENV === "production") {
    port = process.env.PORT || 3000;
    app.use(express.static(filePath.join(__dirname, "../build")));
    app.get("*", (request, response) => {
        response.sendFile(filePath.join(__dirname, "../build", "index.html"));
    });
} else {
    port = 3001;
    console.log("⚠️ Not seeing your changes as you develop?");
    console.log(
        "⚠️ Do you need to set 'start': 'npm run development' in package.json?"
    );
}

// Start the listener!
const listener = app.listen(port, () => {
    console.log(
        "❇️ Express server is running on port",
        listener.address().port
    );
});
