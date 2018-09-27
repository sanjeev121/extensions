'use strict';

var animationDuration;

$(window).load(function() {
    //Welcome Message (not for login page)
    function notify(message, type) {
        $.notify({
            message: message
        }, {
            type: type,
            allow_dismiss: false,
            label: 'Cancel',
            className: 'btn-xs btn-default',
            placement: {
                from: 'bottom',
                align: 'left'
            },
            delay: 2500,
            animate: {
                enter: 'animated fadeInUp',
                exit: 'animated fadeOutDown'
            },
            offset: {
                x: 30,
                y: 30
            }
        });
    }

    if (!$('.be-login, .four-zero')[0] && user_details && user_details.firstname) {
        notify('Welcome back ' + user_details.firstname, '-light');
    }
});

$(document).ready(function() {
    /*--------------------------------------
         Bootstrap Notify Notifications
     ---------------------------------------*/
    function notify(from, align, icon, type, animIn, animOut) {
        $.notify({
            icon: icon,
            title: ' Bootstrap Notify',
            message: 'Turning standard Bootstrap alerts into awesome notifications',
            url: ''
        }, {
            element: 'body',
            type: type,
            allow_dismiss: true,
            placement: {
                from: from,
                align: align
            },
            offset: {
                x: 30,
                y: 30
            },
            spacing: 10,
            z_index: 1031,
            delay: 2500,
            timer: 1000,
            url_target: '_blank',
            mouse_over: false,
            animate: {
                enter: animIn,
                exit: animOut
            },
            template: '<div data-notify="container" class="alert alert-dismissible alert-{0}" role="alert">' +
                '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span></button>' +
                '<span data-notify="icon"></span> ' +
                '<span data-notify="title">{1}</span> ' +
                '<span data-notify="message">{2}</span>' +
                '<div class="progress" data-notify="progressbar">' +
                '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                '</div>' +
                '<a href="{3}" target="{4}" data-notify="url"></a>' +
                '</div>'
        });
    }

});

var help_msgs = ["WW91IGtub3csIHlvdSBjYW4gdXNlIFRlbXBsYXRlcyB0byBzYXZlIHlvdXIgdGltZSBvbiBhZGRpbmcgY3VzdG9tIG1lc3NhZ2VzIGV2ZXJ5IHRpbWUu", "SSBsZWFybmVkIGEgbmV3IHRyaWNrLCBJIGNhbiBlbmRvcnNlIGFuZCBmb2xsb3cgcHJvZmlsZXMgd2hpbGUgdmlzaXRpbmcgeW91ciAxc3QgZGVncmVlIGNvbm5lY3Rpb25zLg==", "UGVyc29uYWxpc2F0aW9uIHZhcmlhYmxlcyBoZWxwIHlvdSB0byBjdXN0b21pemUgeW91ciBtZXNzYWdlIGZvciB0aGUgdGFyZ2V0IHByb2ZpbGUu", "SSBjYW4gc2VuZCBmb2xsb3cgdXAgbWVzc2FnZXMgZm9yIHlvdSwgY29uZmlndXJlIG15IHNldHRpbmdzIGluIENSTS4="];
var msg_interval = false;
function startHinting(){
    var rand_idx = randIn(0,(help_msgs.length - 1));
    var msg_idx = rand_idx;
    while(rand_idx == msg_idx && help_msgs[rand_idx]){
        rand_idx = randIn(0,(help_msgs.length - 1));
    }
    msg_idx = rand_idx;
    $("#leo_hint span").text(atob(help_msgs[msg_idx]));
    msg_interval = setInterval(function(){
        var rand_idx = randIn(0,(help_msgs.length - 1));
        while(rand_idx == msg_idx && help_msgs[rand_idx]){
            rand_idx = randIn(0,(help_msgs.length - 1));
        }
        msg_idx = rand_idx;
        $("#leo_hint span").text(atob(help_msgs[msg_idx]));
    },10000);
}

function stopHinting(){
    clearInterval(msg_interval);
    msg_interval = null;
}