const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kxul6c6.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_SECRET_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const serviceCollection = client.db('photography').collection('services');
        const reviewCollection = client.db('photography').collection('review')

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_SECRET_TOKEN, { expiresIn: '1d' });
            res.send({ token })
        })



        app.get('/services', async (req, res) => {
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.limit(size).sort({ _id: -1 }).toArray();
            res.send(services)
        })


        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })

        app.post('/services', async (req, res) => {
            const services = req.body;
            const result = await serviceCollection.insertOne(services);
            res.send(result)
        })

        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        })

        app.get('/review', async (req, res) => {

            let query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.sort({ _id: -1 }).toArray();
            res.send(reviews)
        })



        app.delete('/review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        })

        app.get('/updateReview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.findOne(query);
            res.send(result)
        })

        app.patch('/updateReview/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.updateOne(query, { $set: req.body });
            res.send(result)
        })
        app.get('/review/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const decoded = req.decoded;
            console.log(decoded)

            if (decoded.email !== req.query.email) {
                return res.status(403).send({ message: 'unauthorized access' })
            }
            console.log(email)
            const query = { email: email };
            const result = await reviewCollection.find(query);
            res.send(result)
        })

    }
    finally {

    }
}
run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send('Server is running')
})

app.listen(port, () => {
    console.log(`Photography server running on ${port}`);
})