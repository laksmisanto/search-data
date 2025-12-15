import { MongoClient } from 'mongodb'

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://online-education:ls1234prrionti@onlineeducationdata.o4ma7.mongodb.net/'
const dbName = process.env.MONGODB_DB || 'data-search'

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable')
}

let cached = global._mongo
if (!cached) {
  cached = global._mongo = { client: null, promise: null }
}

export async function getDb() {
  if (!cached.client) {
    if (!cached.promise) {
      const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
      cached.promise = client.connect().then((client) => {
        cached.client = client
        return client
      })
    }
    await cached.promise
  }
  const client = cached.client
  return client.db(dbName)
}

export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}
