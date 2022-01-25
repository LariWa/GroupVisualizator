$(document).ready(function() {
  let group = "";

  $(document).click(function(e) {
    if (e.target.id.startsWith('O-leaf') && e.target.parentElement.getAttribute('cursor') !== "pointer") {
      $(e.target).toggleClass("select");
      updateGroup();
    }
  });

  function updateGroup() {
    //('<div id="members"></div>').insertAfter($('#group-members-'));
    //$('#group-members-').parent().append(memberContainer);
    //memberContainer.insertAfter($('#group-members-'));
    group = $('.select').prev().text();
    $('#group-members-').append(group);
    console.log(group);
  }
});
