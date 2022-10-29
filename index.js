const express = require('express')
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ServiceRouter = require('./Routes/Service.Route')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vugvxkr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {

  try {
    await client.connect()
    const serviceCollection = client.db('creative').collection('service')
    const reviewCollection = client.db('creative').collection('review')
    const userCollection = client.db('creative').collection('user')

    // app.use('/service', ServiceRouter)
    app.get('/service', async (req, res) => {
      const query = {}
      const cursor = serviceCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/review', async (req, res) => {
      const query = {}
      const cursor = reviewCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    });

    app.put('/user/:email', async(req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email}
      const options = { upsert: true };
      const updateEmail = {
       $set: user
     };
     const result = await userCollection.updateOne(filter, updateEmail, options);
     res.send(result)  
    })
  }
  finally {

  }
}
run().catch(console.dir())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log('Example app listening on port', port)
})
module.exports = run