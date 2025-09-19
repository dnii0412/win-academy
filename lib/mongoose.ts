import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    )
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
declare global {
    var mongoose: {
        conn: any;
        promise: any;
    } | undefined;
}

let cached = global.mongoose

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

// Connection event listeners setup
function setupConnectionListeners() {
    mongoose.connection.on('connected', () => {
    })
    
    mongoose.connection.on('disconnected', () => {
    })
    
    mongoose.connection.on('error', (err) => {
    })
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        }

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            // Setup connection listeners on first connection
            setupConnectionListeners()
            return mongoose
        })
    }

    try {
        cached.conn = await cached.promise
    } catch (e) {
        cached.promise = null
        throw e
    }

    return cached.conn
}

export default dbConnect
