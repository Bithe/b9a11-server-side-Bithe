//SERVER SETUP

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//CONFIG
const app = express();
const port = process.env.PORT || 5000;

//MIDDLEWARE
// app.use(cors());
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
};
app.use(cors(corsConfig));

app.use(express.json());

// CONNECT TO DB

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mfawfp8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    //------------------------ DB CREATE
    const queriesCollection = client
      .db("prodSwapDb")
      .collection("prodSwapQueries");
    const recommendationCollection = client
      .db("prodSwapDb")
      .collection("prodSwapRecommendation");

      // -------------------------------------HOME

    // GET ALL THE POSTED QUERIES FOR HOME PAGE RECENT QUERIES
    app.get("/recent-queries", async (req, res) => {
      const result = await queriesCollection.find().toArray();
      const reversedResult = result.reverse();

      res.send(reversedResult);
    });



    // --------------------------------------------------QUERIES
    // GET ALL QUERIES
    app.get("/queries", async (req, res) => {
      console.log(req.params.email);

      const cursor = queriesCollection.find();
      const result = await cursor.toArray();
      // const result = await craftCollection.find({ email: req.params.email }).toArray();
      res.send(result);
    });

    // POST THE QUERY TO DB FROM ADD QUERIES PAGE
    app.post("/queries", async (req, res) => {
      console.log(req.body);
      // data coming from client site is req
      // data going server to client is res
      // STORE THE DATA TO DB
      const result = await queriesCollection.insertOne(req.body);
      console.log(result);
      res.send(result);
    });

    // GET A SINGLE QUERY BY ID FOR QUERY DETAILS PAGE

    // GET THE QUERIES BY USER EMAIL FOR MY QUERIES PAGE FOR THAT USER ONLY
    app.get("/my-queries/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "addQueriesUserInfo.email": email };
      // const result = await queriesCollection.find(query).toArray();
      const result = await queriesCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // TO UPDATE GET SINGLE DATA FROM API AND ALSO IT WILL WORD FOR QUERY DETAILS PAGE
    app.get("/query/:id", async (req, res) => {
      const id = req.params.id;
      console.log("updated id:", id);
      // const query = { _id: new ObjectId(id) };

      const result = await queriesCollection.findOne({ _id: new ObjectId(id) });
      console.log("update data:", result);

      res.send(result);
    });



    //--------------------------------------------------------- RECOMMENDATION

    // POST THE RECOMMENDATION DATA TO DB
    app.post("/recommendation", async (req, res) => {
      const recommendationData = req.body;
      const result = await recommendationCollection.insertOne(
        recommendationData
      );
      console.log(result);
      res.send(result);
    });

    // GET ALL THE RECOMMENDATION FOR USER FROM DB FOR MY RECOMMENDATION PAGE
    app.get("/my-recommendations/:email", async (req, res) => {
      const email = req.params.email;
      const query = { recommendedUserEmail: email };
      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    });

    // GET RECOMMENDATION FOR ME
    app.get("/recommendations-for-me/:email", async (req, res) => {
      const email = req.params.email;
      const query = { "queryPosterUserInf.email": email };

      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    });


    // ALL RECOMMENDATIONS FOR THAT QUERY
    app.get("/recommendations/:queryId", async (req, res) => {
      const queryId = req.params.queryId;

      const query = { "queryPosterUserInf.queryId": queryId };
      const result = await recommendationCollection.find(query).toArray();
      res.send(result);
    });



    // ----------------------------  QUERY DELETE

    app.delete("/queries/:id", async (req, res) => {

      const id = req.params.id;
      console.log("Deleted id:", id);
      const result = await queriesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    // ----------------------------  RECOMMENDATION DELETE
    app.delete("/recommendation/:id", async (req, res) => {

      const id = req.params.id;
      console.log("Deleted id:", id);
      const result = await recommendationCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });



    // DELETE A QUERY FROM DB



    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//ROOT
app.get("/", (req, res) => {
  res.send("ProdSwap server is running");
});

app.listen(port, () => {
  console.log(`ProdSwap server is running on port: ${port}`);
});
