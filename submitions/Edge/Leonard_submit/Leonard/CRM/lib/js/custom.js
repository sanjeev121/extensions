var tagSelect = $("#tag_select").select2({
        dropdownAutoWidth: !0,
        width: "100%"
    });
var tagSelectMultiple = $("#tag_select_multiple").select2({
        dropdownAutoWidth: !0,
        width: "100%"
});
var tagSelectMessage = $("#tag_select_message").select2({
    dropdownAutoWidth: !0,
    width: "100%"
});
//Toggle Tag Option in connection page
$(".add-tag-option").bind("click", function() {
    $(".tag-title, .remove-tag-option, .tag-container").removeClass("hidden");
    $(".add-tag-option").attr("disabled",true);
    $(".add-tag-to-message").attr("data-tags",true);
    
});
$(".remove-tag-option").bind("click", function() {
    $(".tag-title, .remove-tag-option, .tag-container").addClass("hidden");
    $(".add-tag-option").removeAttr("disabled");
    $(".add-tag-to-message").attr("data-tags",false);
});
$(".leo-search-container").bind("click",function() {
    $(".leo-search-bar").focus()
});
function setupTag(isTag) {
    if (isTag) {
        $("#tag_select").val(isTag.split(',')).trigger('change');
    } else {
        $("#tag_select").val(null).trigger('change');
    }
}