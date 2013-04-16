function ScheduleCtrl($xhr, $defer) {
    var self = this,
        hourOffset = 0,
        debug = false;
  
    if (debug) {
        var hourOffset = 9 - (new Date().getMinutes());
    }

    self.response = null;
    self.currentTime = "--:--";
    self.eventBlocks = [];
    self.tweetBlocks = [];

    $xhr("GET", "schedule.json", function(code, response) {
        self.response = response;
        self.update();
    });

    // periodically update page
    self.update = function() {
        var now = new Date(),
            hours = now.getHours(),
            minutes = now.getMinutes();
        
        // debug only
        if (debug) {
            var hours = now.getMinutes() + hourOffset,
                minutes = now.getSeconds();
            
            now.setDate(23);
            now.setMonth(1);
            now.setYear(2013);
            now.setHours(hours);
            now.setMinutes(minutes);
        }
    
        if (minutes < 10) {
            minutes = "0" + minutes;
        }
    
        self.currentTime = hours + ":" + minutes;

        var nowMinus10 = now.getTime() / 1000 - 600; // now - 10 minutes in seconds

        // reset events
        self.eventBlocks = [];
    
        // group events by time
        var lastTime = "",
            lastGroup = [],
            groupCount = 0;
        
        angular.forEach(self.response.items, function(value, key) {
            if (value.timestamp < nowMinus10) {
                // past event, ignore it
            } else if (value.start != lastTime) {
                if (lastGroup.length > 0 && groupCount < 3) {
                    self.eventBlocks.push({"start": lastTime, "events": lastGroup});
                    groupCount++;
                }
                
                lastTime = value.start;
                lastGroup = [value];
            } else {
                lastGroup.push(value);
            }
        });
        
        if (lastGroup.length > 0 && groupCount < 3) {
            self.eventBlocks.push({"start": lastTime, "events": lastGroup});
        }

        $defer(self.update, 1000);
    }

    $defer(self.update, 1000);
}


// Tweets animation
var tweets = setInterval(function() {
        $.ajax({
            type: "GET",
            dataType: "jsonp",
            url: "http://search.twitter.com/search.json?q=%23rhopen%20OR%20%40redhatcz&rpp=10&callback=?",
            success: function(response) {
                $('#tweets').empty();

                $.each(response.results.slice(0, 5), function(i, data) {
                    var tweet = $(document.createElement('div'));

                    tweet.html('' +
                        '<img src="' + data.profile_image_url + '" />' +
                        '<strong>' + data.from_user + ', ' + parseTwitterDate(data.created_at) + ':</strong> ' +
                        '<span>' + data.text + '</span>'
                    ).addClass('tweet').attr('rel', data.created_at);

                    $('#tweets').append(tweet);
                });
/*
                var first_run = !$('#tweets div:visible:first').length;

                $.each(response.results.slice(0, 5).reverse(), function(i, data) {
                    var tweet = $(document.createElement('div'));

                    tweet.html('' +
                        '<img src="' + data.profile_image_url + '" />' +
                        '<strong>' + data.from_user + ', ' + parseTwitterDate(data.created_at) + ':</strong> ' +
                        '<span>' + data.text + '</span>'
                    ).addClass('tweet').attr('rel', data.created_at);

                    if (first_run || data.created_at != $('#tweets div:visible:first').attr('rel')) {
                        if (!first_run) {
                            $('#tweets div:visible:first').hide('slow');
                        }
                        
                        $('#tweets').append(tweet);
                    } else {
                        return false;    
                    }
                });
*/
            }
        });

    }, 10000);

function parseTwitterDate(tdate) {
    var system_date = new Date(Date.parse(tdate)),
        user_date = new Date();
    
    if (K.ie) {
        system_date = Date.parse(tdate.replace(/( \+)/, ' UTC$1'))
    }
    
    var diff = Math.floor((user_date - system_date) / 1000);
    
    if (diff <= 1) {return "just now";}
    if (diff < 20) {return diff + " seconds ago";}
    if (diff < 40) {return "half a minute ago";}
    if (diff < 60) {return "less than a minute ago";}
    if (diff <= 90) {return "one minute ago";}
    if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
    if (diff <= 5400) {return "1 hour ago";}
    if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
    if (diff <= 129600) {return "1 day ago";}
    if (diff < 604800) {return Math.round(diff / 86400) + " days ago";}
    if (diff <= 777600) {return "1 week ago";}
    
    return "on " + system_date;
}

// from http://widgets.twimg.com/j/1/widget.js
var K = function () {
    var a = navigator.userAgent;
    return {
        ie: a.match(/MSIE\s([^;]*)/)
    }
}();
