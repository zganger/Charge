// Creates the gservice factory. This will be the primary means by which we interact with Google Maps
angular.module('gservice', [])
    .factory('gservice', function($rootScope, $http){

        // Initialize Variables
        // -------------------------------------------------------------
        // Service our factory will return
        var googleMapService = {};
        var waypts = [];
        var globalStart;
        var globalEnd;
        var globalRange = 100;
        var directionService = new google.maps.DirectionsService;
        var directionDisplay = new google.maps.DirectionsRenderer;
        var startAutocomplete = new google.maps.places.Autocomplete(document.getElementById('start'));
        var endAutocomplete = new google.maps.places.Autocomplete(document.getElementById('end'));

        // Array of locations obtained from API calls
        var locations = [];
        var APIlocations = [];

        // Selected Location (initialize to center of US)
        var selectedLat = 39.50;
        var selectedLong = -98.35;

        // Handling Clicks and location selection
        googleMapService.clickLat  = 0;
        googleMapService.clickLong = 0;

        // Functions
        // --------------------------------------------------------------
        // Refresh the Map with new data. Function will take new latitude and longitude coordinates.

        googleMapService.refresh = function(latitude, longitude){

            // Clears the holding array of locations
            locations = [];
            APIlocations = [];

            // Set the selected lat and long equal to the ones provided on the refresh() call
            selectedLat = latitude;
            selectedLong = longitude;

            // Perform an AJAX call to get all of the records in the db.
            $http.get('/chargePorts').success(function(response){
                // Convert the results into Google Map Format
                locations = convertToMapPoints(response);
                // Then initialize the map.
                initialize(latitude, longitude);
            }).error(function(){});

            var APIconnection = 'http://api.openchargemap.io/v2/poi/?output=json&countrycode=US&latitude=' + latitude + '&longitude=' + longitude + '&distance=' + globalRange + '&maxresults=1000';
            $http.get(APIconnection).success(function(response){
                APIlocations = APItoMapPoints(response);
                // Then initialize the map.
                initialize(latitude, longitude);
            }).error(function(){});
        };

        googleMapService.calculateAndDisplayRoute = function(start, end, range) {
            if(startAutocomplete.getPlace().geometry) {
                globalStart = { 'placeId' : startAutocomplete.getPlace().place_id };
            }
            else {
                globalStart = start;
            }
            if(endAutocomplete.getPlace().geometry) {
                globalEnd = { 'placeId' : endAutocomplete.getPlace().place_id };
            }
            else {
                globalEnd = end;
            }
            globalRange = range;
            directionService.route({
                origin: globalStart,
                destination: globalEnd,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            }, function(response, status) {
                if (status === google.maps.DirectionsStatus.OK) {
                    directionDisplay.setDirections(response);
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
            googleMapService.refresh(selectedLat, selectedLong);
        };

        // Private Inner Functions
        // --------------------------------------------------------------
        var convertToMapPoints = function(response){

            // Clear the locations holder
            var locations = [];

            // Loop through all of the JSON entries provided in the response
            for(var i= 0; i < response.length; i++) {
                var chargePorts = response[i];

                // Create popup windows for each record
                var  contentString =
                    '<p><b>Address</b>:<br>' + chargePorts.street +
                    '<br>' + chargePorts.city +
                    ', ' + chargePorts.state +
                    ' ' + chargePorts.zip +
                    '</p>';

                // Converts each of the JSON records into Google Maps Location format (Note [Lat, Lng] format).
                locations.push({
                    latlon: new google.maps.LatLng(chargePorts.location[1], chargePorts.location[0]),
                    message: new google.maps.InfoWindow({
                        content: contentString,
                        maxWidth: 320
                    }),
                    street: chargePorts.street,
                    city: chargePorts.city,
                    state: chargePorts.state,
                    zip: chargePorts.zip
            });
        }
        // location is now an array populated with records in Google Maps format
        return locations;
    };

        var APItoMapPoints = function(response){

            // Clear the locations holder
            var APIlocations = [];

            // Loop through all of the JSON entries provided in the response
            for(var i= 0; i < response.length; i++) {
                var chargePorts = response[i];

                // Create popup windows for each record
                var  contentString =
                    '<p><b>Address</b>:<br>' + chargePorts.AddressInfo.AddressLine1 +
                    '<br>' + chargePorts.AddressInfo.Town +
                    ', ' + chargePorts.AddressInfo.StateOrProvince +
                    ' ' + chargePorts.AddressInfo.Postcode +
                    '</p>';
                
                APIlocations.push({
                    latlon: new google.maps.LatLng(chargePorts.AddressInfo.Latitude, chargePorts.AddressInfo.Longitude),
                    message: new google.maps.InfoWindow({
                        content: contentString,
                        maxWidth: 320
                    }),
                    street: chargePorts.AddressInfo.AddressLine1,
                    city: chargePorts.AddressInfo.Town,
                    state: chargePorts.AddressInfo.StateOrProvince,
                    zip: chargePorts.AddressInfo.Postcode
                });
            }
            return APIlocations;
        };

// Initializes the map
var initialize = function(latitude, longitude) {

    // Uses the selected lat, long as starting point
    var myLatLng = {lat: parseFloat(selectedLat), lng: parseFloat(selectedLong)};

    // If map has not been created already...
    if (!map){
        // Create a new map and place in the index.html page
        var map = new google.maps.Map(document.getElementById('map'), {
            zoom: 3,
            center: myLatLng
        });
    }

    directionDisplay.setMap(map);
    directionDisplay.setPanel(document.getElementById('directionsPanel'));

    // Loop through each location in the array and place a marker
    locations.forEach(function(n){
        var marker = new google.maps.Marker({
            position: n.latlon,
            map: map,
            title: "Big Map",
            icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
        });

        // For each marker created, add a listener that checks for clicks
        google.maps.event.addListener(marker, 'click', function(){

            // When clicked, open the selected marker's message
            //n.message.open(map, marker);
            var loc = n.latlon.lat() + ", " + n.latlon.lng();
            waypts.push({
                location: loc,
                stopover: true
            });
            googleMapService.calculateAndDisplayRoute(globalStart, globalEnd, globalRange);
            googleMapService.refresh(n.latlon.lat(), n.latlon.lng());
        });
    });

    APIlocations.forEach(function(n){
        var APImarker = new google.maps.Marker({
            position: n.latlon,
            map: map,
            title: "Big Map",
            icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        });

        // For each marker created, add a listener that checks for clicks
        google.maps.event.addListener(APImarker, 'click', function(){
            //n.message.open(map, APImarker);
            var loc = n.latlon.lat() + ", " + n.latlon.lng();
            waypts.push({
                location: loc,
                stopover: true
            })
            googleMapService.calculateAndDisplayRoute(globalStart, globalEnd, globalRange);
            googleMapService.refresh(n.latlon.lat(), n.latlon.lng());
        });
    });

    // Set initial location
    var initialLocation = new google.maps.LatLng(latitude, longitude);

    // Function for moving to a selected location
    map.panTo(initialLocation);

    // Clicking on the Map moves the bouncing red marker
    google.maps.event.addListener(map, 'click', function(e){
        map.panTo(e.latLng);

        // Update Broadcasted Variable (lets the panels know to change their lat, long values)
        googleMapService.clickLat = (e.latLng).lat();
        googleMapService.clickLong = (e.latLng).lng();
        $rootScope.$broadcast("clicked");
    });
};

// Refresh the page upon window load. Use the initial latitude and longitude
google.maps.event.addDomListener(window, 'load',
    googleMapService.refresh(selectedLat, selectedLong));

return googleMapService;
});

