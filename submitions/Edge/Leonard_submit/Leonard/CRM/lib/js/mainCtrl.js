var leonardApp = angular.module("app", ["ngRoute", "angularUtils.directives.dirPagination"]);
var user_details = [];
var totalConnections = [];
var site_url = 'http://45.55.120.26/';
var switcheryArr = [];
var isFirefox = typeof InstallTrigger !== 'undefined';
var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
var isChrome = !!window.chrome && !!window.chrome.webstore
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var isEdge = !isIE && !!window.StyleMedia;

const ObjectId = (rnd = r16 => Math.floor(r16).toString(16)) => rnd(Date.now()/1000) + ' '.repeat(16).replace(/./g, () => rnd(Math.random()*16));
var auditMessages = {"visit_profile":"Profiles Visited","notification_jobchange_message_sent":"Job Change Messages Sent","notification_endorsement_message_sent":"Reply for Endorsements Sent","notification_birthday_message_sent":"Birthday Messages Sent","notification_anniversary_message_sent":"Anniversary Messages Sent","message_sent":"Messages sent","message_sending_failed":"Messages Sending Failed","invitation_withdrawn_failed":"Invitations Withdrawn Failed","invitation_withdrawn":"Invitations Withdrawn","invitation_sent":"Invitations Sent","invitation_sending_failed":"Invitations Sending Failed","invitation_removed":"Invitations Auto Withdrawn","invitation_ignored":"Invitations Ignored","invitation_accepted":"Invitations Accepted","inmail_sent":"InMails sent","inmail_sending_failed":"InMail Sending Failed","follow_up_message_sent_selected":"Welcome Messages Sent","follow_up_message_sent":"Auto Welcome Messages Sent"};
auditMessages = {"invitation_sent":"Invitations"};

leonardApp.config(['$compileProvider', function ($compileProvider) {
    if(isOpera === true || isChrome === true){
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension):/);
    }
    if(isFirefox === true){
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|moz-extension):/);
    }
    if(isEdge === true){
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|ms-browser-extension):/);
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|ms-browser-extension):/);
    }
}]);

leonardApp.config(function($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('!');
    $routeProvider.when("/", {
        templateUrl: "modules/connections.html",
        controller: 'connectionsCtrl'
    }).when("/connections", {
        templateUrl: "modules/connections.html",
        controller: 'connectionsCtrl'
    }).when("/accepted", { 
        templateUrl: "modules/accepted.html",
        controller: 'acceptedCtrl'
    }).when("/responded", {
        templateUrl: "modules/responded.html",
        controller: 'respondedCtrl'
    }).when("/sent", {
        templateUrl: "modules/sent.html",
        controller: 'pendingCtrl'
    }).when("/received", {
        templateUrl: "modules/received.html",
        controller: 'receivedCtrl'
    }).when("/connection_invitation", {
        templateUrl: "modules/connection_invitation.html",
        controller: 'connInvCtrl'
    }).when("/follow_up_message", {
        templateUrl: "modules/follow_up_message.html",
        controller: 'follUpCtrl'
    }).when("/message", {
        templateUrl: "modules/message.html",
        controller: 'messageCtrl'
    }).when("/inmail", {
        templateUrl: "modules/inmail.html",
        controller: 'inmailCtrl'
    }).when("/tag", {
        templateUrl: "modules/tag.html",
        controller: 'tagCtrl'
    }).when("/notification", {
        templateUrl: "modules/notification.html",
        controller: 'notificationCtrl'
    }).when("/login", {
        templateUrl: "modules/login.html",
        controller: 'loginCtrl'
    }).when("/messages", {
        templateUrl: "modules/messages.html",
        controller: 'messagesCtrl'
    }).when("/inmails", {
        templateUrl: "modules/inmails.html",
        controller: 'messagesCtrl'
    }).when("/connections_sent", {
        templateUrl: "modules/sent.html",
        controller: 'pendingCtrl'
    }).when("/downloads", {
        templateUrl: "modules/downloads.html",
        controller: 'downloadsCtrl'
    }).when("/settings", {
        templateUrl: "modules/settings.html",
        controller: 'settingsCtrl'
    }).when("/billing", {
        templateUrl: "modules/billing.html",
        controller: 'billingsCtrl'
    }).when("/redeem", {        
        templateUrl: "modules/redeem.html",     
        controller: 'redeemCtrl'        
    }).when("/receipts", {
        templateUrl: "modules/receipts.html",
        controller: 'receiptsCtrl'
    }).when("/profile_manager", {
        templateUrl: "modules/profile_manager.html",
        controller: 'profileManagerCtrl'
    }).when("/details", {
        templateUrl: "modules/details.html",
        controller: 'detailsCtrl'
    }).when("/cancel", {
        templateUrl: "modules/cancel.html",
        controller: 'cancelCtrl'
    });
});

leonardApp.filter('ceil', function() {
    return function(input) {
        return Math.ceil(input);
    };
});

leonardApp.filter('bytes', function() {
    return function(bytes, precision) {
        if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
        if (typeof precision === 'undefined') precision = 1;
        var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
            number = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) +  ' ' + units[number];
    }
});

leonardApp.filter('removeUnderscore', function () {
  return function (input) {
        if(input != undefined)
            return input.replace(/_/g, ' ');
  };
});

leonardApp.controller('dashboardCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        var that = $scope;
        showPageLoader();
        getProfileDetails(function(){
            $scope.$apply(function(){
                $scope.user_details = user_details;
                browser.runtime.sendMessage({
                    getAudits: true
                }, function(res){
                    if(res == 'Error'){
                        swal({
                            type: 'error',
                            title: 'Oops...',
                            text: "Please try again!"
                        });
                    } else {
                        // var events = Object.keys(res);
                        // events.forEach(function(k){
                        //     var event_text = auditMessages[k];
                        //     var event_count = res[k];
                        //     if(event_text)
                        //         $("#stats_cont").append("<div class='stat'><label>"+event_text+"</label><span>"+event_count+"</span></div>");
                        // });
                        var is = res.audit.invitation_sent;
                        var fms = res.audit.follow_up_message_sent || 0;
                        var fmss = res.audit.follow_up_message_sent_selected || 0;
                        var total_accepted = res.engaged + res.accepted + res.removed - res.audit.invitation_withdrawn;
                        var total_connected = fms + fmss;
                        // var iw = res.invitation_withdrawn || 0;
                        // var pending = is - (fms + fmss + iw);
                        hidePageLoader();
                        showAjaxLoader();
                        $("#stats_cont").append("<div class='stat'><label>Invitations</label><span>"+is+"</span></div>");
                        $("#connections_count").text(totalConnections.length);
                        $("#stats_cont").append("<div class='stat'><a href='#accepted'><label>Accepted</label><span>"+total_accepted+"</span></a></div>");
                        var connected_percentage = ((total_accepted*100)/is).toFixed(2);
                        $("#stats_cont").append("<div class='stat'><label>Conversion</label><span>"+connected_percentage+" %</span></div>");
                        browser.runtime.sendMessage({getPending:true},function(pending_connections){
                            $("#stats_cont").append("<div class='stat'><a href='#sent'><label>Pending</label><span>"+pending_connections.length+"</span></a></div>");
                            browser.runtime.sendMessage({getReceived:true},function(received_connections){
                                $("#stats_cont").append("<div class='stat'><a href='#received'><label>Received</label><span>"+received_connections.length+"</span></a></div>");
                                hideAjaxLoader();
                            });
                        });
                        // $("#invitation_sent").text(is);
                        // $("#connected_in_percentage").text(connected_percentage+"%");
                        // // $("#audits_cont").append("<div><label>"+pending+"</label><br /><span>Connection requests</span></div>");
                        // var chart = new Chart(document.getElementById("stats"), {
                        //     type: "doughnut",
                        //     options:{
                        //         // legend:{display:false}
                        //     },
                        //     data: {
                        //         labels: ["Connected", "Pending", "Withdrawn"],
                        //         datasets: [{
                        //             label: "Connection stats",
                        //             data: [342, 246, 167],
                        //             backgroundColor: ["rgb(32, 255, 32)","rgb(223, 223, 32)","rgb(255, 32, 32)"]
                        //         }]
                        //     }
                        // });
                    }
                })
            })
        });
    }
]);

leonardApp.controller('connectionsCtrl', ['$scope', '$route', '$location' , '$filter' , '$timeout', '$compile', function($scope, $route, $location, $filter, $timeout, $compile) {
        getProfileDetails(function(){
            showPageLoader();
            var that = this;
            if(isUserLoggedout()){
                return false;
            }
            //Pagination Settings
            $scope.currentPage = 1;
            $scope.pageSize = "10";
            $scope.selectedRows = [];
            //Filter
            $scope.slectedFilterOptions = [];
            $scope.filterCritera = {};
            $scope.keywordCritera = [];
            // Connections
            $scope.connections = [];
            $scope.backupConnections = [];
            $scope.filteredConnections = [];
            $scope.backupFilteredConnections = [];
            // Tags
            $scope.tags = [];
            $scope.taggedConns = [];
            $scope.tag = '';
            $scope.myLimit = 10;
            $scope.editMode = false;
            $scope.message = '';
            $scope.attachments = '';
            if(user_details.user_type == 'Free' || user_details.user_type == 'Personal'){
                $(".send-all-items").attr("disabled",true);
            }
            $.ajax({
                url: site_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.taggedConns = resp;
                },
                async: false
            });
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: 'message'
                },
                success: function(resp) {
                    var message_templates = [{template_name:'Select message',template_content:''},{template_name:'Custom',template_content:''}];
                    message_templates = message_templates.concat(resp.templates)
                    $scope.message_templates = message_templates;
                    $("#message_template").bind("change", function(){
                        var dd_val = $(this).val();
                        $scope.$apply(function(){
                            if(dd_val == ""){
                                $scope.message = '';
                                $scope.attachments = '';
                            } else {
                                var selected_msg = $scope.message_templates.filter(x=>x.id == dd_val)[0];
                                if(selected_msg){
                                    $scope.message = selected_msg.template_content;
                                    $scope.attachments = selected_msg.attachments;
                                }
                            }
                        })
                    })
                },
                async: false
            });
            $.ajax({
                url: site_url + 'get_tags/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.tags = resp.tags.map(function(t) {
                            return t.tag_name
                        });
                    });
                }
            });
            var aliases, skipList, aliasUrns, skipUrns;
            browser.runtime.sendMessage({
                'getAliases': true
            }, function(as) {
                if(as != 'Error'){
                    aliases = as || [];
                    aliasUrns = aliases.map(x=>x.entityUrn);
                }
                browser.runtime.sendMessage({
                    'getSkipList': true
                }, function(sl) {
                    if(sl != 'Error'){
                        skipList = sl || [];
                        skipUrns = skipList.filter(x=>(x.is_skipped == 'true' || x.is_skipped == true)).map(x=>x.entityUrn);
                    }
                    browser.storage.local.get('connections', function(conns) {
                        var total_conns = conns['connections'];
                        if(!total_conns){
                            browser.runtime.sendMessage({reloadConnections:true}, function(){
                                $route.reload();
                            })
                            return false;
                        }
                        totalConnections = total_conns.slice(0);
                        conns['connections'].map(function(cn){
                            if(cn.occupation && cn.occupation.indexOf(' at ') > 0){
                                cn.position = cn.occupation.match(/(.*?) at (.*)/)[1];
                                cn.company = cn.occupation.match(/(.*?) at (.*)/)[2];
                            } else {
                                cn.position = cn.occupation;
                                cn.company = '';
                            }
                            // var src = './lib/images/leonard_icon_new.jpeg';
                            var src = browser.runtime.getURL('images/profile.png');
                            if(cn.picture){
                                var vectorImage = cn.picture['com.linkedin.common.VectorImage'];
                                if(vectorImage.artifacts){
                                    src = vectorImage.rootUrl + vectorImage.artifacts.slice(-1)[0].fileIdentifyingUrlPathSegment;
                                }
                            }
                            cn.pict = src;
                            var c_entityUrn = cn.entityUrn.replace('urn:li:fs_miniProfile:','');
                            var c_objectUrn = cn.objectUrn.replace('urn:li:member:','');
                            if(aliasUrns){
                                if(aliasUrns.indexOf(cn.publicIdentifier) >= 0){
                                    cn.alias = aliases[aliasUrns.indexOf(cn.publicIdentifier)].new_name;
                                } else if(aliasUrns.indexOf(c_objectUrn) >= 0){
                                    cn.alias = aliases[aliasUrns.indexOf(c_objectUrn)].new_name;
                                } else if(aliasUrns.indexOf(c_entityUrn) >= 0){
                                    cn.alias = aliases[aliasUrns.indexOf(c_entityUrn)].new_name;
                                } else {
                                    cn.alias = '-';
                                }
                            }
                            cn.skipped = (skipUrns.indexOf(cn.publicIdentifier) >= 0 || skipUrns.indexOf(cn.objectUrn) >= 0 || skipUrns.indexOf(cn.entityUrn) >= 0);
                            cn.skipped = cn.skipped ? 'Yes' : 'No';
                        })
                        total_conns.forEach(function(c) {
                            $scope.taggedConns.forEach(function(tc) {
                                if (c.publicIdentifier == tc.connection_id) {
                                    c.tags = tc.tags;
                                    c.notes = tc.notes;
                                }
                            })
                        });
                        $scope.$apply(function() {
                            $scope.connections = conns['connections'];
                            $scope.backupConnections = angular.copy($scope.connections);
                            $scope.backupFilteredConnections = angular.copy($scope.connections);
                        });
                        setTimeout(function() {
                            hidePageLoader();
                        }, 500);
                    });
                });
            });
            /* Event Handlers : Pagination Feature */
            $scope.pageChangeHandler = function(number) {
                $scope.checkSelectAllFlag();    
            }

            //Set list information
            $scope.setInfo = function() {
                //Calculate Page details
                const current = $scope.currentPage || 1;
                const itemsPerPage = $scope.pageSize;
                if($scope.searchBy) {
                    //get length of filtered list
                    var total = $filter('filter')($scope.connections, $scope.searchBy).length;
                } else {
                    //length of total connections
                    var total = $scope.connections.length;
                }
                
                let end = (current * itemsPerPage);
                end = (total === 0 || end === -1 || end > total) ? total : (current * itemsPerPage);
                const start = (total === 0) ? 0 : ((current - 1) * itemsPerPage + 1);

                return `Showing ${start} to ${end} of ${total} entries`;
            };

            $scope.klist = [];
            /* Event Handlers : Filter Feature */
            $scope.applyFilters = function() {
                //Check if filters are applied
                // Only Filter tags
                if($scope.slectedFilterOptions.length > 0  && $scope.keywordCritera.length == 0) {
                    // console.log($scope.filterCritera);
                    $scope.flist = $filter('filter')($scope.backupFilteredConnections, $scope.filterCritera)
                    $scope.connections = angular.copy($scope.flist);   
                }

                // Only keyword
                if($scope.keywordCritera.length > 0 && $scope.slectedFilterOptions.length == 0) {
                    var tempFilterRecords = angular.copy($scope.backupFilteredConnections);
                    $scope.keywordCritera.forEach(function(keyword){
                        tempFilterRecords = $filter('filter')(tempFilterRecords, keyword);
                    });
                    $scope.klist = tempFilterRecords;
                    $scope.connections = angular.copy($scope.klist);
                }

                // Both filter and keyword
                if($scope.keywordCritera.length > 0 && $scope.slectedFilterOptions.length > 0) {
                    $scope.flist = $filter('filter')($scope.backupFilteredConnections, $scope.filterCritera);   
                    var tempFilterRecords = $scope.flist;
                    $scope.keywordCritera.forEach(function(keyword){
                        tempFilterRecords = $filter('filter')(tempFilterRecords, keyword);
                    });
                    $scope.klist = tempFilterRecords;
                    $scope.connections = angular.copy($scope.klist);
                }

                // if none
                if($scope.keywordCritera.length == 0 && $scope.slectedFilterOptions.length == 0) {
                    $scope.connections = angular.copy($scope.backupFilteredConnections);
                }
                $scope.toggleSelected = false;
                //$scope.resetAllSelected();
                $timeout(function() {
                    $scope.checkSelectAllFlag();
                }, 100);
            };
            $scope.isFilterSelected = function(field) {
                return $scope.slectedFilterOptions.indexOf(field) != -1 ? false : true ;
            }
            $scope.setFilterByField = function(field) {
                // Add field into selected options
                $scope.slectedFilterOptions.push(field);
                // Map and store 'Field' and 'keyword'
                $scope.filterCritera[field] = $scope.searchBy;
                $scope.searchBy = "";

                //apply
                $scope.applyFilters();
            };
            $scope.removeFilterTag = function(field) {
                var index = $scope.slectedFilterOptions.indexOf(field);
                $scope.slectedFilterOptions.splice(index, 1);
                delete $scope.filterCritera[field];
                //apply
                $scope.applyFilters();

            };
            $scope.removeKeyword = function(keyword) {
                var index = $scope.keywordCritera.indexOf(keyword);
                $scope.keywordCritera.splice(index, 1);

                //apply
                $scope.applyFilters();

            };
            $scope.showFilterNotification = function(){
                //showNotification("Press enter keyword and hit enter to perform basic search.\nor\nSelect any of the filter critera.");
            }
            $scope.checkSearch = function(elem) {

                if(elem.which == 13 && elem.currentTarget.value.length != 0) {
                    $scope.keywordCritera.push($scope.searchBy);
                    $scope.searchBy = "";
                    //apply
                    $scope.applyFilters();
                }
            };

            /* Event Handlers : Select All Feature */
            $scope.checkSelectAllFlag = function() {
                $scope.selectAllFlag = true;
                $scope.filteredConnections.forEach( (key , index) => {
                    profileId = $scope.filteredConnections[index].publicIdentifier;
                    if($scope.selectedRows.includes(profileId) && profileId && $scope.selectAllFlag)
                        $scope.selectAllFlag = true;
                    else { 
                        $scope.selectAllFlag = false;
                    }
                        

                });
                if($scope.filteredConnections.length == 0)
                    $scope.selectAllFlag = false;

            };
            $scope.toggleSelectedView = function() {
                $scope.toggleSelected = !$scope.toggleSelected;
                if($scope.toggleSelected){
                    // Display only items that are in selectedRows
                    var visibleItems = $scope.connections.filter(function(conn) {
                        return $scope.selectedRows.indexOf(conn.publicIdentifier) != -1;
                    });
                    //var visibleItems = $filter('filter')($scope.connections, myObj);
                    $scope.backupConnections = angular.copy($scope.connections);
                    $scope.connections = visibleItems;
                    $scope.filteredConnections = visibleItems;
                } else {    
                    // Display all items
                    $scope.connections = angular.copy($scope.backupConnections);
                    $scope.filteredConnections = angular.copy($scope.backupConnections);

                }
                $scope.checkSelectAllFlag();
            };
            $scope.selectAll = function(){
                var itemsInPage = $scope.filteredConnections;
                if($scope.selectAllFlag){
                    // Add profile id in selectedRows
                    // Set selected flag to true for that record
                    
                    for(index in itemsInPage){
                        var profileId = $scope.filteredConnections[index].publicIdentifier;
                        if(!$scope.selectedRows.includes(profileId) && profileId) {
                            $scope.filteredConnections[index].isSelected = true;
                            $scope.selectedRows.push(profileId);
                        }
                        if($scope.toggleSelected) {
                            // Update the backupconnections
                            for(index in $scope.backupConnections) {
                                if($scope.backupConnections[index].publicIdentifier == profileId)
                                    $scope.backupConnections[index].isSelected = true;
                            }
                            
                        }
                    }

                } else {
                    // Remove profile id in selectedRows
                    // Set selected flag to false for that record
                    for(index in itemsInPage) { 
                        var profileId = $scope.filteredConnections[index].publicIdentifier;
                        if($scope.selectedRows.includes(profileId) && profileId) {
                            $scope.filteredConnections[index].isSelected = false;
                            var selectedIndex = $scope.selectedRows.indexOf(profileId);
                            if(index != -1){
                                $scope.selectedRows.splice(selectedIndex,1);
                            }
                        }
                        if($scope.toggleSelected) {
                            // Update the backupconnections
                            for(index in $scope.backupConnections) {
                                if($scope.backupConnections[index].publicIdentifier == profileId)
                                    $scope.backupConnections[index].isSelected = false;
                            }

                        }                        
                    }
                    
                }
            };
            $scope.resetAllSelected = function() {
                $scope.selectedRows= [];
                for(index in $scope.connections){
                    $scope.connections[index].isSelected = false;
                }
                for(index in $scope.backupConnections){
                    $scope.backupConnections[index].isSelected = false;
                }
                $scope.checkSelectAllFlag();
            };
            $scope.isRowSelected = function(profileId) {
                // Returns true if the profileid is in selectedRows
                return $scope.selectedRows.indexOf(profileId) > -1;
            };
            $scope.selectRow = function(index, profileId, row) {
                // If already selected remove from selectedRows
                if(!$scope.selectedRows.includes(profileId)) {
                    $scope.selectedRows.push(profileId);

                    if($scope.toggleSelected) {
                        //Update the backupconnection
                        for(index in $scope.backupConnections) {
                            if($scope.backupConnections[index].publicIdentifier == profileId)
                                $scope.backupConnections[index].isSelected = true;
                        }
                    } else {
                        //Update the connections
                        for(index in $scope.connections) {
                            if($scope.connections[index].publicIdentifier == profileId)
                                $scope.connections[index].isSelected = true;
                        }
                    }
                } else {
                    var index = $scope.selectedRows.indexOf(profileId);
                    if(index != -1) {
                        $scope.selectedRows.splice(index,1);
                        if($scope.toggleSelected) {
                            //Update the backupconnection
                           for(index in $scope.backupConnections) {
                                if($scope.backupConnections[index].publicIdentifier == profileId) 
                                    $scope.backupConnections[index].isSelected = false;
                            }

                        } else {
                            //Update the connections
                            for(index in $scope.connections) {
                                if($scope.connections[index].publicIdentifier == profileId) 
                                    $scope.connections[index].isSelected = false;
                            }
                        }
                    }  
                }
                $scope.checkSelectAllFlag();

            };

            /* Event Handlers : Message Feature */
            $scope.setSendMessage = function() {
                $scope.message = '';
                $scope.attachments = '';
                $(".remove-tag-option").trigger("click");
                $('#modal--default').modal('show');
            };
            $scope.sendMessageToSelected = function(){
                showAjaxLoader();
                var selectedRows = angular.copy($scope.selectedRows);
                // Add selectedRows in dom so that it can be access for sending notification in app.min.js
                $("body").append("<span class='temp-selectedRows'></span>");
                $("body .temp-selectedRows").data('selectedRows' , selectedRows);
                if(selectedRows.length == 0){
                    swal({
                        title : 'Warning',
                        text : 'Please select at least one contact!'
                    });
                    hideAjaxLoader();
                    return false;
                }
                var bulk_message_text = $scope.message;
                // debugger;
                var messages = [];
                loadTotalConnections(function(){
                    selectedRows.forEach(function(a){
                        var firstName = '';
                        var lastName = '';
                        var entityURN = '';
                        var publicIdentifier = '';
                        totalConnections.forEach(function(c){
                            if(c.publicIdentifier == a){
                                firstName = c.firstName;
                                lastName = c.lastName;
                                entityURN = c.entityUrn.replace('urn:li:fs_miniProfile:','');
                                publicIdentifier = a;
                            }
                            var aliasFound = aliases.filter(x=>(x.entityUrn == entityURN || x.entityUrn == publicIdentifier)).slice(-1);
                            if(aliasFound.length > 0 && aliasFound[0].new_name){
                                firstName = aliasFound[0].new_name.split(" ")[0];
                                lastName = aliasFound[0].new_name.split(" ")[1];
                            }
                        });
                        var edited_bulk_message = bulk_message_text.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                        messages.push({
                            entityURN : entityURN,
                            message : edited_bulk_message,
                            attachments: $scope.attachments
                        })
                    });
                    // console.log(messages);
                    // return false;
                    browser.runtime.sendMessage({
                        sendBulkMessages : true,
                        messages : messages
                    }, function(){
                        if($(".add-tag-to-message").attr("data-tags") == "true" && $("#tag_select_message").val()) {
                            hideAjaxLoader();
                            $scope.addTagsToMessage();
                        } else {
                            hideAjaxLoader();
                        }
                    });
                });
            };
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            };

            /* Event Handlers : Tagging Feature */
            $scope.editTag = function(recId) {
                $scope.selected_conn_id = recId;
                var filteredConn = $scope.connections.filter(function(c) {
                    return c.publicIdentifier == recId
                })
                if (filteredConn && filteredConn.length > 0 && filteredConn[0].tags) {
                    $scope.tag = filteredConn[0].tags.split(",");
                } else {
                    $scope.tag = null;
                }
                $scope.editMode = false;
                setTimeout(function(){
                    $('#edit--tag').modal('show');
                    if ($scope.tag) {
                        $("#tag_select").val($scope.tag).trigger('change');
                    } else {
                        $("#tag_select").val(null).trigger('change');
                    }    
                },500);
                
            };
            $scope.saveTags = function() {
                var tags_val = $("#tag_select").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                // if(!tags_val){
                //     swal({
                //         title: 'Warning',
                //         text: 'Please select at least one tag!'
                //     })
                //     return false;
                // }
                $scope.editMode = true;
                if ($scope.selected_conn_id) {
                    addTagsToConnection(tags_val, $scope.selected_conn_id);
                } else {
                    swal({
                        title: 'Error',
                        text: 'Cannot access this connection!'
                    })
                }
            };
            $scope.addTagsToSelected = function(){
                var selectedRows = angular.copy($scope.selectedRows);
                if(selectedRows.length == 0){
                    swal({
                        title : 'Warning',
                        text : 'Please select at least one contact!'
                    });
                    return false;
                }
                var tags_val = $("#tag_select_multiple").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                // if(!tags_val){
                //     swal({
                //         title: 'Warning',
                //         text: 'Please select at least one tag!'
                //     })
                //     return false;
                // }
                $scope.editMode = true;
                addTagsToConnections(tags_val, selectedRows, 0, function(){
                    browser.runtime.sendMessage({setTemplates:true}, function(){
                        location.reload();
                    });
                })
            };
            $scope.addTagsToMessage = function(){
                var selectedRows = angular.copy($scope.selectedRows);
                if(selectedRows.length == 0){
                    swal({
                        title : 'Warning',
                        text : 'Please select at least one contact!'
                    });
                    return false;
                }
                var tags_val = $("#tag_select_message").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                // if(!tags_val){
                //     swal({
                //         title: 'Warning',
                //         text: 'Please select at least one tag!'
                //     })
                //     return false;
                // }
                $scope.editMode = true;
                addTagsToConnections(tags_val, selectedRows, 0, function(){
                    browser.runtime.sendMessage({setTemplates:true}, function(){
                        location.reload();
                    });
                })
            };

            /* Event Handlers : Alias Feature */
            $scope.setAlias = function(elem, row) {
                if(elem.which == 13 && elem.currentTarget.value.length != 0) {
                    // update alias
                    updatedAlias = elem.currentTarget.value;                    
                    browser.runtime.sendMessage({
                        renameConnect: true,
                        new_name: updatedAlias,
                        entityUrn: row.publicIdentifier
                    }, function(res) {
                        console.log("alias updated");
                    })
                    // Save changes and close
                    row.alias = elem.currentTarget.value;
                    row.aliasUnderEdit = false;
                    
                }
                if(elem.which == 27) {
                    // undo changes and close
                    elem.currentTarget.value = row.alias;
                    row.aliasUnderEdit = false;

                }
                if(elem.which == 13 && elem.currentTarget.value.length == 0 ) {
                    // undo and close
                    elem.currentTarget.value = row.alias;
                    row.aliasUnderEdit = false;
                }
            };
            $scope.setAliasEditable = function(elem, row) {
                showNotification("You're adding alias to a profile.\n\nPress Enter to confirm\nor\nEscape to exit from editing.");
                row.aliasUnderEdit = true;
                setTimeout(function() {
                    //Initalize text and set focus
                    if(row.alias == '-')
                        $(".alias-edit-" + row.publicIdentifier).val("");
                    document.querySelector(".alias-edit-" + row.publicIdentifier).focus();
                    document.querySelector(".alias-edit-" + row.publicIdentifier).setSelectionRange(row.alias.length,row.alias.length);
                },10);
            };

            /* Event Handlers : Skip Profile Feature */
            $scope.skipProfile = function(profileId , isSkipped) {
                // Send message to skip profile
                browser.runtime.sendMessage({
                    skipProfile: true,
                    is_skipped: isSkipped == "Yes" ? true : false,
                    entityUrn: profileId
                }, function(){
                    console.log("Profile Skipped");
                })
            };
            $scope.sendMessage = function(index, profileId, row){
                if(!$scope.selectedRows.includes(profileId)) {
                    $scope.selectedRows.push(profileId);

                    if($scope.toggleSelected) {
                        //Update the backupconnection
                        for(index in $scope.backupConnections) {
                            if($scope.backupConnections[index].publicIdentifier == profileId)
                                $scope.backupConnections[index].isSelected = true;
                        }
                    } else {
                        //Update the connections
                        for(index in $scope.connections) {
                            if($scope.connections[index].publicIdentifier == profileId)
                                $scope.connections[index].isSelected = true;
                        }
                    }
                }
                $scope.checkSelectAllFlag();
                $scope.setSendMessage();
            }
        })
    }
]);

leonardApp.controller('acceptedCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        $scope.uploaded_files = [];
        $scope.file_upload = 'attachment';
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.taggedConns = [];
            $.ajax({
                url: site_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.taggedConns = resp;
                },
                async: false
            });
            $.ajax({
                url: site_url + 'get_tags/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.tags = resp.tags.map(function(t) {
                            return t.tag_name
                        });
                    });
                }
            });
            $.ajax({
                url: site_url + 'get_connections/' + user_details.id,
                success: function(resp) {
                    var total_conns = resp.conns;
                    total_conns.forEach(function(c) {
                        $scope.taggedConns.forEach(function(tc) {
                            if (c.c_public_id == tc.connection_id) {
                                c.tags = tc.tags;
                            }
                        })
                        var connProfile = c.is_accepted == "true" ? totalConnections.filter(x=>(x.publicIdentifier == c.c_public_id || x.objectUrn.indexOf(c.c_member_id)>-1))[0] : null;
                        if(connProfile){
                            c.follow_up_message = c.follow_up_message.replace(/%firstName%/g, connProfile.firstName).replace(/%lastName%/g, connProfile.lastName);
                        }
                    });
                    $scope.$apply(function() {
                        $scope.invites = total_conns;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(false, true, {
                            sendAllText : 'Send All',
                            deleteSelected: true,
                            deleteBtnTxt : 'Delete',
                            addTagsToAcceptedUsers : true,
                            addTagsBtnClicked : function(){
                                $('#edit-multiple--tag').modal('show');
                            },
                            deleteSelectedClicked: function(public_ids){
                                var conn_ids = $scope.invites.filter(function(i){
                                    if(public_ids.indexOf(i.c_public_id) > -1){
                                        return i.c_public_id;
                                    } else {
                                        return null;
                                    }
                                })
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover these invitation(s)!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    showPageLoader();
                                    removeConnectionInvitations(conn_ids, public_ids, 0, function(){
                                        hideAjaxLoader();
                                        location.reload();
                                    })
                                }, function() {});
                            },
                            reloadClicked: function(){
                                browser.runtime.sendMessage({checkForAccepted:true}, function(isUpdated){
                                    if(isUpdated){
                                        $route.reload();
                                        hideAjaxLoader();
                                    } else {
                                        notify({
                                            title: "No new accepted connections   ",
                                            message: "",
                                            type:'warning'
                                        });
                                        enableRefreshIcon();
                                        hideAjaxLoader();
                                    }
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.invites.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.follow_up_message;
                                    var att = temp.attachments || [];
                                    // debugger;
                                    try{
                                        if(typeof att == 'string'){
                                            att = JSON.parse(temp.attachments);
                                        }
                                    } catch(err){
                                        att = [];
                                    }
                                    $scope.uploaded_files = att;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            editTag: function(recId) {
                                $scope.selected_conn_id = recId;
                                var filteredConn = $scope.invites.filter(function(c) {
                                    return c.id == recId
                                })
                                if (filteredConn && filteredConn.length > 0) {
                                    $scope.tag = filteredConn[0].tags;
                                    $scope.selected_item_profile_id = filteredConn[0].c_public_id;
                                } else {
                                    $scope.tag = null;
                                }
                                $scope.editMode = false;
                                $('#edit--tag').modal('show');
                                if ($scope.tag) {
                                    tagSelect.val($scope.tag.split(',')).trigger('change');
                                } else {
                                    tagSelect.val(null).trigger('change');
                                }
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this invitation!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_connection',
                                        data: {
                                            connection_id: recId
                                        },
                                        success: function() {
                                            browser.runtime.sendMessage({
                                                audit : true,
                                                event : 'invitation_removed'
                                            });
                                            location.reload();
                                        }
                                    })
                                }, function() {});
                            },
                            sendMessage : function(recId){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    browser.runtime.sendMessage({reloadConnections:true},function(){
                                        loadTotalConnections(function(){
                                            var temp = $scope.invites.filter(function(t) {
                                                return t.id == recId
                                            })[0];
                                            var recContact = totalConnections.filter(function(c){
                                                return c.publicIdentifier == temp.c_public_id || c.objectUrn.indexOf(temp.c_member_id) > -1
                                            });
                                            if(recContact && recContact.length > 0){
                                                var entityURN = recContact[0].entityUrn.replace('urn:li:fs_miniProfile:','');
                                                var firstName = recContact[0].firstName;
                                                var lastName = recContact[0].lastName;
                                                var follow_up_message = temp.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                                if(!follow_up_message){
                                                    showNotification("I can't send blank in Follow up message!\nCan you please update Follow up message?");
                                                    return false;
                                                }
                                                browser.runtime.sendMessage({
                                                    sendFollowUpMessages : true,
                                                    messages : [{
                                                        entityURN : entityURN,
                                                        message : follow_up_message,
                                                        attachments: temp.attachments
                                                    }]
                                                }, function(){
                                                    var invIds = $scope.invites.map(function(inv){
                                                        return inv.id;
                                                    });
                                                    if(invIds.length > 0){
                                                        $.ajax({
                                                            method: 'POST',
                                                            url: site_url + 'update_connections',
                                                            data: {
                                                                connection_ids: recId,
                                                                conn_status: 'removed'
                                                            },
                                                            success: function() {
                                                                location.reload();
                                                            }
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    })
                                }, function() {});
                            },
                            sendFollowUpMessagesToSelected : function(recIds){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    var selectedRecs = $scope.invites.filter(function(x){
                                        return recIds.indexOf(x.c_public_id) > -1
                                    });
                                    var messages = [];
                                    selectedRecs.forEach(function(a){
                                        var firstName = a.c_name;
                                        var lastName = '';
                                        var entityURN = '';
                                        totalConnections.forEach(function(c){
                                            if(c.publicIdentifier == a.c_public_id || c.objectUrn.indexOf(a.c_member_id) > -1){
                                                firstName = c.firstName;
                                                lastName = c.lastName;
                                                entityURN = c.entityUrn.replace('urn:li:fs_miniProfile:','');
                                            }
                                        });
                                        var follow_up_message = a.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                        if(entityURN){
                                            messages.push({
                                                entityURN : entityURN,
                                                message : follow_up_message,
                                                attachments: a.attachments || []
                                            })
                                        }
                                    })
                                    if(messages.length > 0){
                                        // console.log(messages);
                                        // return false;
                                        browser.runtime.sendMessage({
                                            sendFollowUpMessages : true,
                                            messages : messages
                                        }, function(){
                                            var conn_ids = selectedRecs.map(x=>x.id);
                                            $.ajax({
                                                method: 'POST',
                                                url: site_url + 'update_connections',
                                                data: {
                                                    connection_ids: conn_ids,
                                                    conn_status: 'removed'
                                                },
                                                success: function() {
                                                    browser.runtime.sendMessage({
                                                        audit : true,
                                                        event : 'follow_up_message_sent_selected'
                                                    });
                                                    location.reload();
                                                }
                                            })
                                        });
                                    } else {
                                        hideAjaxLoader();
                                    }
                                }, function() {});
                            },
                            sendAll : function(){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    var accepted = $scope.invites.filter(function(i){
                                        return i.is_accepted == "true"
                                    });
                                    accepted = removeDuplicates(accepted, 'c_member_id');
                                    // console.log(accepted);
                                    // return false;
                                    if(accepted.length == 0){
                                        showNotification("No accepted connections.\nPlease click REFRESH to sync connections.");
                                        hideAjaxLoader();
                                        return false;
                                    }
                                    var stopSending = false;
                                    accepted.forEach(function(a){
                                        if(a.follow_up_message == ""){
                                            stopSending = true;
                                        }
                                    });
                                    if(stopSending){
                                        showNotification("I can't send blank in Follow up message!\nCan you please update Follow up message?");
                                        hideAjaxLoader();
                                        return false;
                                    }
                                    var messages = [];
                                    accepted.forEach(function(a){
                                        var firstName = a.c_name;
                                        var lastName = '';
                                        var entityURN = '';
                                        totalConnections.forEach(function(c){
                                            if(c.publicIdentifier == a.c_public_id || c.objectUrn.indexOf(a.c_member_id) > -1){
                                                firstName = c.firstName;
                                                lastName = c.lastName;
                                                entityURN = c.entityUrn.replace('urn:li:fs_miniProfile:','');
                                            }
                                        });
                                        var follow_up_message = a.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                        if(entityURN){
                                            messages.push({
                                                entityURN : entityURN,
                                                message : follow_up_message,
                                                attachments: a.attachments || []
                                            })
                                        }
                                    })
                                    if(messages.length > 0){
                                        browser.runtime.sendMessage({
                                            sendFollowUpMessages : true,
                                            messages : messages
                                        }, function(){
                                            var invIds = $scope.invites.filter(function(inv){
                                                return inv.is_accepted == "true";
                                            });
                                            if(invIds.length > 0){
                                                var conn_ids = invIds.map(x=>x.id);
                                                $.ajax({
                                                    method: 'POST',
                                                    url: site_url + 'update_connections',
                                                    data: {
                                                        connection_ids: conn_ids,
                                                        conn_status: 'removed'
                                                    },
                                                    success: function() {
                                                        browser.runtime.sendMessage({
                                                            audit : true,
                                                            event : 'follow_up_message_sent_all'
                                                        });
                                                        location.reload();
                                                    }
                                                })
                                            }
                                        });
                                    } else {
                                        showNotification("You've already sent follow up messages\nto all accepted connections requests!");
                                        hideAjaxLoader();
                                    }
                                }, function() {});
                            },
                            selectionChange : function(){
                                var grid = $("#data-table").data('.rs.jquery.bootgrid');
                                $scope.editMode = false;
                                if(grid.selectedRows.length > 0){
                                    $(".row-selected").removeAttr('disabled');
                                } else {
                                    $(".row-selected").attr('disabled','disabled');
                                }
                            },
                            viewRecord: function(recId){
                                showAjaxLoader();
                                browser.runtime.sendMessage({
                                    getMessageEntityUrn: true,
                                    public_id: recId
                                }, function(entityUrn){
                                    var conversation_id = entityUrn && entityUrn.replace(/urn:li:fs_conversation:/,'');
                                    if(conversation_id){
                                        window.open('https://www.linkedin.com/messaging/thread/'+conversation_id+'/','_blank');
                                    }
                                    hideAjaxLoader();
                                    // postMessageCallback = false;
                                })
                                // if(globalPort){
                                //     postMessageCallback = function(msg){
                                //         var conversation_id = msg.entityUrn && msg.entityUrn.replace(/urn:li:fs_conversation:/,'');
                                //         window.open('https://www.linkedin.com/messaging/thread/'+conversation_id+'/','_blank');
                                //         hideAjaxLoader();
                                //         postMessageCallback = false;
                                //     }
                                //     globalPort.postMessage({getMessageEntityUrn: true, public_id: recId});
                                //     setTimeout(function(){
                                //         if(postMessageCallback){
                                //             showNotification("Please try again!");
                                //             hideAjaxLoader();
                                //             postMessageCallback = false;
                                //         }
                                //     },5000);
                                // } else {
                                //     var that = this;
                                //     enablePort(function(){
                                //         that.viewRecord(recId)
                                //     })
                                // }
                            }
                        });
                    }, 500);
                }
            })
            $scope.saveTags = function() {
                var tags_val = $("#tag_select").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                $scope.editMode = true;
                if ($scope.selected_item_profile_id) {
                    addTagsToConnection(tags_val, $scope.selected_item_profile_id);
                } else {
                    swal({
                        title: 'Error',
                        text: 'Cannot access this connection!'
                    })
                }
            }
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_connection/' + $scope.id,
                    data: {
                        follow_up_message: $scope.message,
                        attachments: JSON.stringify($scope.uploaded_files)
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.addTagsToSelected = function(){
                var grid = $("#data-table").data('.rs.jquery.bootgrid');
                if(grid.selectedRows.length == 0){
                    swal({
                        title : 'Warning',
                        text : 'Please select at least one contact!'
                    });
                    return false;
                }
                var tags_val = $("#tag_select_multiple").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                // if(!tags_val){
                //     swal({
                //         title: 'Warning',
                //         text: 'Please select at least one tag!'
                //     })
                //     return false;
                // }
                $scope.editMode = true;
                // Mapping id to public id
                var accepted = $scope.invites.filter(function(i){
                    return i.is_accepted == "true"
                });
                var selectedProfiles = [];
                accepted.forEach(function(a){
                    if(grid.selectedRows.indexOf(a.c_public_id) != -1)
                        selectedProfiles.push(a.c_public_id)
                });
                addTagsToConnections(tags_val, selectedProfiles, 0, function(){
                    browser.runtime.sendMessage({setTemplates:true}, function(){
                        location.reload();
                    });
                })
            }
            $scope.removeFile = function(idx){
                $scope.uploaded_files.splice(idx,1);
            }
            $scope.uploadFile = function(){
                var acceptable_files = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt', 'rtf', 'odf', 'html', 'csv', 'png', 'jpg']; // InMail
                var temp_file = $('<input />',{'type':'file','hidden':true,'accept':'.doc, .docx, .xls, .xlsx, .pdf, .txt, .rtf, .odf, .html, .csv, .png, .jpg'});
                temp_file[0].onchange = function(e){
                    var file = e.target.files[0];
                    var filename = file.name;
                    var fileSizeInMB = Math.round(file.size/(1024*1024));
                    if(fileSizeInMB > 5){
                        showNotification("Please upload file with size less than 5MB.\nFile you uploaded is "+fileSizeInMB+" MB");
                        return false;
                    }
                    var file_extension = filename.slice(filename.lastIndexOf('.')+1);
                    // if(file_extension) file_extension = file_extension.toLowerCase();
                    if(acceptable_files.indexOf(file_extension) == -1){
                        showNotification("Please upload files from these types :\n"+acceptable_files.join(", "));
                        return false;
                    }
                    $scope.$apply(function() {
                        $scope.file_upload = 'file_upload';
                    });
                    var fr = new FileReader();
                    fr.onload = function(prog){
                        var file_text = prog.target.result;
                        browser.runtime.sendMessage({
                            getFileUploadToken : true
                        }, function(upload_info){
                            browser.runtime.sendMessage({
                                fileTxt : file_text,
                                name : file.name,
                                size : file.size,
                                type : file.type,
                                upload_info: upload_info
                            }, function(resp){
                                $scope.$apply(function() {
                                    $scope.uploaded_files.push({
                                        name : file.name,
                                        size : file.size,
                                        type : file.type,
                                        LinkedInResource : resp
                                    });
                                    $scope.file_upload = 'attachment';
                                });
                            })
                        })
                    }
                    fr.readAsDataURL(file);
                }
                temp_file.trigger('click');
            }
        });
    }
]);

leonardApp.controller('respondedCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.taggedConns = [];
            $.ajax({
                url: site_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.taggedConns = resp;
                },
                async: false
            });
            $.ajax({
                url: site_url + 'get_tags/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.tags = resp.tags.map(function(t) {
                            return t.tag_name
                        });
                    });
                }
            });
            $.ajax({
                url: site_url + 'get_connections/' + user_details.id,
                success: function(resp) {
                    var total_conns = resp.conns;
                    total_conns.forEach(function(c) {
                        $scope.taggedConns.forEach(function(tc) {
                            if (c.c_public_id == tc.connection_id) {
                                c.tags = tc.tags;
                            }
                        })
                        var connProfile = c.is_accepted == "engaged" ? totalConnections.filter(x=>(x.publicIdentifier == c.c_public_id || x.objectUrn.indexOf(c.c_member_id)>-1))[0] : null;
                        if(connProfile){
                            c.follow_up_message = c.follow_up_message.replace(/%firstName%/g, connProfile.firstName).replace(/%lastName%/g, connProfile.lastName);
                        }
                    });
                    $scope.$apply(function() {
                        $scope.invites = total_conns;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(false, true, {
                            // sendAllText : 'Send All',
                            deleteSelected: true,
                            deleteBtnTxt : 'Delete',
                            addTagsToAcceptedUsers : true,
                            addTagsBtnClicked : function(){
                                $('#edit-multiple--tag').modal('show');
                            },
                            deleteSelectedClicked: function(public_ids){
                                var conn_ids = $scope.invites.filter(function(i){
                                    if(public_ids.indexOf(i.c_public_id) > -1){
                                        return i.c_public_id;
                                    } else {
                                        return null;
                                    }
                                })
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover these invitation(s)!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    showPageLoader();
                                    removeConnectionInvitations(conn_ids, public_ids, 0, function(){
                                        hideAjaxLoader();
                                        location.reload();
                                    })
                                }, function() {});
                            },
                            reloadClicked: function(){
                                browser.runtime.sendMessage({checkForAccepted:true}, function(isUpdated){
                                    if(isUpdated){
                                        $route.reload();
                                        hideAjaxLoader();
                                    } else {
                                        notify({
                                            title: "No new accepted connections   ",
                                            message: "",
                                            type:'warning'
                                        });
                                        enableRefreshIcon();
                                        hideAjaxLoader();
                                    }
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.invites.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.follow_up_message;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            editTag: function(recId) {
                                $scope.selected_conn_id = recId;
                                var filteredConn = $scope.invites.filter(function(c) {
                                    return c.id == recId
                                })
                                if (filteredConn && filteredConn.length > 0) {
                                    $scope.tag = filteredConn[0].tags;
                                    $scope.selected_item_profile_id = filteredConn[0].c_public_id;
                                } else {
                                    $scope.tag = null;
                                }
                                $scope.editMode = false;
                                $('#edit--tag').modal('show');
                                if ($scope.tag) {
                                    tagSelect.val($scope.tag.split(',')).trigger('change');
                                } else {
                                    tagSelect.val(null).trigger('change');
                                }
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this invitation!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_connection',
                                        data: {
                                            connection_id: recId
                                        },
                                        success: function() {
                                            browser.runtime.sendMessage({
                                                audit : true,
                                                event : 'invitation_removed'
                                            });
                                            location.reload();
                                        }
                                    })
                                }, function() {});
                            },
                            sendMessage : function(recId){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    browser.runtime.sendMessage({reloadConnections:true},function(){
                                        loadTotalConnections(function(){
                                            var temp = $scope.invites.filter(function(t) {
                                                return t.id == recId
                                            })[0];
                                            var recContact = totalConnections.filter(function(c){
                                                return c.publicIdentifier == temp.c_public_id || c.objectUrn.indexOf(temp.c_member_id) > -1
                                            });
                                            if(recContact && recContact.length > 0){
                                                var entityURN = recContact[0].entityUrn.replace('urn:li:fs_miniProfile:','');
                                                var firstName = recContact[0].firstName;
                                                var lastName = recContact[0].lastName;
                                                var follow_up_message = temp.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                                if(!follow_up_message){
                                                    showNotification("I can't send blank in Follow up message!\nCan you please update Follow up message?");
                                                    return false;
                                                }
                                                browser.runtime.sendMessage({
                                                    sendFollowUpMessages : true,
                                                    messages : [{
                                                        entityURN : entityURN,
                                                        message : follow_up_message
                                                    }]
                                                }, function(){
                                                    var invIds = $scope.invites.map(function(inv){
                                                        return inv.id;
                                                    });
                                                    if(invIds.length > 0){
                                                        $.ajax({
                                                            method: 'POST',
                                                            url: site_url + 'update_connections',
                                                            data: {
                                                                connection_ids: recId,
                                                                conn_status: 'removed'
                                                            },
                                                            success: function() {
                                                                location.reload();
                                                            }
                                                        })
                                                    }
                                                });
                                            }
                                        });
                                    })
                                }, function() {});
                            },
                            sendFollowUpMessagesToSelected : function(recIds){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    var selectedRecs = $scope.invites.filter(function(x){
                                        return recIds.indexOf(x.c_public_id) > -1
                                    });
                                    var messages = [];
                                    selectedRecs.forEach(function(a){
                                        var firstName = a.c_name;
                                        var lastName = '';
                                        var entityURN = '';
                                        totalConnections.forEach(function(c){
                                            if(c.publicIdentifier == a.c_public_id || c.objectUrn.indexOf(a.c_member_id) > -1){
                                                firstName = c.firstName;
                                                lastName = c.lastName;
                                                entityURN = c.entityUrn.replace('urn:li:fs_miniProfile:','');
                                            }
                                        });
                                        var follow_up_message = a.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                        if(entityURN){
                                            messages.push({
                                                entityURN : entityURN,
                                                message : follow_up_message
                                            })
                                        }
                                    })
                                    if(messages.length > 0){
                                        // console.log(messages);
                                        // return false;
                                        browser.runtime.sendMessage({
                                            sendFollowUpMessages : true,
                                            messages : messages
                                        }, function(){
                                            var conn_ids = selectedRecs.map(x=>x.id);
                                            $.ajax({
                                                method: 'POST',
                                                url: site_url + 'update_connections',
                                                data: {
                                                    connection_ids: conn_ids,
                                                    conn_status: 'removed'
                                                },
                                                success: function() {
                                                    browser.runtime.sendMessage({
                                                        audit : true,
                                                        event : 'follow_up_message_sent_selected'
                                                    });
                                                    location.reload();
                                                }
                                            })
                                        });
                                    } else {
                                        hideAjaxLoader();
                                    }
                                }, function() {});
                            },
                            sendAll : function(){
                                swal({
                                    title: "Are you sure?",
                                    text: "I'm about to send your welcome follow up message(s) to your new contact(s).",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes",
                                    cancelButtonText: "No"
                                }).then(function() {
                                    showAjaxLoader();
                                    var accepted = $scope.invites.filter(function(i){
                                        return i.is_accepted == "true"
                                    });
                                    if(accepted.length == 0){
                                        showNotification("No accepted connections.\nPlease click REFRESH to sync connections.");
                                        hideAjaxLoader();
                                        return false;
                                    }
                                    var stopSending = false;
                                    accepted.forEach(function(a){
                                        if(a.follow_up_message == ""){
                                            stopSending = true;
                                        }
                                    });
                                    if(stopSending){
                                        showNotification("I can't send blank in Follow up message!\nCan you please update Follow up message?");
                                        hideAjaxLoader();
                                        return false;
                                    }
                                    var messages = [];
                                    accepted.forEach(function(a){
                                        var firstName = a.c_name;
                                        var lastName = '';
                                        var entityURN = '';
                                        totalConnections.forEach(function(c){
                                            if(c.publicIdentifier == a.c_public_id || c.objectUrn.indexOf(a.c_member_id) > -1){
                                                firstName = c.firstName;
                                                lastName = c.lastName;
                                                entityURN = c.entityUrn.replace('urn:li:fs_miniProfile:','');
                                            }
                                        });
                                        var follow_up_message = a.follow_up_message.replace(/%firstName%/g, firstName).replace(/%lastName%/g, lastName);
                                        if(entityURN){
                                            messages.push({
                                                entityURN : entityURN,
                                                message : follow_up_message
                                            })
                                        }
                                    })
                                    if(messages.length > 0){
                                        browser.runtime.sendMessage({
                                            sendFollowUpMessages : true,
                                            messages : messages
                                        }, function(){
                                            var invIds = $scope.invites.filter(function(inv){
                                                return inv.is_accepted == "true";
                                            });
                                            if(invIds.length > 0){
                                                var conn_ids = invIds.map(x=>x.id);
                                                $.ajax({
                                                    method: 'POST',
                                                    url: site_url + 'update_connections',
                                                    data: {
                                                        connection_ids: conn_ids,
                                                        conn_status: 'removed'
                                                    },
                                                    success: function() {
                                                        browser.runtime.sendMessage({
                                                            audit : true,
                                                            event : 'follow_up_message_sent_all'
                                                        });
                                                        location.reload();
                                                    }
                                                })
                                            }
                                        });
                                    } else {
                                        showNotification("You've already sent follow up messages\nto all accepted connections requests!");
                                        hideAjaxLoader();
                                    }
                                }, function() {});
                            },
                            selectionChange : function(){
                                var grid = $("#data-table").data('.rs.jquery.bootgrid');
                                $scope.editMode = false;
                                if(grid.selectedRows.length > 0){
                                    $(".row-selected").removeAttr('disabled');
                                } else {
                                    $(".row-selected").attr('disabled','disabled');
                                }
                            },
                            viewRecord: function(recId){
                                showAjaxLoader();
                                if(globalPort){
                                    postMessageCallback = function(msg){
                                        var conversation_id = msg.entityUrn && msg.entityUrn.replace(/urn:li:fs_conversation:/,'');
                                        window.open('https://www.linkedin.com/messaging/thread/'+conversation_id+'/','_blank');
                                        hideAjaxLoader();
                                        postMessageCallback = false;
                                    }
                                    globalPort.postMessage({getMessageEntityUrn: true, public_id: recId});
                                    setTimeout(function(){
                                        if(postMessageCallback){
                                            showNotification("Please try again!");
                                            hideAjaxLoader();
                                            postMessageCallback = false;
                                        }
                                    },5000);
                                } else {
                                    var that = this;
                                    enablePort(function(){
                                        that.viewRecord(recId)
                                    })
                                }
                            }
                        });
                    }, 500);
                }
            })
            $scope.saveTags = function() {
                var tags_val = $("#tag_select").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                $scope.editMode = true;
                if ($scope.selected_item_profile_id) {
                    addTagsToConnection(tags_val, $scope.selected_item_profile_id);
                } else {
                    swal({
                        title: 'Error',
                        text: 'Cannot access this connection!'
                    })
                }
            }
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_connection/' + $scope.id,
                    data: {
                        follow_up_message: $scope.message
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.addTagsToSelected = function(){
                var grid = $("#data-table").data('.rs.jquery.bootgrid');
                if(grid.selectedRows.length == 0){
                    swal({
                        title : 'Warning',
                        text : 'Please select at least one contact!'
                    });
                    return false;
                }
                var tags_val = $("#tag_select_multiple").val();
                if(tags_val && tags_val.length > 0){
                    tags_val = tags_val.map(function(v) {
                        return v.replace(/^string:/, '')
                    });
                }
                if(!tags_val){
                    tags_val = "";
                }
                // if(!tags_val){
                //     swal({
                //         title: 'Warning',
                //         text: 'Please select at least one tag!'
                //     })
                //     return false;
                // }
                $scope.editMode = true;
                // Mapping id to public id
                var accepted = $scope.invites.filter(function(i){
                    return i.is_accepted == "true"
                });
                var selectedProfiles = [];
                accepted.forEach(function(a){
                    if(grid.selectedRows.indexOf(a.c_public_id) != -1)
                        selectedProfiles.push(a.c_public_id)
                });
                addTagsToConnections(tags_val, selectedProfiles, 0, function(){
                    browser.runtime.sendMessage({setTemplates:true}, function(){
                        location.reload();
                    });
                })
            }
        });
    }
]);

leonardApp.controller('pendingCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.taggedConns = [];
            $scope.pending_connections = [];
            $("#autoWithdraw").off("change");
            $("#autoWithdraw").on("change", function(){
                $scope.settings.autoWithdraw = $(this).val();
                user_details.autoWithdraw = $(this).val();
                updateSettings();
            })
            $.ajax({
                url: site_url + 'get_tagged_connections_of_user/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.taggedConns = resp;
                },
                async: false
            });
            $.ajax({
                url: site_url + 'get_tags/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.tags = resp.tags.map(function(t) {
                            return t.tag_name
                        });
                    });
                }
            });
            $.ajax({
                url: site_url + 'get_connections/' + user_details.id,
                success: function(resp) {
                    $scope.pending_connections = resp.conns;
                    var pending_connection_map = {};
                    $scope.pending_connections.forEach(function(x){
                        pending_connection_map[x.c_public_id] = {
                            id: x.id,
                            invitation_message: x.invitation_message,
                            follow_up_message: x.follow_up_message
                        }
                        pending_connection_map[x.c_member_id] = pending_connection_map[x.c_public_id];
                    })
                    browser.runtime.sendMessage({getPending:true},function(pending_connections){
                        var total_conns = [];
                        if(pending_connections){
                            pending_connections.forEach(function(pc){
                                var toMember = pc.toMember;
                                if(toMember){
                                    var member_id = toMember.objectUrn.replace('urn:li:member:', '');
                                    var p_obj = {
                                        user_id : user_details.id,
                                        c_name : toMember.firstName + " " + toMember.lastName,
                                        c_profile_url : "https://www.linkedin.com/in/" + toMember.publicIdentifier + '/',
                                        c_public_id : toMember.publicIdentifier,
                                        c_member_id : member_id,
                                        date_conn_sent : new Date(pc.sentTime).toISOString(),
                                        date_accepted : new Date(pc.sentTime).toISOString(),
                                        invitation_message : pc.message,
                                        follow_up_message : "",
                                        is_accepted : "false",
                                        id : ObjectId()
                                    };
                                    var mappedPC = pending_connection_map[toMember.publicIdentifier] || pending_connection_map[member_id];
                                    if(mappedPC){
                                        p_obj['id'] = mappedPC.id;
                                        p_obj['invitation_message'] = mappedPC.invitation_message.replace(/%firstName%/g, toMember.firstName).replace(/%lastName%/g, toMember.lastName);
                                        p_obj['follow_up_message'] = mappedPC.follow_up_message.replace(/%firstName%/g, toMember.firstName).replace(/%lastName%/g, toMember.lastName);
                                    }
                                    total_conns.push(p_obj);
                                    // if(p_obj.follow_up_message){
                                    //     total_conns.push(p_obj);
                                    // }
                                }
                            })
                        }
                        total_conns.forEach(function(c) {
                            $scope.taggedConns.forEach(function(tc) {
                                if (c.c_public_id == tc.connection_id || c.c_member_id == tc.connection_id) {
                                    c.tags = tc.tags;
                                }
                            })
                            // var connProfile = totalConnections.filter(x=>(x.publicIdentifier == c.c_public_id || x.objectUrn.indexOf(c.c_member_id)>-1))[0];
                            // if(connProfile){
                            //     c.follow_up_message = c.follow_up_message.replace(/%firstName%/g, connProfile.firstName).replace(/%lastName%/g, connProfile.lastName);
                            // }
                        });
                        $scope.settings = {autoWithdraw:user_details.autoWithdraw};
                        $scope.$apply(function() {
                            $scope.invites = total_conns;
                        });
                        setTimeout(function() {
                            hidePageLoader();
                            initBootGrid(false, true,{
                                deleteSelected: true,
                                deleteBtnTxt : 'WITHDRAW',
                                addTagsToAcceptedUsers: true,
                                addTagsBtnClicked : function(){
                                    $('#edit-multiple--tag').modal('show');
                                },
                                deleteSelectedClicked: function(public_ids){
                                    var conn_ids = $scope.invites.filter(function(i){
                                        if(public_ids.indexOf(i.c_public_id) > -1){
                                            return i.c_public_id;
                                        } else {
                                            return null;
                                        }
                                    });
                                    var DELETE_BTN_TXT = "Yes, withdraw them!";
                                    if(conn_ids.length == 1 ){
                                        DELETE_BTN_TXT = "Yes, withdraw it!";
                                    }
                                    swal({
                                        title: "Are you sure?",
                                        text: "You will not be able to recover these invitation(s)!",
                                        type: "warning",
                                        showCancelButton: true,
                                        confirmButtonColor: "#DD6B55",
                                        confirmButtonText: DELETE_BTN_TXT
                                    }).then(function() {
                                        showAjaxLoader();
                                        // console.log(conn_ids);
                                        // return false;
                                        removeConnectionInvitations(conn_ids, public_ids, 0, function(){
                                            hideAjaxLoader();
                                            location.reload();
                                        },true);
                                    }, function() {});
                                },
                                reloadClicked: function(){
                                    browser.runtime.sendMessage({checkForAccepted:true}, function(isUpdated){
                                        if(isUpdated){
                                            $route.reload();
                                            hideAjaxLoader();
                                        } else {
                                            notify({
                                                title: "No new pending connections   ",
                                                message: "",
                                                type:'warning'
                                            });
                                            enableRefreshIcon();
                                            hideAjaxLoader();
                                        }
                                    })
                                },
                                deleteRecord: function(recId) {
                                    var delCon = $scope.invites.filter(i=>i.id == recId)[0];
                                    swal({
                                        title: "Are you sure?",
                                        text: "You will not be able to recover this invitation!",
                                        type: "warning",
                                        showCancelButton: true,
                                        confirmButtonColor: "#DD6B55",
                                        confirmButtonText: "Yes, withdraw it!"
                                    }).then(function() {
                                        showAjaxLoader();
                                        browser.runtime.sendMessage({withdrawConnection:true,public_id:delCon.c_public_id},function(){
                                            $.ajax({
                                                method: 'POST',
                                                url: site_url + 'remove_connection',
                                                data: {
                                                    connection_id: recId
                                                },
                                                success: function() {
                                                    browser.runtime.sendMessage({
                                                        audit : true,
                                                        event : 'invitation_removed'
                                                    });
                                                    hideAjaxLoader();
                                                    location.reload();
                                                },
                                                error : function(){
                                                    browser.runtime.sendMessage({
                                                        audit : true,
                                                        event : 'invitation_removed'
                                                    });
                                                    hideAjaxLoader();
                                                    location.reload();
                                                }
                                            })
                                        });
                                    }, function() {});
                                },
                                editTag: function(recId) {
                                    $scope.selected_conn_id = recId;
                                    var filteredConn = $scope.invites.filter(function(c) {
                                        return c.id == recId
                                    })
                                    if (filteredConn && filteredConn.length > 0) {
                                        $scope.tag = filteredConn[0].tags;
                                        $scope.selected_item_profile_id = filteredConn[0].c_public_id;
                                    } else {
                                        $scope.tag = null;
                                    }
                                    $scope.editMode = false;
                                    $('#edit--tag').modal('show');
                                    if ($scope.tag) {
                                        tagSelect.val($scope.tag.split(',')).trigger('change');
                                    } else {
                                        tagSelect.val(null).trigger('change');
                                    }
                                },
                                selectionChange : function(){
                                    var grid = $("#data-table").data('.rs.jquery.bootgrid');
                                    $scope.editMode = false;
                                    if(grid.selectedRows.length > 0){
                                        $(".row-selected").removeAttr('disabled');
                                    } else {
                                        $(".row-selected").attr('disabled','disabled');
                                    }
                                }
                            });
                        }, 500);
                    })
                }
            })
        });
        $scope.saveTags = function() {
            var tags_val = $("#tag_select").val();
            if(tags_val && tags_val.length > 0){
                tags_val = tags_val.map(function(v) {
                    return v.replace(/^string:/, '')
                });
            }
            if(!tags_val){
                tags_val = "";
            }
            $scope.editMode = true;
            if ($scope.selected_item_profile_id) {
                addTagsToConnection(tags_val, $scope.selected_item_profile_id);
            } else {
                swal({
                    title: 'Error',
                    text: 'Cannot access this connection!'
                })
            }
        }

        $scope.addTagsToSelected = function(){
            var grid = $("#data-table").data('.rs.jquery.bootgrid');
            if(grid.selectedRows.length == 0){
                swal({
                    title : 'Warning',
                    text : 'Please select at least one contact!'
                });
                return false;
            }
            var tags_val = $("#tag_select_multiple").val();
            if(tags_val && tags_val.length > 0){
                tags_val = tags_val.map(function(v) {
                    return v.replace(/^string:/, '')
                });
            }
            if(!tags_val){
                tags_val = "";
            }
            // if(!tags_val){
            //     swal({
            //         title: 'Warning',
            //         text: 'Please select at least one tag!'
            //     })
            //     return false;
            // }
            $scope.editMode = true;
            // Mapping id to public id
            var pending = $scope.invites.filter(function(i){
                return i.is_accepted == "false"
            });
            var selectedProfiles = [];
            pending.forEach(function(a){
                if(grid.selectedRows.indexOf(a.c_public_id) != -1)
                    selectedProfiles.push(a.c_public_id)
            });
            addTagsToConnections(tags_val, selectedProfiles, 0, function(){
                browser.runtime.sendMessage({setTemplates:true}, function(){
                    location.reload();
                });
            })
        }
    }
]);

leonardApp.controller('receivedCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.taggedConns = [];
            $scope.received_connections = [];
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: 'message'
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        var r_temp = resp.templates;
                        r_temp.splice(0,0,{id:'',template_name:'Select message'});
                        $scope.reply_message_templates = resp.templates;
                    });
                },
                async: false
            });
            browser.runtime.sendMessage({getReceived:true},function(received_connections){
                var total_conns = [];
                if(received_connections){
                    received_connections.forEach(function(rc){
                        var fromMember = rc.fromMember;
                        if(fromMember){
                            var member_id = fromMember.objectUrn.replace('urn:li:member:', '');
                            var p_obj = {
                                user_id : user_details.id,
                                c_name : fromMember.firstName + " " + fromMember.lastName,
                                c_profile_url : "https://www.linkedin.com/in/" + fromMember.publicIdentifier + '/',
                                c_public_id : fromMember.publicIdentifier,
                                invitation_message : rc.customMessage ? rc.message : "",
                                c_member_id : member_id,
                                date_conn_sent : new Date(rc.sentTime).toISOString(),
                                date_accepted : new Date(rc.sentTime).toISOString(),
                                invitation_message : rc.message,
                                follow_up_message : "",
                                is_accepted : "false",
                                rec: rc,
                                id : ObjectId()
                            };
                            total_conns.push(p_obj);
                            // if(p_obj.follow_up_message){
                            //     total_conns.push(p_obj);
                            // }
                        }
                    })
                }
                $scope.$apply(function() {
                    $scope.received_connections = total_conns;
                });
                setTimeout(function() {
                    hidePageLoader();
                    initBootGrid(false, true,{
                        // sendAllText : 'Accept All',
                        // deleteSelected: true,
                        deleteBtnTxt : 'IGNORE',
                        // sendAll : function(){
                        //     $scope.$apply(function(){
                        //         $scope.message = '';
                        //     });
                        //     $(".remove-tag-option").trigger("click");
                        //     $('#modal--default').modal('show');
                        // },
                        // deleteSelectedClicked: function(public_ids){
                        //     var conn_ids = $scope.received_connections.filter(function(i){
                        //         if(public_ids.indexOf(i.c_public_id) > -1){
                        //             return i.c_public_id;
                        //         } else {
                        //             return null;
                        //         }
                        //     });
                        //     var DELETE_BTN_TXT = "Yes, ignore them!";
                        //     if(conn_ids.length == 1 ){
                        //         DELETE_BTN_TXT = "Yes, ingore it!";
                        //     }
                        //     swal({
                        //         title: "Are you sure?",
                        //         text: "You will not be able to recover these invitation(s)!",
                        //         type: "warning",
                        //         showCancelButton: true,
                        //         confirmButtonColor: "#DD6B55",
                        //         confirmButtonText: DELETE_BTN_TXT
                        //     }).then(function() {
                        //         showAjaxLoader();
                        //         // console.log(conn_ids);
                        //         // return false;
                        //         // removeConnectionInvitations(conn_ids, public_ids, 0, function(){
                        //         //     hideAjaxLoader();
                        //         //     location.reload();
                        //         // },true);
                        //     }, function() {});
                        // },
                        acceptAll: function(){
                            var selectOptions = {};
                            $scope.reply_message_templates.forEach(function(x){
                                if(x.id)
                                    selectOptions[x.id]=x.template_name;
                            });
                            swal({
                                title: 'Select message after accepting',
                                input: 'select',
                                inputOptions: selectOptions,
                                inputPlaceholder: 'Select message',
                                showCancelButton: true,
                            }).then(function(templateId){
                                // console.log(templateId);
                                // console.log($scope.reply_message_templates);
                                showAjaxLoader();
                                var reply_message_templates = $scope.reply_message_templates;

                                var syncAccept = function(recConnections, idx, callback){
                                    if(recConnections[idx]){
                                        accCon = recConnections[idx];
                                        var rec = accCon.rec;
                                        var msg_obj = reply_message_templates.filter(x=>x.id == templateId)[0];
                                        var tc = '';
                                        if(msg_obj && msg_obj.template_content){
                                            tc = msg_obj.template_content;
                                            tc = tc.replace(/%firstName%/g, rec.fromMember.firstName).replace(/%lastName%/g, rec.fromMember.lastName);
                                        }
                                        browser.runtime.sendMessage({handleConnection:true, mode:'accept', rec:accCon.rec},function(state){
                                            if(state == 'success'){
                                                browser.runtime.sendMessage({
                                                    audit : true,
                                                    event : 'invitation_accepted'
                                                });
                                                if(tc){
                                                    browser.runtime.sendMessage({
                                                        sendBulkMessages : true,
                                                        messages : [{
                                                            entityURN : rec.fromMemberId,
                                                            message : tc,
                                                            attachments: msg_obj.attachments || []
                                                        }]
                                                    }, function(){
                                                        idx++;
                                                        syncAccept(receivedConnections, idx, callback);
                                                    });
                                                } else {
                                                    swal({
                                                        type: 'error',
                                                        title: 'Oops...',
                                                        text: "Leonard encountered a problem while sending message.\nPlease contact support."
                                                    })
                                                    hideAjaxLoader();
                                                }
                                            } else {
                                                showNotification("Process stopped as one of the connection invitation failed while accepting.\nPlease try again.");
                                                hideAjaxLoader();
                                            }
                                        });
                                    } else {
                                        callback();
                                    }
                                }

                                var receivedConnections = $scope.received_connections;
                                syncAccept(receivedConnections, 0, function(){
                                    hideAjaxLoader();
                                    browser.runtime.sendMessage({
                                        removeBadge: true
                                    });
                                    $route.reload();
                                })
                            })
                        },
                        reloadClicked: function(){
                            browser.runtime.sendMessage({getReceived:true}, function(isUpdated){
                                if(isUpdated){
                                    $route.reload();
                                    hideAjaxLoader();
                                } else {
                                    notify({
                                        title: "No new received connections   ",
                                        message: "",
                                        type:'warning'
                                    });
                                    enableRefreshIcon();
                                    hideAjaxLoader();
                                }
                            })
                        },
                        deleteRecord: function(recId) {
                            var delCon = $scope.received_connections.filter(i=>i.id == recId)[0];
                            swal({
                                title: "Are you sure?",
                                text: "You will not be able to recover this invitation!",
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonColor: "#DD6B55",
                                confirmButtonText: "Yes, ignore it!"
                            }).then(function() {
                                showAjaxLoader();
                                browser.runtime.sendMessage({handleConnection:true, mode:'ignore', rec:delCon.rec},function(state){
                                    hideAjaxLoader();
                                    if(state == 'success'){
                                        browser.runtime.sendMessage({
                                            audit : true,
                                            event : 'invitation_ignored'
                                        });
                                        location.reload();
                                    } else {
                                        showNotification("Ignoring connection invitation failed.\nPlease try again.");
                                    }
                                });
                            }, function() {});
                        },
                        acceptRecord: function(recId){
                            var accCon = $scope.received_connections.filter(i=>i.id == recId)[0];
                            accCon.follow_up_message = $("[data-row-id='"+accCon.c_public_id+"']").find("select").val();
                            if(!accCon.follow_up_message){
                                showAjaxLoader();
                                var rec = accCon.rec;
                                var msg_obj = $scope.reply_message_templates.filter(x=>x.id == accCon.follow_up_message)[0];
                                var tc = '';
                                if(msg_obj && msg_obj.template_content){
                                    tc = msg_obj.template_content;
                                    tc = tc.replace(/%firstName%/g, rec.fromMember.firstName).replace(/%lastName%/g, rec.fromMember.lastName);
                                }
                                browser.runtime.sendMessage({handleConnection:true, mode:'accept', rec:accCon.rec},function(state){
                                    hideAjaxLoader();
                                    if(state == 'success'){
                                        browser.runtime.sendMessage({
                                            audit : true,
                                            event : 'invitation_accepted'
                                        });
                                        if(tc){
                                            browser.runtime.sendMessage({
                                                sendBulkMessages : true,
                                                messages : [{
                                                    entityURN : rec.fromMemberId,
                                                    message : tc,
                                                    attachments: msg_obj.attachments || []
                                                }]
                                            }, function(){
                                                location.reload();
                                            });
                                        } else {
                                            location.reload();
                                        }
                                    } else {
                                        showNotification("Ignoring connection invitation failed.\nPlease try again.");
                                    }
                                });
                            } else {
                                swal({
                                    title: "Are you sure?",
                                    text: "You want to send a message to "+accCon.c_name+"!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, send message!"
                                }).then(function() {
                                    showAjaxLoader();
                                    var rec = accCon.rec;
                                    var msg_obj = $scope.reply_message_templates.filter(x=>x.id == accCon.follow_up_message)[0];
                                    var tc = '';
                                    if(msg_obj){
                                        tc = msg_obj.template_content;
                                        tc = tc.replace(/%firstName%/g, rec.fromMember.firstName).replace(/%lastName%/g, rec.fromMember.lastName);
                                    }
                                    browser.runtime.sendMessage({handleConnection:true, mode:'accept', rec:accCon.rec},function(state){
                                        hideAjaxLoader();
                                        if(state == 'success'){
                                            browser.runtime.sendMessage({
                                                audit : true,
                                                event : 'invitation_accepted'
                                            });
                                            if(tc){
                                                browser.runtime.sendMessage({
                                                    sendBulkMessages : true,
                                                    messages : [{
                                                        entityURN : rec.fromMemberId,
                                                        message : tc,
                                                        attachments : msg_obj.attachments || []
                                                    }]
                                                }, function(){
                                                    location.reload();
                                                });
                                            }
                                        } else {
                                            showNotification("Ignoring connection invitation failed.\nPlease try again.");
                                        }
                                    });
                                }, function(){});
                            }
                        },
                        selectionChange : function(){
                            var grid = $("#data-table").data('.rs.jquery.bootgrid');
                            $scope.editMode = false;
                            if(grid.selectedRows.length > 0){
                                $(".row-selected").removeAttr('disabled');
                            } else {
                                $(".row-selected").attr('disabled','disabled');
                            }
                        }
                    });
                }, 500);
            })
        });
    }
]);

leonardApp.controller('connInvCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type = 'connection_invitation';
            $scope.template_type_txt = 'Connection Invitation';
            $scope.title = '';
            $scope.message = '';
            $scope.addOrEdit = 'Add';
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: $scope.template_type
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.templates = resp.templates;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.edit = false;
                                    $scope.id = '';
                                    $scope.addOrEdit = 'Add';
                                    $scope.title = '';
                                    $scope.message = '';
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.templates.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.template_content;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_template/' + recId,
                                        success: function() {
                                            browser.runtime.sendMessage({setTemplates:true}, function(){
                                                location.reload();
                                            });
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                },
                error : function(){
                    hidePageLoader();
                    $scope.$apply(function() {
                        $scope.templates = [];
                    });
                }
            })
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.saveTemplate = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_template',
                    data: {
                        user_id: user_details.id,
                        template_name: $scope.title,
                        template_content: $scope.message,
                        template_type: $scope.template_type
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_template/' + $scope.id,
                    data: {
                        template_name: $scope.title,
                        template_content: $scope.message
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
        });
    }
]);

leonardApp.controller('follUpCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type = 'follow_up_message';
            $scope.template_type_txt = 'Follow Up Message';
            $scope.title = '';
            $scope.message = '';
            $scope.addOrEdit = 'Add';
            $scope.uploaded_files = [];
            $scope.file_upload = 'attachment';
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: $scope.template_type
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.templates = resp.templates;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.edit = false;
                                    $scope.id = '';
                                    $scope.addOrEdit = 'Add';
                                    $scope.title = '';
                                    $scope.message = '';
                                    $scope.uploaded_files = [];
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.templates.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.template_content;
                                    var att = temp.attachments || [];
                                    try{
                                        if(typeof att == 'string'){
                                            att = JSON.parse(temp.attachments);
                                        }
                                    } catch(err){
                                        att = [];
                                    }
                                    $scope.uploaded_files = att;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_template/' + recId,
                                        success: function() {
                                            browser.runtime.sendMessage({setTemplates:true}, function(){
                                                location.reload();
                                            });
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                },
                error : function(){
                    hidePageLoader();
                    $scope.$apply(function() {
                        $scope.templates = [];
                    });
                }
            })
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.saveTemplate = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_template',
                    data: {
                        user_id: user_details.id,
                        template_name: $scope.title,
                        template_content: $scope.message,
                        attachments : JSON.stringify($scope.uploaded_files),
                        template_type: $scope.template_type
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_template/' + $scope.id,
                    data: {
                        template_name: $scope.title,
                        attachments : JSON.stringify($scope.uploaded_files),
                        template_content: $scope.message
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.removeFile = function(idx){
                $scope.uploaded_files.splice(idx,1);
            }
            $scope.uploadFile = function(){
                var acceptable_files = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt', 'rtf', 'odf', 'html', 'csv', 'png', 'jpg']; // InMail
                var temp_file = $('<input />',{'type':'file','hidden':true,'accept':'.doc, .docx, .xls, .xlsx, .pdf, .txt, .rtf, .odf, .html, .csv, .png, .jpg'});
                temp_file[0].onchange = function(e){
                    var file = e.target.files[0];
                    var filename = file.name;
                    var fileSizeInMB = Math.round(file.size/(1024*1024));
                    if(fileSizeInMB > 5){
                        showNotification("Please upload file with size less than 5MB.\nFile you uploaded is "+fileSizeInMB+" MB");
                        return false;
                    }
                    var file_extension = filename.slice(filename.lastIndexOf('.')+1);
                    // if(file_extension) file_extension = file_extension.toLowerCase();
                    if(acceptable_files.indexOf(file_extension) == -1){
                        showNotification("Please upload files from these types :\n"+acceptable_files.join(", "));
                        return false;
                    }
                    $scope.$apply(function() {
                        $scope.file_upload = 'file_upload';
                    });
                    var fr = new FileReader();
                    fr.onload = function(prog){
                        var file_text = prog.target.result;
                        browser.runtime.sendMessage({
                            getFileUploadToken : true
                        }, function(upload_info){
                            browser.runtime.sendMessage({
                                fileTxt : file_text,
                                name : file.name,
                                size : file.size,
                                type : file.type,
                                upload_info: upload_info
                            }, function(resp){
                                $scope.$apply(function() {
                                    $scope.uploaded_files.push({
                                        name : file.name,
                                        size : file.size,
                                        type : file.type,
                                        LinkedInResource : resp
                                    });
                                    $scope.file_upload = 'attachment';
                                });
                            })
                        })
                    }
                    fr.readAsDataURL(file);
                }
                temp_file.trigger('click');
            }
        });
    }
]);

leonardApp.controller('messageCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type = 'message';
            $scope.template_type_txt = 'Message';
            $scope.title = '';
            $scope.message = '';
            $scope.addOrEdit = 'Add';
            $scope.uploaded_files = [];
            $scope.file_upload = 'attachment';
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: $scope.template_type
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.templates = resp.templates;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.edit = false;
                                    $scope.id = '';
                                    $scope.addOrEdit = 'Add';
                                    $scope.title = '';
                                    $scope.message = '';
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.templates.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                var att = temp.attachments || [];
                                try{
                                    if(typeof att == 'string'){
                                        att = JSON.parse(temp.attachments);
                                    }
                                } catch(err){
                                    att = [];
                                }
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.template_content;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId;
                                    $scope.uploaded_files = att;
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_template/' + recId,
                                        success: function() {
                                            browser.runtime.sendMessage({setTemplates:true}, function(){
                                                location.reload();
                                            });
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                },
                error : function(){
                    hidePageLoader();
                    $scope.$apply(function() {
                        $scope.templates = [];
                    });
                }
            })
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.saveTemplate = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_template',
                    data: {
                        user_id: user_details.id,
                        template_name: $scope.title,
                        template_content: $scope.message,
                        template_type: $scope.template_type,
                        attachments: JSON.stringify($scope.uploaded_files)
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_template/' + $scope.id,
                    data: {
                        template_name: $scope.title,
                        template_content: $scope.message
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.removeFile = function(idx){
                $scope.uploaded_files.splice(idx,1);
            }
            $scope.uploadFile = function(){
                var acceptable_files = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt', 'rtf', 'odf', 'html', 'csv', 'png', 'jpg']; // InMail
                var temp_file = $('<input />',{'type':'file','hidden':true,'accept':'.doc, .docx, .xls, .xlsx, .pdf, .txt, .rtf, .odf, .html, .csv, .png, .jpg'});
                temp_file[0].onchange = function(e){
                    var file = e.target.files[0];
                    var filename = file.name;
                    var fileSizeInMB = Math.round(file.size/(1024*1024));
                    if(fileSizeInMB > 5){
                        showNotification("Please upload file with size less than 5MB.\nFile you uploaded is "+fileSizeInMB+" MB");
                        return false;
                    }
                    var file_extension = filename.slice(filename.lastIndexOf('.')+1);
                    // if(file_extension) file_extension = file_extension.toLowerCase();
                    if(acceptable_files.indexOf(file_extension) == -1){
                        showNotification("Please upload files from these types :\n"+acceptable_files.join(", "));
                        return false;
                    }
                    $scope.$apply(function() {
                        $scope.file_upload = 'file_upload';
                    });
                    var fr = new FileReader();
                    fr.onload = function(prog){
                        var file_text = prog.target.result;
                        browser.runtime.sendMessage({
                            getFileUploadToken : true
                        }, function(upload_info){
                            browser.runtime.sendMessage({
                                fileTxt : file_text,
                                name : file.name,
                                size : file.size,
                                type : file.type,
                                upload_info: upload_info
                            }, function(resp){
                                $scope.$apply(function() {
                                    $scope.uploaded_files.push({
                                        name : file.name,
                                        size : file.size,
                                        type : file.type,
                                        LinkedInResource : resp
                                    });
                                    $scope.file_upload = 'attachment';
                                });
                            })
                        })
                    }
                    fr.readAsDataURL(file);
                }
                temp_file.trigger('click');
            }
        });
    }
]);

leonardApp.controller('inmailCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type = 'inmail';
            $scope.template_type_txt = 'InMail';
            $scope.title = '';
            $scope.message = '';
            $scope.subject = '';
            $scope.addOrEdit = 'Add';
            $scope.uploaded_files = [];
            $scope.file_upload = 'attachment';
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: $scope.template_type
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.templates = resp.templates;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.edit = false;
                                    $scope.id = '';
                                    $scope.addOrEdit = 'Add';
                                    $scope.title = '';
                                    $scope.subject = '';
                                    $scope.message = '';
                                    $scope.uploaded_files = [];
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.templates.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    var att = temp.attachments || [];
                                    try{
                                        if(typeof att == 'string'){
                                            att = JSON.parse(temp.attachments);
                                        }
                                    } catch(err){
                                        att = [];
                                    }
                                    $scope.uploaded_files = att;
                                    $scope.title = temp.template_name;
                                    $scope.subject = temp.template_subject;
                                    $scope.message = temp.template_content;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_template/' + recId,
                                        success: function() {
                                            browser.runtime.sendMessage({setTemplates:true}, function(){
                                                location.reload();
                                            });
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                },
                error : function(){
                    hidePageLoader();
                    $scope.$apply(function() {
                        $scope.templates = [];
                    });
                }
            })
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.addToSubject = function(variable) {
                var textareaEl = $(".template_subject")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.subject;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.subject = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.saveTemplate = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_template',
                    data: {
                        user_id: user_details.id,
                        template_name: $scope.title,
                        template_subject: $scope.subject,
                        template_content: $scope.message,
                        attachments: JSON.stringify($scope.uploaded_files),
                        template_type: $scope.template_type
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_template/' + $scope.id,
                    data: {
                        template_name: $scope.title,
                        template_subject: $scope.subject,
                        template_content: $scope.message,
                        attachments: JSON.stringify($scope.uploaded_files)
                    },
                    success: function() {
                        location.reload();
                    }
                })
            }
        });
        $scope.removeFile = function(idx){
            $scope.uploaded_files.splice(idx,1);
        }
        $scope.uploadFile = function(){
            var acceptable_files = ['doc', 'docx', 'xls', 'xlsx', 'pdf', 'txt', 'rtf', 'odf', 'html', 'csv', 'png', 'jpg']; // InMail
            var temp_file = $('<input />',{'type':'file','hidden':true,'accept':'.doc, .docx, .xls, .xlsx, .pdf, .txt, .rtf, .odf, .html, .csv, .png, .jpg'});
            temp_file[0].onchange = function(e){
                var file = e.target.files[0];
                var filename = file.name;
                var fileSizeInMB = Math.round(file.size/(1024*1024));
                if(fileSizeInMB > 5){
                    showNotification("Please upload file with size less than 5MB.\nFile you uploaded is "+fileSizeInMB+" MB");
                    return false;
                }
                var file_extension = filename.slice(filename.lastIndexOf('.')+1);
                // if(file_extension) file_extension = file_extension.toLowerCase();
                if(acceptable_files.indexOf(file_extension) == -1){
                    showNotification("Please upload files from these types :\n"+acceptable_files.join(", "));
                    return false;
                }
                $scope.$apply(function() {
                    $scope.file_upload = 'file_upload';
                });
                var fr = new FileReader();
                fr.onload = function(prog){
                    var file_text = prog.target.result;
                    browser.runtime.sendMessage({
                        getFileUploadToken : true
                    }, function(upload_info){
                        browser.runtime.sendMessage({
                            fileTxt : file_text,
                            name : file.name,
                            size : file.size,
                            type : file.type,
                            upload_info: upload_info
                        }, function(resp){
                            $scope.$apply(function() {
                                $scope.uploaded_files.push({
                                    name : file.name,
                                    size : file.size,
                                    type : file.type,
                                    LinkedInResource : resp
                                });
                                $scope.file_upload = 'attachment';
                            });
                        })
                    })
                }
                fr.readAsDataURL(file);
            }
            temp_file.trigger('click');
        }
    }
]);

leonardApp.controller('tagCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type_txt = 'Tag';
            $scope.title = '';
            $.ajax({
                url: site_url + 'get_tags/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.tags = resp.tags;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.title = '';
                                });
                            },
                            // editRecord : function(recId){
                            //  console.log(recId);
                            // },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_tag/' + recId,
                                        success: function() {
                                            // var remIdx = false;
                                            // $scope.tags.filter(function(x, idx){
                                            //     if(x.id == recId){
                                            //         remIdx = idx;
                                            //     }
                                            // });
                                            // if(remIdx != false){
                                            //     $scope.tags.splice(remIdx,1);
                                            //     var grid = $("#data-table").data(".rs.jquery.bootgrid");
                                            //     grid.rows = $scope.tags;
                                            //     grid.reload();
                                            // }
                                            location.reload();
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                }
            })
            $scope.saveTag = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_tag',
                    data: {
                        user_id: user_details.id,
                        tag_name: $scope.title
                    },
                    success: function(resp) {
                        if (resp.success == "1") {
                            location.reload();
                        } else {
                            swal({
                                title: 'Error',
                                text: resp.message
                            });
                        }
                    }
                })
            }
        });
    }
]);

leonardApp.controller('notificationCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.template_type = 'notification';
            $scope.template_type_txt = 'Notification';
            $scope.title = '';
            $scope.message = '';
            $scope.addOrEdit = 'Add';
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: $scope.template_type
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        $scope.templates = resp.templates;
                    });
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(true, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            clickHandler: function() {
                                $scope.$apply(function() {
                                    $scope.edit = false;
                                    $scope.id = '';
                                    $scope.addOrEdit = 'Add';
                                    $scope.title = '';
                                    $scope.message = '';
                                })
                            },
                            editRecord: function(recId) {
                                var temp = $scope.templates.filter(function(t) {
                                    return t.id == recId
                                })[0];
                                $scope.$apply(function() {
                                    $scope.title = temp.template_name;
                                    $scope.message = temp.template_content;
                                    $scope.addOrEdit = 'Edit';
                                    $scope.id = recId
                                    $scope.edit = true;
                                });
                                $('#modal--default').modal('show');
                            },
                            deleteRecord: function(recId) {
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this template!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    $.ajax({
                                        method: 'POST',
                                        url: site_url + 'remove_template/' + recId,
                                        success: function() {
                                            browser.runtime.sendMessage({setTemplates:true}, function(){
                                                location.reload();
                                            });
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                },
                error : function(){
                    hidePageLoader();
                    $scope.$apply(function() {
                        $scope.templates = [];
                    });
                }
            })
            $scope.addToMessage = function(variable) {
                var textareaEl = $("textarea")[0];
                var scrollTop = textareaEl.scrollTop;
                var front = textareaEl.selectionStart;
                var text_val = $scope.message;
                text_val = text_val.substring(0, textareaEl.selectionStart) + variable + text_val.substring(textareaEl.selectionStart);
                $scope.message = text_val;
                textareaEl.value = text_val;
                var cursorPosition = front + variable.length;
                textareaEl.selectionStart = cursorPosition;
                textareaEl.selectionEnd = cursorPosition;
                textareaEl.focus();
            }
            $scope.saveTemplate = function(variable) {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'add_template',
                    data: {
                        user_id: user_details.id,
                        template_name: $scope.title,
                        template_content: $scope.message,
                        template_type: $scope.template_type
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
            $scope.updateTemplate = function() {
                $.ajax({
                    method: 'POST',
                    url: site_url + 'update_template/' + $scope.id,
                    data: {
                        template_name: $scope.title,
                        template_content: $scope.message
                    },
                    success: function() {
                        browser.runtime.sendMessage({setTemplates:true}, function(){
                            location.reload();
                        });
                    }
                })
            }
        });
    }
]);


leonardApp.controller('settingsCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        var that = $scope;
        $scope.settings = {};
        switcheryArr = [];
        var elems = document.querySelectorAll('.js-switch');
        for (var i = 0; i < elems.length; i++) {
            switcheryArr.push(new Switchery(elems[i]));
        }
        var triggeredByJS = false;
        $(".js-auto-change").bind("change", function(){
            var setting_type = $(this).attr('data-setting-type');
            if(setting_type == 'autoWithdraw'){
                if(!triggeredByJS){
                    var autoWithdrawVal = $(this)[0].checked;
                    if(autoWithdrawVal){
                        autoWithdrawVal = "30";
                    }
                    $scope.$apply(function(){
                        $scope.settings.autoWithdraw = autoWithdrawVal;
                        user_details.autoWithdraw = autoWithdrawVal;
                        updateSettings();
                    })
                }
                $("#autoWithdraw").off("change");
                $("#autoWithdraw").on("change", function(){
                    that.settings.autoWithdraw = $(this).val();
                    user_details.autoWithdraw = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'autoWish'){
                if(!triggeredByJS){
                    var autoWishVal = $(this)[0].checked;
                    if(autoWishVal){
                        autoWishVal = {anniversary: null,birthday: null,endorsement:null,jobchange:null};
                        if($scope.wishTemplates.length == 0){
                            showNotification("Please add notification templates");
                        }
                    }
                    $scope.$apply(function(){
                        $scope.settings.autoWish = autoWishVal;
                        user_details.autoWish = autoWishVal;
                        updateSettings();
                    })
                }
                $("#anniversary").off("change");
                $("#anniversary").on("change", function(){
                    that.settings.autoWish.anniversary = $(this).val().replace(/string:/,'');
                    user_details.autoWish.anniversary = $(this).val().replace(/string:/,'');
                    updateSettings(true);
                })
                $("#birthday").off("change");
                $("#birthday").on("change", function(){
                    that.settings.autoWish.birthday = $(this).val().replace(/string:/,'');
                    user_details.autoWish.birthday = $(this).val().replace(/string:/,'');
                    updateSettings(true);
                });
                $("#endorsement").off("change");
                $("#endorsement").on("change", function(){
                    that.settings.autoWish.endorsement = $(this).val().replace(/string:/,'');
                    user_details.autoWish.endorsement = $(this).val().replace(/string:/,'');
                    updateSettings(true);
                });
                $("#jobchange").off("change");
                $("#jobchange").on("change", function(){
                    that.settings.autoWish.jobchange = $(this).val().replace(/string:/,'');
                    user_details.autoWish.jobchange = $(this).val().replace(/string:/,'');
                    updateSettings(true);
                });
            } else if(setting_type == 'autoRemind'){
                if(!triggeredByJS){
                    var autoRemindVal = $(this)[0].checked;
                    if(autoRemindVal){
                        autoRemindVal = "1";
                        $("#autoFollowUp_check").prop("checked",false).trigger("change");
                        switcheryArr[2].element.dispatchEvent(new Event("change"));
                    }
                    $scope.$apply(function(){
                        $scope.settings.autoRemind = autoRemindVal;
                        user_details.autoRemind = autoRemindVal;
                        user_details.autoFollowUp = false;
                        updateSettings();
                    })
                }
                $("#autoRemind").off("change");
                $("#autoRemind").on("change", function(){
                    that.settings.autoRemind = $(this).val();
                    user_details.autoRemind = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'autoFollowUp'){
                if(!triggeredByJS){
                    var autoFollowUpVal = $(this)[0].checked;
                    if(autoFollowUpVal){
                        autoFollowUpVal = "1";
                        // $("#autoRemind_check").prop("checked",false).trigger("change");
                        // switcheryArr[1].element.dispatchEvent(new Event("change"));
                    }
                    $scope.$apply(function(){
                        $scope.settings.autoFollowUp = autoFollowUpVal;
                        user_details.autoRemind = false;
                        user_details.autoFollowUp = autoFollowUpVal;
                        updateSettings();
                    })
                }
                $("#autoFollowUp").off("change");
                $("#autoFollowUp").on("change", function(){
                    that.settings.autoFollowUp = $(this).val();
                    user_details.autoFollowUp = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'skipVisit'){
                if(!triggeredByJS){
                    var skipVisitVal = $(this)[0].checked;
                    if(skipVisitVal){
                        skipVisitVal = "30";
                    }
                    $scope.$apply(function(){
                        $scope.settings.skipVisit = skipVisitVal;
                        user_details.skipVisit = skipVisitVal;
                        updateSettings();
                    })
                }
                $("#skipVisit").off("change");
                $("#skipVisit").on("change", function(){
                    that.settings.skipVisit = $(this).val();
                    user_details.skipVisit = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'skipMessage'){
                if(!triggeredByJS){
                    var skipMessageVal = $(this)[0].checked;
                    if(skipMessageVal){
                        skipMessageVal = "30";
                    }
                    $scope.$apply(function(){
                        $scope.settings.skipMessage = skipMessageVal;
                        user_details.skipMessage = skipMessageVal;
                        updateSettings();
                    })
                }
                $("#skipMessage").off("change");
                $("#skipMessage").on("change", function(){
                    that.settings.skipMessage = $(this).val();
                    user_details.skipMessage = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'skipInMail'){
                if(!triggeredByJS){
                    var skipInMailVal = $(this)[0].checked;
                    if(skipInMailVal){
                        skipInMailVal = "30";
                    }
                    $scope.$apply(function(){
                        $scope.settings.skipInMail = skipInMailVal;
                        user_details.skipInMail = skipInMailVal;
                        updateSettings();
                    })
                }
                $("#skipInMail").off("change");
                $("#skipInMail").on("change", function(){
                    that.settings.skipInMail = $(this).val();
                    user_details.skipInMail = $(this).val();
                    updateSettings();
                })
            } else if(setting_type == 'maxEndorse'){
                if(!triggeredByJS){
                    var maxEndorseVal = $(this).val();
                    $scope.$apply(function(){
                        $scope.settings.maxEndorse = maxEndorseVal;
                        user_details.maxEndorse = maxEndorseVal;
                        updateSettings();
                    })
                } else {
                    that.settings.maxEndorse = $(this).val();
                    user_details.maxEndorse = $(this).val();
                    updateSettings();
                }
            }
        });
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $scope.wishTemplates = [];
            $.ajax({
                url: site_url + 'get_templates/',
                data: {
                    user_id: user_details.id,
                    template_type: 'notification'
                },
                success: function(resp) {
                    $scope.$apply(function() {
                        var first_el = {id:null,template_name:'Select template'};
                        resp.templates.splice(0,0,first_el)
                        $scope.wishTemplates = resp.templates || [];
                    });
                    if(resp.templates.length == 0 && user_details.autoWish){
                        showNotification("Please add notification templates");
                    }
                },
                async: false
            });
            if($location.path() != "/sent" && $location.path() != "/connections_sent")
                hidePageLoader();
            user_details.autoWish = typeof user_details.autoWish == 'string' && user_details.autoWish.length > 0 ? JSON.parse(user_details.autoWish) : user_details.autoWish;
            $scope.$apply(function(){
                $scope.settings.autoFollowUp = user_details.autoFollowUp != "false" ? user_details.autoFollowUp : false;
                $scope.settings.autoRemind = user_details.autoRemind != "false" ? user_details.autoRemind : false;
                $scope.settings.autoWithdraw = user_details.autoWithdraw != "false" ? user_details.autoWithdraw : false;
                $scope.settings.autoWish = user_details.autoWish != "false" ? user_details.autoWish : false;
                $scope.settings.skipVisit = user_details.skipVisit != "false" ? user_details.skipVisit : false;
                $scope.settings.skipMessage = user_details.skipMessage != "false" ? user_details.skipMessage : false;
                $scope.settings.skipInMail = user_details.skipInMail != "false" ? user_details.skipInMail : false;
                $scope.settings.maxEndorse = user_details.maxEndorse || '1';
            });
            triggeredByJS = true;
            for (var i = 0; i < switcheryArr.length; i++) {
                switcheryArr[i].element.dispatchEvent(new Event("change"));
            }
            triggeredByJS = false;
        });
    }
]);

leonardApp.controller('billingsCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            $("[data-plan='"+user_details.user_type+"'] .upgrade_btn").removeClass("upgrade_btn").addClass("current_plan");
            if(isUserLoggedout()){
                return false;
            }
            hidePageLoader();
        });
    }
]);

leonardApp.controller('redeemCtrl', ['$scope', function($scope) {
        showPageLoader();
        // Get user details
        getProfileDetails(function() {
            $scope.$apply(function() {
                $scope.user_details = user_details;
                hidePageLoader();
            });
        });

        $scope.redeemCoupon = function() {
            browser.runtime.sendMessage({
                coupon_code: $scope.coupon,
                user_id: $scope.user_details.id,
                redeemCode: true
            }, function(res){
                alert(JSON.stringify(res.message));
            });
        };
       
    }
]);

leonardApp.controller('detailsCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $.ajax({
                url: site_url + 'get_user_payment_history',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    browser.storage.local.get('user_profile', function(o){
                        if(o && o['user_profile']){
                            var user_profile = o['user_profile'];
                            if(resp && resp[0] && resp[0].next_payment_date){
                                user_profile.renewal_date = resp[0].next_payment_date;
                            }
                            $scope.$apply(function(){
                                user_profile = $.extend(user_profile,user_details);
                                $scope.user_profile = user_profile;
                            });
                        }
                    })
                    hidePageLoader();
                },
                async: false
            });
        });
    }
]);

leonardApp.controller('cancelCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $.ajax({
                url: site_url + 'get_tenants/',
                data: {
                    user_id: user_details.id
                },
                success: function(res){
                    $scope.$apply(function(){
                        $scope.subscription = res.subscription;
                    });
                    hidePageLoader();
                }
            });
        });
        $scope.cancelSubscription = function(){
            if(!$scope.reason || $scope.reason.length < 10){
                alert("Please enter valid reason.");
            } else {
                showAjaxLoader();
                var subscription_id = null;
                if($scope.subscription){
                    subscription_id = $scope.subscription.data[0].id;
                }
                if(subscription_id){
                    browser.runtime.sendMessage({
                        audit : true,
                        event : 'CANCEL||'+$scope.reason+"||"+subscription_id
                    }, function(){
                        $.ajax({
                            url: site_url + 'delete_subscription',
                            type: 'POST',
                            data:{
                                user_id: user_details.id,
                                subscription_id: subscription_id
                            },
                            success: function(){
                                setTimeout(function(){
                                    window.location = '/CRM/index.html#/details';
                                },3000);
                            }
                        })
                    });
                } else {
                    browser.runtime.sendMessage({
                        audit : true,
                        event : 'CANCEL_FAILED||'+$scope.reason+"||"+subscription_id
                    }, function(){
                        alert("Please contact support@meetleonard.com for this cancellation");
                    });
                }
            }
        }
    }
]);

leonardApp.controller('messagesCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            $.ajax({
                url: site_url + 'get_comms',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    $scope.$apply(function(){
                        $scope.comms = resp.comms;
                        setTimeout(function() {
                            hidePageLoader();
                            initBootGrid(false, false, {
                                reloadClicked: function(){
                                    $route.reload();
                                    hideAjaxLoader();
                                }
                            });
                        }, 500);
                    });
                },
                async: false
            });
        });
    }
]);

leonardApp.controller('receiptsCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            browser.runtime.sendMessage({getUserDetails:true},function(){
                
            })
            // $.ajax({
            //     url: site_url + 'get_user_payment_history/',
            //     data: {
            //         user_id: user_details.id
            //     },
            //     success: function(resp) {
            //         $scope.$apply(function(){
            //             $scope.receipts = resp;
            //         });
            //         setTimeout(function() {
            //             hidePageLoader();
            //             initBootGrid(false, false, {
            //             });
            //         },500);
            //     },
            //     async: false
            // });
            $.ajax({
                url: site_url + 'get_invoices/',
                data: {
                    user_id: user_details.id
                },
                success: function(resp) {
                    var data = resp.data;
                    if(data){
                        $scope.$apply(function(){
                            data = data.map(function(d){
                                d.date = parseInt(d.date*1000);
                                return d;
                            })
                            $scope.receipts = data;
                        });
                    }
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(false, false, {
                        });
                    },500);
                }
            });
        });
    }
]);

leonardApp.controller('profileManagerCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        $scope.profile_count = (new Array(100)).fill(1).map((x,y)=>(y+1));
        $scope.deletingTenant = [];
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            browser.runtime.sendMessage({getUserDetails:true},function(){
                $.ajax({
                    url: site_url + 'get_tenants/',
                    data: {
                        user_id: user_details.id
                        // user_id: '59ccec5f72c8f9985a7c3f7f'
                    },
                    success: function(resp) {
                        $scope.$apply(function(){
                            $scope.tenants = resp.tenants;
                            $scope.subscription = resp.subscription;
                            // $scope.quantity = resp.subscription && resp.subscription.data && resp.subscription.data.length > 1 ? resp.subscription.data[1].quantity.toString() : "1";
                            // if(resp.subscription && resp.subscription.data && resp.subscription.data.length > 0){
                            //     $scope.quantity = resp.subscription.data[0] && resp.subscription.data[0].items && resp.subscription.data[0].items.data && resp.subscription.data[0].items.data.length > 1 resp.subscription.data[0].items.data[1].quantity;
                            // }
                            var currentTenants = $scope.tenants.filter(x=>x.admin_id!=x.tenant_id);
                            $scope.quantity = currentTenants.length.toString();
                            $scope.profile_count = (new Array(101-parseInt($scope.quantity))).fill(1).map((x,y)=>(y+parseInt($scope.quantity)));
                        });
                        setTimeout(function() {
                            hidePageLoader();
                            initBootGrid(false, false, {
                                addProfile: function(){
                                    $('#modal--default').modal('show');
                                },
                                assignProfile: function(recId){
                                    $scope.assignRecId = recId;
                                    $scope.leonard_id = '';
                                    $('#modal--assign').modal('show');
                                },
                                deleteRecord: function(recId){
                                    var currentTenants = $scope.tenants.filter(x=>x.admin_id!=x.tenant_id);
                                    var quantity = currentTenants.length;
                                    var deletingTenant = currentTenants.filter(x=>x.id==recId);
                                    if(deletingTenant && deletingTenant.length > 0){
                                        $scope.deletingTenant = deletingTenant[0];
                                        // console.log(deletingTenant);
                                        swal({
                                            title: "Are you sure?",
                                            text: "You're deleting a profile.",
                                            type: "warning",
                                            showCancelButton: true,
                                            confirmButtonColor: "#DD6B55",
                                            confirmButtonText: "Yes, delete it!"
                                        }).then(function() {
                                            var new_quantity = quantity - 1;
                                            $.ajax({
                                                url: site_url + 'delete_subscription_item',
                                                type: 'POST',
                                                data: {
                                                    user_id: user_details.id,
                                                    profile_id: $scope.deletingTenant.tenant_id,
                                                    profile_idx: $scope.deletingTenant.id,
                                                    quantity: new_quantity
                                                },
                                                success: function(resp) {
                                                    $route.reload();
                                                }
                                            });
                                        }, function() {});
                                    }
                                }
                            });
                        },500);
                    },
                    error: function(){
                        hidePageLoader();
                        initBootGrid(false, false, {});
                        showNotification("You're not subscribed to Enterprise plan!");
                    },
                    timeout: 5000,
                    async: true
                });
            }) 
        });
        $scope.addNewProfile = function(){
            showAjaxLoader();
            $.ajax({
                url: site_url + 'add_tenant',
                type: 'POST',
                data: {
                    user_id: user_details.id,
                    quantity: $scope.quantity
                },
                timeout: 10000,
                success: function(resp) {
                    $route.reload();
                },
                error: function(){
                    hideAjaxLoader();
                    showNotification("Contact support@meetleonard.com for assistance with this purchase!");
                }
            });
        }
        $scope.assignProfile = function(){
            if($scope.leonard_id && $scope.leonard_id.length == 24){
                $.ajax({
                    url: site_url + 'update_tenant',
                    type: 'POST',
                    data: {
                        profile_id: $scope.leonard_id,
                        profile_idx: $scope.assignRecId
                    },
                    success: function(resp) {
                        $route.reload();
                    }
                });
            } else {
                alert("Invalid Leonard ID");
                $scope.leonard_id = '';
                $('#modal--assign').modal('show');
            }
        }
    }
]);

leonardApp.controller('downloadsCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        showPageLoader();
        getProfileDetails(function(){
            if(isUserLoggedout()){
                return false;
            }
            browser.runtime.sendMessage({
                getDownloads: true
            }, function(downloads){
                if(downloads == 'Error'){
                    downloads = [];
                }
                $scope.$apply(function(){
                    $scope.downloads = downloads;
                    setTimeout(function() {
                        hidePageLoader();
                        initBootGrid(false, false, {
                            reloadClicked: function(){
                                $route.reload();
                                hideAjaxLoader();
                            },
                            renameClicked: function(recId){
                                var d_rec = $scope.downloads[recId];
                                swal({
                                    title: 'New Filename',
                                    input: 'text',
                                    inputValue: d_rec.filename,
                                    inputAttributes: {
                                        autocapitalize: 'off'
                                    },
                                    showCancelButton: true,
                                    confirmButtonText: 'Submit',
                                    showLoaderOnConfirm: true
                                }).then((result) => {
                                    browser.runtime.sendMessage({
                                        rename_filename: true,
                                        filename: d_rec.filename,
                                        new_filename: result
                                    }, function(res){
                                        if(res.message){
                                            swal({
                                                type: 'error',
                                                title: 'Oops...',
                                                text: res.message
                                            })
                                        } else {
                                            $route.reload();
                                        }
                                    })
                                })
                            },
                            downloadClicked: function(recId){
                                var d_rec = $scope.downloads[recId];
                                window.open(site_url+'download_file?user_id='+user_details.id+'&filename='+d_rec.filename);
                            },
                            deleteRecord: function(recId){
                                var d_rec = $scope.downloads[recId];
                                swal({
                                    title: "Are you sure?",
                                    text: "You will not be able to recover this CSV!",
                                    type: "warning",
                                    showCancelButton: true,
                                    confirmButtonColor: "#DD6B55",
                                    confirmButtonText: "Yes, delete it!"
                                }).then(function() {
                                    browser.runtime.sendMessage({
                                        delete_file: true,
                                        filename: d_rec.filename
                                    }, function(resp){
                                        if(resp.message){
                                            swal({
                                                type: 'error',
                                                title: 'Oops...',
                                                text: res.message
                                            });
                                        } else {
                                            $route.reload();
                                        }
                                    })
                                }, function() {});
                            }
                        });
                    }, 500);
                });
            })
        });
    }
]);

leonardApp.controller('loginCtrl', ['$scope', '$route', '$location', function($scope, $route, $location) {
        $("body").addClass("full-page");
        $scope.signIn = function(){
            // site_url
            browser.runtime.sendMessage({email:$scope.user_details.email,password:$scope.user_details.password,rememberMe:$scope.user_details.rememberMe},function(resp){
                if(resp == "success"){
                    window.location.assign('/CRM/index.html');
                } else {
                    showNotification("You have entered an incorrect email or password. Please try again.");
                    $("#email").val("").trigger("focus");
                    $("#password").val("");
                    $("#remember").removeAttr("checked");
                }
            });
        }
        setTimeout(function(){
            hidePageLoader();
        },500);
    }
]);

leonardApp.controller('mainCtrl', ['$scope', '$location', function($scope, $location) {
        function setModule(newUrl){
            var module = newUrl.slice(newUrl.lastIndexOf('/') + 1);
            $scope.active_page = module == '' ? 'connections' : module;
            $scope.user_details = user_details;
            if(user_details.user_plan == 'Cancelled'){
                $(".upgrade_container").removeAttr("hidden");
                $("#navigation, #navigation_min, #header, .main-container").addClass("cancelled_margin_top");
            }
            // $scope.$apply(function(){
            // });
            // if(module == 'dashboard'){
            //     hidePageLoader();
            // }
        }
        getProfileDetails(function() {
            $scope.user_details = user_details;
            if(isUserLoggedout()){
                return false;
            } else {
                $scope.$on('$locationChangeSuccess', function(event, newUrl, oldUrl) {
                    setModule(newUrl);
                });
                loadTotalConnections();
            }
            setModule($location.$$path);
        });
    }
]);

function loadTotalConnections(callback){
    browser.storage.local.get('connections', function(conns) {
        totalConnections = conns['connections'];
        if(typeof callback == 'function'){
            callback();
        }
    });
}