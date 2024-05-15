//SERVER SETUP

const express = require("express");
const cors = require("cors");
require("dotenv").config();
// const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//CONFIG
const app = express();
const port = process.env.PORT || 5000;

// //MIDDLEWARE

const corsConfig = {
  origin: [
    "*",
    "http://localhost:5174",
    "http://localhost:5173",
    "https://prodswap-hub.web.app",
  ],
  credentials: true,
};
app.use(cors(corsConfig));
app.use(express.json());
app.use(cookieParser());
// JWT MIDDLEWARE

// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   console.log(req.cookies);
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized access" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log(err);
//       return res.status(401).send({ message: "unauthorized access" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

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

const cookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
};
//localhost:5000 and localhost:5173 are treated as same site.  so sameSite value must be strict in development server.  in production sameSite will be none
// in development server secure will false .  in production secure will be true

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

    // app.post("/jwt", async (req, res) => {
    //   const user = req.body;
    //   console.log("I need a new jwt", user);
    //   const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    //     expiresIn: "365d",
    //   });
    //   res.cookie("token", token, cookieOptions).send({ success: true });
    // });

    //clearing Token
    // app.post("/logout", async (req, res) => {
    //   const user = req.body;
    //   console.log("logging out", user);
    //   res
    //     .clearCookie("token", { ...cookieOptions, maxAge: 0 })
    //     .send({ success: true });
    // });

    // -------------------------------------HOME

    // GET ALL THE POSTED QUERIES FOR HOME PAGE RECENT QUERIES
    app.get("/recent-queries", async (req, res) => {
      try {
        // Fetch all queries from the collection
        const result = await queriesCollection.find().toArray();
        // Reverse the array to get the most recent queries first
        const reversedResult = result.reverse();
        // Send the reversed array as the response
        res.send(reversedResult);
      } catch (error) {
        // Handle any errors that occur during the database operation
        console.error("Error fetching recent queries:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // --------------------------------------------------QUERIES
    // GET ALL QUERIES
    app.get("/queries", async (req, res) => {
      try {
        // Fetch all queries from the collection
        const cursor = queriesCollection.find();
        const result = await cursor.toArray();
        // Send the array of queries as the response
        res.send(result);
      } catch (error) {
        // Handle any errors that occur during the database operation
        console.error("Error fetching queries:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // POST THE QUERY TO DB FROM ADD QUERIES PAGE
    app.post("/queries", async (req, res) => {
      try {
        // Log the incoming request body
        console.log(req.body);
        // Store the data to the database
        const result = await queriesCollection.insertOne(req.body);
        // Send the result of the database operation as the response
        res.send(result);
      } catch (error) {
        // Handle any errors that occur during the database operation
        console.error("Error storing query to database:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET A SINGLE QUERY BY ID FOR QUERY DETAILS PAGE

    // GET THE QUERIES BY USER EMAIL FOR MY QUERIES PAGE FOR THAT USER ONLY
    app.get("/my-queries/:email", async (req, res) => {
      // const tokenEmail = req.user.email;

      const email = req.params.email;

      // if (tokenEmail !== email) {
      //   return res.status(403).send({ message: "Forbidden Access" });
      // }
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
    // POST THE RECOMMENDATION DATA TO DB
    app.post("/recommendation", async (req, res) => {
      const recommendationData = req.body;

      try {
        // Insert the recommendation data into the database
        const result = await recommendationCollection.insertOne(
          recommendationData
        );

        // Increment recommendation count for the corresponding query
        const updateStatus = await queriesCollection.updateOne(
          { _id: new ObjectId(recommendationData.queryId) },
          { $inc: { "addQueriesUserInfo.recommendationCount": 1 } }
        );
        console.log(updateStatus);

        console.log(result);
        res.send(result);
      } catch (error) {
        console.error("Error adding recommendation:", error);
        res
          .status(500)
          .send("Error adding recommendation. Please try again later.");
      }
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
      const result = await queriesCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // ----------------------------  RECOMMENDATION DELETE
    app.delete("/recommendation/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Deleted id:", id);
      const result = await recommendationCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // DELETE A QUERY FROM DB

    // ----------------------------UPDATE
    // UPDATE TO SERVER
    app.put("/query/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedQuery = req.body;

      const newUpdatedCraft = {
        $set: {
          productName: updatedQuery.productName,
          productBrand: updatedQuery.productBrand,
          productImage: updatedQuery.productImage,
          queryTitle: updatedQuery.queryTitle,
          boycottingReason: updatedQuery.boycottingReason, // corrected reference here
        },
      };

      try {
        const result = await queriesCollection.updateOne(
          filter,
          newUpdatedCraft,
          options
        );
        res.send(result);
      } catch (error) {
        console.error("Error updating query:", error);
        res
          .status(500)
          .send({ message: "Error updating query. Please try again later." });
      }
    });

    // RECOMMEDNATION COUNT
    // GET RECOMMENDATION COUNT FOR A POST

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
