$(document).ready(function() {

  var checkExist = setInterval(function() {
   if ($('#score-').length) {
     let e = $("#score-")[0].closest('.observablehq');
      while (e = e.nextElementSibling) e.classList.add("hide");
      clearInterval(checkExist);
   }
}, 100);
});
