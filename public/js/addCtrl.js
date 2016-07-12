// Creates the addCtrl Module and Controller. Note that it depends on the 'geolocation' and 'gservice' modules and controllers.
var addCtrl = angular.module('addCtrl', ['geolocation', 'gservice']);
addCtrl.controller('addCtrl', function($scope, $http, $rootScope, geolocation, gservice){

    // Initializes Variables
    // ----------------------------------------------------------------------------
    $scope.formData = {};
    var coords = {};

    // Set initial coordinates to the center of the US
    $scope.formData.latitude = 39.500;
    $scope.formData.longitude = -98.350;

    geolocation.getLocation().then(function(data){

        // Set the latitude and longitude equal to the HTML5 coordinates
        coords = {lat:data.coords.latitude, long:data.coords.longitude};

        // Display coordinates in location textboxes rounded to three decimal points
        $scope.formData.longitude = parseFloat(coords.long).toFixed(3);
        $scope.formData.latitude = parseFloat(coords.lat).toFixed(3);
        
        gservice.refresh($scope.formData.latitude, $scope.formData.longitude);

    });

    $rootScope.$on("clicked", function(){

        // Run the gservice functions associated with identifying coordinates
        $scope.$apply(function(){
            $scope.formData.latitude = parseFloat(gservice.clickLat).toFixed(3);
            $scope.formData.longitude = parseFloat(gservice.clickLong).toFixed(3);
        });
    });
    
    $scope.createLoc = function() {
        if($scope.formData.zip < 0 || $scope.formData.zip > 99999)
        {
            document.getElementById('warning').innerText = "Please input a valid ZIP Code";
            return;
        } else if ($scope.formData.latitude < -85.05115 || $scope.formData.latitude > 85.05115) {
            document.getElementById('warning').innerText = "Please enter a valid Latitude";
            return;
        } else if ($scope.formData.longitude < -180 || $scope.formData.longitude > 180) {
            document.getElementById('warning').innerText = "Please enter a valid Longitude";
            return;
        }
        // Grabs all of the text box fields
        var chargeData = {
            street: $scope.formData.street,
            city: $scope.formData.city,
            state: $scope.formData.state,
            zip: $scope.formData.zip,
            location: [$scope.formData.longitude, $scope.formData.latitude]
        };

        // Saves the charge port data to the db
        $http.post('/chargePorts', chargeData)
            .success(function (data) {

                // Once complete, clear the form (except location)
                $scope.formData.street = "";
                $scope.formData.city = "";
                $scope.formData.state = "";
                $scope.formData.zip = "";

                // Refresh the map with new data
                gservice.refresh($scope.formData.latitude, $scope.formData.longitude);
            })
            .error(function (data) {
                console.log('Error: ' + data);
            });
    };

    $scope.getDirection = function() {
        if($scope.formData.range < 1) {
            $scope.formData.range = 1;
        }
        gservice.calculateAndDisplayRoute($scope.formData.start, $scope.formData.end, $scope.formData.range);
        document.getElementById('mapsize').className = "col-md-9";
    };
});