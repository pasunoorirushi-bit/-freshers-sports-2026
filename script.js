require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "freshers_sports_2026";

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

if (!MONGODB_URI) {
    console.error("ERROR: MONGODB_URI is missing");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

let registrations;

async function startServer() {
    try {
        await client.connect();

        await client.db("admin").command({ ping: 1 });

        const db = client.db(DB_NAME);
        registrations = db.collection("registrations");

        await registrations.createIndex(
            { registrationId: 1 },
            { unique: true }
        );

        console.log("MongoDB connected successfully");

        app.get("/api/health", (req, res) => {
            res.json({
                success: true,
                message: "Freshers Sports server is running"
            });
        });

        app.post("/api/registrations", async (req, res) => {
            try {
                const data = req.body;

                if (!data.registrationId) {
                    return res.status(400).json({
                        success: false,
                        message: "Registration ID is required"
                    });
                }

                const registration = {
                    ...data,
                    createdAt: new Date()
                };

                await registrations.insertOne(registration);

                res.status(201).json({
                    success: true,
                    message: "Registration saved successfully",
                    registrationId: data.registrationId
                });

            } catch (error) {
                console.error(error);

                if (error.code === 11000) {
                    return res.status(409).json({
                        success: false,
                        message: "Registration ID already exists"
                    });
                }

                res.status(500).json({
                    success: false,
                    message: "Failed to save registration"
                });
            }
        });

        app.get("/api/registrations", async (req, res) => {
            try {
                const data = await registrations
                    .find({})
                    .sort({ createdAt: -1 })
                    .limit(100)
                    .toArray();

                res.json({
                    success: true,
                    count: data.length,
                    registrations: data
                });

            } catch (error) {
                console.error(error);

                res.status(500).json({
                    success: false,
                    message: "Failed to retrieve registrations"
                });
            }
        });

        app.listen(PORT, "0.0.0.0", () => {
            console.log("");
            console.log("=================================");
            console.log(" Freshers Sports 2026");
            console.log("=================================");
            console.log("Server running on port " + PORT);
            console.log("Open: http://localhost:" + PORT);
            console.log("");
        });

    } catch (error) {
        console.error("MongoDB connection failed:");
        console.error(error.message);
        process.exit(1);
    }
}

startServer();