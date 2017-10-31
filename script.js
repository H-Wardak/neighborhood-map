var map = {};
var nav = $('.nav');
var infoWindow = {};
var message = $('#message');

window.addEventListener('offline', function (e) {
    vm.showMessage(-1, 'We cannot connect to the internet!');
});
window.addEventListener('online', function (e) {
    vm.showMessage(0, 'We are back online!');
});

function startMap() {
    //var ratio = window.devicePixelRatio || 1;
    //var width = screen.width * ratio;
    //var zoom = 17; //width > "360px" ? 13 : 12;

    var mapProp = {
        center: { lat: 24.810509, lng: 46.735496 },
        zoom: 16,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.RIGHT_TOP,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
        }
    };

    infoWindow = new google.maps.InfoWindow({
        maxWidth: 320
    });

    map = new google.maps.Map(document.getElementById("map"), mapProp);
    map.addListener('click', function () {
        infoWindow.close();
    });

    vm.loadVenues();
};

var Filter = function (data) {
    var self = this;
    self.id = data.id;
    self.name = data.pluralName;
    self.img = data.icon.prefix + data.icon.suffix;
};

var Venue = function (data) {
    var self = this;
    self.id = data.id;
    self.name = data.name;
    self.categoryId = data.categories[0].id;
    self.visible = ko.observable(true);
    self.desc = '';
    self.img = '';
    self.url = data.url;
    self.address = data.location.formattedAddress;

    self.marker = new google.maps.Marker({
        position: {
            lat: parseFloat(data.location.lat),
            lng: parseFloat(data.location.lng)
        },
        title: self.name,
        animation: google.maps.Animation.DROP, // DROP, BOUNCE,
        map: map
    });
    self.marker.addListener('click', function () {
        vm.showInfo(self);
    });
};

var ViewModel = function () {
    var self = this;
    var fs = 'https://api.foursquare.com/v2/venues/';
    var data = {
        client_id: '3XNDXYUPKU2X0QMHG4ZKXPX4ZKKXZL2GWGKI5GPBR04FIFYN',
        client_secret: '23NYUI2R3SZUZFUCGKQFGGU2KRRYKBP52SH2FYHXUVXVHBO1',
        v: 201701031
    };

    data.ll = '24.807918,46.736490';
    //data.near = 'Qurtuba, Riyadh';
    //data.intent = 'checkin' // 'browse'
    data.categoryId = '4d4b7105d754a06374d81259'; // food
    data.radius = 500;
    //data.query = 'fast food'
    data.limit = 15;
    //data.url = 'someurl.com';

    self.venues = ko.observableArray([]);
    self.filters = ko.observableArray([]);
    self.isFiltered = ko.observable(false);

    self.showInfo = function (venue) {
        if (!venue.img) {
            self.loadDetails(venue);
        } else {
            var iw_html = $('#iw-template').html();
            iw_html = iw_html.replace('{{title}}', venue.name)
                .replace('{{img}}', venue.img)
                .replace('{{content}}', venue.address + '<br>' + (venue.desc || ''));
            infoWindow.setContent(iw_html);
            infoWindow.open(map, venue.marker);
            self.animateMarker(venue.marker);
            map.setCenter(venue.marker.position);
            map.setZoom(17);
        }
    }

    self.loadDetails = function (venue) {
        $.ajax({
            url: fs + venue.id,
            data: data,
            dataType: 'json'
        }).done(function (data) {
            venue.img = data.response.venue.bestPhoto.prefix + 'original' + data.response.venue.bestPhoto.suffix;
            venue.desc = data.response.venue.description;
            self.showInfo(venue);
        }).fail(function (data, msg) {
            self.showMessage(-1, 'failed to load details');
        });
    }

    self.loadVenues = function () {
        $.ajax({
            url: fs + 'search',
            data: data,
            dataType: 'json'
        }).done(function (data) {
            var venues = data.response.venues;
            var filterIds = [];
            for (var i = 0; i < venues.length; i++) {
                var venueData = venues[i];
                var venue = new Venue(venueData);
                self.venues.push(venue);
                if (filterIds.indexOf(venue.categoryId) === -1) {
                var category = venueData.categories[0];
                    filterIds.push(category.id);
                    self.filters.push(new Filter(category));
                }
            }
        }).fail(function (data, msg) {
            self.showMessage(-1, 'failed to load venues');
        });
    }

    self.animateMarker = function (marker) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            marker.setAnimation(null);
        }, 1450);
    }

    self.toggleNav = function () {
        nav.toggleClass('change');
        nav.children('.hamburger').toggleClass('change');
    }

    self.filter = function (category) {
        for (var i = 0; i < self.venues().length; i++) {
            var venue = self.venues()[i];
            if (venue.categoryId !== category.id) {
                venue.marker.setMap(null);
                venue.visible(false);
            } else if (venue.marker.getMap() === null) {
                venue.marker.setMap(map);
                venue.visible(true);
            }
        }
        self.isFiltered(true);
    }

    self.defilter = function () {
        for (var i = 0; i < self.venues().length; i++) {
            var venue = self.venues()[i];
            if (!venue.visible()) {
                venue.marker.setMap(map);
                venue.visible(true);
            }
        }
        self.isFiltered(false);
    }

    self.showMessage = function (type, msg) {
        if (type === -1) {
            message.removeClass().addClass('error');
        } else if (type === 0) {
            message.removeClass().addClass('success');
        }
        message.text(msg);
        message.fadeIn();
        setTimeout(function () {
            message.fadeOut();
        }, 5000);
    }
}

var vm = new ViewModel();
ko.applyBindings(vm);



function toggle(header) {
    $(header).next('.list-items').slideToggle();
}
