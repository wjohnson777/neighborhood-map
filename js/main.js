
var map;
var boundary;
var infoWindow;

/*--- Map View Model ---*/
var MapViewModel = function() {
    var self = this;

    this.searchItem = ko.observable('');
    this.mapList = ko.observableArray([]);

    // Adding markers for each location
    locations.forEach(function(location) {
        self.mapList.push( new LocationMarker(location) );
    });

    // Map locations
    this.placeList = ko.computed(function() {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
				return result;
			});
        }
        self.mapList().forEach(function(location) {
            location.visible(true);
        });
        return self.mapList();
    }, self);
};

/*--- Initialize Map ---*/
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 38.610302, lng: -90.412518},
    zoom: 14
  });

  // Centered map depending on screen size
  // http://stackoverflow.com/questions/18444161/google-maps-responsive-resize
  google.maps.event.addDomListener(window, 'resize', function() {
    var center = map.getCenter();
    google.maps.event.trigger(map, 'resize');
    map.setCenter(center);
  });
  infoWindow = new google.maps.InfoWindow();
  boundary = new google.maps.LatLngBounds();

  ko.applyBindings(new MapViewModel());
}

// Create icon markers and load location data from Foursquare
/*--- Location Model ---*/ 
var LocationMarker = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;
    this.street = '',
    this.city = '';

    this.visible = ko.observable(true);
	// Foursquare client info
	var clientID = 'W4SYZCMR544EEL5K0STE2CXAKFS0LPFH53XZAUBCA55A0P13';
	var clientSecret = '0JEEG3ONN34CUS0ODD3T0DOYP4Q01AYDIO4XFOAABTO2KCW1';

    // Assign default and highlighted icon colors
    var defaultIcon = makeMarkerIcon('29D81F');
    var highlightedIcon = makeMarkerIcon('F92D1B');

    // JSON request of foursquare data
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20180323' + '&query=' + this.title;

    $.getJSON(reqURL).done(function(data) {
		var results = data.response.venues[0];
        self.street = results.location.formattedAddress[0] 
		? results.location.formattedAddress[0]: 'N/A';
        self.city = results.location.formattedAddress[1] 
		? results.location.formattedAddress[1]: 'N/A';
    }).fail(function() {
        alert('Error occured with Foursquare API');
    });

    // Create marker for each location, and put into an array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });    

    self.filterMarkers = ko.computed(function () {
        // Set markers and extend boundary
        if(self.visible() === true) {
            self.marker.setMap(map);
            boundary.extend(self.marker.position);
            map.fitBounds(boundary);
        } else {
            self.marker.setMap(null);
        }
    });
    
    // Create an onclick even to open an infowindow for each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, infoWindow);
        map.panTo(this.getPosition());
		toggleBounce(this);
    });
	
	// Adjust size of markers on map
	function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(25, 38),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(25, 38));
    return markerImage;
}

    // Event listeners to change the color of the icons when hovering with mouse
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // Show location info when selected from list
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

};

// Use Google Streetview to generate infowindow
// Populate, verify and clear the infowindow for each marker
function populateInfoWindow(marker, street, city, infowindow) {
    if (infowindow.marker != marker) {
        // Clear content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;
		// Verify window is closed
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });
        var streetViewService = new google.maps.StreetViewService();
        var radius = 50;

        var windowContent = '<h4>' + marker.title + '</h4>' + 
            '<p>' + street + "<br>" + city + "</p>";

        // Pull streetview panorama image if found
        var getStreetView = function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var nearStreetViewLocation = data.location.latLng;
                var heading = google.maps.geometry.spherical.computeHeading(
                    nearStreetViewLocation, marker.position);
                infowindow.setContent(windowContent + '<div id="pano"></div>');
                var panoramaOptions = {
                    position: nearStreetViewLocation,
                    pov: {
                        heading: heading,
                        pitch: 30
                    }
                };
                var panorama = new google.maps.StreetViewPanorama(
                    document.getElementById('pano'), panoramaOptions);
            } else {
                infowindow.setContent(windowContent + '<div style="color: red">No Street View Found</div>');
            }
        };
        // Pull panorama image within 50 meters of the markers position
        streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
        // Open the infowindow on the marker.
        infowindow.open(map, marker);
    }
}

function toggleBounce(marker) {
	if (marker.getAnimation() !== null) {
		marker.setAnimation(null);
	} else {
		marker.setAnimation(google.maps.Animation.BOUNCE);
		setTimeout(function() {
			marker.setAnimation(null);
		}, 1100);
	}
}

// Google map error handler
function googleMapsError() {
    alert('Google Maps failed to load. Please check internet connection!');
}
