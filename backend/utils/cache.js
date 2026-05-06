const {Redis} = require("@upstash/redis");

const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});



// TTL values (in seconds)
const TTL = {
    states:       86400,    // 24 hours — states never change
    districts:    86400,    // 24 hours — districts never change
    subdistricts: 86400,    // 24 hours — subdistricts never change
    villages:     3600,     // 1 hour
    search:       1800,     // 30 minutes
    autocomplete: 900       // 15 minutes
};


// Get from cache
async function getCache(key) {
    try {
        const data = await redis.get(key);
        return data;
    } catch (err) {
        console.error("Cache Get error:", err.message);
        return null;
    }
}


// Set to Cache
async function setCache(key, data, ttl) {
    try {
        await redis.set(key, JSON.stringify(data), { ex : ttl});

    } catch(err) {
        console.error("Cache SET error:", err.message)
    }
}

// Delete from cache
async function deleteCache(key) {
    try {
        await redis.del(key);
    } catch (err) {
        console.error("Cache Del error:", err.message);
    }
}


module.exports = { getCache, setCache, deleteCache, TTL};
