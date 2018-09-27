var trial_comp = false;
var triggered_prog = false;
var LINKEDIN_SEARCH_PAGE = 'https://www.linkedin.com/search/results/people/';
var LINKED_SALES_SEARCH_PAGE = 'https://www.linkedin.com/sales/search?keywords=';
var local_data = {};
var ONE_DAY = 24*60*60*1000;
var MAX_VIEWS = 500;
var user_id = '';
var isSalesNav = false;
var loadingInterval = false;
var reloadInter = false;
var pagesReloaded = false;
const PAYMENTURL = 'https://meetleonard.com/payment/';

$(document).ready(function(){
    setTimeout(onPageLoaded, 0);
});

function onPageLoaded(){
    // alert(window.innerHeight);
    // return false;
    browser.runtime.sendMessage({showToolbar:true}, function(res){
        if(res == 'TOOLBAR_SHOWN'){
            window.close();
        } else {
            browser.storage.local.get('firstConnectionsData', function(o){
                if(o && o.firstConnectionsData){
                    $("#global_export, #sales_export").removeClass("pending");
                }
                $("#preloader").hide();
            });
            browser.runtime.sendMessage({isLinkedInAvailable : true}, function(res){
                if(res == 0){
                    $("#get_details").show();
                    $("#outer_form").hide();
                } else {
                    $("#get_details").hide();
                    $("#outer_form").show();
                }
                browser.storage.local.get("isSignUpRequired", function(o){
                   
                    if(o && o.isSignUpRequired == true){
                        $("#det_popup").hide();
                        $("#signup_popup").show();
                    } else {
                        $("#det_popup").show();
                        $("#signup_popup").hide();
                        $("#top_version").text(browser.runtime.getManifest().version);
                        $("#outer_form").show();
                        $("#det_popup").hide();
                        browser.storage.local.get('isSalesNav', function(o){
                            if(o && o.isSalesNav){
                                isSalesNav = o.isSalesNav;
                            }
                            getUserDetails(function(ud){
                                if(ud && ud['autoLogIn']){
                                    user_id = ud.id;
                                    $("#outer_form").hide();
                                    $("#det_popup").show();
                                    var firstname = ud['firstname'];
                                    var user_type = ud.user_type;
                                    if(user_type == "Free Trial"){
                                        var delta = Math.ceil((new Date(ud.expiry_date) - Date.now())/(24*60*60*1000));
                                        user_type = "<span style='color:red'>"+delta+" days left of "+user_type+"</span>"; 
                                    }
                                    $("#top_plan").html(user_type);
                                    $("#top_leonard_id").html(ud.id);
                                    $("#greet_user").text("Hi "+firstname+",");
                                    if(isSalesNav){
                                        $("#controls .sales_controls").show();
                                        $("#controls .global_controls").hide();
                                    } else {
                                        $("#controls .sales_controls").hide();
                                        $("#controls .global_controls").show();
                                    }
                                    switch(ud.user_type){
                                        case 'Free':
                                        case 'Personal':
                                            $("[data-plan-check='true']").addClass('upgrade_membership pending');
                                            $("[data-plan-check='true']").attr("title", "Click to upgrade");
                                            break;
                                    }
                                } else {
                                    $("#login_popup, #get_details").show();
                                    $("#outer_form").hide();
                                    // showNotification("I'm getting your details from LinkedIn\nPlease wait...");
                                    browser.runtime.sendMessage({
                                        reloadAllLinkedInPages : true
                                    },function(res){
                                        pagesReloaded = true;
                                        $("#get_details").show();
                                        $("#outer_form").hide();
                                    })

                                    loadingInterval = setInterval(function(){
                                        getUserDetails(function(ud){
                                            if(ud && ud.id){
                                                location.reload();
                                            } else {
                                                if(pagesReloaded){
                                                    $("#get_details").hide();
                                                    $("#outer_form").show();
                                                } else {
                                                    $("#get_details").show();
                                                    $("#outer_form").hide();
                                                }
                                                // clearInterval(loadingInterval);
                                                // loadingInterval = false;
                                            }
                                        });
                                    },1000);
                                }
                            })
                        })
                    }
                });
                
            })
            
            $(".close_btn").bind("click",function(){
                window.close();
            });
            $(".buttons[data-control-type]").bind("click", function(){
                if($(this).attr("id") == "sales_export" || $(this).attr("id") == "global_export"){
                    browser.runtime.sendMessage({
                        exportContacts : true
                    });
                    return false;
                }
                if($(this).hasClass("button_stop")){
                    browser.runtime.sendMessage({
                        stopLeonard : true
                    })
                } else {
                    if($(this).hasClass("upgrade_membership")) {
                        showNotification("Feature not available on Free Plan.\nClick here to upgrade.", "payment");
                    } else if($(this).hasClass("pending") && !$(this).hasClass("only_sales")){
                        showNotification("This feature is under development.");
                    } else {
                        if($(this).data('control-type') == 'sales'){
                            browser.tabs.create({url : LINKED_SALES_SEARCH_PAGE});
                        } else {
                            browser.tabs.create({url : LINKEDIN_SEARCH_PAGE});
                        }
                    }
                }
            });
            $("#open_crm").bind("click",function(){
                browser.tabs.create({url : browser.runtime.getURL('CRM/index.html')});
            });
            $(".upgrade_btn").bind("click",function(){
                browser.tabs.create({url : PAYMENTURL});
            });
            $(".new_tab").bind("click", function(){
                var url = $(this).data("href");
                if(url){
                    browser.tabs.create({url : url});
                } else {
                    var crm_link = $(this).data("link");
                    browser.tabs.create({url : browser.runtime.getURL('CRM/index.html#/details')});
                }
            });
        }
    })
    $("#agreed").bind("change", function(){
        if($(this).is(":checked")){
            $(".linkedin_btn").removeAttr("disabled");
        } else {
            $(".linkedin_btn").attr("disabled",true);
        }
    });
    $(".linkedin_btn").bind("click", function(){
        $("#preloader").show();
        $("#signup_popup").hide();
        browser.runtime.sendMessage({
            getUserDetailsToRegister: true
        }, function(){
            pagesReloaded = 0;
            reloadInter = setInterval(function(){
                if(pagesReloaded > 5){
                    clearInterval(reloadInter);
                    reloadInter = false;
                }
                getUserDetails(function(ud){
                    if(ud && ud.id){
                        location.reload();
                    } else {
                        pagesReloaded++;
                    }
                })
            },1000);
        });
       });
}

function showErrorMsg(txt, id){
    $("#"+id+" .error_msg").text(txt).show();
}

function removeErrorMsg(){
    $(".error_msg").text('').hide();
}

function millisecondsToStr(milliseconds) {
    function numberEnding (number) {
        return (number > 1) ? 's' : '';
    }
    var temp = Math.floor(milliseconds / 1000);
    var years = Math.floor(temp / 31536000);
    if (years) {
        return years + ' year' + numberEnding(years);
    }
    var days = Math.floor((temp %= 31536000) / 86400);
    if (days) {
        return days + ' day' + numberEnding(days);
    }
    var hours = Math.floor((temp %= 86400) / 3600);
    if (hours) {
        return hours + ' hour' + numberEnding(hours);
    }
    var minutes = Math.floor((temp %= 3600) / 60);
    if (minutes) {
        return minutes + ' minute' + numberEnding(minutes);
    }
    var seconds = temp % 60;
    if (seconds) {
        return seconds + ' second' + numberEnding(seconds);
    }
    return 'less than a second';
}

function getUserDetails(callback){
    browser.storage.local.get("user_details", function(ud){
        callback(ud['user_details']);
    })
}

function showNotification(txt, id){
    browser.runtime.sendMessage({showNotification : txt, tabId : id});
}

function getTodaysDate(){
    return (new Date()).toISOString().substring(0,10) +" "+ (new Date()).toLocaleTimeString();
}
