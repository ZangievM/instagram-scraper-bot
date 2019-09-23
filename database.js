const mongoClient = require('mongodb').MongoClient
const config = require('./config')
const uri = config.mongoUrl

const dbLink = 'test'
const postsCollection = 'posts'
const usersCollection = 'users'
var insert = function (data, collectionName = postsCollection) {
    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(uri, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                const db = client.db(dbLink).collection(collectionName)
                db.insertOne(data, (err, res) => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(res)
                        client.close()
                    }

                })
            })
        } catch (error) {
            reject(error)
        }
    })
}
var update = function (query, data, collectionName = postsCollection) {
    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(uri, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                let groups = client.db(dbLink).collection(collectionName)
                groups.updateOne(query, {
                        $set: data
                    })
                    .then(res => {
                        client.close()
                        resolve(res)
                    })
                    .catch(error => {
                        logger.log(`database error in ${collectionName} group update ` + error, 'error');
                        reject(error)
                    })
            })
        } catch (error) {
            reject(error)
        }
    })
}
var remove = function (query, collectionName = postsCollection) {
    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(uri, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }

                let groups = client.db(dbLink).collection(collectionName)
                groups.deleteOne(query)
                    .then(res => {
                        client.close()
                        resolve(res)
                    })
                    .catch(error => {
                        logger.log('database error in function query ' + error, 'error');
                    })
            })
        } catch (error) {
            reject(error)
        }
    })
}
var query = function (query = {}, collectionName = postsCollection) {
    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(uri, (err, client) => {
                if (err) {
                    console.log('QUERY IN DATABASE', err);
                    resolve([])
                    return;
                }
                const db = client.db(dbLink).collection(collectionName)
                db.find(query).toArray((err, res) => {
                    if (err) {
                        console.log('QUERY IN DATABASE', err);
                        resolve([])
                    } else {
                        if (res)
                            resolve(res)
                        else
                            resolve([])
                        client.close()
                    }

                })
            })
        } catch (error) {
            console.log('QUERY IN DATABASE', error);
            resolve([])
        }
    })
}

var handleObject = function (object, collectionName = postsCollection) {
    return new Promise((resolve, reject) => {
        try {
            mongoClient.connect(uri, (err, client) => {
                if (err) {
                    reject(err);
                    return;
                }
                const db = client.db(dbLink).collection(collectionName)
                db.findOne({
                        shortcode: object.shortcode
                    }).then(res => {
                        if (!res) {
                            insert(object)
                        } else
                        if (object.user != res.user || object.desc != res.desc)
                            update({
                                shortcode: object.shortcode
                            }, object)
                        client.close()
                        resolve()
                    })
                    .catch(err => reject(err))
            })
        } catch (error) {
            reject(error)
        }
    })
}
var getAllPosts = async () => {
    let posts = await query()
    let res = []
    for (const item of posts) {
        res.push(`https://www.instagram.com/p/${item.shortcode}`)
    }
    return res
}
var getPostsFromUser = async (user) => {
    let posts = await query({
        user: user
    })
    let res = []
    for (const item of posts) {
        res.push(`https://www.instagram.com/p/${item.shortcode}`)
    }
    return res
}
var findWithHashTags = async (hashTags) => {
    let tags = [].concat(hashTags)
    let regString = tags.reduce((res, item) => res += `|${item}`)
    regString = `(${regString})`
    let reg = new RegExp(regString)
    let res = await query({
        desc: reg
    })


    return res.map(element => `https://www.instagram.com/p/${element.shortcode}`)
}
var insertUser = async (id, chatId) => {
    let user = {
        id: id,
        chatId: chatId
      }
      // Insert user to 'users' collection 
      await insert(user, 'users')
}

module.exports = {
    handleObject,
    getAllPosts,
    getPostsFromUser,
    findWithHashTags,
    insertUser
}