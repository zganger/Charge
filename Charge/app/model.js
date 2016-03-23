// Pulls Mongoose dependency for creating schemas
var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;

// Creates a Charge Port Schema. This will be the basis of how user data is stored in the db
var ChargeSchema = new Schema({
    street: {type: String, required: true},
    city: {type: String, required: true},
    state: {type: String, required: true},
    zip: {type: String, required: true},
    location: {type: [Number], required: true}, // [Long, Lat]
    htmlverified: String,
    created_at: {type: Date, default: Date.now},
    updated_at: {type: Date, default: Date.now}
});

// Sets the created_at parameter equal to the current time
ChargeSchema.pre('save', function(next){
    now = new Date();
    this.updated_at = now;
    if(!this.created_at) {
        this.created_at = now
    }
    next();
});

// Indexes this schema in 2dsphere format (critical for running proximity searches)
ChargeSchema.index({location: '2dsphere'});

// Exports the ChargeSchema for use elsewhere. Sets the MongoDB collection to be used as: "charge-ports"
module.exports = mongoose.model('charge-port', ChargeSchema);