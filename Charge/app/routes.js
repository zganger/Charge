// Dependencies
var mongoose        = require('mongoose');
var ChargePort      = require('./model.js');


// Opens App Routes
module.exports = function(app) {

    // GET Routes
    // --------------------------------------------------------
    // Retrieve records for all charge ports in the db
    app.get('/chargePorts', function(req, res){

        // Uses Mongoose schema to run the search (empty conditions)
        var query = ChargePort.find({});
        query.exec(function(err, users){
            if(err)
                res.send(err);

            // If no errors are found, it responds with a JSON of all users
            res.json(users);
        });
    });

    // POST Routes
    // --------------------------------------------------------
    // Provides method for saving new users in the db
    app.post('/chargePorts', function(req, res){

        // Creates a new User based on the Mongoose schema and the post bo.dy
        var newPort = new ChargePort(req.body);

        // New User is saved in the db.
        newPort.save(function(err){
            if(err)
                res.send(err);

            // If no errors are found, it responds with a JSON of the new user
            res.json(req.body);
        });
    });
};  