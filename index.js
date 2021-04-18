const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const fs = require('fs-extra')
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.taqt5.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express()

app.use(bodyParser.json());
app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(express.static('services'));
app.use(express.static('reviews'));
app.use(fileUpload());

const port = process.env.PORT || 8000;

app.get('/', (req, res) => {
    res.send("hello from db it's working working")
})

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const serviceCollection = client.db("carWash").collection("products");
    const reviewCollection = client.db("carWash").collection("reviews");
    const shipmentCollection = client.db("carWash").collection("shipmentInfo");
    const adminCollection = client.db("carWash").collection("admins");



    app.post('/booklistByAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, email) => {
                
                if (email.length === 0) {
                    console.log('email is empty')
                }
               
                shipmentCollection.find({})
                    .toArray((err, documents) => {
                         
                        res.send(documents);
                    })
            })

    })
//booklist for user
     app.get('/showCustomersOrder', (req, res) => {
        shipmentCollection.find({ email: req.query.email })
            .toArray((err, items) => {
                res.send(items)
            })
    })
    // //post a service inforamtion.
    app.post('/addService', (req, res) => {
        const file = req.files.file;
        const serviceName = req.body.name;
        const price = req.body.price;
        const description = req.body.description;

            const newImg = file.data;
            const encImg = newImg.toString('base64');
            const image = {
                contentType: file.mimetype,
                size: file.size,
                img: Buffer.from(encImg, 'base64')
            };

            serviceCollection.insertOne({ serviceName, description, price, image })
                .then(result => {
                    
                        res.send(result.insertedCount > 0);
                    })

                })
     

     

    //post a review  information.


    app.post('/addReviews', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const company = req.body.company;
        const description = req.body.description;

        const filePath = `${__dirname}/reviews/${file.name}`;
        file.mv(filePath, err => {
            if (err) {

                return res.status(500).send('Image Upload Failed!')
            }
            const newImg = fs.readFileSync(filePath);
            const encImg = newImg.toString('base64');
            const image = {
                contentType: req.files.file.mimetype,
                size: req.files.file.size,
                img: Buffer.from(encImg, 'base64')
            };

            reviewCollection.insertOne({ name, description, company, image })
                .then(result => {
                    fs.remove(filePath, errors => {
                        if (errors) {
                            return res.status(500).send('Image Upload Failed!')
                        }
                        res.send(result.insertedCount > 0);
                    })

                })
        })

    })

    //post a admin.

    app.post('/addAdmin', (req, res) => {

        const email = req.body.email;

        adminCollection.insertOne({ email })
            .then(result => {
                console.log(result)

            })
    })

    app.post('/isAdmin', (req, res) => {
        const email = req.body.email;
        adminCollection.find({ email: email })
            .toArray((err, admins) => {
                res.send(admins.length > 0);
            })
    })



    //read reviews from database.
    app.get('/reviews', (req, res) => {
        reviewCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });

    app.post('/shipments', (req, res) => {

        const newOrder = req.body;
        console.log(newOrder)
        shipmentCollection.insertOne(newOrder)
            .then(result => {

                res.send(result.insertedCount > 0);

            })
    })

    app.get('/product/:id', (req, res) => {
        serviceCollection.find({ _id: ObjectId(req.params.id) })
            .toArray((err, items) => {
                res.send(items)
            })
    })

   //delete a product from database.

    app.delete('/productDelete/:id', (req, res) => {
        serviceCollection.findOneAndDelete({ _id: ObjectId(req.params.id) })
            .then(document => {
                res.redirect("/")
            })
    })

//read all products from database

    app.get('/allProduct', (req, res) => {
        serviceCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})