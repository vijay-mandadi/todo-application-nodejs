const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(2000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    process.exit(1);
  }
};

initializeDBAndServer();

let checkStatusAndPriority = (n) => {
  return n.status !== undefined && n.priority !== undefined;
};

let checkStatus = (n) => {
  return n.status !== undefined;
};

let checkPriority = (n) => {
  return n.priority !== undefined;
};

app.get("/todos/", async (request, response) => {
  let query = "";
  let { search_q, status, priority } = request.query;
  switch (true) {
    case checkStatusAndPriority(request.query):
      query = `SELECT * FROM todo WHERE status LIKE '${status}' AND priority LIKE '${priority}'`;
      break;
    case checkStatus(request.query):
      query = `SELECT * FROM todo WHERE status LIKE '${status}'`;
      break;
    case checkPriority(request.query):
      query = `SELECT * FROM todo WHERE priority LIKE '${priority}'`;
      break;
    default:
      query = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`;
  }
  let obj = await db.all(query);
  response.send(obj);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    SELECT
      *
    FROM
      todo
    WHERE
      id=${todoId};`;
  const obj = await db.get(query);
  response.send(obj);
});

app.post("/todos/", async (request, response) => {
  let details = request.body;
  let { id, todo, priority, status } = details;
  let query = `INSERT INTO todo(id,todo,priority,status) VALUES(${id},'${todo}','${priority}','${status}');`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;
  let text = "";
  let query = "";
  let details = request.body;
  switch (true) {
    case details.status !== undefined:
      query = `UPDATE todo SET status ='${details.status}' WHERE id=${todoId}`;
      text = "Status";
      break;
    case details.priority !== undefined:
      query = `UPDATE todo SET priority ='${details.priority}' WHERE id=${todoId}`;
      text = "Priority";
      break;
    case details.todo !== undefined:
      query = `UPDATE todo SET todo ='${details.todo}' WHERE id=${todoId}`;
      text = "Todo";
      break;
  }
  await db.run(query);
  response.send(`${text} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
