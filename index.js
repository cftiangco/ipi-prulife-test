const express = require('express');
const couchbase = require('couchbase')
const cors = require('cors');
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const uuid = require('uuid')


const app = express();

app.set('view engine', 'ejs')
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// const cluster = new couchbase.Cluster("couchbase://localhost:8091/", {
//     username: 'Administrator',
//     password: 'password'
// })

const cluster = new couchbase.Cluster("couchbase://database", {
    username: 'Administrator',
    password: 'password'
})

const bucket = cluster.bucket('users');
const collection = bucket.defaultCollection();

app.get('/',(req,res) => {
    res.render('pages/index');
});

app.post('/login', async (req, res) => {
    if (!req.body.username && !req.body.password) {
        return res.status(401).send({ "message": "`Username` and `Password` are required" });
    } else if (!req.body.username || !req.body.password) {
        return res.status(401).send({ "message": `${!req.body.username ? '`Username`' : '`Password`'} is required` });
    }
    const options = {
        parameters: {
            username:req.body.username
        }
    }

    const query = "SELECT * FROM `users` WHERE username = $username";
    await cluster.query(query, options)
      .then((result) => {
            
            if(result.rows.length > 0) {
                const user = result.rows[0].users;
                if(!bcrypt.compareSync(req.body.password,user.password)) {
                    return res.status(401).send({ "message": "Incorrect Password" });
                }
                res.send(user);
            } else {
                res.status(401).send({"message": `Username does not exists`})
            }
      })
      .catch((error) => res.status(500).send({
        "message": `Query failed: ${error.message}`
      }))
});

app.post('/register', async (req, res) => {

    if (!req.body.username && !req.body.password) {
        return res.status(401).send({ "message": "An `username` and `password` are required" });
    } else if (!req.body.username || !req.body.password) {
        return res.status(401).send({ "message": `A ${!req.body.username ? '`username`' : '`password`'} is required` });
    }

    const id = uuid.v4()
    const newUser = {
        "username": req.body.username,
        "password": bcrypt.hashSync(req.body.password, 10)
    }

    await collection.insert(id, newUser)
        .then(async (result) => {
            res.send(result)
        }).catch(e => res.status(500).send(e));
});


app.listen(3000, () => {
    console.log(`MyApp app listening on port 3000`)
})