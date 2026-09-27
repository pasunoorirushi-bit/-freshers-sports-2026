const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
    try {
        console.log("Starting in-memory MongoDB instance...");
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        
        process.env.MONGODB_URI = uri;
        console.log("In-memory MongoDB started at:", uri);
        
        // Execute the main server script
        require('./script.js');
    } catch (err) {
        console.error("Failed to start memory server:", err);
        process.exit(1);
    }
})();
