const express = require('express')
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, Admin, ObjectId } = require('mongodb');
const ServiceRouter = require('./Routes/Service.Route')
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()

app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vugvxkr.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'unAuthorized access' })
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.JSON_WEB_SECRET_KEY, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'forbidden access' })
    }
    req.decoded = decoded
    next()
  })

}

async function run() {


  try {
    await client.connect()
    const serviceCollection = client.db('creative').collection('service')
    const reviewCollection = client.db('creative').collection('review')
    const userCollection = client.db('creative').collection('user')
    const orderCollection = client.db('creative').collection('order')


    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;

      const requesterAccount = await userCollection.findOne({ email: requester });
      console.log(requesterAccount)
      if (requesterAccount.role === 'admin') {
        next();
      }
      else {
        res.status(403).send({ message: 'forbidden' });
      }
    }

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

    // add review
    app.post('/review', async (req, res) => {
      const reviewData = req.body;
      const result = await reviewCollection.insertOne(reviewData)
      res.send(result)
    })

    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email }
      const options = { upsert: true };
      const updateEmail = {
        $set: user
      }
      const result = await userCollection.updateOne(filter, updateEmail, options);

      const token = jwt.sign({ email: email }, process.env.JSON_WEB_SECRET_KEY, { expiresIn: '1h' })
      res.send({ result, token })

    });

    app.get('/admin/:email', async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email: email });
      const isAdmin = result.role === "admin"
      res.send({ admin: isAdmin })
    })

    app.put('/user/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: { role: 'admin' },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    // add service
    app.post('/service', async (req, res) => {
      const inserted = req.body
      const result = await serviceCollection.insertOne(inserted)
      res.send(result)
    });

    // order 

    app.post('/order', async (req, res) => {
      const orderData = req.body;
      const result = await orderCollection.insertOne(orderData)
      res.send(result)
    })

    // get user data
    app.get('/order/:email', async (req, res) => {
      const email = req.params.email
      const getData = await orderCollection.find({ email: email }).toArray();
      res.send(getData)
    })

    // get all service 
    app.get('/order', async (req, res) => {
      const result = await orderCollection.find().toArray();
      res.send(result)
    })

    // update status 
    app.put('/order/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: { status: 'Done' },
      };
      const result = await orderCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
    
    // 
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